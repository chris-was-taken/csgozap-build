var bot = require("./bot.js");
var databaseManager = require("./databaseManager.js");

var bot1 = new bot("ximvtwl0062","8446trlEQOA","S6KTpOMYhb6teCjYMMNxRNF+Mkg=","kLdwlaWb//jBQpT1/BrDP4J1bAs=",1);
var bot2 = new bot("cykanahoinugget","Im.Just.Bot312","ZeZqARKaWj0MObetHO1TeoJZ8Ms=","cy9nBLx5nrneMvBDyadl5j5jjLM=",2);
var bot3 = new bot("rofligercopter","Im.Just.Bot312","FqN/drVFPrw32Gq39lImJ2WkBcE=","PMBCUIzBQYU8aTzCcS3Ekz8gK4s=",3);

var botArray = [bot1,bot2,bot3];

loginBots();

function sendTrade(requestPackage,callback,bot_id) {

    console.log("in send trade")
    console.log("DIS IS DA BOT IDS")
    console.log(bot_id)
    if(bot_id === undefined || bot_id == null) {
        getOpenTradesForUser(requestPackage["steamID"],function (amountOfTradeoffers) {
            console.log("after get open trades")
            console.log(amountOfTradeoffers)
            if(amountOfTradeoffers < 3) {
                selectFreeBot(function (bot) {
                    console.log("after select free bot")
                    bot.sendTrade(requestPackage,function (offerId,secretHash) {
                        callback(offerId,secretHash);
                    });
                })
            } else {
                callback("You have to many open Tradeoffers with our bots. Please accept or decline them first before you try again.");
            }
        })
    } else {
        getOpenTradesForUser(requestPackage["steamID"],function (amountOfTradeoffers) {
            console.log("after get open trades")
            console.log(amountOfTradeoffers)
            if(amountOfTradeoffers < 3) {
                getBotByID(bot_id,function (bot) {
                    bot.sendTrade(requestPackage,function (offerId,secretHash) {
                        callback(offerId,secretHash);
                    });
                })
            } else {
                callback("You have to many open Tradeoffers with our bots. Please accept or decline them first before you try again.");
            }
        })
    }

/*    selectFreeBot().sendTrade(requestPackage,function (offerId,secretHash) {
        callback(offerId,secretHash);
    });*/
}

function getBotByID(id,callback) {
    console.log("IN BEGINNING GET BOT BY ID")
    console.log(botArray)
    botArray.forEach(function (val,ind) {
        console.log("in loop")
        console.log(val)
        console.log(" bot number ")
        console.log(val._bot_number)
        console.log("looking for ")
        console.log(parseInt(id))
        if(val._bot_number == parseInt(id)) {
            console.log("Triggerd if")
            callback(val);
        }
    })
}

function loginBots() {
    botArray.forEach(function (val,ind) {
        val.login();
    })
}

function getOpenTradesForUser(steam64,callback) {
    var tradeOffers = 0;
    var finaleSize = botArray.length;
    var finalCounter = 0;
    botArray.forEach(function (bot,index) {
        console.log("in bot array for each")
        bot._manager.getOffers(1,function (err,sent,received) {
            console.log("in bot get offers")
            console.log(sent)
            if(sent.length == 0) {
                finalCounter++;
                console.log("in first finished check ")
                console.log(finalCounter);
                if(finalCounter == finaleSize) {
                    callback(tradeOffers);
                }
            }
            sent.forEach(function (val, ind) {
                console.log(" in sent ")
                console.log(val.partner.getSteamID64());
                if(val.partner.getSteamID64() == steam64) {
                    tradeOffers++;
                }
                if(ind == sent.length - 1) {
                    finalCounter++;
                    console.log("in second finished check ")
                    console.log(finalCounter);
                    if(finalCounter == finaleSize) {
                        callback(tradeOffers);
                    }
                }
            })
        })
    })

}

function giveItemsBack() {

    botArray.forEach(function (bot,index) {

        bot._manager.getInventoryContents(578080, 2, true, function (err, inventory) {
            if (err) {
                console.log(err);
                return;
            }
            if (inventory.length == 0) {
                console.log("There are no Items on this Bot Account.");
                return;
            }
            var offer = bot._manager.createOffer("https://steamcommunity.com/tradeoffer/new/?partner=480901181&token=Tjoi_8H8");

            //08.01 TODO IMPLEMENT FEATURE BELOW AND TEST IT
            databaseManager.getTaxedItemsAssets((assets) => {


                if( assets === undefined || !assets || assets.length == 0 || assets == null) {
                    return;
                }

                var taxedAssets = [];

                inventory.forEach(function (val,ind) {
                    if (assets.includes(val["assetid"])) {
                        taxedAssets.push(val["assetid"])
                        offer.addMyItem({
                            'assetid': val["assetid"],
                            'appid': 578080,
                            'contextid': 2
                        });
                    }
                })

                offer.setMessage("Tax Items!");
                offer.send(function (err, status) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    if (status == 'pending') {
                        // We need to confirm it
                        console.log(`Offer #${offer.id} sent, but requires confirmation`);
                        bot._community.acceptConfirmationForObject(bot._identity_secret, offer.id, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("Offer confirmed");
                            }
                        });
                    } else {
                        console.log(`Offer #${offer.id} sent successfully`);
                    }

                    databaseManager.setTaxedItemsDelivered(taxedAssets);

                });

            })

/*            var counter = 0;
/!*            inventory.forEach(function (val,ind) {
                counter++;
                if(counter < 20 || counter > 40) {
                    return;
                } else {
                    console.log(val)
                    offer.addMyItem({
                        'assetid': val["assetid"],
                        'appid': 730,
                        'contextid': 2
                    });
                }
            })*!/
            offer.addMyItems(inventory);
            offer.setMessage("Here, have some items!");
            offer.send(function (err, status) {
                if (err) {
                    console.log(err);
                    return;
                }

                if (status == 'pending') {
                    // We need to confirm it
                    console.log(`Offer #${offer.id} sent, but requires confirmation`);
                    bot._community.acceptConfirmationForObject(bot._identity_secret, offer.id, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Offer confirmed");
                        }
                    });
                } else {
                    console.log(`Offer #${offer.id} sent successfully`);
                }
            });*/
        });
    })

}

function sendWinnersTrade(id,tradeurl,assets,callback) {
    getBotByID(id,function (bot) {
        bot.sendWinningOffer(tradeurl,assets,function (offerid) {
            callback(offerid)
        })
    })
}

function selectFreeBot(callback) {

    var trigger = false;
    botArray.forEach(function (bot,index) {
        bot._manager.getOffers(1, (err, sent, received) => {
            if (sent.length < 2) {
                if (!trigger) {
                    trigger = true;
                    callback(bot);
                }
            }
        })
    })
}

function sendCancelTradeofferBack(coinflipID,tradeurl,id) {
    getBotByID(id,function (bot) {
        bot.sendOfferWithOurItems(coinflipID,tradeurl)
    })
}

module.exports = {
    sendTrade: sendTrade,
    giveItemsBack: giveItemsBack,
    sendCancelTradeofferBack: sendCancelTradeofferBack,
    sendWinnersTrade: sendWinnersTrade
};
