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
    var sql = "CREATE TABLE coinflip (steam64 VARCHAR(255), value VARCHAR(255), items VARCHAR(255), trade_accepted BIT(1), site_chosen BIT(1),tradeurl VARCHAR(255), finished BIT(1), winner BIT(1))";
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Table created");
    });
});