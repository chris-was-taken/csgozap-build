var mysql = require("mysql");

const connection = mysql.createConnection({
    host: "localhost",
    user: "main_query",
    password: 'z41"(H)Jhnfu("342',
    socketPath: '/var/run/mysqld/mysqld.sock',
    database: "main",
    charset: "utf8_general_ci"
});

var bot = require("./bot.js");

var bot1 = new bot("ioagvnoighn", "!OUdaOJGNg!?", "W+AjQXY99PJxMZgSOIWPnJxwzzI=", "VGCRgK0LJT8J0q8E/eaCyVm3B1c=", 1);
var bot2 = new bot("nbeaufhunvaw", "BV82!??.D", "cCJU52pZ/mdW+IOwTVN9xaBTvLc=", "/gUQUq7ZceF8oP5eOQ/Gre3GJ8A=", 2);
var bot3 = new bot("pioj2trj3jtijoatroai", '!NrUN2AFNi"1fA', "1tkvR+Z49Xv+Y1Q5gp1qhmoyKg4=", "IGJffZwXKtqitDWeNkuAIfWls10=", 3);
var bot4 = new bot("klafkawktrfopkawt24", '!fini"IHnfnFANO', "C3j4sYEv75bzPHSjCivqrZjlXmY=", "+p670VWl5vB/CXeGo7JKXqXW20Y=", 4);
var bot5 = new bot("jiof3q29ffaiojfq", 'Nunbf"Ubf8N"f', "yacTt/T/lyogD+Zhm7xMYT3aGcQ=", "p/ldgEa1JzQmspE+VORYZfbi3cc=", 5);

var botArray = [bot1,bot2,bot3,bot4,bot5];//,bot2,bot3,bot4];

loginBots();

function loginBots() {
    botArray.forEach(function (val, ind) {
        val.login();
    })
}

setTimeout(function () {
    botArray.forEach(function (bot,ind) {
        bot.resendEverything();
    })
},10000)



