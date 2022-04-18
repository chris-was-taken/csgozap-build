var bot = require("./bot.js");
var request = require("request")
var databaseManager = require("./databaseManager.js");
var steamApisApi = "QvYN67ICBK25VqGq2WSRRP3nklA";
var mysql = require("mysql")

const connection = mysql.createConnection({
    host: "localhost",
    user: "main_query",
    password: 'z41"(H)Jhnfu("342',
    socketPath: '/var/run/mysqld/mysqld.sock',
    database: "main",
    charset: "utf8_general_ci"
});

//TRADEURL TO DEPOSIT ITEMS = https://steamcommunity.com/tradeoffer/new/?partner=846278581&token=d7JmJUKF

var bot1 = new bot("randomnamessuck","Im.Just.Bot312","RF/cJtcMGExFy3QB4GdkmsZz1XM=","hQ/GdeSiHqrZj3Sly4ufZ4AqoAU=",999);
bot1.login()
bot1.afevents();

function sendAFShopTrade(tradeurl,assets) {
    bot1.sendAFShopOffer(tradeurl,assets,function (offerid) {

    })
}

function loadBotInventory(callback,para) {
    if(para) {
        var string = 'https://api.steamapis.com/steam/inventory/'+para+'/578080/2?api_key='
    } else {
        var string = 'https://api.steamapis.com/steam/inventory/76561198806544309/578080/2?api_key='
    }
    request(string + steamApisApi, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var items = [];
            var itemArr = [];
            var items_hashname_arr = [];
            var classAssosiativeHashName = [];
            var jsonContent = JSON.parse(body);
            var finishedRequests = 0;
            var counter = 0;

            if(jsonContent === undefined || jsonContent == null || jsonContent["descriptions"] === undefined || jsonContent["descriptions"] == null) {
                callback("There was a error while loading our items. We are either out of stock or an error occoured. Please try again later!")
            } else {
                for (var i = 0; i < jsonContent["descriptions"].length; i++) {
                    if (jsonContent["descriptions"][i]["tradable"] == 1) {
                        itemArr.push(jsonContent["descriptions"][i]["classid"])
                        classAssosiativeHashName[jsonContent["descriptions"][i]["classid"]] = jsonContent["descriptions"][i]["market_hash_name"]
                    }
                }
                jsonContent["assets"].forEach(function (val, index) {
                    if (itemArr.includes(val["classid"])) {
                        counter++;
                    }
                })
                if(counter == 0) {
                    callback("Unfortunatley we are out of stock.");
                }
                jsonContent["assets"].forEach(function (val, index) {
                    if (itemArr.includes(val["classid"])) {
                        var hashname = classAssosiativeHashName[val["classid"]]

                        connection.query('SELECT * FROM prices WHERE hashname = ?', [hashname], function (error, results, fields) {

                            if(results[0] === undefined || results[0] === null) {

                            } else {
                                var price = parseFloat(results[0]["price"]);
                                items.push([hashname, val["classid"], val["assetid"], price]);
                                items_hashname_arr.push(hashname);
                            }
                            finishedRequests++;
                            if (finishedRequests == counter) {

                                callback(items);

                            }
                        })
                    }
                })
            }
        } else {
            callback("There was a error loading our items! Please try again later!");
        }
    })
}

function prepareBotCoinflip(steamInfos,botAssets,playerAssets,callback) {
    loadBotInventory(function (inv) {
        var playerPrice = 0;
        var botPrice = 0;
        if(Array.isArray(inv)) {
            inv.forEach(function (val,ind) {
                if(playerAssets.includes(val[2])) {
                    playerPrice += val[3]
                }
            })
            loadBotInventory(function (botInv) {
                if(Array.isArray(botInv)) {
                    botInv.forEach(function (val, ind) {
                        if (botAssets.includes(val[2])) {
                            botPrice += val[3]
                        }
                    })
                    if(playerPrice >= botPrice && playerPrice <= (botPrice / 100) * 105) {
                        steamInfos["botValue"] = botPrice
                        steamInfos["playerValue"] = playerPrice
                        bot1.requestItems(steamInfos,botAssets,playerAssets,function (offerId,offerHash) {
                            callback(offerId,offerHash)
                        })
                    } else {
                        callback("The given prices where incorrect, if you try to exploit us we will permanently ban you from using our service.")
                    }

                } else {
                    callback("Failed to confirm bots item data, please try again later.")
                }
            })
        } else {
            callback("Failed to confirm your item data, please try again later.")
        }
    },steamInfos["player64"])
}

module.exports = {
    sendAFShopTrade: sendAFShopTrade,
    loadBotInventory, loadBotInventory,
    prepareBotCoinflip: prepareBotCoinflip
};
