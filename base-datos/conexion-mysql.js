const mysql2 = require('mysql2/promise');

async function getConnection(){
    return await mysql2.createConnection({
        host: process.env.MY_HOST,
        user: process.env.MY_USER,
        database: process.env.MY_DATABASE,
        password: process.env.MY_PASSWORD,
        /*waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10, 
        idleTimeout: 60000,
        queueLimit: 0*/
    });
}

module.exports = { getConnection }