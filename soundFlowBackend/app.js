require('dotenv').config();
const PORT = process.env.SERVER_PORT || 3000;
const HOST = process.env.SERVER_HOST || 'localhost';

const express = require('express');
const app = express();

const swaggerUi = require('swagger-ui-express');
const bodyParser = require('body-parser')
const swaggerOptions = require('./swagger.js');
const swaggerFile = require('./swagger-output.json');

const cors = require('cors')
app.use(cors())

app.use(bodyParser.json())
app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.listen(PORT, () => {
  console.log(`Server started on port http://${HOST}:${PORT}/api`);
});

/* Endpoints */
const verifyToken = require('./routes/verifyToken.js');
require('./routes/users.js')(app, verifyToken);
require('./routes/musics.js')(app, verifyToken);
require('./routes/playlists.js')(app, verifyToken);
require('./routes/playlists_musics.js')(app, verifyToken);
require('./routes/authentication.js')(app, verifyToken);





