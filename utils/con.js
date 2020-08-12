const mysql = require("mysql");
require("dotenv").config();

const con = mysql.createPool({
    connectionLimit: 100,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DATABASE
});

con.getConnection(function(err, connection) {
    if (err) throw err;
    console.log("db connected!");
    connection.release();
});

const conQuery = function (query, value) {
    return new Promise(resolve => {
        con.query(query, value, function (err, result) {
            if (err) throw err;
            resolve(result);
        });
    });
};

module.exports = {
    con,
    conQuery
};