require('dotenv').config();
const data = require('./datas.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('./verifyToken.js');

const { validationResult, body, param } = require('express-validator');
const validateFields = [
    // Vérifier si les champs ne sont pas vides et s'ils existent dans la requête
    body('email').notEmpty().withMessage('Email is required').exists().withMessage('Email doesn\'t exist').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required').exists().withMessage('Password doesn\'t exist').isString().withMessage('Password must be a string'),
];
const validation = validationResult.withDefaults({
    formatter: error => error.msg,
});

module.exports = async function (app) {

    app.get('/auth/profile', verifyToken, async (req, res, next) => {// #swagger.tags = ['Authentication']
        try {
            const id = req.user.id;
            // Valider l'id
            const errors = validation(req);
            if (!errors.isEmpty()) {
                console.error(errors);
                return res.status(400).json({ errors: errors.array() });
            }

            const rows = await data.query('SELECT id, firstname, lastname, email, display, created FROM users WHERE id = ?', [id]);
            // console.log(rows);
            if(rows.length>0) res.send({user: rows[0]}); // Renvoyer le premier élément du tableau
            else res.status(404).send('User not found');
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

    app.post('/auth/logout', (req, res, next) => {// #swagger.tags = ['Authentication']
        res.send(true);
    });

    app.post('/auth/login', validateFields, async (req, res, next) => { // #swagger.tags = ['Authentication']
        /*  #swagger.requestBody = {
              required: true,
              content: {
                  "application/json": {
                      schema: {
                          type: "object",
                          properties: {
                              email: {
                                  type: "string",
                                  description: "Email of the host",
                                  example: "email"
                              },
                              password: {
                                  type: "string",
                                  description: "Password of the host",
                                  example: "password"
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

            const email = req.body.email;
            const password = req.body.password;

            const result = await data.query('SELECT * FROM users WHERE email = ?', [email]);
            const user = result[0];

            if (!user) {
                return res.status(401).send('Invalid email or password');
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).send('Invalid email or password');
            }

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
            // console.log('token', token);
            // Renvoyer les informations de l'utilisateur et le token
            res.header('authorization', token).send({ message: 'Login successful', token, user: { id: user.id, lastname: user.lastname, firstname: user.firstname, email: user.email } });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal server error');
        }
    });

}