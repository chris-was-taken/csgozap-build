var botHandler = require("./botHandler.js");
var databaseManager = require("./databaseManager.js");
var newManager = require("./newManager.js");

function sendTrade(requestPackage,requestStatusType,callback) {
    switch (requestStatusType) {
        case "create":
            handleCreateRequest(requestPackage,function (offerId,secretHash) {
                callback(offerId,secretHash);
            });
            break;
        case "join":
            handleJoinRequest(requestPackage,function (offerId,secretHash) {
                callback(offerId,secretHash);
            });
            break;
        case "winning":
            break;
    }
}

function handleCreateRequest(requestPackage,callback) {

    validateCreateRequest(requestPackage,function (itemInformations) {
        databaseManager.getTradeurlBySteam64(requestPackage["steamID"],function (tradeurl) {
            requestPackage["tradeURL"] = tradeurl;
            requestPackage["value"] = 0;

            itemInformations.forEach(function (val,ind) {
                requestPackage["value"] += parseFloat(val["itemPrice"])
            })

            if (requestPackage["value"] >= 0.5) {
                //TODO PASS VALUE FOR COINFLIP / MAYBE JUST ADD ALL FROM ITEM INFORMATIONS
                databaseManager.createNewCoinflipEntry(requestPackage, function (coinflipID) {
                    requestPackage["coinflipID"] = coinflipID;
                    console.log("after coinflip insert")
                    databaseManager.insertNewItemEntry(itemInformations, coinflipID, 0, function () {
                        console.log("after item insert")
                        botHandler.sendTrade(requestPackage, function (offerId, secretHash) {
                            console.log("before last thingy")
                            callback(offerId, secretHash);
                        })
                    })
                })
            } else {
                callback("The value of the items selected is under 0.50! If you encounter this error more often please contact the support.");
            }
        })
    });

}

function validateCreateRequest(requestPackage,callback) {

    //TODO MAYBE CHECK SOMEWHERE IF TOTAL PRICE IS OVER 0.5 ?

    var assets = requestPackage["assets"]

    console.log(requestPackage)

    newManager.fetchInventory(requestPackage["steamID"],assets,function (itemInformations) {
        callback(itemInformations);
    })

}

function handleJoinRequest(requestPackage,callback) {
    console.log(requestPackage["coinflipId"])
    databaseManager.checkAndInsertJoinAttemptDate(requestPackage["steamID"],requestPackage["coinflipId"],function (responseMessage) {
        if(responseMessage == "success") {
            validateJoinRequest(requestPackage,function (itemInformations) {
                databaseManager.getTradeurlBySteam64(requestPackage["steamID"],function (tradeurl) {
                    requestPackage["tradeURL"] = tradeurl;
                    requestPackage["value"] = 0;

                    itemInformations.forEach(function (val,ind) {
                        requestPackage["value"] += parseFloat(val["itemPrice"])
                    })

                    databaseManager.getNeededPrice(requestPackage["coinflipId"],function (lowendTrashold,highendTrashhold) {
                        if (requestPackage["value"] >= lowendTrashold && requestPackage["value"] <= highendTrashhold) {
                            databaseManager.insertJoinAttempt(requestPackage, function (bot_id) {
                                databaseManager.insertNewItemEntry(itemInformations, requestPackage["coinflipId"], 1, function () {
                                    databaseManager.prepareCoinflipArray(requestPackage["coinflipId"],function (updatedCoinflipArr) {
                                        io.sockets.emit("updateCoinflipArray",updatedCoinflipArr,requestPackage["coinflipId"]);
                                    })
                                    console.log("HERE IS THE BOT ID WE HAVE WHEN CREATING JOIN ATTEMPT")
                                    console.log(bot_id)
                                    botHandler.sendTrade(requestPackage, function (offerId, secretHash) {
                                        callback(offerId, secretHash);
                                    }, bot_id)
                                })
                            })
                        } else {
                            callback("The value of the items is to low or to high! If you encounter this error more often please contact the support.");
                        }
                    })
                })
            });
        } else {
            callback(responseMessage);
        }
    })

}

function validateJoinRequest(requestPackage,callback) {

    var assets = requestPackage["assets"]
    newManager.fetchInventory(requestPackage["steamID"],assets,function (itemInformations) {
        callback(itemInformations);
    })

}

function handleWinningRequest() {

}

module.exports = {
    sendTrade: sendTrade
};
