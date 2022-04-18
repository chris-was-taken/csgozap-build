//Get All needed Modules
var SteamUser = require('steam-user');
var SteamCommunity = require('steamcommunity');
var SteamTotp = require('steam-totp');
var TradeOfferManager = require('steam-tradeoffer-manager'); // use require('steam-tradeoffer-manager') in production
var request = require("request");
var mysql = require("mysql");
var moment = require('moment')
var randomstring = require("randomstring");
var databaseManager = require("./databaseManager.js");
var botHandler = require("./botHandler.js");
var newManager = require("./newManager.js");

class Bot {
    constructor(username, password, shared_secret, identity_secret, bot_number) {
        this._username = username;
        this._password = password;
        this._shared_secret = shared_secret;
        this._identity_secret = identity_secret;
        this._bot_number = bot_number;
        this._logged = false;
        this._client = new SteamUser();
        this._manager = new TradeOfferManager({
            "steam": this._client, // Polling every 30 seconds is fine since we get notifications from Steam
            "domain": "csgozap.com", // Our domain is example.com
            "language": "en", // We want English item descriptions
            "pollInterval": "3000",
            "cancelTime": "1800000" // Currently deletes Create attempts after 30 minutes
        })
        this._community = new SteamCommunity();
        this._busy = false;
    }

    login() {
        this.eventHandling();
        console.log("In Login Request for Bot: " + this._bot_number)
        this._client.logOn({
            "accountName": this._username,
            "password": this._password,
            "twoFactorCode": SteamTotp.getAuthCode(this._shared_secret)
        })
        //TODO NEED TO REMOVE THIS IF I USE MORE THEN 1 BOT
        setTimeout(() => {
            databaseManager.loadLastBotSend((lastSend) => {
                if(parseInt(Date.now()) - parseInt(lastSend) > 1000*60*60) {
                    databaseManager.setLastBotSend()
                    botHandler = require("./botHandler.js")
                    botHandler.giveItemsBack()
                }
            })
        },15000)
    }

    sendTrade(requestPackage, callback) {

        var assetIds = requestPackage["assets"];        

        if(requestPackage["tradeURL"] === undefined || requestPackage["tradeURL"] == null) {
            callback("Unfortunately we couldn't send the trade. You haven't set a valid tradeurl yet.");
            return false;
        }
        var tradeurl = requestPackage["tradeURL"].toLowerCase();

        if(tradeurl.includes("https://steamcommunity.com/tradeoffer/new/?partner=") && tradeurl.includes("&token=") && !tradeurl.includes(" ")) {
        } else {
            callback("Unfortunately we couldn't send the trade. Your tradeurl seems to be malformed. Please try to reset it with a valid one.");
            return false;
        }

        var offer = this._manager.createOffer(requestPackage["tradeURL"]);

        assetIds.forEach(function (val, ind) {
            offer.addTheirItem({
                'assetid': val,
                'appid': 578080,
                'contextid': 2
            });
        })


        var secretHash = randomstring.generate(7);

        if (requestPackage["player1secret"] === undefined || requestPackage["player1secret"] == null) {
            setTimeout(function () {
                console.log("please worj dius time")
                databaseManager.getJoinOfferStatus(requestPackage["coinflipId"], function (status) {
                    console.log("LOG 1.1 -> after getJoinOfferStatus -> bot.js line 65 -> status : " + status)
                    if (status == 0 || status == null) {
                        offer.cancel(function () {
                            databaseManager.checkAndDeleteJoinAttempt(requestPackage["coinflipId"]);
                        })
                    }
                });
            }, 1000 * 100)
        }

        offer.setMessage("Coinflip offer - Secret: " + secretHash);
        offer.send((err, status) => {
            //TODO CHECK AND DELETE COINFLIP AFTER 30 MINUTES
            //TODO MAYBE DO INT BOT HANDLER SINCE THIS METHOD CAN BE USED BY JOIN REQUEST ASWELL
            //TODO ALL REQUEST ARE GETTING CANCLED AFTER 30 MINUTES ANYWAY SO NOT SURE IF REALLY NEEDED HERE
            //setTimeout(checkAndDeleteJoinAttempt, 1000 * 100, coinflipId, offer);
            if (err) {
                console.log(err);
                callback(err);
            }

            if (status == 'pending') {
                console.log(`Offer #${offer.id} sent, but requires confirmation`);
                this._community.acceptConfirmationForObject(this._identity_secret, offer.id, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(offer);
                        console.log("Offer confirmed");

                        if (requestPackage["player1secret"] === undefined || requestPackage["player1secret"] == null) {
                            databaseManager.finalizeJoinRequest(offer.id, secretHash, requestPackage["coinflipId"], requestPackage["player2secret"]);
                        } else {
                            console.log("before the offer gets finalized -> create1")
                            databaseManager.finalizeCreateRequest(offer.id, secretHash, this._bot_number, requestPackage["coinflipID"], requestPackage["player1secret"])
                        }

                        callback(offer.id, secretHash);

                    }
                });
            } else {
                console.log(`Offer #${offer.id} sent successfully`);

                if (requestPackage["player1secret"] === undefined || requestPackage["player1secret"] == null) {
                    databaseManager.finalizeJoinRequest(offer.id, secretHash, requestPackage["coinflipId"], requestPackage["player2secret"]);
                } else {
                    console.log("before the offer gets finalized -> create2")
                    databaseManager.finalizeCreateRequest(offer.id, secretHash, this._bot_number, requestPackage["coinflipID"], requestPackage["player1secret"])
                }

                callback(offer.id, secretHash);

            }
        });

    }

    sendOfferWithOurItems(coinflipId, tradeurl) {
        databaseManager.getAssets(coinflipId, (assets) => {
            var assetIds = assets;

            var offer = this._manager.createOffer(tradeurl);

            assetIds.forEach(function (val, ind) {
                offer.addMyItem({
                    'assetid': val,
                    'appid': 578080,
                    'contextid': 2
                });
            })

            offer.setMessage("Unfortunately no one joined your coinflip in the last 30 minutes, so here, have your items back!");
            offer.send((err, status) => {
                if (status == 'pending') {
                    console.log(`Offer #${offer.id} sent, but requires confirmation`);
                    this._community.acceptConfirmationForObject(this._identity_secret, offer.id, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(offer);
                            console.log("Offer confirmed");

                            databaseManager.markCreateSendBack(coinflipId)
                        }
                    });
                } else {
                    console.log(`Offer #${offer.id} sent successfully`);

                    databaseManager.markCreateSendBack(coinflipId)
                }
            });
        })
    }

    sendTaxItemsToHolder() {
        databaseManager.getTaxItemAssets((assets) => {
            if(assets !== undefined && assets != null) {
                console.log("i got this assets")
                console.log(assets)
                var assetIds = [];

                assets.forEach(function (val,ind) {
                    assetIds.push(val["assetid"])
                })

                console.log("afterwards i got this")
                console.log(assetIds)

                var offer = this._manager.createOffer("https://steamcommunity.com/tradeoffer/new/?partner=480901181&token=Tjoi_8H8");

                assetIds.forEach(function (val, ind) {
                    offer.addMyItem({
                        'assetid': val,
                        'appid': 578080,
                        'contextid': 2
                    });
                })

                offer.setMessage("We Gucci!");
                offer.send((err, status) => {
                    if (status == 'pending') {
                        console.log(`Offer #${offer.id} sent, but requires confirmation`);
                        this._community.acceptConfirmationForObject(this._identity_secret, offer.id, (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(offer);
                                console.log("Offer confirmed");

                                databaseManager.setTaxedItemsDelivered(assetIds);
                            }
                        });
                    } else {
                        console.log(`Offer #${offer.id} sent successfully`);

                        databaseManager.setTaxedItemsDelivered(assetIds);
                    }
                });
            }
        })
    }

    sendWinningOffer(tradeurl, assets, callback) {

        var offer = this._manager.createOffer(tradeurl);

        console.log("We are right where the assets for the winning offer get passed : ")
        console.log("Assets Array : ")
        console.log(assets)
        console.log("We are right where the assets for the winning offer get added : ")

        //TODO WONT WORK FOR MULTIPLE BOT ACCOUNTS
        databaseManager.loadLastBotSend((lastSend) => {
            if(parseInt(Date.now()) - parseInt(lastSend) > 1000*60*60) {
                databaseManager.setLastBotSend()
                botHandler = require("./botHandler.js")
                botHandler.giveItemsBack()
            }
        })
        
        assets.forEach(function (val, ind) {
            offer.addMyItem({
                'assetid': val,
                'appid': 578080,
                'contextid': 2
            });

            console.log("Assets Added with the ID : " + val)

        })

        offer.setMessage("Congratulations you won a Coinflip! Here enjoy your winnings!");

        offer.send((err, status) => {
            if (status == 'pending') {
                console.log(`Offer #${offer.id} sent, but requires confirmation`);
                this._community.acceptConfirmationForObject(this._identity_secret, offer.id, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(offer);
                        console.log("Offer confirmed");
                    }
                });
            } else {
                console.log(`Offer #${offer.id} sent successfully`);
            }

            callback(offer.id);
        });
    }

    requestItems(steamInfos,botAssets,playerAssets,callback) {

        databaseManager.createBotcfEntry(steamInfos,botAssets,playerAssets,(insertId) => {

            var offer = this._manager.createOffer(steamInfos["playerTradeurl"]);

            playerAssets.forEach(function (val, ind) {
                offer.addTheirItem({
                    'assetid': val,
                    'appid': 578080,
                    'contextid': 2
                });
            })

            var secretHash = randomstring.generate(7);

            offer.setMessage("Bot Coinflip offer - Secret: " + secretHash);

            offer.send((err, status) => {
                if (err) {
                    console.log(err);
                    callback(err);
                }

                if (status == 'pending') {
                    console.log(`Offer #${offer.id} sent, but requires confirmation`);
                    this._community.acceptConfirmationForObject(this._identity_secret, offer.id, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Offer confirmed");

                            databaseManager.addBotcfOfferInfo(insertId,offer.id,secretHash,function () {
                                callback(offer.id, secretHash);
                            })

                        }
                    });
                } else {
                    console.log(`Offer #${offer.id} sent successfully`);

                    databaseManager.addBotcfOfferInfo(insertId,offer.id,secretHash,function () {
                        callback(offer.id, secretHash);
                    })

                }
            });
        })

    }

    sendAFShopOffer(tradeurl,assets,callback) {

        var offer = this._manager.createOffer(tradeurl);

        assets.forEach(function (val, ind) {
            offer.addMyItem({
                'assetid': val,
                'appid': 578080,
                'contextid': 2
            });
        })

        offer.setMessage("Hello, here is your offer from our affiliate store!");

        offer.send((err, status) => {
            if (status == 'pending') {
                console.log(`Offer #${offer.id} sent, but requires confirmation`);
                this._community.acceptConfirmationForObject(this._identity_secret, offer.id, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(offer);
                        console.log("Offer confirmed");
                    }
                });
            } else {
                console.log(`Offer #${offer.id} sent successfully`);
            }

            callback(offer.id);
        });
    }

    afevents() {
        this._manager.on('newOffer', (offer) => {
            console.log("New offer #" + offer.id + " from " + offer.partner.getSteam3RenderedID());

            if (offer.itemsToGive.length == 0 && offer.itemsToReceive.length > 0) {
                offer.accept((err) => {
                    if (err) {
                        console.log("Unable to accept offer: " + err.message);
                    } else {
                        console.log("Offer accepted");
                    }
                });
            }
        });
    }

    eventHandling() {
        this._client.on('loggedOn', () => {
            console.log("Bot " + this._bot_number + " successfully logged in!");
        });

        this._client.on('webSession', (sessionID, cookies) => {
            this._manager.setCookies(cookies, (err) => {
                if (err) {
                    console.log(err);
                    //process.exit(1);
                    return;
                }
                console.log("Got API key: " + this._manager.apiKey + " for Bot Number: " + this._bot_number);
            });
            this._community.setCookies(cookies);
        });

        this._manager.on('sentOfferChanged', (offer, oldState) => {
            console.log(`Offer #${offer.id} changed: ${TradeOfferManager.ETradeOfferState[oldState]} -> ${TradeOfferManager.ETradeOfferState[offer.state]}`);
            if (offer.state == 3) {
                databaseManager.getOfferState(offer.id, (state, coinflipID) => {
                    console.log(state)
                    switch (state) {
                        case "create":
                            console.log("in creation state")
                            databaseManager.updateCreateOffer(coinflipID, () => {
                                console.log("in correct one if createrooo")
                                databaseManager.prepareCoinflipArray(coinflipID, (coinflipArray) => {
                                    //TODO SEE WHY A ERROR OCCURS HERE
                                    setTimeout(() => {
                                        newManager = require("./newManager.js");
                                        newManager.checkAndCloseCreate(coinflipID)
                                    }, 30 * 60 * 1000);
                                    io.sockets.emit("updateCoinflipArray", coinflipArray, coinflipID);
                                    offer.getReceivedItems(function (err, items) {
                                        databaseManager.updateAssets(coinflipID, items, 0, function () {
                                        });
                                    });
                                })
                            })
                            break;
                        case "join":
                            console.log("in join 23131")
                            databaseManager.updateJoinOffer(coinflipID, () => {
                                console.log("in update join offer 213213123")
                                offer.getReceivedItems((err, items) => {
                                    console.log("in trolololol")
                                    //TODO SOMEWHERE HERE THERE NEEDS TO BE THE ERROR REGARDING THE WINNING OFFER SEND ISSUE
                                    databaseManager.updateAssets(coinflipID, items, 1, () => {
                                        console.log("in iauifbuifbuiabfwuibawiaf")
                                        databaseManager.calculateWinnerAndTax(coinflipID, (botId, tradeurl, assets) => {
                                            console.log("in ad adiaondi waind aowndn ")
                                            setTimeout(() => {
                                                console.log("In send winning offer timeout")
                                                console.log("Given bot id ->")
                                                console.log(botId)
                                                console.log("SECOND CHECK FOR WINNER TRADEURL -> ")
                                                console.log(tradeurl)
                                                console.log("Given assets -> ")
                                                console.log(assets)
                                                console.log("The actual bot id ->")
                                                console.log(this._bot_number)
                                                this.sendWinningOffer(tradeurl, assets, function (offerid) {
                                                    console.log("In send Winning offer dadadadadada")
                                                    databaseManager.finalizeWinningOfferSend(offerid, coinflipID);
                                                })
                                            }, 1000 * 10)

                                            setTimeout(function () {
                                                io.sockets.emit("deleteCoinflip", coinflipID);
                                            }, 1000 * 60 * 5)

                                            databaseManager.getSteam64s(coinflipID, function (steamids) {
                                                //TODO CURRENTLY HERE TRYING TO FIGURE OUT HOW TO PASS BOTH STEAM 64 HERE
                                                console.log("STEAM IDS 1 HERE")
                                                console.log(steamids)
                                                //TODO FIND A WAY TO PROPERLY LOAD HISTORY WITH SOCKETS
                                                databaseManager.fetchAndPrepareSocketHistory(coinflipID, function (history) {
                                                    io.sockets.emit("updatedHistory", history)
                                                    history["misc"]["private"] = true
                                                    steamids.forEach(function (val, ind) {
                                                        if (socketConnections[val] !== undefined && socketConnections[val] !== null) {
                                                            if (socketConnections[val] === undefined) {
                                                            } else {
                                                                socketConnections[val].emit("updatedHistory", history, 1)
                                                            }
                                                        }
                                                    })
                                                })
                                            })
                                            databaseManager.prepareCoinflipArray(coinflipID, function (coinflipArray) {
                                                io.sockets.emit("updateCoinflipArray", coinflipArray, coinflipID)
                                            });
                                        })
                                    });
                                })
                            })
                            break;
                        case "winning":
                            databaseManager.setWinningOfferAccepted(coinflipID);
                            break;
                        case "misc":
                            break;
                    }
                })
            }

        })
    }

}

module.exports = Bot;
