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

/*setTimeout(function () {
 getAllHashnames(function (hashnames) {
 console.log(hashnames)
 })
 /!*botArray.forEach(function (val,ind) {
 val.getInventory();
 })*!/
 },5000)*/

function getAllHashnames(coinflipId,callback) {
    var hashnames = [];
    connection.query("SELECT * FROM items WHERE coinflip_id = ? AND taxed = 0", [coinflipId], function (err, result) {
        result.forEach(function (val, ind) {
            hashnames.push(val["market_hash_name"])
            if (ind == result.length - 1) {
                callback(hashnames)
            }
        })
    })
}

function getBotInventory(bot,callback) {
    bot._manager.getInventoryContents(578080, 2, true, function (err, inventory) {
        callback(inventory)
    })
}

/*setTimeout(function () {
    botArray.forEach(function (bot, ind) {
        getBotInventory(bot,function (inventory) {
            var inv = inventory;
            connection.query("SELECT * FROM coinflip WHERE winofferid IS NOT NULL AND winofferid_accepted = 0 AND bot_id = ?", [bot._bot_number], function (err, result) {
                result.forEach(function (val, ind) {
                    if (val["winner"] == "p1") {
                        var tradeurl = val["tradeurl"];
                    } else {
                        var tradeurl = val["tradeurlv2"]
                    }
                    getAllHashnames(val["id"],function (hashnames) {
                        var hashnames = hashnames;
                        var assets = [];
                        var deleteArr = [];
                        inv.forEach(function (val,ind) {
                            if(hashnames.includes(val["market_hash_name"])) {
                                console.log("New Hashname + "+val["market_hash_name"])
                                assets.push(val["assetid"])
                                var index = hashnames.indexOf(val["market_hash_name"])
                                hashnames.splice(index,1);
                                //inv.splice(ind, 1);
                                deleteArr.push(val)
                            }
                        })
                        deleteArr.forEach(function (val,ind) {
                            var index = inv.indexOf(val)
                            inv.splice(index, 1);
                        })
                        bot.sendWinningOffer(tradeurl, assets ,function (status) {
                            console.log(status)
                        })
                    })
                })
            })
        })
    })
},10000)*/

setTimeout(function () {
    resendOfferWithCoinflipId(280)
},5000)

function resendOfferWithCoinflipId(coinflipid) {
    connection.query("SELECT * FROM coinflip WHERE id = ?", [coinflipid], function (err, coinflipData) {
        connection.query("SELECT * FROM items WHERE coinflip_id = ? AND taxed = 0", [coinflipid], function (err, itemData) {
            getBotInventory(botArray[coinflipData[0]["bot_id"]-1],function (inventory) {
                if (coinflipData[0]["winner"] == "p1") {
                    var tradeurl = coinflipData[0]["tradeurl"];
                } else {
                    var tradeurl = coinflipData[0]["tradeurlv2"]
                }
                var assets = [];
                var hashnames = [];
                var invHashNames = [];
                var realAssets = [];
                var marker = false;
                inventory.forEach(function (val,ind) {
                    realAssets.push(val["assetid"])
                    invHashNames.push(val["market_hash_name"]);
                })
                itemData.forEach(function (val,ind) {
                    assets.push(val["assetid"])
                    hashnames.push(val["market_hash_name"])
                    if(!realAssets.includes(val["assetid"])) {
                        marker = true;
                    }
                })
                console.log("Given Hashnames ->")
                console.log(hashnames)
                console.log("All Hashnames ->")
                console.log(invHashNames)
                if(marker) {
                    assets = [];
                    inventory.forEach(function (val,ind) {
                        if(hashnames.includes(val["market_hash_name"])) {
                            assets.push(val["assetid"])
                            var index = hashnames.indexOf(val["market_hash_name"])
                            hashnames.splice(index,1);
                        }
                    })
                    botArray[coinflipData[0]["bot_id"]-1].sendWinningOffer(tradeurl, assets ,function (status) {
                        console.log(status)
                    })
                } else {
                    botArray[coinflipData[0]["bot_id"]-1].sendWinningOffer(tradeurl, assets ,function (status) {
                        console.log(status)
                    })
                }
            })
        })
    })
}



