const data = require('./datas.js');
const verifyToken = require('./verifyToken.js');
const bcrypt = require("bcrypt");

const { validationResult, body, param} = require('express-validator');
const validateId = [
  param('id').notEmpty().withMessage('Id is required').exists().withMessage('Id is doesn\'t exist').isInt().withMessage('Id must be an integer'),
];
const validateEmail = [
    body('email').notEmpty().withMessage('Email is required').exists().withMessage('Email is doesn\'t exist').isEmail().withMessage('Invalid email format'),
];
const validateLastname = [
    body('lastname').notEmpty().withMessage('Lastname is required').exists().withMessage('Lastname is doesn\'t exist').isString().withMessage('Lastname must be a string'),
];
const validateFirstname = [
    body('firstname').notEmpty().withMessage('Firstname is required').exists().withMessage('Firstname is doesn\'t exist').isString().withMessage('Firstname must be a string'),
];
const validatePassword = [
    body('password').notEmpty().withMessage('Password is required').exists().withMessage('Password is doesn\'t exist').isString().withMessage('Password must be a string'),
];
const validatePasswordConfirm = [
    body('passwordConfirm').notEmpty().withMessage('Password confirm is required').exists().withMessage('Password confirm is doesn\'t exist').isString().withMessage('Password confirm must be a string'),
];
const validateMode = [
    body('display').notEmpty().withMessage('Mode is required').exists().withMessage('Mode is doesn\'t exist').isString().withMessage('Mode must be a string'),
];
const validation = validationResult.withDefaults({
  formatter: error => error.msg,
});

module.exports = async function (app) {

  app.get('/users', verifyToken, async (req, res, next) => {// #swagger.tags = ['Users']
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
       #swagger.parameters['search'] = {
           in: 'query',
           description: 'User lastname, firstname or email',
           required: false,
           type: 'string'
       }
    */
    try {
      let { page = 1, limit = 10, search = '' } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);

      let query = 'SELECT id, firstname, lastname, email, created, modified FROM users';
      let queryParams = [];

      if (search.trim() !== '' && search.trim().length > 0) {
        query += ' WHERE lastname LIKE ? OR firstname LIKE ? OR email LIKE ?';
        queryParams.push(`%${search}%`);
        queryParams.push(`%${search}%`);
        queryParams.push(`%${search}%`);
      }

      const countQuery = await data.query(`SELECT COUNT(*) AS count FROM (${query}) AS countQuery`, queryParams);
      const totalCount = Number(countQuery[0].count);
      const totalPages = Math.ceil(totalCount / limit);
      const offset = (page - 1) * limit;

      query += ' LIMIT ?, ?';
      queryParams.push(offset);
      queryParams.push(limit);

      const rows = await data.query(query, queryParams);

      const response = {page, totalPages, totalCount, data: rows};
      res.send(response);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });

  app.get('/users/:id', verifyToken, validateId, async (req, res, next) => {// #swagger.tags = ['Users']
    try {
      // Valider l'id
      const errors = validation(req);
      if (!errors.isEmpty()) {
        console.error(errors);
        return res.status(400).json({ errors: errors.array() }); // Renvoyer une erreur si l'id est invalide
      }
      const id = parseInt(req.params.id); // Récupérer l'id
      const rows = await data.query('SELECT id, firstname, lastname, email, created, modified FROM users WHERE id = ?', [id]); // Récupérer l'utilisateur
      const user = rows[0]; // Récupérer le premier utilisateur

      if (!user) {
        return res.status(404).send('User not found'); // Renvoyer une erreur si l'utilisateur n'existe pas
      }

      res.send(user); // Renvoyer l'utilisateur
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error'); // Renvoyer une erreur si une erreur interne au serveur s'est produite
    }
  });

  app.get('/users/:id/musics', verifyToken, validateId, async (req, res, next) => {// #swagger.tags = ['Users']
    try {
      // Valider l'id
      const errors = validation(req);
      if (!errors.isEmpty()) {
        console.error(errors);
        return res.status(400).json({ errors: errors.array() }); // Renvoyer une erreur si l'id est invalide
      }
      const id = parseInt(req.params.id); // Récupérer l'id
      const rows = await data.query('SELECT id, user_id, title, filename, original_filename, duration, artist, album, style, start_date, end_date, created, modified FROM musics WHERE user_id = ?', [id]); // Récupérer l'utilisateur

      if (!rows) {
        return res.status(404).send('User not found'); // Renvoyer une erreur si l'utilisateur n'existe pas
      }

      res.send(rows); // Renvoyer l'utilisateur
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error'); // Renvoyer une erreur si une erreur interne au serveur s'est produite
    }
  });

  app.post('/users', verifyToken, validateEmail, validateLastname, validateFirstname, validatePassword, validatePasswordConfirm, async (req, res, next) => { // #swagger.tags = ['Users']
    /* #swagger.security = [{
         "bearerAuth": []
   }] */
    /* #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              lastname: {
                type: "string",
                description: "Lastname of the user",
                example: "Lastname"
              },
              firstname: {
                type: "string",
                description: "Firstname of the user",
                example: "Firstname"
              },
              email: {
                type: "string",
                description: "Email of the user",
                example: "youremail@inovshop.com"
              },
              password: {
                type: "string",
                description: "Password of the user",
                example: "password"
              },
              confirmPassword: {
                type: "string",
                description: "Password confirmation of the user",
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
        return res.status(400).json({ errors: errors.array() }); // Renvoyer une erreur si l'id est invalide
      }

      const lastName = req.body.lastname;
      const firstName = req.body.firstname;
      const email = req.body.email;
      const password = req.body.password
      const confirmPassword = req.body.confirmPassword;
      // Vérifier si le mot de passe et la confirmation du mot de passe correspondent
      if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
      }
      const passwordHash = await bcrypt.hash(password, 10); // Crypter le mot de passe

      // Vérifier si les champs ne sont pas vides
      if(!lastName || !firstName || !email || !password) {
        return res.status(400).send('Bad request');
      }

      // Vérifier si l'utilisateur existe déjà
      const verify = await data.query('SELECT id FROM users WHERE email = ?', [email]);
      const user = verify[0];
      if (user) {
          return res.status(400).send('User already exists, please login or reset your password');
      }

      // Convertir les BigInts en chaînes si nécessaire
      const values = [lastName, firstName, email, passwordHash].map((value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      });

      const rows = await data.query(`INSERT INTO users (lastname, firstname, email, password) VALUES (?, ?, ?, ?)`, [...values]);
      const insertedUserId = rows.insertId.toString(); // Convertir l'identifiant de la nouvelle entrée insérée en chaîne
      res.send({ id: insertedUserId }); // Renvoyer l'identifiant sous forme de chaîne dans un objet JSON
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });

  app.delete('/users/:id', verifyToken, validateId, async (req, res, next) => {// #swagger.tags = ['Users']
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

      await data.query(`DELETE FROM users WHERE id = ?`, [...values]);
      res.send({'message': `User with id ${id} deleted`});
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });

  app.put('/users/:id/', verifyToken, validateId, async (req, res, next) => {// #swagger.tags = ['Users']
    /* #swagger.requestBody = {
            required: true,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {
                            lastname: {
                                type: "string",
                                description: "Lastname of the user",
                                example: "Lastname"
                            },
                            firstname: {
                                type: "string",
                                description: "Firstname of the user",
                                example: "Firstname"
                            },
                            email: {
                                type: "string",
                                description: "Email of the user",
                                example: "inovshop@inovshop.com"
                            },
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
      const lastName = req.body.lastname;
      const firstName = req.body.firstname;
      const email = req.body.email;
      // Vérifier si les champs ne sont pas vides
      if(!lastName || !firstName || !email || !password) {
        return res.status(400).send('Bad request');
      }
      const values = [lastName, firstName, email, id];

      await data.query(`UPDATE users SET lastname=?, firstname=?, email=?, modified=NOW() WHERE id=?`, [...values]);
      res.send({'message': `User with id ${id} have new email ${email} and new lastname ${lastName} and new firstname ${firstName}`});
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });

  app.put('/users/:id/password', verifyToken, validateId, validatePassword, validatePasswordConfirm, async (req, res, next) => {// #swagger.tags = ['Users']
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        password: {
                            type: "string",
                            description: "Password of the user",
                            example: "password"
                        },
                        confirmPassword: {
                            type: "string",
                            description: "Password confirmation",
                            example: "password"
                        },
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

        const id = req.params.id;
        const password = req.body.password
        const confirmPassword = req.body.confirmPassword;
        // Vérifier si le mot de passe et la confirmation du mot de passe correspondent
        if (password !== confirmPassword) {
            return res.status(400).send('Passwords do not match');
        }
        const passwordHash = await bcrypt.hash(password, 10); // Crypter le mot de passe
        // Vérifier si les champs ne sont pas vides
        if(!password) {
            return res.status(400).send('Bad request');
        }
        const values = [passwordHash, id];

        await data.query(`UPDATE users SET password=?, modified=NOW() WHERE id=?`, [...values]);
        res.send({'message': `Password of user with id ${id} have new password`}); // Renvoyer l'identifiant sous forme de chaîne dans un objet JSON
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });

  app.put('/users/:id/display', verifyToken, validateId, validateMode, async (req, res, next) => {// #swagger.tags = ['Users']
    /* #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        display: {
                            type: "string",
                            description: "dark or light",
                            example: "dark"
                        },
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

        const id = req.params.id;
        const display = req.body.display;
        // console.log(display);
        // Vérifier si les champs ne sont pas vides
        if(!display) {
            return res.status(400).send('Bad request');
        }
        const values = [display, id];

        await data.query(`UPDATE users SET display=?, modified=NOW() WHERE id=?`, [...values]);
        res.send({'message': `User with id ${id} have new display ${display}`}); // Renvoyer l'identifiant sous forme de chaîne dans un objet JSON
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });

}