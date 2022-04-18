var mysql = require("mysql");
var CryptoJS = require("crypto-js");
/*var ChanceJS = require("chance");
var botHandler = require("./botHandler.js");
var randomstring = require("randomstring");
*/

var randomstring = require("randomstring");
var crypto = require("crypto");
var ChanceJS = require("chance");
/*
var botHandler = require("./botHandler.js");
*/

const connection = mysql.createConnection({
    host: "localhost",
    user: "main_query",
    password: 'z41"(H)Jhnfu("342',
    socketPath: '/var/run/mysqld/mysqld.sock',
    database: "main",
    charset: "utf8_general_ci"
});

function createNewCoinflipEntry(coinflipInformations,callback) {
    var steamID = coinflipInformations["steamID"];
    var steamName = coinflipInformations["steamName"];
    var steamAvatar = coinflipInformations["steamAvatar"];
    var steamURL = coinflipInformations["steamURL"];
    var siteChosen = coinflipInformations["siteChosen"];
    var tradeURL = coinflipInformations["tradeURL"];
    var value = coinflipInformations["value"];

    connection.query('INSERT INTO coinflip (' +
        'steam64, steamName, steamAvatar, steamUrl, site_chosen, tradeurl, value) ' +
        'VALUES (?,?,?,?,?,?,?)',
        [steamID, steamName, steamAvatar, steamURL, siteChosen, tradeURL, value],
        function (error, results, fields) {

            callback(results["insertId"]);

        });
}

function getTradeurlBySteam64(steam64,callback) {
    connection.query('SELECT * FROM user WHERE steam64 = ?',
        [steam64],
        function (error, results, fields) {

            callback(results[0]["tradelink"]);

        });
}

function insertNewItemEntry(itemInformations,coinflipID,statusType,callback) {


    itemInformations.forEach(function (val,ind) {

        var assetID = val["assetID"];
        var iconURL = val["iconURL"];
        var marketHashName = val["hashName"];
        var itemPrice = val["itemPrice"];

        connection.query('INSERT INTO items (' +
            'assetid, iconurl, market_hash_name, price, coinflip_id, mode) ' +
            'VALUES (?,?,?,?,?,?)',
            [assetID,iconURL,marketHashName,itemPrice,coinflipID,statusType],
            function (error, results, fields) {

                if(ind == itemInformations.length - 1) {
                    callback();
                }

            });
    })

}

function getItemPrice(hashName,callback) {

    //TODO MIGHT THROW A ERROR HERE IF USER PLACES KNIVE
    connection.query('SELECT * FROM prices WHERE hashname = ?', [hashName], function (error, results, fields) {
        console.log("IN GET ITEM PRICE");
        console.log(results);
        console.log(hashName);
        callback(parseFloat(results[0]["price"]).toFixed(2));
    })
}

function generateNewSecret() {
    return randomstring.generate(20);
}

function finalizeCreateRequest(offerid,hash,botNumber,coinflipID,player1secret){

    console.log("in finalize create request")

    var secret = generateNewSecret();
    var seed = generateNewSecret();

    var secHash = crypto.createHmac('sha1',secret);
    secHash.update(seed)
    secHash = secHash.digest('hex')
    console.log(secHash)

    connection.query('UPDATE coinflip SET firstofferid = ?, firstOfferHash = ?, bot_id = ?, player1hash = ?, serverhash = ?, seed = ?, secret = ? WHERE id = ?', [offerid,hash,botNumber,player1secret,secHash,seed,secret,coinflipID], function (error, results, fields) {
        if(error) {
           console.log(error)
        }
        console.log("after da changes")
    })
}

function getOfferState(offerID,callback) {
    connection.query('SELECT * FROM coinflip WHERE firstofferid = ?', [offerID], function (error, results, fields) {
        if(results[0] === undefined) {
            connection.query('SELECT * FROM coinflip WHERE secondofferid = ?', [offerID], function (error, results, fields) {
                if(results[0] === undefined) {
                    connection.query('SELECT * FROM coinflip WHERE winofferid = ?', [offerID], function (error, results, fields) {
                        if(results[0] === undefined) {
                            callback("misc");
                        } else {
                            callback("winning",results[0]["id"])
                        }
                    });
                } else {
                    callback("join",results[0]["id"])
                }
            })
        } else {
            callback("create",results[0]["id"])
        }
    })
}

function updateCreateOffer(coinflipID,callback) {
    connection.query('UPDATE coinflip SET trade_accepted = 1, createdDate = ? WHERE id = ?', [Date.now(),coinflipID], function (error, results, fields) {
        callback();
    })
}

function updateJoinOffer(coinflipID,callback) {
    connection.query('UPDATE coinflip SET trade_acceptedv2 = 1, offerAcceptedStart = ? WHERE id = ?', [Date.now(),coinflipID], function (error, results, fields) {
        callback();
    })
}

function getNeededPrice(coinflipId,callback) {
    connection.query('SELECT * FROM coinflip WHERE id = ?', [coinflipId], function (error, results, fields) {

        var lowEndTrashhold = ((parseFloat(results[0]["value"]) / 100) * 90).toFixed(2);
        var highEndTrashhold = ((parseFloat(results[0]["value"]) / 100) * 110).toFixed(2);
        callback(lowEndTrashhold,highEndTrashhold);
    })
}

function checkAndInsertJoinAttemptDate(newSteamID,coinflipId,callback) {
    console.log("in checkAndInsertJoinAttemptDate")
    connection.query('SELECT * FROM coinflip WHERE id = ?', [coinflipId], function (error, results, fields) {
        console.log("After Query");
        if(results[0] === undefined || results[0]["steamNamev2"] === undefined || results[0]["steamNamev2"] == null) {
            console.log("After first if");
            console.log("Steam id =>");
            console.log(newSteamID);
            console.log("Old Steam Id => ");
            console.log(results[0]["steam64"]);
            //TODO REACTIVATE LATER
            if(results[0]["steam64"] != newSteamID) {
                console.log("passed if");
                connection.query('UPDATE coinflip SET joinAttemptStart = ? WHERE id = ?', [Date.now(),coinflipId], function (error, results, fields) {
                    console.log("query dopne")
                    callback("success")
                })
            } else {
                console.log("In sorry but cant join your own coinflip callback");
                callback("Sorry, but you can't join your own coinflip!");
            }
        } else {
            console.log("sirry but someone is already joining callback");
            callback("Sorry, but someone is already joining that game!")
        }
    })
}

function insertJoinAttempt(requestPackage,callback) {
    connection.query('SELECT * FROM coinflip WHERE id = ?', [requestPackage["coinflipId"]], function (error, results, fields) {
        var sitev2;
        if (results[0]["site_chosen"] == 0) {
            sitev2 = 1;
        } else {
            sitev2 = 0;
        }
        connection.query('UPDATE coinflip SET player2hash = ?,steam64v2 = ?, valuev2 = ?, tradeurlv2 = ?, steamNamev2 = ?,steamAvatarv2 = ?,steamUrlv2 = ?,site_chosenv2 = ? WHERE id = ?',
            [requestPackage["player2hash"],requestPackage["steamID"], requestPackage["value"], requestPackage["tradeURL"], requestPackage["steamName"], requestPackage["steamAvatar"], requestPackage["steamURL"], sitev2, requestPackage["coinflipId"]], function (error, results2, fields) {
                callback(results[0]["bot_id"]);
            });
    })
}

function prepareCoinflipArray(coinflipID,callback) {

    console.log("preparing a coinflip array....");

    connection.query('SELECT * FROM coinflip WHERE id = ?', [coinflipID], function (error, results, fields) {

        var frontedCoinflipContent = {};
        var frontendContentCFID = coinflipID;

        frontedCoinflipContent[frontendContentCFID] = {};

        frontedCoinflipContent[frontendContentCFID]["serverhash"] = results[0]["serverhash"];
        frontedCoinflipContent[frontendContentCFID]["winner"] = results[0]["winner"];
        frontedCoinflipContent[frontendContentCFID]["winnerPerc"] = results[0]["winning_perc"];

        frontedCoinflipContent[frontendContentCFID]["p1"] = {};
        frontedCoinflipContent[frontendContentCFID]["p1"]["image"] = results[0]["steamAvatar"];
        frontedCoinflipContent[frontendContentCFID]["p1"]["url"] = results[0]["steamUrl"];
        frontedCoinflipContent[frontendContentCFID]["p1"]["name"] = results[0]["steamName"];
        frontedCoinflipContent[frontendContentCFID]["p1"]["value"] = parseFloat(results[0]["value"]);
        frontedCoinflipContent[frontendContentCFID]["p1"]["site"] = results[0]["site_chosen"];
        frontedCoinflipContent[frontendContentCFID]["p1"]["createdDate"] = results[0]["createdDate"];

        frontedCoinflipContent[frontendContentCFID]["p2"] = {};
        frontedCoinflipContent[frontendContentCFID]["p2"]["image"] = results[0]["steamAvatarv2"];
        frontedCoinflipContent[frontendContentCFID]["p2"]["url"] = results[0]["steamUrlv2"];
        frontedCoinflipContent[frontendContentCFID]["p2"]["name"] = results[0]["steamNamev2"];
        frontedCoinflipContent[frontendContentCFID]["p2"]["value"] = parseFloat(results[0]["valuev2"]);
        frontedCoinflipContent[frontendContentCFID]["p2"]["site"] = results[0]["site_chosenv2"];
        frontedCoinflipContent[frontendContentCFID]["p2"]["joinDate"] = results[0]["joinAttemptStart"];
        if(results[0]["offerAcceptedStart"] !== undefined && results[0]["offerAcceptedStart"] != null) {
            frontedCoinflipContent[frontendContentCFID]["p2"]["joined"] = true;
        } else {
            frontedCoinflipContent[frontendContentCFID]["p2"]["joined"] = false;
        }
        frontedCoinflipContent[frontendContentCFID]["p2"]["acceptedDate"] = results[0]["offerAcceptedStart"];

        connection.query('SELECT * FROM items WHERE coinflip_id = ? AND mode = 0', [coinflipID], function (error, results, fields) {
            frontedCoinflipContent[frontendContentCFID]["p1items"] = {};
            results.forEach(function (val,ind) {
                frontedCoinflipContent[frontendContentCFID]["p1items"][ind] = {};
                frontedCoinflipContent[frontendContentCFID]["p1items"][ind]["iconurl"] = val["iconurl"];
                frontedCoinflipContent[frontendContentCFID]["p1items"][ind]["hashname"] = val["market_hash_name"];
                frontedCoinflipContent[frontendContentCFID]["p1items"][ind]["val"] = parseFloat(val["price"]);
            });
            connection.query('SELECT * FROM items WHERE coinflip_id = ? AND mode = 1', [coinflipID], function (error, results, fields) {
                frontedCoinflipContent[frontendContentCFID]["p2items"] = {};
                results.forEach(function (val,ind) {
                    frontedCoinflipContent[frontendContentCFID]["p2items"][ind] = {};
                    frontedCoinflipContent[frontendContentCFID]["p2items"][ind]["iconurl"] = val["iconurl"];
                    frontedCoinflipContent[frontendContentCFID]["p2items"][ind]["hashname"] = val["market_hash_name"];
                    frontedCoinflipContent[frontendContentCFID]["p2items"][ind]["val"] = parseFloat(val["price"]);
                });
                console.log("STRAIGHT TO WALHALLA");
                console.log(frontedCoinflipContent);
                callback(frontedCoinflipContent[frontendContentCFID]);
            })
        })
    })
}

function finalizeJoinRequest(offerId,secretHash,coinflipId,player2secret) {
    connection.query('UPDATE coinflip SET secondofferid = ?, secondOfferHash = ?, player2hash = ? WHERE id = ?', [offerId,secretHash,player2secret,coinflipId], function (error, results, fields) {
    })
}

function updateAssets(coinflipID,items,mode,callback) {
    connection.query('DELETE FROM items WHERE coinflip_id = ? AND mode = ?', [coinflipID,mode], function (error, results, fields) {
        var counter = 0;
        items.forEach(function (val, ind) {
            connection.query('SELECT * FROM prices WHERE hashname = ?', [val["market_hash_name"]], function (error, results, fields) {
                var price = parseFloat(results[0]["price"]);
                connection.query('INSERT INTO items (assetid , iconurl, market_hash_name, price, mode,coinflip_id) VALUES (?,?,?,?,?,?)', [val["assetid"], val["classid"], val["market_hash_name"], price, mode, coinflipID], function (error, results, fields) {
                    counter++;
                    if(counter == items.length) {
                        callback();
                    }
                });
            })
        })
    })
}

function getAssets(coinflipId,callback) {
    var assets = [];
    connection.query('SELECT * FROM items WHERE coinflip_id = ?', [coinflipId], function (error, results, fields) {
        results.forEach(function (val,ind) {
            assets.push(val["assetid"])
        });
        callback(assets)
    })
}

function markCreateSendBack(coinflipId) {
    connection.query('UPDATE coinflip SET createSendBack = 1, finished = 1, offerAcceptedStart = 123  WHERE id = ?', [coinflipId], function (error, results, fields) {
    })
}

function checkAndDeleteJoinAttempt(coinflipId) {

    connection.query('UPDATE coinflip SET joinAttemptStart = ?,steam64v2 = ?, valuev2 = ?, itemsv2 = ?, trade_acceptedv2 = ?, tradeurlv2 = ?, steamNamev2 = ?,steamAvatarv2 = ?,steamUrlv2 = ?,site_chosenv2 = ? WHERE id = ?', [null, null, null, null, null, null, null, null, null, null, coinflipId], function (error, results, fields) {
        if (error) throw error;
        connection.query('DELETE FROM items WHERE coinflip_id = ? AND mode = 1', [coinflipId], function (error, results, fields) {
            if (error) throw error;
            prepareCoinflipArray(coinflipId,function (updatedCoinflipArr) {
                console.log("for emit");
                io.sockets.emit("updateCoinflipArray",updatedCoinflipArr,coinflipId);
            })
        });
    });

}

function getJoinOfferStatus(coinflipId,callback) {
    connection.query('SELECT * FROM coinflip WHERE id = ?', [coinflipId], function (error, results, fields) {
        callback(results[0]["trade_acceptedv2"])
    });
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
    var chosenArr = [];
    result.forEach(function (res, ind) {
        if (res.length < minLen) {
            chosenArr = res;
            minLen = res.length;
        }
    });

    callback(chosenArr);

}

function calculateWinnerAndTax(coinflipId,callback) {
    connection.query('SELECT * FROM coinflip WHERE id = ?', [coinflipId], function (error, coinflipData, fields) {
        connection.query('SELECT * FROM items WHERE coinflip_id = ?', [coinflipId], function (error, itemData, fields) {

            var player1site = coinflipData[0]["site_chosen"];
            var player2site = coinflipData[0]["site_chosenv2"];

            var seed = coinflipData[0]["seed"];
            var player1seed = coinflipData[0]["player1hash"];
            var player2seed = coinflipData[0]["player2hash"];

            var finalseed = seed + player1seed + player2seed;
            var chance = new ChanceJS(finalseed);

            var percantage = chance.floating({min:0, max: 100,fixed: 12});

            if(coinflipData[0]["winning_perc"] !== undefined && coinflipData[0]["winning_perc"] !== null) {
                percantage = parseFloat(coinflipData[0]["winning_perc"]);
            }

            var value1 = parseFloat(coinflipData[0]["value"]);
            var value2 = parseFloat(coinflipData[0]["valuev2"]);
            var totalValue = value1 + value2;
            var taxTreshhold = 5;
            var taxPercentage = 0;
            var taxIds = [];
            var winningPlayer;

            var player1Perc = (value1 / (value1 + value2)) * 100;
            var player2Perc = 100 - player1Perc;

            if (player1site == 0 && percantage <= player1Perc) {
                winningPlayer = "p1";
            } else if (player1site == 1 && percantage > player2Perc) {
                winningPlayer = "p1"
            } else {
                winningPlayer = "p2"
            }

            if (totalValue >= taxTreshhold) {
                taxPercentage = 5;
            }

            var taxValue = ((totalValue / 100) * taxPercentage);

            var itemPrices = [];
            var assetids = [];
            var combinedInformations = {};

            itemData.forEach(function (val, index) {
                combinedInformations[val["assetid"]] = parseFloat(val["price"])
                itemPrices.push(parseFloat(val["price"]));
            });

            if (winningPlayer == "p1") {
                var winnersTradeUrl = coinflipData[0]["tradeurl"];
                var winnerName = coinflipData[0]["steamName"];
                var winner64 = coinflipData[0]["steam64"];
                var loser64 = coinflipData[0]["steam64v2"];
                var wonValue = parseFloat(coinflipData[0]["valuev2"]);
                var winningSite = player1site;
            } else {
                var winner64 = coinflipData[0]["steam64v2"];
                var loser64 = coinflipData[0]["steam64"];
                var wonValue = parseFloat(coinflipData[0]["value"]);
                var winnersTradeUrl = coinflipData[0]["tradeurlv2"];
                var winnerName = coinflipData[0]["steamNamev2"];
                var winningSite = player2site;
            }

            console.log("FIRST TRADEURL CHECK FOR WINNING TICKET")
            console.log(winnersTradeUrl)

            //Total Won/Lost updates
            connection.query('SELECT * FROM `user` WHERE steam64 = ?', [winner64], function (error2, res1, fields2) {
                connection.query('SELECT * FROM `user` WHERE steam64 = ?', [loser64], function (error2, res2, fields2) {

                    var totalWonVal = parseFloat(res1[0]["totalWon"]) + wonValue;
                    var totalLostVal = parseFloat(res2[0]["totalLost"]) + wonValue;
                    connection.query('UPDATE user SET totalWon = ? WHERE steam64 = ?', [String(totalWonVal), winner64], function (error2, dares, fields2) {
                    });
                    connection.query('UPDATE user SET totalLost = ? WHERE steam64 = ?', [String(totalLostVal), loser64], function (error2, dares, fields2) {
                    })
                    if(socketConnections[winner64] !== undefined || socketConnections[winner64] !== null ) {
                        if(socketConnections[winner64] === undefined) {
                        } else {
                            console.log(socketConnections[winner64])
                            socketConnections[winner64].emit("updateUserStats",totalWonVal,"won");
                        }
                    }
                    if(socketConnections[loser64] !== undefined || socketConnections[loser64] !== null ) {
                        if(socketConnections[loser64] === undefined) {
                        } else {
                            console.log(socketConnections[loser64])
                            socketConnections[loser64].emit("updateUserStats",totalLostVal,"lost");
                        }
                    }

                })
            });

            connection.query('SELECT * FROM user WHERE steam64 = ?', [coinflipData[0]["steam64"]], function (er, re) {
                if(re[0]["af_codeused"] !== undefined && re[0]["af_codeused"] != null) {
                    connection.query('SELECT * FROM user WHERE af_code = ?',[re[0]["af_codeused"]],function (err,res) {
                        var betamount = (res[0]["af_betamount"] + value1).toFixed(2)
                        connection.query('UPDATE user SET af_betamount = ? WHERE af_code = ?',[betamount,re[0]["af_codeused"]],function (fehler,erg) {
                        })
                    })
                }
            });

            connection.query('SELECT * FROM user WHERE steam64 = ?', [coinflipData[0]["steam64v2"]], function (er, re) {
                if(re[0]["af_codeused"] !== undefined && re[0]["af_codeused"] != null) {
                    connection.query('SELECT * FROM user WHERE af_code = ?',[re[0]["af_codeused"]],function (err,res) {
                        var betamount = (res[0]["af_betamount"] + value2).toFixed(2)
                        connection.query('UPDATE user SET af_betamount = ? WHERE af_code = ?',[betamount,re[0]["af_codeused"]],function (fehler,erg) {
                        })
                    })
                }
            });

            //TODO LOOK HOW I CAN UPDATE USER STATS VIA SOCKET TO THE INDIVIDUAL SOCKETS
            //io.sockets.emit("updateTotalStats",parseFloat(results2["value"]),results.length,1);

            calculateTaxItems(itemPrices,taxValue,function (chosenPrices) {

                var marker = false;/*
                var combinedInformations = {};
                combinedInformations["asset1"] = 1.12;
                combinedInformations["asset2"] = 2.32;
                combinedInformations["asset3"] = 1.12;
                combinedInformations["asset4"] = 1.56;
                combinedInformations["asset5"] = 4.23;
                combinedInformations["asset6"] = 1.01;
                combinedInformations["asset7"] = 0.19;
                combinedInformations["asset8"] = 9.23;*/

                for (var prop in combinedInformations) {
                    chosenPrices.forEach(function (val,ind) {
                        var assetID = prop;
                        if(val == combinedInformations[prop] && marker == false) {
                            chosenPrices.splice(ind,1)
                            marker = true;
                            taxIds.push(assetID)
                            delete combinedInformations[prop];
                        }
                    })
                    marker = false;
                }
                for (var prop in combinedInformations) {
                    assetids.push(prop)
                }

                taxIds.forEach(function (val,ind) {
                    connection.query('UPDATE items SET taxed = 1 WHERE assetid = ?', [val], function (error2, res2, fields2) {
                        console.log("1 more item taxed")
                    })
                });

                connection.query('UPDATE coinflip SET finished = ?,winning_perc = ?, winner = ?, winofferid_accepted = ? WHERE id=?', [1,percantage, winningPlayer, 0, coinflipId], function (error, results, fields) {
                    console.log("passed asset ids #1234")
                    console.log(assetids)
                    callback(coinflipData[0]["bot_id"],winnersTradeUrl,assetids);
                });








/*                //TODO 08.01 I GUESS THAT THERE IS A ISSUE WITH THE CORRECT ASSET IDS, WHEN SOMETHING GET TAXXED, RESULTING INTO MASSIVE BUG WHILE SENDING WINNING OFFER
                itemData.forEach(function (result, index) {
                    if (chosenPrices.includes(parseFloat(result["price"]))) {
                        var ind = chosenPrices.indexOf(parseFloat(result["price"]));
                        chosenPrices.splice(ind, 1);
                        ind = assetids.indexOf(result["assetid"]);
                        taxIds.push(assetids[ind]);
                        assetids.splice(ind, 1)
                    }
                });*/


/*                setTimeout(function () {
                    botHandler.sendWinnersTrade(coinflipData[0]["bot_id"],winnersTradeUrl,assetids,function (offerid) {
                        connection.query('UPDATE coinflip SET winofferid = ? WHERE id=?', [offerid,coinflipId], function (error, results, fields) {
                        })
                    });
                },1000*10)*/
            })
        });
    });
}

function finalizeWinningOfferSend(offerid,coinflipid) {
    connection.query('UPDATE coinflip SET winofferid = ? WHERE id=?', [offerid,coinflipid], function (error, results, fields) {
    })
}

function insertNewUser(steamID,callback) {
    connection.query('SELECT * FROM user WHERE steam64 = ?', [steamID], function (error, results, fields) {
        if(results[0] === undefined || results[0] === null) {
            generateRandomAffCode(function (affCode) {
                connection.query('INSERT INTO user (steam64,af_code) VALUES (?,?)', [steamID,affCode], function (error, results, fields) {
                    callback();
                });
            })
        } else {
            if(results[0]["af_code"] == null) {
                generateRandomAffCode(function (affCode) {
                    connection.query('UPDATE user SET af_code = ? WHERE steam64 = ?', [affCode,steamID], function (error, results, fields) {
                        callback();
                    });
                })
            } else {
                callback();
            }
        }
    })
}

function generateRandomAffCode(callback) {

    var inter = setInterval(function () {
        console.log("LOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOP")
        var affCode = Math.random().toString(36).substring(7).toLowerCase().substring(0,7);
        connection.query('SELECT * FROM user WHERE af_code = ?', [affCode], function (error, results, fields) {
            if(results[0] === undefined || results[0] == null) {
                clearInterval(inter)
                callback(affCode);
            }
        })
    },200)

}

function fetchAndPrepareHistory(steamID,callback) {
    console.log("STEAM IDS 2 HERE")
    console.log(steamID)

    //TODO NEED TO FIND A WAY TO MAKE IT QUERY LESS OTHERWISE IT WILL JSUT INCREASE LOADING TIME BY ALOT
    connection.query("SELECT * FROM coinflip WHERE finished = 1",[],function (error,result) {
        if(result[0] !== undefined && result[0] !== null) {
            console.log("nada niente")
            var frontendHistory = {}
            var counter = 0;

            result.forEach(function (val,ind) {
                if(ind < result.length - 50 && !steamID.includes(val["steam64"]) && !steamID.includes(val["steam64v2"])) {
                    counter++;
                    if(counter == result.length) {
                        callback(frontendHistory);
                    }
                    return;
                }

                if(val["offerAcceptedStart"] == "123") {
                    counter++;
                    if(counter == result.length) {
                        callback(frontendHistory);
                    }
                    return;
                }
                frontendHistory[ind] = {};
                frontendHistory[ind]["p1"] = {}
                frontendHistory[ind]["p2"] = {}
                frontendHistory[ind]["items"] = {}
                frontendHistory[ind]["misc"] = {}

                frontendHistory[ind]["p1"]["image"] = val["steamAvatar"]
                frontendHistory[ind]["p1"]["link"] = val["steamUrl"]
                frontendHistory[ind]["p1"]["site"] = val["site_chosen"]

                frontendHistory[ind]["p2"]["image"] = val["steamAvatarv2"]
                frontendHistory[ind]["p2"]["link"] = val["steamUrlv2"]
                frontendHistory[ind]["p2"]["site"] = val["site_chosenv2"]

                frontendHistory[ind]["misc"]["serverhash"] = val["serverhash"]
                frontendHistory[ind]["misc"]["serverseed"] = val["seed"]
                frontendHistory[ind]["misc"]["serversecret"] = val["secret"]
                frontendHistory[ind]["misc"]["p1hash"] = val["player1hash"]
                frontendHistory[ind]["misc"]["p2hash"] = val["player2hash"]
                frontendHistory[ind]["misc"]["percentage"] = val["winning_perc"]
                frontendHistory[ind]["misc"]["totalValue"] = parseFloat(val["value"]) + parseFloat(val["valuev2"])
                frontendHistory[ind]["misc"]["winner"] = val["winner"]
                frontendHistory[ind]["misc"]["date"] = val["offerAcceptedStart"]
                if(steamID.includes(val["steam64"]) || steamID.includes(val["steam64v2"])) {
                    frontendHistory[ind]["misc"]["private"] = true
                } else {
                    frontendHistory[ind]["misc"]["private"] = false
                }

                connection.query("SELECT * FROM items WHERE coinflip_id = ?",[val["id"]],function (err,items) {
                    items.forEach(function (val,indexo) {
                        frontendHistory[ind]["items"][indexo] = {};
                        frontendHistory[ind]["items"][indexo]["image"] = val["iconurl"]
                        frontendHistory[ind]["items"][indexo]["value"] = val["price"]
                        frontendHistory[ind]["items"][indexo]["name"] = val["market_hash_name"]
                    })
                    console.log("in if before counter ticks up")
                    console.log(counter)
                    console.log(result.length)
                    counter++;
                    if(counter == result.length) {
                        callback(frontendHistory);
                    }
                })

                    /*
                } else {
                    console.log("in else before counter ticks up")
                    console.log(counter)
                    console.log(result.length)
                    counter++;
                    if(counter == result.length) {
                        callback(frontendHistory);
                    }
                }*/
            })
        } else {
            console.log("cyka blyat")
            callback("Your coinflip history is empty.");
        }
    })
}

function fetchAndPrepareSocketHistory(coinflipId,callback) {
    connection.query("SELECT * FROM coinflip WHERE id = ?",[coinflipId],function (error,result) {
        if(result[0] !== undefined && result[0] !== null) {
            console.log("nada niente")
            var frontendHistory = {}
            var val = result[0];

            frontendHistory["p1"] = {}
            frontendHistory["p2"] = {}
            frontendHistory["items"] = {}
            frontendHistory["misc"] = {}

            frontendHistory["p1"]["image"] = val["steamAvatar"]
            frontendHistory["p1"]["link"] = val["steamUrl"]
            frontendHistory["p1"]["site"] = val["site_chosen"]

            frontendHistory["p2"]["image"] = val["steamAvatarv2"]
            frontendHistory["p2"]["link"] = val["steamUrlv2"]
            frontendHistory["p2"]["site"] = val["site_chosenv2"]

            frontendHistory["misc"]["serverhash"] = val["serverhash"]
            frontendHistory["misc"]["serverseed"] = val["seed"]
            frontendHistory["misc"]["serversecret"] = val["secret"]
            frontendHistory["misc"]["p1hash"] = val["player1hash"]
            frontendHistory["misc"]["p2hash"] = val["player2hash"]
            frontendHistory["misc"]["percentage"] = val["winning_perc"]
            frontendHistory["misc"]["totalValue"] = parseFloat(val["value"]) + parseFloat(val["valuev2"])
            frontendHistory["misc"]["winner"] = val["winner"]
            frontendHistory["misc"]["date"] = val["offerAcceptedStart"]
            frontendHistory["misc"]["private"] = false

            connection.query("SELECT * FROM items WHERE coinflip_id = ?",[coinflipId],function (err,items) {
                items.forEach(function (val,indexo) {
                    frontendHistory["items"][indexo] = {};
                    frontendHistory["items"][indexo]["image"] = val["iconurl"]
                    frontendHistory["items"][indexo]["value"] = val["price"]
                    frontendHistory["items"][indexo]["name"] = val["market_hash_name"]
                })
                callback(frontendHistory);
            })

        }
    })
}

function getSteam64s(coinflipID,callback) {
    connection.query("SELECT * FROM coinflip WHERE id = ?",[coinflipID],function (err,res) {
        callback([res[0]["steam64"],res[0]["steam64v2"]]);
    })
}

function setWinningOfferAccepted(coinflipID) {
    connection.query("UPDATE coinflip SET winofferid_accepted = 1 WHERE id = ?",[coinflipID],function (err,res) {
    })
}

function getTaxedItemsAssets(callback) {
    connection.query("SELECT * FROM items WHERE taxed = 1 AND taxed_and_send = 'no'",[],function (err,res) {
        var assets = [];
        res.forEach(function (val,ind) {
            assets.push(val["assetid"])
        })
        callback(assets)
    })
}

function setTaxedItemsDelivered(assets) {
    assets.forEach(function (val,ind) {
        connection.query("UPDATE items SET taxed_and_send = 'yes' WHERE assetid = ?",[val],function (err,res) {

        })
    })
}

function loadLastBotSend(callback) {
    connection.query("SELECT * FROM botUpdates",[],function (err,res) {
        callback(res[0]["lastUpdate"])
    })
}

function setLastBotSend() {
    connection.query("UPDATE botUpdates SET lastUpdate = ?",[Date.now()],function (err,res) {
    })
}

function getTaxItemAssets(callback) {
    connection.query("SELECT * FROM items WHERE taxed = 1 AND taxed_and_send = 'no'",[],function (err,res) {
        if(res !== undefined && res != null) {
            callback(res)
        } else {
            callback()
        }
    })
}

function getAffiliateInfos(steamid,callback) {
    connection.query("SELECT * FROM user WHERE steam64 = ?",[steamid],function (err,res) {
        var returnArr = [];
        res = res[0]
        returnArr["code"] = res["af_code"]
        returnArr["coins"] = res["af_coins"]
        returnArr["amount"] = res["af_amount"]
        //returnArr["totalearning"] = res["af_totalearning"]
        returnArr["totalearning"] = (res["af_betamount"] * 0.01) - res["af_collected"]
        returnArr["collected"] = res["af_collected"]
        returnArr["betamount"] = res["af_betamount"]
        returnArr["level"] = res["af_level"]
        callback(returnArr)
    })
}

function createBotcfEntry(steaminfos,botassets,playerassets,callback) {

    connection.query("INSERT INTO botCoinflips (player64,playerName,playerImage,playerProfile,playerAmount,botAmount,playerTradeurl,offerAccepted) VALUES (?,?,?,?,?,?,?,?)",
        [steaminfos["player64"], steaminfos["playerName"], steaminfos["playerImage"], steaminfos["playerProfile"], steaminfos["playerValue"], steaminfos["botValue"] , steaminfos["playerTradeurl"], 0],
        function (err,res) {
        callback(res["insertId"])
    })

}

function addBotcfOfferInfo(insertId,offerid,hash,callback) {
    connection.query("UPDATE botCoinflips SET offerid = ?, offerhash = ? WHERE id = ?",[offerid,hash,insertId],function (err,res) {
        callback()
    })
}

module.exports = {
    createNewCoinflipEntry: createNewCoinflipEntry,
    addBotcfOfferInfo: addBotcfOfferInfo,
    createBotcfEntry: createBotcfEntry,
    getAffiliateInfos: getAffiliateInfos,
    setLastBotSend:setLastBotSend,
    getTaxItemAssets:getTaxItemAssets,
    loadLastBotSend: loadLastBotSend,
    insertNewItemEntry: insertNewItemEntry,
    getItemPrice: getItemPrice,
    getTradeurlBySteam64: getTradeurlBySteam64,
    finalizeCreateRequest: finalizeCreateRequest,
    getOfferState: getOfferState,
    updateCreateOffer: updateCreateOffer,
    updateJoinOffer: updateJoinOffer,
    prepareCoinflipArray: prepareCoinflipArray,
    getNeededPrice: getNeededPrice,
    insertJoinAttempt: insertJoinAttempt,
    checkAndInsertJoinAttemptDate: checkAndInsertJoinAttemptDate,
    finalizeJoinRequest: finalizeJoinRequest,
    updateAssets: updateAssets,
    getAssets: getAssets,
    markCreateSendBack: markCreateSendBack,
    checkAndDeleteJoinAttempt: checkAndDeleteJoinAttempt,
    getJoinOfferStatus: getJoinOfferStatus,
    calculateWinnerAndTax: calculateWinnerAndTax,
    finalizeWinningOfferSend: finalizeWinningOfferSend,
    insertNewUser: insertNewUser,
    fetchAndPrepareHistory: fetchAndPrepareHistory,
    getSteam64s: getSteam64s,
    setWinningOfferAccepted: setWinningOfferAccepted,
    getTaxedItemsAssets: getTaxedItemsAssets,
    setTaxedItemsDelivered: setTaxedItemsDelivered,
    fetchAndPrepareSocketHistory: fetchAndPrepareSocketHistory
};
