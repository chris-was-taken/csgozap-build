var mysql = require("mysql");
var moment = require("moment");
var request = require("request");
const connection = mysql.createConnection({
    host: "localhost",
    user: "main_query",
    password: 'z41"(H)Jhnfu("342',
    socketPath: '/var/run/mysqld/mysqld.sock',
    database: "main",
    charset: "utf8_general_ci"
});

var time = moment();

connection.query('TRUNCATE prices', function (error, results, fields) {

})
request('http://api.steamapis.com/market/items/578080?api_key=QvYN67ICBK25VqGq2WSRRP3nklA', function (error, response, body) {
    if (!error && response.statusCode == 200) {

        console.log("in dem bases ")

        var items = JSON.parse(body);
        var counter = 0;
        items["data"].forEach(function (val,index) {
            if(val["prices"]["unstable"] == true) {
                var unstable = 1;
            } else {
                var unstable = 0;
            }
            var price = val["prices"]["safe"];
            connection.query('INSERT INTO prices (hashname, unstable, price) VALUES (?, ?, ? )',[val["market_hash_name"],unstable,price], function (error, results, fields) {
                counter++;
/*                if(val["market_hash_name"].toUpperCase().includes("KARAMBIT")) {
                    console.log(val["market_hash_name"])
                }*/
                if (items["data"].length == counter) {
                    var time2 = moment();
                    /*console.log(JSON.parse(body))*/

                    console.log("and it started : ", time)
                    console.log("only took till : ", time2)
                    process.exit();
                }
            })
        })
    } else {
        console.log(error)
        console.log(response.statusCode)
        console.log(body)
    }
})