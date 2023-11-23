require('dotenv').config(); // Load .env file
// MariaDB ---------------------------------------------------------------------
const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: process.env.DATABASE_PORT,
});

async function getConnection() {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error(error);
    }
}

async function query(sql, params) {
    const connection = await getConnection();
    try {
        return await connection.query(sql, params);
    } catch (error) {
        console.error(error);
    } finally {
        await connection.release();
    }
}

module.exports = {
    query,
}