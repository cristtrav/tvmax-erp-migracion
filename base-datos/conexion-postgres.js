const postgrescon = require('pg')

async function getConnection(){
    const postgres = new postgrescon.Client({
        user: process.env.PG_USER,
        host: process.env.PG_HOST,
        database: process.env.PG_DATABASE,
        password: process.env.PG_PASSWORD
    })

    await postgres.connect();
    return postgres;
}

module.exports = {getConnection}