const swaggerAutogen = require('swagger-autogen')({openapi: '3.0.0'});
require('dotenv').config();

const doc = {
    info: {
        version: '1.0.0',
        title: 'User API',
        description: 'User API Information',
    },
    host: `${process.env.SWAGGER_URL}`,
    basePath: '/',
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
        {
            name: 'Users',
            description: 'User management',
        },
        {
            name: 'Musics',
            description: 'Music management',
        },
        {
            name: 'Playlists',
            description: 'Playlist management',
        },
        {
            name: 'PlaylistsMusics',
            description: 'PlaylistMusic management',
        },
        {
            name: 'Authentication',
            description: 'Authentication management',
        }
    ],
    securityDefinitions: {
        bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
        }
    },
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./routes/users.js', './routes/musics.js', './routes/playlists.js', './routes/playlists_musics.js', './routes/authentication.js'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    require('./app.js') // Your project's root file
});