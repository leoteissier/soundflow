require('dotenv').config();
const data = require('./datas.js'); // Pour la connexion à la base de données
const verifyToken = require('./verifyToken.js'); // Pour vérifier le token
const { v4: UUID } = require('uuid'); // Pour la génération d'UUID
const mm = require('music-metadata'); // Pour la récupération des métadonnées des fichiers

// Pour le téléchargement de fichiers
const multer = require('multer');
const upload = multer();

const { validationResult, body, param } = require('express-validator'); // Pour la validation des champs
const validateFields = [
    // Vérifier si les champs ne sont pas vides et s'ils existent dans la requête
    body('start_date').isString().withMessage('Start date must be a string'),
    body('end_date').exists().withMessage('End date doesn\'t exist').notEmpty().withMessage('End date is required').isString().withMessage('End date must be a string'),
];
const validateId = [
    // Vérifier si les champs ne sont pas vides et s'ils existent dans la requête
    param('id').exists().withMessage('Id is doesn\'t exist').notEmpty().withMessage('Id is required').isInt().withMessage('Id must be an integer'),
];
const validateUserId = [
    // Vérifier si les champs ne sont pas vides et s'ils existent dans la requête
    param('user_id').exists().withMessage('User id is doesn\'t exist').notEmpty().withMessage('User id is required').isInt().withMessage('User id must be an integer'),
];
const validatePut = [
    // Vérifier si les champs ne sont pas vides et s'ils existent dans la requête
    body('title').exists().withMessage('Title doesn\'t exist').notEmpty().withMessage('Title is required').isString().withMessage('Title must be a string'),
    body('artist').exists().withMessage('Artist doesn\'t exist').notEmpty().withMessage('Artist is required').isString().withMessage('Artist must be a string'),
    body('album').exists().withMessage('Album doesn\'t exist').notEmpty().withMessage('Album is required').isString().withMessage('Album must be a string'),
    body('style').exists().withMessage('style doesn\'t exist').notEmpty().withMessage('style is required').isString().withMessage('style must be an string'),
    body('start_date').isString().withMessage('Start date must be a string'),
    body('end_date').exists().withMessage('End date doesn\'t exist').notEmpty().withMessage('End date is required').isString().withMessage('End date must be a string'),
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

    app.get('/musics', verifyToken, async (req, res, next) => {//#swagger.tags = ['Musics']
        try {
            let { page = 1, limit = null, search = '', sort_by = 'id', sort_order = 'asc' } = req.query;
            page = parseInt(page);
            if (limit !== null) limit = parseInt(limit);

            let query = 'SELECT *, CONCAT(?, filename) AS music_link FROM musics WHERE 1=1';
            let queryParams = [process.env.AWS_S3_URL];

            if (search.trim() !== '' && search.trim().length > 0) {
                query += ' AND (title LIKE ? OR artist LIKE ? OR album LIKE ? OR style LIKE ?)';
                queryParams.push(`%${search}%`);
                queryParams.push(`%${search}%`);
                queryParams.push(`%${search}%`);
                queryParams.push(`%${search}%`);
            }

            // Add sort order to query
            if (sort_by && sort_order) {
                const sortField = ['id', 'title', 'artist', 'album', 'style', 'start_date', 'end_date', 'duration'].includes(sort_by) ? sort_by : 'id';
                const sortOrder = sort_order === 'asc' ? 'ASC' : 'DESC';
                query += ` ORDER BY ${sortField} ${sortOrder}`;
            }

            const countQuery = await data.query(`SELECT COUNT(*) AS count FROM (${query}) AS countQuery`, queryParams);
            const totalCount = Number(countQuery[0].count);
            const totalPages = limit !== null ? Math.ceil(Number(totalCount) / limit) : 1;

            // Adjusting LIMIT clause based on limit value
            if (limit !== null) {
                const offset = (page - 1) * limit;
                query += ' LIMIT ?, ?';
                queryParams.push(offset);
                queryParams.push(limit);
            }

            const rows = await data.query(query, queryParams);

            const today = new Date();
            const response = {
                page,
                totalPages,
                totalCount,
                data: rows.map(row => {
                    const isBlocked = today < new Date(row.start_date) || today > new Date(row.end_date);
                    const blockedMessage = isBlocked ? 'true' : 'false';

                    return {
                        ...row,
                        blocked: blockedMessage,
                    };
                }),
            };

            res.send(response);
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

    app.get('/musics/:user_id', verifyToken, validateUserId, async (req, res, next) => {// #swagger.tags = ['Musics']
        try {
            // Valider l'id
            const errors = validation(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const user_id = req.params.user_id;
            let { page = 1, limit = null, search = '', sort_by = 'id', sort_order = 'asc' } = req.query;
            page = parseInt(page);
            if (limit !== null) limit = parseInt(limit);

            let query = 'SELECT *, CONCAT(?, filename) AS music_link FROM musics WHERE user_id = ?';
            let queryParams = [process.env.AWS_S3_URL, user_id];

            if (search.trim() !== '' && search.trim().length > 0) {
                query += ' AND (title LIKE ? OR artist LIKE ? OR album LIKE ? OR style LIKE ?)';
                queryParams.push(`%${search}%`);
                queryParams.push(`%${search}%`);
                queryParams.push(`%${search}%`);
                queryParams.push(`%${search}%`);
            }

            // Add sort order to query
            if (sort_by && sort_order) {
                const sortField = ['id', 'title', 'artist', 'album', 'style', 'start_date', 'end_date', 'duration'].includes(sort_by) ? sort_by : 'id';
                const sortOrder = sort_order === 'asc' ? 'ASC' : 'DESC';
                query += ` ORDER BY ${sortField} ${sortOrder}`;
            }

            const countQuery = await data.query(`SELECT COUNT(*) AS count FROM (${query}) AS countQuery`, queryParams);
            const totalCount = Number(countQuery[0].count);
            const totalPages = limit !== null ? Math.ceil(Number(totalCount) / limit) : 1;

            // Adjusting LIMIT clause based on limit value
            if (limit !== null) {
                const offset = (page - 1) * limit;
                query += ' LIMIT ?, ?';
                queryParams.push(offset);
                queryParams.push(limit);
            }

            const rows = await data.query(query, queryParams);

            const today = new Date();
            const response = {
                page,
                totalPages,
                totalCount,
                data: rows.map(row => {
                    const isBlocked = !(today >= new Date(row.start_date) && today < new Date(row.end_date));
                    const blockedMessage = isBlocked ? 'true' : 'false';

                    return {
                        ...row,
                        blocked: blockedMessage,
                    };
                }),
            };

            res.send(response);
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

    app.post('/musics', verifyToken, upload.array('files'), validateFields, async (req, res, next) => {// #swagger.tags = ['Musics']
        /* #swagger.requestBody = {
             required: true,
             content: {
                 "multipart/form-data": {
                     schema: {
                         type: "object",
                         properties: {
                             files: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                    format: 'binary'
                                }
                             },
                             start_date: {
                                 type: "string",
                                 description: "Start date of the music",
                                 example: "2023-04-23"
                             },
                             end_date: {
                                 type: "string",
                                 description: "End date of the music",
                                 example: "2023-05-23"
                             }
                         }
                     }
                 }
             }
        } */
        try {
            // Valider les champs
            const errors = validation(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const files = req.files;
            // Vérifier qu'un fichier a bien été envoyé
            if (!files || !Array.isArray(files) || files.length === 0) {
                return res.status(400).send('No file was uploaded');
            }
            let musics = [];
            for(let i=0; i<files.length; i++) {
                // Vérifier que les données du fichier sont bien présentes
                if (!files[i].buffer) {
                    return res.status(400).send('File buffer is missing');
                }
                // Vérifier que le fichier est bien un fichier audio
                if (files[i].mimetype !== 'audio/mpeg') {
                    return res.status(400).send('File must be a .mp3/.wav file');
                }
                // Récupérer les informations de la musique à partir des métadonnées du fichier audio
                const metadata = await mm.parseBuffer(files[i].buffer);
                const user_id = req.user.id;
                const title = metadata.common.title || '';
                const original_filename = files[i].originalname;
                const duration = metadata.format.duration || 0;
                const artist = metadata.common.artist || '';
                const album = metadata.common.album || '';
                const style = metadata.common.genre ? metadata.common.genre.map(g => g.slice(0, 64)).join() : '';
                const start_date = req.body.start_date ? new Date(req.body.start_date) : null;
                const end_date = new Date(req.body.end_date);
                // vérifier si end_date est bien une date
                if (end_date && isNaN(end_date.getTime())) {
                    return res.status(400).send('End date is not a valid date');
                }
                // Vérifier que la date de fin est bien supérieure à la date de début
                if (start_date && end_date && start_date >= end_date) {
                    return res.status(400).send('Start date must be before end date');
                }

                // Générer un nom de fichier unique
                const extension = files[i].originalname.split('.').pop();
                const filename = `${UUID()}.${extension}`;
                // Paramètres de l'objet S3
                const S3params = {
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: `medias/${filename}`,
                    Body: files[i].buffer,
                    ContentType: files[i].mimetype,
                    ACL: 'public-read'
                };
                // Uploader le fichier dans le bucket S3
                const uploadResponse = await s3.upload(S3params).promise();
                const values = [user_id, title, filename, original_filename, duration, artist, album, style, start_date, end_date];
                // Insérer les informations de la musique dans la base de données
                const rows = await data.query(`INSERT INTO musics (user_id, title, filename, original_filename, duration, artist, album, style, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [...values]
                );
                // Convertir l'identifiant de la nouvelle entrée insérée en chaîne
                const insertedMusicId = rows.insertId.toString();
                musics.push({ 'message': `Music with id ${insertedMusicId} published`, url: uploadResponse.Location });
            }
            // Renvoyer l'identifiant de la nouvelle entrée insérée
            res.status(201).send({ musics });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

    app.delete('/musics/:id', verifyToken, validateId, async (req, res, next) => {// #swagger.tags = ['Musics']
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

            await data.query(`DELETE FROM musics WHERE id = ?`, [...values]);
            res.send({'message': `Music with id ${id} deleted`}); // Renvoyer l'identifiant sous forme de chaîne dans un objet JSON
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

    app.put('/musics/:id', verifyToken, validatePut, async (req, res, next) => {//#swagger.tags = ['Musics']
        /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            title: {
                                type: "string",
                                description: "Title of the music",
                                example: "Music title"
                            },
                            artist: {
                                type: "string",
                                description: "Artist of the music",
                                example: "Music artist"
                            },
                            album: {
                                type: "string",
                                description: "Album of the music",
                                example: "Music album"
                            },
                            style: {
                                type: "string",
                                description: "style of the music",
                                example: "Music style"
                            },
                            start_date: {
                                type: "string",
                                description: "Start date of the music",
                                example: "2023-04-23"
                            },
                            end_date: {
                                type: "string",
                                description: "End date of the music",
                                example: "2023-05-23"
                            }
                        }
                    }
                }
            }
        } */
        try {
            // Valider les champs
            const errors = validation(req);
            if (!errors.isEmpty()) {
                console.error(errors);
                return res.status(400).json({ errors: errors.array() });
            }

            const id = req.params.id;
            const title = req.body.title;
            const artist = req.body.artist;
            const album = req.body.album;
            const style = req.body.style;
            const start_date = new Date(req.body.start_date);
            const end_date = new Date(req.body.end_date);
            const values = [title, artist, album, style, start_date, end_date, id];

            // Vérifier que les champs ne dépassent pas la taille maximale
            if (title.length > 64 || artist.length > 64 || album.length > 64 || style.length > 64) {
                return res.status(400).send('Fields must not exceed 64 characters');
            }

            // Vérifier que la date de début est bien une date
            if (start_date && isNaN(start_date.getTime())) {
                return res.status(400).send('Start date is not a valid date');
            }
            // Vérifier que la date de fin est bien une date
            if (end_date && isNaN(end_date.getTime())) {
                return res.status(400).send('End date is not a valid date');
            }
            // Vérifier que la date de début est antérieure à la date de fin
            if (start_date.getTime() > end_date.getTime()) {
                return res.status(400).send('Start date must be before end date');
            }
            // mettre à jour la musique
            await data.query(`UPDATE musics SET title=?, artist=?, album=?, style=?, start_date=?, end_date=?, modified=NOW() WHERE id = ?`, [...values]);
            res.send({'message': `Music with id ${id} updated`}); // Renvoyer l'identifiant sous forme de chaîne dans un objet JSON
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

}