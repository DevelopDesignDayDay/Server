const mysql = require('mysql');
require('dotenv').config({path:__dirname+'/../.env'});

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    charset  : 'utf8mb4' 
};

const pool = mysql.createPool(config);
pool.getConnection((err, conn)=>{
    if(!err){
        console.log("DB CONNECTED")
    }
    conn.release();
});

module.exports = pool