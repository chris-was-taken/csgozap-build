var mysql = require('mysql');

const connection = mysql.createConnection({
    host: "localhost",
    user: "main_query",
    password: 'z41"(H)Jhnfu("342',
    socketPath: '/var/run/mysqld/mysqld.sock',
    database: "main",
    charset: "utf8_general_ci"
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    var sql = "CREATE TABLE prices (hashname VARCHAR(125), unstable INT(5), price VARCHAR(10))";
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Table created");
    });
});