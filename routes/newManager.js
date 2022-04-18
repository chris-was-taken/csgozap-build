var request = require("request");
var mysql = require("mysql");
var moment = require('moment');
var databaseManager = require("./databaseManager");
var botHandler = require("./botHandler")

//var steamApisApi = "TepcAfI1S2kghe_LZnKGgUZcS6Y";
var steamApisApi = "QvYN67ICBK25VqGq2WSRRP3nklA";

const connection = mysql.createConnection({
    host: "localhost",
    user: "main_query",
    password: 'z41"(H)Jhnfu("342',
    socketPath: '/var/run/mysqld/mysqld.sock',
    database: "main",
    charset: "utf8_general_ci"
});

function loadInventory(steamid, callback) {

    connection.query('SELECT * FROM user WHERE steam64 = ?', [steamid], function (error, results, fields) {

        if(results[0] === undefined || 5 - moment().diff(results[0]["lastInventoryRefresh"], 'seconds') < 0 || results[0]["lastInventoryRefresh"] == null) {
            connection.query('UPDATE user SET lastInventoryRefresh = ? WHERE steam64 = ?', [String(moment()),steamid], function (error, results, fields) {
            })
            var itemArr = [];
            request('https://api.steamapis.com/steam/inventory/' + steamid + '/578080/2?api_key=' + steamApisApi, function (error, response, body) {
                if (!error && response.statusCode == 200) {

                    var items = [];
                    var items_hashname_arr = [];
                    var classAssosiativeHashName = [];
                    var jsonContent = JSON.parse(body);
                    var finishedRequests = 0;
                    var counter = 0;

                    if(jsonContent === undefined || jsonContent == null || jsonContent["descriptions"] === undefined || jsonContent["descriptions"] == null) {
                        callback("There was a error while loading your items, please try again later! If the error keeps occurring please visit the Support page.")
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
                            callback("No items were found in your inventory, please try again later and make sure that your inventory isn't private!");
                        }
                        jsonContent["assets"].forEach(function (val, index) {
                            if (itemArr.includes(val["classid"])) {
                                var hashname = classAssosiativeHashName[val["classid"]]
                                console.log("New Hashname : ")
                                console.log(hashname);
                                /*                            if(hashname.includes("★")) {
                                                                hashname = hashname.replace('★','');
                                                            }*/
                                connection.query('SELECT * FROM prices WHERE hashname = ?', [hashname], function (error, results, fields) {
                                    //TODO HERE IS SOMETIMES UNDEFINED DONT KNOW WHY THO
                                    //TODO ITS BECAUSE THERE IS A PROBLEM WITH THE HASHNAME FOR KNIFES AND FINDING IT IN THE PRICES DB
                                    if(results[0] === undefined || results[0] === null) {

                                    } else {
                                        var price = parseFloat(results[0]["price"]);
                                        items.push([hashname, val["classid"], val["assetid"], price]);//price*100]);
                                        items_hashname_arr.push(hashname);
                                    }
                                    finishedRequests++;
                                    if (finishedRequests == counter) {

                                        console.log("dis we fetch")
                                        console.log(items)

                                        callback(items);

                                    }
                                })
                            }
                        })
                    }
                } else {
                    callback("There was a error loading the items, please try again later and make sure that your inventory isn't private!");
                }
            })
        } else {
            callback("You can only refresh your inventory every 30 seconds!");
        }
    })

};

function checkAndCloseCreate(coinflipID) {
    connection.query('SELECT * FROM coinflip WHERE id = ?', [coinflipID], function (error, results, fields) {
        if(results[0] !== undefined) {
            if (results[0]["steam64v2"] == null) {
                io.sockets.emit("deleteCoinflip", coinflipID);
                botHandler.sendCancelTradeofferBack(coinflipID, results[0]["tradeurl"], results[0]["bot_id"])
            } else if (results[0]["trade_acceptedv2"] == 1) {
            } else {
                setTimeout(checkAndCloseCreate, 3000, coinflipID)
            }
        }
    })
}

function fetchInventory(steamID,assets,callback) {
    request('https://api.steamapis.com/steam/inventory/' + steamID + '/578080/2?api_key=QvYN67ICBK25VqGq2WSRRP3nklA', function (error, response, body) {

        if (!error && response.statusCode == 200) {

            var itemInformations = [];
            var classAssosiativeHashName = [];
            var jsonContent = JSON.parse(body);
            var counter = 0;
            var itemArr = [];

            if(jsonContent === undefined || jsonContent["descriptions"] === undefined || jsonContent == null || jsonContent["descriptions"] == null) {
                return;
            }

            for (var i = 0; i < jsonContent["descriptions"].length; i++) {
                if (jsonContent["descriptions"][i]["tradable"] == 1) {
                    itemArr.push(jsonContent["descriptions"][i]["classid"])
                    classAssosiativeHashName[jsonContent["descriptions"][i]["classid"]] = jsonContent["descriptions"][i]["market_hash_name"]
                    // ---- > classAssosiativeHashName["classid"] = "hashname";
                }
            }

            jsonContent["assets"].forEach(function (val, index) {
                if (itemArr.includes(val["classid"])) {
                    counter++;
                }
            })

            jsonContent["assets"].forEach(function (val, index) {
                if (itemArr.includes(val["classid"])) {
                    var hashname = classAssosiativeHashName[val["classid"]]

                    if (assets.includes(val["assetid"])) {

                        //itemInformations.push([val["assetid"], val["classid"], hashname, 2]);

                        var itemInfoNew = [];

                        itemInfoNew["assetID"] = val["assetid"];
                        itemInfoNew["iconURL"] = val["classid"];
                        itemInfoNew["hashName"] = hashname;

                        itemInformations.push(itemInfoNew)

                    }
                }
            })

            console.log(itemInformations)
            itemInformations.forEach(function (val,ind) {
                databaseManager.getItemPrice(val["hashName"],function (itemprice) {
                    val["itemPrice"] = itemprice;
                    if(ind == itemInformations.length -1 ) {
                        console.log("Dis we fetched")
                        console.log(itemInformations)
                        callback(itemInformations);
                    }
                })
            })
        }

    })
}

module.exports = {
    loadInventory: loadInventory,
    fetchInventory: fetchInventory,
    checkAndCloseCreate: checkAndCloseCreate
};
