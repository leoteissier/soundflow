const data = require('./datas.js');
const verifyToken = require("./verifyToken");

const { validationResult, param, body} = require('express-validator');
const validateId = [
    // Vérifier si les champs ne sont pas vides et s'ils existent dans la requête
    param('id').exists().withMessage('Id is doesn\'t exist').notEmpty().withMessage('Id is required').isInt().withMessage('Id must be an integer'),
];
const validatePost = [
    // Vérifier si les champs ne sont pas vides et s'ils existent dans la requête
    param('music_id').exists().withMessage('User_id doesn\'t exist').notEmpty().withMessage('User_id is required').isInt().withMessage('User_id must be an integer'),
    param('playlist_id').exists().withMessage('Playlist_id doesn\'t exist').notEmpty().withMessage('Playlist_id is required').isString().withMessage('Playlist_id must be a string'),
];
const validateDelete = [
    // Vérifier si les champs ne sont pas vides et s'ils existent dans la requête
    param('id').exists().withMessage('Id slot doesn\'t exist').notEmpty().withMessage('Id slot is required').isInt().withMessage('Id slot must be an integer'),
    param('playlist_id').exists().withMessage('Playlist_id doesn\'t exist').notEmpty().withMessage('Playlist_id is required').isString().withMessage('Playlist_id must be a string'),
];
const validateUpdate = [
    // Vérifier si les champs ne sont pas vides et s'ils existent dans la requête
    param('playlist_id').exists().withMessage('Playlist_id doesn\'t exist').notEmpty().withMessage('Playlist_id is required').isInt().withMessage('Playlist_id must be a string'),
    param('id').exists().withMessage('Music_id doesn\'t exist').notEmpty().withMessage('Music_id is required').isInt().withMessage('Music_id must be an integer'),
    body('position').exists().withMessage('Position doesn\'t exist').notEmpty().withMessage('Position is required').isInt().withMessage('Position must be an integer'),
];
const validation = validationResult.withDefaults({
    formatter: error => error.msg,
});

module.exports = async function (app) {

    app.get('/playlists/:id/musics/', verifyToken, validateId, async (req, res) => {// #swagger.tags = ['PlaylistsMusics']
        try {
            const playlistId = req.params.id;
            let { search = '', sort_by = 'position', sort_order = 'asc' } = req.query;

            // Validate the id
            const errors = validation(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            let query = `
              SELECT m.*, pm.id AS playlist_music_id, pm.position, CONCAT(?, m.filename) AS music_link, m.start_date AS music_start_date, m.end_date AS music_end_date
              FROM musics m
              INNER JOIN playlists_musics pm ON m.id = pm.music_id
              WHERE pm.playlist_id = ?
            `;

            let playlistQuery = `
              SELECT name AS playlist_name
              FROM playlists
              WHERE id = ?
            `;
            let queryParams = [process.env.AWS_S3_URL, playlistId];

            if (search.trim() !== '' && search.trim().length > 0) {
                query += ' AND (title LIKE ? OR artist LIKE ? OR album LIKE ? OR style LIKE ?)';
                queryParams.push(`%${search}%`);
                queryParams.push(`%${search}%`);
                queryParams.push(`%${search}%`);
                queryParams.push(`%${search}%`);
            }

            const validSortColumns = ['id', 'title', 'artist', 'album', 'style', 'start_date', 'duration', 'position'];
            const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'position';
            const sortOrder = sort_order === 'desc' ? 'DESC' : 'ASC';

            query += ` ORDER BY ${sortColumn} ${sortOrder}`;

            // Execute the queries
            const rows = await data.query(query, queryParams);
            const playlistNameRow = await data.query(playlistQuery, [playlistId]);

            const playlistInfoQuery = await data.query(`
              SELECT COUNT(pm.music_id) AS nbMusic, CAST(SUM(m.duration) AS CHAR) AS duration
              FROM playlists_musics AS pm
              LEFT JOIN musics AS m ON pm.music_id = m.id
              WHERE pm.playlist_id = ?
            `, [playlistId]);

            const playlistInfo = playlistInfoQuery[0];
            const durationInSeconds = Number(playlistInfo.duration);
            const durationInHours = Math.floor(durationInSeconds / 3600);
            const durationInMinutes = Math.floor((durationInSeconds % 3600) / 60);
            const durationInSecs = durationInSeconds % 60;

            let formattedDuration = '';

            if (durationInHours > 0) {
                formattedDuration += `${durationInHours}h `;
            }

            if (durationInMinutes > 0 || durationInHours > 0) {
                formattedDuration += `${durationInMinutes}min `;
            }

            formattedDuration += `${durationInSecs}sec`;

            const today = new Date();
            const response = {
                data: rows.map(row => {
                    const isBlocked = today < new Date(row.start_date) || today > new Date(row.end_date);
                    const blockedMessage = isBlocked ? 'true' : 'false';

                    return {
                        ...row,
                        blocked: blockedMessage,
                    };
                }),
                playlist_name: playlistNameRow[0] ? playlistNameRow[0].playlist_name : null,
                nbMusic: Number(playlistInfo.nbMusic),
                duration: formattedDuration.trim()
            };

            res.send(response);
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

    app.post('/playlists/:playlist_id/musics/:music_id', verifyToken, validatePost, async (req, res, next) => {// #swagger.tags = ['PlaylistsMusics']
       try{
           // Valider les champs
           const errors = validation(req);
           if (!errors.isEmpty()) {
               return res.status(400).json({ errors: errors.array() });
           }

           const playlist_id = req.params.playlist_id;
           const music_id = req.params.music_id;

           // Chercher la position maximale dans la colonne "position"
           const maxPositionQuery = await data.query(`SELECT MAX(position) as maxPosition FROM playlists_musics WHERE playlist_id = ?`, [playlist_id]);
           const maxPosition = maxPositionQuery[0].maxPosition || 0; // La position maximale est soit la valeur retournée, soit 0 si la valeur est null

           // Convertir les BigInts en chaînes si nécessaire
           const values = [playlist_id, music_id, maxPosition + 1].map((value) => {
               if (typeof value === 'bigint') {
                   return value.toString();
               }
               return value;
           });

           // Insérer la nouvelle entrée
           const rows = await data.query(`INSERT INTO playlists_musics (playlist_id, music_id, position) VALUES (?, ?, ?)`, [...values]);
           const insertMusic_id = rows.insertId.toString(); // Convertir l'identifiant de la nouvelle entrée insérée en chaîne
           res.send({id: insertMusic_id}); // Renvoyer l'identifiant sous forme de chaîne dans un objet JSON
       } catch(error){
           console.error(error);
           res.status(500).send('Internal server error');
       }
   });

    app.delete('/playlists/:playlist_id/musics/:id', verifyToken, validateDelete, async (req, res, next) => {// #swagger.tags = ['PlaylistsMusics']
        try {
            // Valider l'id
            const errors = validation(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const playlist_id = req.params.playlist_id;
            const id = req.params.id;

            // Convertir les BigInts en chaînes si nécessaire
            const values = [playlist_id, id].map((value) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            });

            // Supprimer le slot de musique
            await data.query(`DELETE FROM playlists_musics WHERE playlist_id = ? AND id = ?`, [...values]);

            // Récupérer toutes les musiques restantes dans la playlist
            const remainingMusics = await data.query('SELECT id FROM playlists_musics WHERE playlist_id = ? ORDER BY position ASC', [playlist_id]);

            // Recalculer les positions des musiques restantes
            for (let i = 0; i < remainingMusics.length; i++) {
                const musicId = remainingMusics[i].id;
                const newPosition = i + 1;

                // Mettre à jour la position de la musique dans la base de données
                await data.query('UPDATE playlists_musics SET position = ? WHERE playlist_id = ? AND id = ?', [newPosition, playlist_id, musicId]);
            }

            const deleteId = id.toString(); // Convertir l'identifiant de la slot supprimée en chaîne
            res.send({ slotId: deleteId }); // Renvoyer l'identifiant sous forme de chaîne dans un objet JSON
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

   app.put('/playlists/:playlist_id/musics/:id', verifyToken, validateUpdate, async (req, res, next) => {// #swagger.tags = ['PlaylistsMusics']
       /* #swagger.requestBody = {
          required: true,
          content: {
              "application/json": {
                  schema: {
                      type: "object",
                      properties: {
                          position: {
                              type: "integer",
                              description: "Position of the music in the playlist",
                              example: 1
                          }
                      }
                  }
              }
          }
      }
       */
        // Mettre à jour la position de la musique dans la base de données
        const playlist_id = req.params.playlist_id;
        const id = req.params.id;
        const position = req.body.position;

        try {
            // Valider les champs
            const errors = validation(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Vérifier l'existence de la playlist
            const playlistQuery = await data.query('SELECT * FROM playlists WHERE id = ?', [playlist_id]);
            if (playlistQuery.length === 0) {
                return res.status(404).send('Playlist not found');
            }

            // Vérifier l'existence de l'entrée de musique dans la playlist
            const entryQuery = await data.query('SELECT * FROM playlists_musics WHERE playlist_id = ? AND id = ?', [playlist_id, id]);
            if (entryQuery.length === 0) {
                return res.status(404).send('Entry not found');
            }

            const currentEntry = entryQuery[0];
            const currentPosition = currentEntry.position;

            if (currentPosition === position) {
                return res.status(400).send('Position is the same');
            }

            if (position < 1) {
                return res.status(400).send('Invalid position');
            }

            // Mettre à jour les positions des musiques dans la playlist
            if (currentPosition < position) {
                // Déplacer les musiques entre les positions (currentPosition + 1) et position vers le haut
                await data.query('UPDATE playlists_musics SET position = position - 1 WHERE playlist_id = ? AND position > ? AND position <= ?', [playlist_id, currentPosition, position]);
            } else {
                // Déplacer les musiques entre les positions position et (currentPosition - 1) vers le bas
                await data.query('UPDATE playlists_musics SET position = position + 1 WHERE playlist_id = ? AND position >= ? AND position < ?', [playlist_id, position, currentPosition]);
            }

            // Mettre à jour la position de la musique sélectionnée
            await data.query('UPDATE playlists_musics SET position = ? WHERE playlist_id = ? AND id = ?', [position, playlist_id, id]);

            res.send(`Le slot ${id} a été déplacée à la position ${position}`);
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

}