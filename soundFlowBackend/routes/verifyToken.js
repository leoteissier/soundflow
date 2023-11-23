require('dotenv').config();
const data = require('./datas.js');
const jwt = require('jsonwebtoken');

module.exports = async function (req, res, next) {
    /* #swagger.security = [{
          "bearerAuth": []
    }] */
    if(!req.headers.authorization) return res.status(401).send('Access denied. No token provided');
    const token = req.headers.authorization.split(' ')[1];
    if (!token) return res.status(401).send('Access denied. No token provided.');
    try {
        // verifier si user exist
        const decryptedUser = jwt.verify(token, process.env.JWT_SECRET);
        const rows = await data.query('SELECT id, lastname, firstname, email, created, modified FROM users WHERE id = ?', [decryptedUser.id]);
        if (!rows[0]) return res.status(401).send('user not found')
        else req.user = rows[0];
        next();
    } catch (error) {
        console.error(error)
        res.status(400).send('Invalid token.');
    }
};