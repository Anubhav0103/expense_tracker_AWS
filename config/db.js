const mysql = require('mysql2/promise');
require('dotenv').config();  // ✅ Load environment variables

const pool = mysql.createPool({
    host: process.env.DB_HOST,  // ✅ Access from .env
    user: process.env.DB_USER,       // ✅ Access from .env
    password: process.env.DB_PASSWORD,       // ✅ Access from .env
    database: process.env.DB_DATABASE, // Access from .env
    port: process.env.DB_PORT,  // ✅ Access from .env
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;