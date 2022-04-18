var https = require('https');
var express = require('express');
var http = require('http');
var SteamUser = require('steam-user');
var SteamCommunity = require('steamcommunity');
var SteamTotp = require('steam-totp');
var TradeOfferManager = require('steam-tradeoffer-manager'); // use require('steam-tradeoffer-manager') in production
var fs = require('fs');
var requestify = require('requestify');
var request = require("request");
var OPSkinsAPI = require('@opskins/api');
var opskins = new OPSkinsAPI('17ecd5305274a98151667ae490948a');
var mysql = require("mysql");
var moment = require('moment');


function start(io) {
    //io.sockets.emit("testy");
}

/*var hashArr = [];
hashArr.push("Gamma Case");
hashArr.push("AWP | Dragon Lore (Minimal Wear)");
hashArr.push("Gamma Case")

opskins.getSuggestedPrices(730,hashArr, function (err,prices) {
    console.log("in dragoloro teuroro")
    console.log(prices)
});*/

const connection = mysql.createConnection({
    host: "localhost",
    user: "main_query",
    password: 'z41"(H)Jhnfu("342',
    socketPath: '/var/run/mysqld/mysqld.sock',
    database: "main",
    charset: "utf8_general_ci"
});
var client = new SteamUser();
var manager = new TradeOfferManager({
    "steam": client, // Polling every 30 seconds is fine since we get notifications from Steam
    "domain": "csgozap.com", // Our domain is example.com
    "language": "en", // We want English item descriptions
    "pollInterval": "3000",
    "cancelTime": "1800000" // Currently deletes Create attempts after 30 minutes
});

function uniq(a) {
    return Array.from(new Set(a));
}

var community = new SteamCommunity();

var logOnOptions = {
    "accountName": "ioagvnoighn",
    "password": "!OUdaOJGNg!?",
    "twoFactorCode": SteamTotp.getAuthCode("W+AjQXY99PJxMZgSOIWPnJxwzzI=")
};

//client.logOn(logOnOptions);

//requesthttp://api.steamapis.com/market/items/730?api_key=TepcAfI1S2kghe_LZnKGgUZcS6Y

function getItemList(steamid, callback) {
    var itemArr = [];
    //TODO CHANGE ALL PRICE FETCHES AND INVENTORY FETCHES TO THIS
    request('https://api.steamapis.com/steam/inventory/' + steamid + '/578080/2?api_key=QvYN67ICBK25VqGq2WSRRP3nklA', function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var items = [];
            var items_hashname_arr = [];
            var classAssosiativeHashName = [];
            var jsonContent = JSON.parse(body);
            var finishedRequests = 0;
            var counter = 0;
            console.log(jsonContent);
            //TODO HUGE BUG IF USER HAS NO ITEMS SHOW ERROR MESSAGE
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
            jsonContent["assets"].forEach(function (val, index) {
                if (itemArr.includes(val["classid"])) {
                    var hashname = classAssosiativeHashName[val["classid"]]
                    console.log("New Hashname : ")
                    console.log(hashname);
                    connection.query('SELECT * FROM prices WHERE hashname = ?', [hashname], function (error, results, fields) {
                        finishedRequests++;
                        if(results !== undefined) { // TODO HERE IS SOMETIMES UNDEFINED DONT KNOW WHY THO
                            //TODO ITS BECAUSE THERE IS A PROBLEM WITH THE HASHNAME FOR KNIFES AND FINDING IT IN THE PRICES DB
                            var price = parseFloat(results[0]["price"]);
                            items.push([hashname, val["classid"], val["assetid"], price]);//price*100]);
                            items_hashname_arr.push(hashname);
                            if (finishedRequests == counter) {
                                console.log("vor callback")
                                callback(items);
                            }
                        }
                    })
                }
            })
        }
    })

};

function sendTrade(steamid, itemAssetIds, tradeurl, site, steamname, steamiconurl, profileurl, callback) {

    var itemArr = [];
    //TODO CHANGE ALL PRICE FETCHES AND INVENTORY FETCHES TO THIS
    request('https://api.steamapis.com/steam/inventory/' + steamid + '/578080/2?api_key=QvYN67ICBK25VqGq2WSRRP3nklA', function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var items = [];
            var itemInformations = [];
            var itemHashnames = [];
            var classAssosiativeHashName = [];
            var jsonContent = JSON.parse(body);
            var finishedRequests = 0;
            var counter = 0;
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
            jsonContent["assets"].forEach(function (val, index) {
                if (itemArr.includes(val["classid"])) {
                    var hashname = classAssosiativeHashName[val["classid"]]


                    if (itemAssetIds.includes(val["assetid"])) {
                        //items.push(currentValue) // THIS IS JUST FOR THE ITEM OBJECT SAVE DATA HERE
                        itemInformations.push([val["assetid"], val["classid"], hashname, 1]);
                        itemHashnames.push(hashname);
                    }

                    /*connection.query('SELECT * FROM prices WHERE hashname = ?',[hashname], function (error, results, fields) {

                        var price = results[0]["price"];
                        items.push([hashname, val["classid"], val["assetid"],price*100]);
                        items_hashname_arr.push(hashname);
                        finishedRequests++;
                        if(finishedRequests == counter) {
                            console.log("vor callback")
                            callback(items);
                        }
                    })*/
                }
            })
            var winning_perc = Math.random() * 100;
            getPricesForItemlist(itemInformations, itemHashnames, function (data, totalValue) {
                itemInformations = data;
                insertNewCoinflip(steamid, totalValue, itemAssetIds, site, winning_perc, tradeurl, steamname, steamiconurl, profileurl, function (insertId) {
                    itemInformations.forEach(function (value) {
                        value.push(insertId);
                    })
                    insertNewItems(itemInformations, function () {
                        var offer = manager.createOffer(tradeurl);

                        itemInformations.forEach(function (valero, indero) {
                            offer.addTheirItem({
                                'assetid': valero[0],
                                'appid': 578080,
                                'contextid': 2
                            });
                        })

                        offer.setMessage("Lukas stinkt!");
                        offer.send(function (err, status) {
                            if (err) {
                                console.log(err);
                                callback(err);
                            }
                            if (status == 'pending') {
                                console.log(`Offer #${offer.id} sent, but requires confirmation`);
                                community.acceptConfirmationForObject("VGCRgK0LJT8J0q8E/eaCyVm3B1c=", offer.id, function (err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log(offer);

                                        console.log("Offer confirmed");
                                        insertOfferId(insertId, offer.id, function () {
                                            callback("https://steamcommunity.com/tradeoffer/" + offer.id + "/");
                                        })
                                    }
                                });
                            } else {
                                console.log(`Offer #${offer.id} sent successfully`);
                                insertOfferId(insertId, offer.id, function () {
                                    callback("https://steamcommunity.com/tradeoffer/" + offer.id + "/");
                                })
                            }
                        });
                    })
                })
            })
        }
    })

};

function sendJoinTrade(steamid, itemAssetIds, tradeurl, coinflipId, steamname, steamiconurl, profileurl, callback) {
    //TODO REMOVE CHECK FOR STEAM64 ADD CUSTOM ONE AND IF CHECK == NULL IS GOOD INSTANTLY INSERT A VALUE SO IF 2 WANT TO JOIN CHICK AFTERWARDS IT ISNT POSSIBLE
    //TODO WHEN OFFER IS INSERTED OR AT BEGINNING DUNNO YET SEND SOCKET EMIT TO ALL TO SHOW THAT USER IS JOINING
    //io.sockets.emit("startTimerForCoinflip",coinflipId);
    connection.query('SELECT steam64v2,value FROM coinflip WHERE id = ?', [coinflipId], function (error, results, fields) {
        var neededValue = parseFloat(results[0]["value"]);
        console.log(results[0]["steam64v2"])
        if (results[0]["steam64v2"] == null) {
            connection.query('UPDATE coinflip SET steam64v2 = ? WHERE id = ?', [steamid, coinflipId], function (error, results, fields) {
                if (error) console.log(error)

                console.log("jausen isse null")
                var itemArr = [];
                request('https://api.steamapis.com/steam/inventory/' + steamid + '/578080/2?api_key=QvYN67ICBK25VqGq2WSRRP3nklA', function (error, response, body) {
                    if (!error && response.statusCode == 200) {

                        var items = [];
                        var itemInformations = [];
                        var itemHashnames = [];
                        var classAssosiativeHashName = [];
                        var jsonContent = JSON.parse(body);
                        var finishedRequests = 0;
                        var counter = 0;
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
                        jsonContent["assets"].forEach(function (val, index) {
                            if (itemArr.includes(val["classid"])) {
                                var hashname = classAssosiativeHashName[val["classid"]]


                                if (itemAssetIds.includes(val["assetid"])) {
                                    //items.push(currentValue) // THIS IS JUST FOR THE ITEM OBJECT SAVE DATA HERE
                                    itemInformations.push([val["assetid"], val["classid"], hashname, 2]);
                                    itemHashnames.push(hashname);
                                }
                            }
                        })

                        getPricesForItemlist(itemInformations, itemHashnames, function (data, totalValue) {
                            itemInformations = data;
                            console.log("ALEL WICHTIGENEA NDJFHABWUJFBNAWIUFNHIAWF")
                            totalValue = parseFloat(totalValue) / 100;
                            var treshHoldBottom = (neededValue / 100) * 90;
                            var treshHoldHeight = (neededValue / 100) * 110;

                            if (totalValue >= treshHoldBottom && totalValue <= treshHoldHeight) {
                                console.log("in sendJoinTrade after getpricelisteforitems")
                                insertJoinCoinflip(steamid, totalValue, itemAssetIds, coinflipId, tradeurl, steamname, steamiconurl, profileurl, function (insertId) {
                                    console.log("in sendJoinTrade after coinflip insert")
                                    itemInformations.forEach(function (value) {
                                        value.push(insertId);
                                    })
                                    insertNewItems(itemInformations, function () {
                                        console.log("in sendJoinTrade after item insert")

                                        var content = '<div class="col-xs-4 col-sm-4 col-md-4 col-lg-4 activity-right-cont"><div class="activity-profile">' +
                                            '<a href="' + profileurl + '"><img src="' + steamiconurl + '" class="img-responsive prof-pic" alt=""></a>' +
                                            '<p class="player-name"><a href="' + profileurl + '">' + steamname + '</a></p></div></div>'

                                        connection.query('UPDATE coinflip SET joinAttemptStart = ? WHERE id = ?', [String(moment()), coinflipId], function (error, results, fields) {
                                        })

                                        var frontedCoinflipContent = {};
                                        frontedCoinflipContent["image"] = steamiconurl;
                                        frontedCoinflipContent["url"] = profileurl;
                                        frontedCoinflipContent["name"] = steamname;

                                        sendClientsNewJoinAttempt(coinflipId, content, frontedCoinflipContent);
                                        console.log("is aktuell")

                                        var offer = manager.createOffer(tradeurl);

                                        itemInformations.forEach(function (valero, indero) {
                                            offer.addTheirItem({
                                                'assetid': valero[0],
                                                'appid': 578080,
                                                'contextid': 2
                                            });
                                        })
                                        offer.setMessage("Lukas stinkt!");
                                        offer.send(function (err, status) {
                                            console.log("sendJoinTradeGestartet es ist nun egal und falls in 100 Sekunden der tradeoffer nicht angenommen wurde sollte der resetet bleiben in der zeit aber gelockt test");
                                            setTimeout(checkAndDeleteJoinAttempt, 1000 * 100, coinflipId, offer);
                                            console.log(insertId)
                                            console.log("peterpan ist killa")
                                            console.log(content)


                                            if (err) {
                                                console.log(err);
                                                callback(err);
                                            }
                                            if (status == 'pending') {
                                                console.log(`Offer #${offer.id} sent, but requires confirmation`);
                                                community.acceptConfirmationForObject("VGCRgK0LJT8J0q8E/eaCyVm3B1c=", offer.id, function (err) {
                                                    if (err) {
                                                        console.log(err);
                                                    } else {
                                                        console.log(offer);

                                                        console.log("Offer confirmed");
                                                        insertJoinOfferId(insertId, offer.id, function () {
                                                            callback("https://steamcommunity.com/tradeoffer/" + offer.id + "/");
                                                        })
                                                    }
                                                });
                                            } else {
                                                console.log(`Offer #${offer.id} sent successfully`);
                                                insertJoinOfferId(insertId, offer.id, function () {
                                                    callback("https://steamcommunity.com/tradeoffer/" + offer.id + "/");
                                                })
                                            }
                                        });
                                    })
                                })
                            } else {
                                connection.query('UPDATE coinflip SET steam64v2 = null WHERE id = ?', [coinflipId], function (error, results, fields) {

                                })
                                console.log("der dude hat hart gecheatet, fack off")
                            }
                        })
                    }
                })

            })
        } else {
            console.log("Leider schon jemand im coinflippero drinnero alsoero gehenero nixeoro")
        }
    })
};

function sendClientsNewJoinAttempt(coinflipId, content, cfArr) {
    //TODO DO frontedCoinflipContent array here // DONE
    io.sockets.emit("insertJoinAttempt", coinflipId, content, cfArr);
}

function checkAndDeleteJoinAttempt(coinflipId, offer) {
    //TODO CANCLE TRADEOFFER MANUALLY SO USER CANT ACCEPT AFTERWARDS
    //TODO WAIT 5 MORE SECONDS AFTER TRADE OFFER IS CANCLED SO IF USERS ACCEPT IN LAST SECOND COULD DO PROBLEMS
    console.log("In check and Delete join attempt");
    connection.query('SELECT trade_acceptedv2 FROM coinflip WHERE id = ?', [coinflipId], function (error, results, fields) {
        console.log(results[0]["trade_acceptedv2"])
        if (results[0]["trade_acceptedv2"] == 0) {
            offer.cancel(function () {
                console.log("didnt accepted ma boy")
                connection.query('UPDATE coinflip SET joinAttemptStart = ?,steam64v2 = ?, valuev2 = ?, itemsv2 = ?, trade_acceptedv2 = ?, tradeurlv2 = ?, steamNamev2 = ?,steamAvatarv2 = ?,steamUrlv2 = ?,site_chosenv2 = ? WHERE id = ?', [null, null, null, null, null, null, null, null, null, null, coinflipId], function (error, results, fields) {
                    if (error) throw error;
                    console.log("Da nicht akzeptiert user gelöscht");
                    connection.query('DELETE FROM items WHERE coinflip_id = ? AND mode = 2', [coinflipId], function (error, results, fields) {
                        if (error) throw error;
                        console.log("Da nicht akzeptiert items für join gelöscht");
                        console.log("Done")
                        //TODO do frontedCoinflipContent clientside here // DONE
                        io.sockets.emit("deleteJoinAttempt", coinflipId)
                    });
                });
            });
        }
    })
}

function checkAndDeleteCreatedCoinflip(coinflipid) {
    connection.query('SELECT * FROM coinflip WHERE id = ?', [coinflipid], function (error, results, fields) {
        if (results[0]["steam64v2"] == null) {
            sendCancelTradeofferBack(coinflipid, results[0]["tradeurl"], function () {
                connection.query('DELETE FROM coinflip WHERE id = ?', [coinflipid], function (error, results2, fields) {
                    connection.query('DELETE FROM items WHERE coinflip_id = ?', [coinflipid], function (error, results3, fields) {
                        io.sockets.emit("deleteCoinflip", coinflipid);
                        //TODO do frontedCoinflipContent clientside here // DONE
                    });
                });
            })
        } else if (results[0]["trade_acceptedv2"] == 1) {
        } else {
            setTimeout(checkAndDeleteCreatedCoinflip, 3000, coinflipid)
        }
    })
}

function sendCancelTradeofferBack(coinflipId, tradeurl, callback) {

    connection.query('SELECT * FROM items WHERE coinflip_id = ?', [coinflipId], function (error, results, fields) {
        var hashnameArr = [];
        results.forEach(function (val, index) {
            hashnameArr.push(val["market_hash_name"])
        })
        manager.getInventoryContents(578080, 2, true, function (err, inventory) {
            if (err) {
                console.log(err);
                return;
            }
            var offer = manager.createOffer(tradeurl);
            var itemArr = [];
            inventory.forEach(function (value, indexo) {
                if (hashnameArr.includes(value["market_hash_name"])) { //TODO POSSIBLE HUGE BUG THERE IS THAT IF IT FOUND 1 ITEM WITH THE HASH NAME AND FOUNDS ANOTHER ITS PUTS BOTH IN TRADE, SO AFTER FOUND 1 REMOVE HASHNAME FROM HASHNAMES ARRAY
                    itemArr.push(value)                             //TODO BUT STILL NEEDS TO WORK THE WAY THAT WHEN A GUY PLAYS WITH FOR EXAMPLE 2 DRAGON LORES HE WILL RECEIVE 2 DRAGON LORES
                    var indexoto = hashnameArr.indexOf(value["market_hash_name"]);
                    hashnameArr.splice(indexoto, 1);
                }
            })
            offer.addMyItems(itemArr);
            offer.setMessage("Unfortunatly your coinflip didn't get played in 30 minutes! So here you get your items back!");
            offer.send(function (err, status) {
                if (err) {
                    console.log(err);
                    return;
                }

                if (status == 'pending') {
                    // We need to confirm it
                    console.log(`Offer #${offer.id} sent, but requires confirmation`);
                    community.acceptConfirmationForObject("VGCRgK0LJT8J0q8E/eaCyVm3B1c=", offer.id, function (err) {

                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Offer confirmed");
                        }
                    });
                } else {
                    console.log(`Offer #${offer.id} sent successfully`);
                }
                callback();
            });
        })
    })

}

function insertOfferId(insertId, offerId, callback) {
    connection.query('UPDATE coinflip SET firstofferid = ? WHERE id = ?', [offerId, insertId], function (error, results, fields) {
        if (error) throw error;
        console.log("1 record inserteddddddd");
        callback();
    });
}


function insertJoinOfferId(insertId, offerId, callback) {
    console.log("TROLOLOLOL")
    console.log(offerId)
    console.log(insertId)
    connection.query('UPDATE coinflip SET secondofferid = ? WHERE id = ?', [offerId, insertId], function (error, results, fields) {
        if (error) throw error;
        console.log("1 record inserteddddddd");
        callback();
    });
}

function insertNewItems(items, callback) {
    items.forEach(function (currentVal) {
        console.log("in insertItems")
        console.log(currentVal)
        connection.query('INSERT INTO items (assetid , iconurl, market_hash_name, price, mode,coinflip_id) VALUES (?,?,?,?,?,?)', [currentVal[0], currentVal[1], currentVal[2], currentVal[4] / 100, parseInt(currentVal[3]), currentVal[5]], function (error, results, fields) {
            if (error) throw error;
            console.log("1 record inserteddddddd");
        });
    })
    console.log("When no inserteddddddd dann insertNewItems rip")
    callback();
}

function getPricesForItemlist(itemHashName, realItemHashNameArr, callback) {

    var returnArr = itemHashName;
    var pricesum = 0;
    var finishedRequests = 0;
    returnArr.forEach(function (val, index) {
        connection.query('SELECT * FROM prices WHERE hashname = ?', [val[2]], function (error, results, fields) {

            var price = parseFloat(results[0]["price"]) * 100;
            val.push(price);
            pricesum += price;
            finishedRequests++;
            if (finishedRequests == realItemHashNameArr.length) {
                console.log("vor callback")
                callback(returnArr, pricesum);
            }
        })
    })

    /*    var newArr = [];
        realItemHashNameArr.forEach(function (val,index) {
            newArr.push(val)
        })

        newArr = uniq(newArr);

        var returnArr = itemHashName;
        var pricesum = 0;
        opskins.getSuggestedPrices(730,newArr, function (err,prices) {
            returnArr.forEach(function (value,index) {
                 value.push(prices[value[2]].market_price); //For opskins price swap to .opskins_price
                 pricesum += prices[value[2]].market_price; //For opskins price swap to .opskins_price
            })
            callback(returnArr,pricesum);
        });*/

}


function insertJoinCoinflip(steam64, value, items, coinflipId, tradeurl, steamname, steamiconurl, steamprofileurl, callback) {
    connection.query('SELECT site_chosen FROM coinflip WHERE id = ?', [coinflipId], function (error, results, fields) {
        var sitev2;
        if (results[0]["site_chosen"] == 0) {
            sitev2 = 1;
        } else {
            sitev2 = 0;
        }
        connection.query('UPDATE coinflip SET steam64v2 = ?, valuev2 = ?, itemsv2 = ?, trade_acceptedv2 = ?, tradeurlv2 = ?, steamNamev2 = ?,steamAvatarv2 = ?,steamUrlv2 = ?,site_chosenv2 = ? WHERE id = ?', [steam64, (value / 100).toString(), items.join(","), 0, tradeurl, steamname, steamiconurl, steamprofileurl, sitev2, parseInt(coinflipId)], function (error, results, fields) {
            if (error) throw error;
            console.log("1 record inserted");
            console.log(results)
            callback(coinflipId);
        });
    })
}

function insertNewCoinflip(steam64, value, items, site_chosen, winning_perc, tradeurl, steamname, steamiconurl, steamprofileurl, callback) {
    console.log([steam64, value / 100, items.join(","), 0, parseInt(site_chosen), winning_perc, tradeurl, 0, 0]);
    connection.query('INSERT INTO coinflip (steam64, value, items, trade_accepted, site_chosen, winning_perc,tradeurl, finished,winner,steamName,steamAvatar,steamUrl) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [steam64, (value / 100).toString(), items.join(","), 0, parseInt(site_chosen), winning_perc.toString(), tradeurl, 0, 0, steamname, steamiconurl, steamprofileurl], function (error, results, fields) {
        if (error) throw error;
        console.log("1 record inserted");
        callback(results["insertId"]);
    });
}


client.on('loggedOn', function () {
    //Is used when new Account activates Two Factor and gives Back The 2 Needed secret key
    /*client.enableTwoFactor(function (response) {
     console.log(response);
     console.log( JSON.stringify(response));
     });*/
    //Mit secret keys 2 factor aktivieren
    /*client.finalizeTwoFactor("cCJU52pZ/mdW+IOwTVN9xaBTvLc=","91986",function (err) {
     console.log(err);
     });*/
    console.log("Logged into Steam");
});

client.on('webSession', function (sessionID, cookies) {
    console.log(cookies)
    manager.setCookies(cookies, function (err) {
        if (err) {
            console.log(err);
            process.exit(1); // Fatal error since we couldn't get our API key
            return;
        }
        console.log("Got API key: " + manager.apiKey);
    });
    community.setCookies(cookies);
});

function updateofferstatus(offerid, callback) {
    connection.query('UPDATE coinflip SET trade_accepted = 1 WHERE firstofferid = ?', [offerid], function (error, results, fields) {
        if (error) throw error;
        console.log("1 record updated");
        callback();
    });
}

function updateJoinofferstatus(offerid, callback) {
    connection.query('UPDATE coinflip SET trade_acceptedv2 = 1, offerAcceptedStart = ? WHERE secondofferid = ?', [String(moment()), offerid], function (error, results, fields) {
        if (error) throw error;
        console.log("1 record updated");
        callback();
    });
}

function redoItems2(err,items,coinflipId,callback) {
    console.log("We got damn new gucci2 shipment")
    if(err) {
        console.log(err)
    } else {
        connection.query('DELETE FROM items WHERE coinflip_id = ? AND mode = 2', [coinflipId], function (error, results, fields) {
            items.forEach(function (val, ind) {
                connection.query('SELECT * FROM prices WHERE hashname = ?', [val["market_hash_name"]], function (error, results, fields) {
                    var price = parseFloat(results[0]["price"]);
                    connection.query('INSERT INTO items (assetid , iconurl, market_hash_name, price, mode,coinflip_id) VALUES (?,?,?,?,?,?)', [val["assetid"], val["classid"], val["market_hash_name"], price, 2, coinflipId], function (error, results, fields) {
                        if (error) throw error;
                        console.log("itemz2 worked right here");
                        if(ind == items.length - 1) {
                            callback();
                        }
                    });
                })
            })
        })
    }
}

manager.on('sentOfferChanged', function (offer, oldState) {
    console.log(`Offer #${offer.id} changed: ${TradeOfferManager.ETradeOfferState[oldState]} -> ${TradeOfferManager.ETradeOfferState[offer.state]}`);
    if (TradeOfferManager.ETradeOfferState[offer.state].indexOf("Accepted") !== -1) {
        connection.query('SELECT * FROM `coinflip` WHERE firstofferid = ?', [offer.id], function (error, results, fields) {
            console.log(results)
            if (results[0] === undefined) {
                updateJoinofferstatus(offer.id, function () {
                    var frontedCoinflipContentPlayer2 = {};
                    var frontedCoinflipContentPlayer2items = {};
                    console.log(" in update offer status should be joiner")
                    console.log(offer.id)
                    connection.query('SELECT * FROM `coinflip` WHERE secondofferid = ?', [offer.id], function (error, results, fields) {
                        if (results[0] === undefined) {
                            connection.query('UPDATE coinflip SET winofferid_accepted = 1 WHERE winofferid = ?', [offer.id], function (error, results, fields) {
                            })
                            console.log("Winning Offer / Send back") //TODO WRITE WINNING OFFER ID IN COINFLIPPERO AND SEE WHAT HAPPENS IF I CHANGE THE OFFER
                        }
                        else {
                            connection.query('SELECT * FROM `items` WHERE coinflip_id = ? AND mode = 2 ORDER BY price DESC', [results[0]["id"]], function (error, results2, fields) {

                                //TODO THIS IS JUST A PLACEHOLDER MARK FOR V 1.1
                                offer.getReceivedItems(function (err,items) {
                                    redoItems2(err,items,results[0]["id"],function () {
                                        frontedCoinflipContentPlayer2["image"] = results[0]["steamAvatarv2"];
                                        frontedCoinflipContentPlayer2["url"] = results[0]["steamUrlv2"];
                                        frontedCoinflipContentPlayer2["name"] = results[0]["steamNamev2"];
                                        frontedCoinflipContentPlayer2["value"] = parseFloat(results[0]["valuev2"]) * 100;
                                        frontedCoinflipContentPlayer2["site"] = results[0]["site_chosenv2"];

                                        results2.forEach(function (val,ind) {
                                            frontedCoinflipContentPlayer2items[ind] = {};
                                            frontedCoinflipContentPlayer2items[ind]["iconurl"] = val["iconurl"];
                                            frontedCoinflipContentPlayer2items[ind]["hashname"] = val["market_hash_name"];
                                            frontedCoinflipContentPlayer2items[ind]["val"] = parseFloat(val["price"]);
                                        })

                                        calculateWinnerAndSendWinningTradeoffer(results[0]["id"], function (winningInformations) {
                                            var content = '<div class="col-xs-4 col-sm-4 col-md-4 col-lg-4 activity-right-cont">' +
                                                '<div class="activity-profile">' +
                                                '<a target="_blank" href="'+results[0]["steamUrlv2"]+'"><img src="' + results[0]["steamAvatarv2"] + '" title="' + results[0]["steamNamev2"] + '" class="img-responsive prof-pic" alt=""></a>' +
                                                '<p class="player-name"><a target="_blank" href="'+results[0]["steamUrlv2"]+'">' + results[0]["steamNamev2"] + '</a></p><span data-value-player2="' + (parseFloat(results[0]["valuev2"]) * 100) + '">$' + (parseFloat(results[0]["valuev2"]) * 100) + '</span>';
                                            var forLimiter = results2.length;
                                            if (results2.length > 5) {
                                                content += "<div class='more-items'  data-player2-extraItems='" + (results2.length - 5) + "' onclick='opendesktop()'>+" + (results2.length - 5) + " more</div>";
                                                forLimiter = 5;
                                            }
                                            content += "</div><div class='player-items'>";
                                            for (var i = 0; i < forLimiter; i++) {
                                                content += '<img src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/' + results2[i]["iconurl"] + '/100fx80f" title="' + results2[i]["market_hash_name"] + "  " + results2[i]["price"] + '$" class="img-responsive item-pic-thumb pull-rightextraup" alt="">';
                                            }
                                            content += '</div>' +
                                                '<i class="fa fa-chevron-down hidden-sm hidden-md hidden-lg pull-rightextradown" onclick="openmobile()" aria-hidden="true"></i></div>';

                                            //var winningInformations = [hashPercentage, winningSite];
                                            //TODO MAYBE WAIT LIKE 10 SECOND HERE TO MATCH THE TIMER??? BUT DUNNO IF ITS PROBLEM IF WE SEND THE TRADEOFFER 10 SECS BEFORE
                                            //TODO EDIT MAYBE SEND THE TRADE 10 SECONDS LATER AND DONT WAIT HERE
                                            io.sockets.emit("insertAcceptedOfferContent", results[0]["id"], (parseFloat(results[0]["valuev2"]) * 100), results[0]["site_chosenv2"], winningInformations[1], content,frontedCoinflipContentPlayer2,frontedCoinflipContentPlayer2items,winningInformations[0]);
                                            //TODO do frontedCoinflipContent here // DONE
                                            io.sockets.emit("updateTotalStats", (parseFloat(results[0]["valuev2"]) * 100), results2.length, 0);
                                        })
                                    })
                                });

                                /*
                                results2.forEach(function (val,ind) {
                                    connection.query('UPDATE items SET assetid = ? WHERE assetid = ?', [,val["assetid"]], function (error, results, fields) {
                                    })
                                })*/
                            })
                        }
                    })
                });
            } else {
                updateofferstatus(offer.id, function () {
                    console.log(" in update offer status should be starter")


                    var completeString = "";
                    var finishedFlips = 0;
                    var finalstring = [];
                    var frontedCoinflipContent = {};
                    frontedCoinflipContent["p1"] = {};
                    frontedCoinflipContent["p1items"] = {};

                    connection.query('SELECT * FROM `coinflip` WHERE firstofferid = ?', [offer.id], function (error, coinflipGames, fields) {

                        frontedCoinflipContent["p1"]["image"] = coinflipGames[0]["steamAvatar"];
                        frontedCoinflipContent["p1"]["url"] = coinflipGames[0]["steamUrl"];
                        frontedCoinflipContent["p1"]["name"] = coinflipGames[0]["steamName"];
                        frontedCoinflipContent["p1"]["value"] = parseFloat(coinflipGames[0]["value"]);
                        frontedCoinflipContent["p1"]["site"] = coinflipGames[0]["site_chosen"];


                        for (var i = 0; i < coinflipGames.length; i++) {
                            finalstring.push("");
                        }
                        if (error) console.log(error);
                        coinflipGames.forEach(function (results2, index) {
                            finalstring[index] += "<div class='activity-block' data-cid='" + [results2["id"]] + "' >" +
                                "<div class='row'>" +
                                "<div class='col-xs-4 col-sm-4 col-md-4 col-lg-4 activity-left-cont'>" +
                                "<div class='activity-profile'>" +
                                "<a target='_blank' href='"+results2["steamUrl"]+"'><img src='" + results2["steamAvatar"] + "' title='" + results2["steamName"] + "' class='img-responsive prof-pic' alt=''></a>" +
                                "<p class='player-name'><a target='_blank' href='"+results2["steamUrl"]+"'>" + results2["steamName"] + "</a></p>" +
                                "<span data-value-player1='" + parseFloat(results2["value"]) + "'>$" + results2["value"] + "</span>";
                            connection.query('SELECT * FROM `items` WHERE coinflip_id = ? AND mode = 1 ORDER BY price DESC', [results2["id"]], function (error, results, fields) {

                                //TODO THIS IS JUST A PLACEHOLDER MARK FOR V 1.1
                                offer.getReceivedItems(function (err,items) {
                                    console.log("We got damn new gucci shipment")
                                    if(err) {
                                        console.log(err)
                                    } else {
                                        connection.query('DELETE FROM items WHERE coinflip_id = ? AND mode = 1', [coinflipGames[0]["id"]], function (error, results, fields) {
                                            items.forEach(function (val, ind) {
                                                connection.query('SELECT * FROM prices WHERE hashname = ?', [val["market_hash_name"]], function (error, results, fields) {
                                                    var price = parseFloat(results[0]["price"]);
                                                    connection.query('INSERT INTO items (assetid , iconurl, market_hash_name, price, mode,coinflip_id) VALUES (?,?,?,?,?,?)', [val["assetid"], val["classid"], val["market_hash_name"], price, 1, coinflipGames[0]["id"]], function (error, results, fields) {
                                                        if (error) throw error;
                                                        console.log("itemz worked right here");
                                                    });
                                                })
                                            })
                                        })
                                    }
                                    //console.log(items);
                                });

                                results.forEach(function (val,ind) {
                                    frontedCoinflipContent["p1items"][ind] = {};
                                    frontedCoinflipContent["p1items"][ind]["iconurl"] = val["iconurl"];
                                    frontedCoinflipContent["p1items"][ind]["hashname"] = val["market_hash_name"];
                                    frontedCoinflipContent["p1items"][ind]["val"] = parseFloat(val["price"]);
                                })

                                console.log(results)
                                console.log(results.length)
                                var forLimiter = results.length;
                                if (results.length > 5) {
                                    finalstring[index] += "<div class='more-items' data-player1-extraItems='" + (results.length - 5) + "' onclick='opendesktop()'>+" + (results.length - 5) + " more</div>";
                                    forLimiter = 5;
                                }
                                finalstring[index] += "</div><div class='player-items'>";
                                //finalstring += "</div><div class='player-items'>";
                                for (var i = forLimiter - 1; i >= 0; i--) {
                                    finalstring[index] += '<img src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/' + results[i]["iconurl"] + '/100fx80f" title="' + results[i]["market_hash_name"] + "  " + results[i]["price"] + '$" class="img-responsive item-pic-thumb pull-rightextraup" alt="">';
                                }
                                finalstring[index] += '</div>' +
                                    '<i class="fa fa-chevron-down hidden-sm hidden-md hidden-lg pull-rightextradown" onclick="openmobile()" aria-hidden="true"></i>' +
                                    '</div><div class="col-xs-4 col-sm-4 col-md-4 col-lg-4 activity-center-cont">';
                                if (results2["site_chosen"] == 0) {
                                    finalstring[index] += '<img src="images/mlogo1.png" alt="" class="img-responsive hidden-xs">';
                                } else {
                                    finalstring[index] += '<img src="images/mlogo2.png" alt="" class="img-responsive hidden-xs">';
                                }
                                finalstring[index] += '<p class="hidden-xs" data-value-total="' + parseFloat(results2["value"]) + '">$' + results2["value"] + '</p>'
                                finalstring[index] += '<div class="pie degree"><div class="circeOverlay"></div><span class="block"></span><span data-leftTime="100" class="time">100</span></div>';
                                finalstring[index] += '<div class="activity-mid-buttons">'
                                finalstring[index] += '<a class="btn btn-primary join-popup-button" data-effect="mfp-move-vertical">Join</a><a  class="btn btn-primary view-popup-button" data-effect="mfp-move-vertical">View</a>';
                                finalstring[index] += '</div></div>'
                                finalstring[index] += '</div></div>';
                                console.log("loop end through  " + index + "   coinflip");
                                finishedFlips++;
                                if (finishedFlips == coinflipGames.length) {
                                    console.log("finished loading coinflips games")
                                    setTimeout(checkAndDeleteCreatedCoinflip, 1000 * 30 * 60, results2["id"]);
                                    //TODO do frontedCoinflipContent here // DONE
                                    console.log(frontedCoinflipContent)
                                    io.sockets.emit("newCoinflip", parseFloat(results2["value"]), finalstring.join(""), frontedCoinflipContent, results2["id"]);
                                    io.sockets.emit("updateTotalStats", parseFloat(results2["value"]), results.length, 1);
                                }
                            });
                        })
                    });

                });
            }
        })
    }

});

function calculateWinnerAndSendWinningTradeoffer(coinflipId, callback) {
    //TODO CALCULATE WHICH CUT WE TAKE AND IF WE TAKE THEN DONT SEND THE ITEM AND MAYBE INSERT IN INTO THE DB SO WE CAN TRACK BETTER WHAT AND HOW MUCH WE TAXED COULD CREATE ADMIN PANEL OR SMTHING
    //TODO  REGARDING TAX WE COULD ALSO DIRECTLY SEND A TRADEOFFER TO MAIN ACCOUNT OR 2 PROXY ACCOUNTS TO DIRECTLY RETRIEVE TAX ITEMS, BUT COULD ALSO ONLY DO ONCE FULL FOR LOWER PERFORMCE USAGE WE WILL SEE
    //TODO SET WINNER AND FINISHED IN DB AFTER COINFLIP IS DONE
    connection.query('SELECT * FROM `coinflip` WHERE id = ?', [coinflipId], function (error, results, fields) { //TODO HERE MAYBE INSERT ALL THE DONE STUFF BELOW LIKE PLAYER PERCENTAGES INTO DATABASE TO TRACK OLD COINFLIPS AND WINNERS
        var value1 = parseFloat(results[0]["value"]);
        var value2 = parseFloat(results[0]["valuev2"]) * 100;
        console.log(value1)
        console.log(value2)

        // START TAXXX **********************************************************************
        var totalValue = value1 + value2;
        var taxTreshhold = 10;
        var taxPercentage = 0;
        if (totalValue >= 10) {
            taxPercentage = 5;
        }
        var taxValue = ((totalValue / 100) * taxPercentage);
        // END TAXXX **********************************************************************

        var player1Perc = (value1 / (value1 + value2)) * 100
        var player2Perc = 100 - player1Perc
        console.log(player1Perc)
        console.log(player2Perc)
        var winningSite;
        var winningPlayer;
        var winnersTradeUrl = "";
        var winnerName = "";
        var winner64;
        var loser64;
        var wonValue;
        var player1site = results[0]["site_chosen"]
        var player2site = results[0]["site_chosenv2"]
        var hashPercentage = parseFloat(results[0]["winning_perc"]);

        if (player1site == 0 && hashPercentage <= player1Perc) {
            winningPlayer = 0;
        } else if (player1site == 1 && hashPercentage > player2Perc) {
            winningPlayer = 0
        } else {
            winningPlayer = 1
        }

        if (winningPlayer == 0) {
            winnersTradeUrl = results[0]["tradeurl"];
            winnerName = results[0]["steamName"];
            winner64 = results[0]["steam64"];
            loser64 = results[0]["steam64v2"];
            wonValue = parseFloat(results[0]["valuev2"]) * 100;
            winningSite = player1site;
        } else {
            winner64 = results[0]["steam64v2"];
            loser64 = results[0]["steam64"];
            wonValue = parseFloat(results[0]["value"]);
            winnersTradeUrl = results[0]["tradeurlv2"];
            winnerName = results[0]["steamNamev2"];
            winningSite = player2site;
        }
        connection.query('SELECT * FROM `items` WHERE coinflip_id = ?', [coinflipId], function (error2, results2, fields2) {
            console.log(results2)
            var assetids = [];
            var taxIds = [];
            var itemPrices = [];
            results2.forEach(function (val, index) {
                itemPrices.push(parseFloat(val["price"]));
                assetids.push(val['assetid'])
            })

            //Total Won/Lost updates
            connection.query('SELECT * FROM `user` WHERE steam64 = ?', [winner64], function (error2, res1, fields2) {
                connection.query('SELECT * FROM `user` WHERE steam64 = ?', [loser64], function (error2, res2, fields2) {

                    var totalWonVal = parseFloat(res1[0]["totalWon"]) + wonValue;
                    var totalLostVal = parseFloat(res2[0]["totalLost"]) + wonValue;
                    connection.query('UPDATE user SET totalWon = ? WHERE steam64 = ?', [String(totalWonVal), winner64], function (error2, dares, fields2) {
                    })
                    connection.query('UPDATE user SET totalLost = ? WHERE steam64 = ?', [String(totalLostVal), loser64], function (error2, dares, fields2) {
                    })
                })
            })

            //TODO LOOK HOW I CAN UPDATE USER STATS VIA SOCKET TO THE INDIVIDUAL SOCKETS
            //io.sockets.emit("updateTotalStats",parseFloat(results2["value"]),results.length,1);

            calculateTaxItems(itemPrices, taxValue, function (chosenPrices) {

                //TODO HERE BELOW THE ITEMS WHICH ARE TAX GET PULLED OUT OF THE HASH ARRAY MAYBE PUT THEM IN NEW ARRAY AND SEND THEM TO ANOTHER ACCOUNT ?=??

                results2.forEach(function (result, index) {
                    if (chosenPrices.includes(parseFloat(result["price"]))) {
                        var ind = chosenPrices.indexOf(parseFloat(result["price"]));
                        chosenPrices.splice(ind, 1);
                        ind = assetids.indexOf(result["assetid"]);
                        taxIds.push(assetids[ind]);
                        assetids.splice(ind, 1)
                    }
                })

                taxIds.forEach(function (val,ind) {
                    connection.query('UPDATE items SET taxed = 1 WHERE assetid = ?', [val], function (error2, res2, fields2) {
                        console.log("1 more item taxed")
                    })
                })
                
                console.log(itemPrices);

                var offer = manager.createOffer(winnersTradeUrl);
                var itemArr = [];
                assetids.forEach(function (val,ind) {
                    offer.addMyItem({
                        'assetid': val,
                        'appid': 578080,
                        'contextid': 2
                    });
                })
                //offer.addMyItems(itemArr);
                offer.setMessage("Congratz bro you won!");
                offer.send(function (err, status) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    if (status == 'pending') {
                        // We need to confirm it
                        console.log(`Offer #${offer.id} sent, but requires confirmation`);
                        community.acceptConfirmationForObject("VGCRgK0LJT8J0q8E/eaCyVm3B1c=", offer.id, function (err) {

                            if (err) {
                                console.log(err);
                            } else {
                                console.log("Offer confirmed");
                            }
                        });
                    } else {
                        console.log(`Offer #${offer.id} sent successfully`);
                    }
                    connection.query('UPDATE coinflip SET finished = ?, winner = ?, winofferid = ?, winofferid_accepted = ? WHERE id=?', [1, winningSite, offer.id, 0, coinflipId], function (error, results, fields) {

                    })
                    var winningInformations = [hashPercentage, winningSite];
                    callback(winningInformations);
                });

                // THIS IS SOLUTION WITH FETCHING THE INVENTORY FROM API BUT BOTS INV IS PRIVATE SO
                /*var itemArr = [];
                var botSteam64 = "76561198376637377";
                //TODO MAYBE CHANGE IT DYNAMIC SO IF MULTIPLE BOTS ARE IN USE IT WILL CHOSE SPECIFIC
                request('https://api.steamapis.com/steam/inventory/'+botSteam64+'/730/2?api_key=TepcAfI1S2kghe_LZnKGgUZcS6Y', function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var items = [];
                        var itemInformations = [];
                        var itemHashnames = [];
                        var classAssosiativeHashName = [];
                        var jsonContent = JSON.parse(body);
                        console.log(jsonContent)
                        var finishedRequests = 0;
                        var counter = 0;
                        for(var i = 0; i < jsonContent["descriptions"].length; i++) {
                            if(jsonContent["descriptions"][i]["tradable"] == 1) {
                                itemArr.push(jsonContent["descriptions"][i]["classid"])
                                classAssosiativeHashName[jsonContent["descriptions"][i]["classid"]] = jsonContent["descriptions"][i]["market_hash_name"]
                            }
                        }
                        jsonContent["assets"].forEach(function (val,index) {
                            if(itemArr.includes(val["classid"])){
                                counter++;
                            }
                        })
                        var assetIds = [];
                        jsonContent["assets"].forEach(function (val,index) {
                            if(itemArr.includes(val["classid"])){
                                var hashname = classAssosiativeHashName[val["classid"]]

                                if(hashnames.includes(hashname)) { //TODO POSSIBLE HUGE BUG THERE IS THAT IF IT FOUND 1 ITEM WITH THE HASH NAME AND FOUNDS ANOTHER ITS PUTS BOTH IN TRADE, SO AFTER FOUND 1 REMOVE HASHNAME FROM HASHNAMES ARRAY
                                    assetIds.push(val["assetid"])   //THESE HERE ONLY ADDS THE ITEM OBJECT AGAIN SO I NEED TO ADD ASSET ASSET ID
                                    var indexoto = hashnames.indexOf(hashname);
                                    hashnames.splice(indexoto, 1);
                                }
                            }
                        })
                        var offer = manager.createOffer(winnersTradeUrl);

                        assetIds.forEach(function (vakkk,inkkk) {
                            offer.addMyItem({
                                'assetid': vakkk,
                                'appid': 730,
                                'contextid': 2
                            });
                        })
                        offer.setMessage("Congratz bro you won!");
                        offer.send(function(err, status) {
                            if (err) {
                                console.log(err);
                                return;
                            }

                            if (status == 'pending') {
                                // We need to confirm it
                                console.log(`Offer #${offer.id} sent, but requires confirmation`);
                                community.acceptConfirmationForObject("VGCRgK0LJT8J0q8E/eaCyVm3B1c=", offer.id, function(err) {

                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log("Offer confirmed");
                                    }
                                });
                            } else {
                                console.log(`Offer #${offer.id} sent successfully`);
                            }
                            connection.query('UPDATE coinflip SET finished = ?, winner = ?, winofferid = ?, winofferid_accepted = ? WHERE id=?', [1,winningSite,offer.id,0,coinflipId], function (error, results, fields) {

                            })
                            var winningInformations = [hashPercentage,winningSite];
                            callback(winningInformations);
                        });
                    }
                })*/

                /*manager.getInventoryContents(730, 2, true, function (err, inventory) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    var offer = manager.createOffer(winnersTradeUrl);
                    var itemArr = [];
                    inventory.forEach(function (value, indexo) {
                        console.log("in comparison")
                        console.log(value["assetid"])
                        console.log(hashnames)
                        if (hashnames.includes(value["market_hash_name"])) { //TODO POSSIBLE HUGE BUG THERE IS THAT IF IT FOUND 1 ITEM WITH THE HASH NAME AND FOUNDS ANOTHER ITS PUTS BOTH IN TRADE, SO AFTER FOUND 1 REMOVE HASHNAME FROM HASHNAMES ARRAY
                            itemArr.push(value)                             //TODO BUT STILL NEEDS TO WORK THE WAY THAT WHEN A GUY PLAYS WITH FOR EXAMPLE 2 DRAGON LORES HE WILL RECEIVE 2 DRAGON LORES
                            var indexoto = hashnames.indexOf(value["market_hash_name"]);
                            hashnames.splice(indexoto, 1);
                        }
                    })
                    offer.addMyItems(itemArr);
                    offer.setMessage("Congratz bro you won!");
                    offer.send(function (err, status) {
                        if (err) {
                            console.log(err);
                            return;
                        }

                        if (status == 'pending') {
                            // We need to confirm it
                            console.log(`Offer #${offer.id} sent, but requires confirmation`);
                            community.acceptConfirmationForObject("VGCRgK0LJT8J0q8E/eaCyVm3B1c=", offer.id, function (err) {

                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("Offer confirmed");
                                }
                            });
                        } else {
                            console.log(`Offer #${offer.id} sent successfully`);
                        }
                        connection.query('UPDATE coinflip SET finished = ?, winner = ?, winofferid = ?, winofferid_accepted = ? WHERE id=?', [1, winningSite, offer.id, 0, coinflipId], function (error, results, fields) {

                        })
                        var winningInformations = [hashPercentage, winningSite];
                        callback(winningInformations);
                    });
                })*/
            })
        })
    })
}

function calculateTaxItems(array, sum, callback) {
    function add(a, b) {
        return a + b;
    }

    function c(left, right) {
        var s = right.reduce(add, 0);
        if (s > sum) {
            return;
        }
        if (!result.length || s === result[0].reduce(add, 0)) {
            result.push(right);
        } else if (s > result[0].reduce(add, 0)) {
            result = [right];
        }
        left.forEach(function (a, i) {
            var x = left.slice();
            x.splice(i);
            c(left.slice(0, i), [a].concat(right));
        });
    }

    var result = [];
    c(array, [], 0);

    var minLen = 9999;
    var chosenArr;
    result.forEach(function (res, ind) {
        if (res.length < minLen) {
            chosenArr = res;
            minLen = res.length;
        }
    })

    callback(chosenArr);

}

function giveItemsBack() {
    manager.getInventoryContents(578080, 2, true, function (err, inventory) {
        if (err) {
            console.log(err);
            return;
        }

        if (inventory.length == 0) {
            // Inventory empty
            console.log("CS:GO inventory is empty");
            return;
        }
        var offer = manager.createOffer("https://steamcommunity.com/tradeoffer/new/?partner=161244103&token=ILQM3w-_");
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
                community.acceptConfirmationForObject("VGCRgK0LJT8J0q8E/eaCyVm3B1c=", offer.id, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Offer confirmed");
                    }
                });
            } else {
                console.log(`Offer #${offer.id} sent successfully`);
            }
        });
    });
}

module.exports = {
    getItemList: getItemList,
    sendTrade: sendTrade,
    giveItemsBack: giveItemsBack,
    start: start,
    sendJoinTrade: sendJoinTrade
};
