require('dotenv').config();
const data = require('./datas.js');
const verifyToken = require("./verifyToken");


const { validationResult, body, param} = require('express-validator');
const validateId = [
    // Vérifier si les champs ne sont pas vides et s'ils existent dans la requêt
    param('id').exists().withMessage('Id is doesn\'t exist').notEmpty().withMessage('Id is required').isInt().withMessage('Id must be an integer'),
];
const validateUserId = [
    // Vérifier si les champs ne sont pas vides et s'ils existent dans la requête
    param('user_id').exists().withMessage('User id is doesn\'t exist').notEmpty().withMessage('User id is required').isInt().withMessage('User id must be an integer'),
];
const validateName = [
    // Vérifier si les champs ne sont pas vides et s'ils existent dans la requêt
    body('name').exists().withMessage('Name is doesn\'t exist').notEmpty().withMessage('Name is required').isString().withMessage('Name must be a string'),
];
const validation = validationResult.withDefaults({
    formatter: error => error.msg,
});

const AWS = require('aws-sdk'); // Pour la connexion à AWS S3
// Configuration des informations d'identification AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();

module.exports = async function (app) {

    app.get('/playlists', verifyToken, async (req, res, next) => {// #swagger.tags = ['Playlists']
        /* #swagger.parameters['page'] = {
               in: 'query',
               description: 'Page number',
               required: false,
               type: 'integer',
               default: 1
           }
           #swagger.parameters['limit'] = {
               in: 'query',
               description: 'Number of elements per page',
               required: false,
               type: 'integer',
               default: 10
           }
           #swagger.parameters['name'] = {
               in: 'query',
               description: 'Playlist name',
               required: false,
               type: 'string'
           }
           #swagger.parameters['sort_by'] = {
                in: 'query',
                description: 'Sort column (id, name, created)',
                required: false,
                type: 'string',
                default: 'id'
            }
            #swagger.parameters['sort_order'] = {
                in: 'query',
                description: 'Sort order (asc, desc)',
                required: false,
                type: 'string',
                default: 'asc'
            }
        */
        try {
            let { page = 1, limit = 10, name = '', sort_by = '', sort_order = 'asc' } = req.query;
            page = parseInt(page);
            limit = parseInt(limit);

            let query = `
                SELECT p.id, p.name, COUNT(pm.music_id) AS nbMusic, CAST(SUM(m.duration) AS CHAR) AS duration
                FROM playlists AS p
                LEFT JOIN playlists_musics AS pm ON p.id = pm.playlist_id
                LEFT JOIN musics AS m ON pm.music_id = m.id
            `;
            let queryParams = [];

            if (name.trim() !== '' && name.trim().length > 0) { // check for non-space characters in name
                query += ' WHERE name LIKE ?';
                queryParams.push(`%${name}%`);
            }

            query += ' GROUP BY p.id';

            if (sort_by.trim() !== '' && sort_by.trim().length > 0) {
                if (sort_order.toLowerCase() === 'desc') {
                    query += ` ORDER BY ${sort_by} DESC`;
                } else {
                    query += ` ORDER BY ${sort_by} ASC`;
                }
            }

            const countQuery = await data.query(`SELECT COUNT(*) AS count FROM (${query}) AS countQuery`, queryParams);
            const totalCount = Number(countQuery[0].count);
            const totalPages = Math.ceil(Number(totalCount) / limit);
            const offset = (page - 1) * limit;

            query += ' LIMIT ?, ?';
            queryParams.push(offset);
            queryParams.push(limit);

            const rows = await data.query(query, queryParams);

            // Format the duration
            rows.forEach(row => {
                const durationInSeconds = Number(row.duration);
                const durationInMinutes = Math.floor(durationInSeconds / 60);
                const durationInHours = Math.floor(durationInMinutes / 60);

                const remainingMinutes = durationInMinutes % 60;
                const remainingSeconds = durationInSeconds % 60;

                let formattedDuration = '';

                if (durationInHours > 0) {
                    formattedDuration += `${durationInHours} h `;
                }

                if (remainingMinutes > 0 || durationInHours > 0) {
                    formattedDuration += `${remainingMinutes} min `;
                }

                formattedDuration += `${remainingSeconds} sec`;

                // Supprimer les zéros non significatifs
                if (formattedDuration !== '0 sec') {
                    formattedDuration = formattedDuration.replace(/(^| )0+(?!$)/g, '');
                }

                row.duration = formattedDuration.trim();
            });

            const response = { page, totalPages, totalCount, data: rows.map(row => ({ ...row, nbMusic: Number(row.nbMusic), duration: String(row.duration) })) };
            res.send(response);
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

    app.get('/playlists/:user_id', verifyToken, validateUserId, async (req, res, next) => {// #swagger.tags = ['Playlists']
        try {
            // Valider l'id
            const errors = validation(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { user_id } = req.params;
            let { page = 1, limit = 10, name = '', sort_by = '', sort_order = 'asc' } = req.query;
            page = parseInt(page);
            limit = parseInt(limit);

            let query = `
            SELECT p.id, p.name, COUNT(pm.music_id) AS nbMusic, CAST(SUM(m.duration) AS CHAR) AS duration
            FROM playlists AS p
            LEFT JOIN playlists_musics AS pm ON p.id = pm.playlist_id
            LEFT JOIN musics AS m ON pm.music_id = m.id
            WHERE p.user_id = ?
        `;
            let queryParams = [user_id];

            if (name.trim() !== '' && name.trim().length > 0) {
                query += ' AND p.name LIKE ?';
                queryParams.push(`%${name}%`);
            }

            query += ' GROUP BY p.id';

            if (sort_by.trim() !== '' && sort_by.trim().length > 0) {
                if (sort_order.toLowerCase() === 'desc') {
                    query += ` ORDER BY ${sort_by} DESC`;
                } else {
                    query += ` ORDER BY ${sort_by} ASC`;
                }
            }

            const countQuery = await data.query(`SELECT COUNT(*) AS count FROM (${query}) AS countQuery`, queryParams);
            const totalCount = Number(countQuery[0].count);
            const totalPages = Math.ceil(Number(totalCount) / limit);
            const offset = (page - 1) * limit;

            query += ' LIMIT ?, ?';
            queryParams.push(offset);
            queryParams.push(limit);

            const rows = await data.query(query, queryParams);

            // Format the duration
            rows.forEach(row => {
                const durationInSeconds = Number(row.duration);
                const durationInMinutes = Math.floor(durationInSeconds / 60);
                const durationInHours = Math.floor(durationInMinutes / 60);

                const remainingMinutes = durationInMinutes % 60;
                const remainingSeconds = durationInSeconds % 60;

                let formattedDuration = '';

                if (durationInHours > 0) {
                    formattedDuration += `${durationInHours} h `;
                }

                if (remainingMinutes > 0 || durationInHours > 0) {
                    formattedDuration += `${remainingMinutes} min `;
                }

                formattedDuration += `${remainingSeconds} sec`;

                // Supprimer les zéros non significatifs
                if (formattedDuration !== '0 sec') {
                    formattedDuration = formattedDuration.replace(/(^| )0+(?!$)/g, '');
                }

                row.duration = formattedDuration.trim();
            });

            const response = { page, totalPages, totalCount, data: rows.map(row => ({ ...row, nbMusic: Number(row.nbMusic), duration: String(row.duration) })) };
            res.send(response);
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

    app.get('/playlists/:id/export', verifyToken, validateId, async (req, res, next) => {// #swagger.tags = ['Playlists']
        try {
            const errors = validation(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const playlistId = req.params.id;

            // Récupérer le nom de la playlist depuis la base de données
            const playlist = await data.query('SELECT name FROM playlists WHERE id = ?', [playlistId]);

            // Récupérer les musiques de la playlist depuis la base de données
            const musicFiles = await data.query(
                `SELECT m.title, m.artist, m.filename, m.duration, m.album, m.style, m.start_date, m.end_date
               FROM musics m
               JOIN playlists_musics pm ON m.id = pm.music_id 
               WHERE pm.playlist_id = ?`,
                            [playlistId]
            );


            function determineBlockedStatus(startDate, endDate) {
                const today = new Date();
                const startDateObj = new Date(startDate);
                const endDateObj = new Date(endDate);

                if (today < startDateObj || today > endDateObj) {
                    return 'true';
                } else {
                    return 'false';
                }
            }

            // Créer un tableau de liens des musiques
            const musicLinks = musicFiles.map(file => ({
                title: file.title,
                artist: file.artist,
                duration: file.duration,
                album: file.album,
                style: file.style,
                link: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/medias/${file.filename}`,
                blocked: determineBlockedStatus(file.start_date, file.end_date)
            }));

            // Renvoyer les liens des musiques en tant qu'objet JSON
            res.send(musicLinks);
        } catch (error) {
            console.error('Export playlist error:', error);
            res.status(500).send('Internal server error');
        }
    });

    app.post('/playlists', verifyToken, validateName, async (req, res, next) => {// #swagger.tags = ['Playlists']
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Name of the playlist",
                                example: "Playlist name"
                            }
                        }
                    }
                }
            }
        }
         */
        try {
            // Valider les champs
            const errors = validation(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const user_id = req.user.id;
            const name = req.body.name;

            // Convertir les BigInts en chaînes si nécessaire
            const values = [user_id, name].map((value) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            });

            const rows = await data.query(`INSERT INTO playlists (user_id, name) VALUES (?, ?)`, [...values]);
            const insertPlaylistId = rows.insertId.toString(); // Convertir l'identifiant de la nouvelle entrée insérée en chaîne
            res.send({id: insertPlaylistId}); // Renvoyer l'identifiant sous forme de chaîne dans un objet JSON
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

    app.delete('/playlists/:id', verifyToken, validateId, async (req, res, next) => {// #swagger.tags = ['Playlists']
        try {
            // Valider l'id
            const errors = validation(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const id = req.params.id;

            const values = [id].map((value) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            });

            await data.query(`DELETE FROM playlists WHERE id = ?`, [...values]);
            res.send({playlist_id: req.params.id});
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

    app.put('/playlists/:id', verifyToken, validateName, validateId, async (req, res, next) => {// #swagger.tags = ['Playlists']
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "Name of the playlist",
                                example: "Playlist name"
                            }
                        }
                    }
                }
            }
        }
        */
        try {
            // Valider les champs
            const errors = validation(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const id = req.params.id;
            const name = req.body.name;
            const values = [ name, id ];

            await data.query(`UPDATE playlists SET name=?, modified=NOW() WHERE id=?`, [...values]);
            res.send({id: id}); // Renvoyer l'identifiant sous forme de chaîne dans un objet JSON
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

}