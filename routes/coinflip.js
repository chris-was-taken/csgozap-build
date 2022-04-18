var express = require('express');
var router = express.Router();
var mysql = require("mysql");
var databaseManager = require("./databaseManager")
const connection = mysql.createConnection({
    host: "localhost",
    user: "main_query",
    password: 'z41"(H)Jhnfu("342',
    socketPath: '/var/run/mysqld/mysqld.sock',
    database: "main",
    charset: "utf8_general_ci"
});

var moment = require('moment');

router.get('/', function(req, res, next) {

    if(!req.session.steamId) {
        return res.redirect('/');
    //} else if ( req.session.steamId == "76561198121509831") {
    } else if ( req.session.steamId == "76561198121509831R" || req.session.steamId == '76561198448300120R' || req.session.steamId == '7656119ddddd8448300120R') {

        loadAllCoinflips(function (totalItems,totalValue,totalGames,frontendCoinflipArr) {
            console.log("ok load all coinflips passed");
            console.log(frontendCoinflipArr)
            if(frontendCoinflipArr === undefined) {
                frontendCoinflipArr = {};
            }
            console.log("vor load chat")
            loadChatMessages(function (messageString) {
                console.log("vor load user stats")
                loadUserStats(req.session.steamId,function (totalWon,totalLost,totalProfitText) {
                    console.log("vor fetch and prep")
                    databaseManager.fetchAndPrepareHistory([req.session.steamId],function (history) {
                        console.log("whre i shld be")
                        res.render('coinflip_z', {
                            "steam": {
                                "link": req.session.steamProfileurl,
                                "id": req.session.steamId,
                                "name": req.session.steamName,
                                "avatar": req.session.steamAvatar
                            },
                            "headerValues": {"totalItems": totalItems, "totalValue": totalValue.toFixed(2), "totalGames": totalGames},
                            "yourStats": {"totalWon": totalWon, "totalLost": totalLost, "totalProfit": totalProfitText},
                            "content": { "chatTemplates": messageString},
                            "clientsideArr" : JSON.stringify(frontendCoinflipArr),
                            "cfHistory" : JSON.stringify(history)
                        });
                    })
                    //res.render("coinflipTestversion");
                    //res.render('coinflip', {"steam": {"link": req.session.steamProfileurl,"id": req.session.steamId,"name": req.session.steamName,"data": string,"avatar": req.session.steamAvatar,"messages" : chatmessagestring}});
                })
            })

        })
    } else {

        loadAllCoinflips(function (totalItems,totalValue,totalGames,frontendCoinflipArr) {
            console.log("ok load all coinflips passed");
            console.log(frontendCoinflipArr)
            if(frontendCoinflipArr === undefined) {
                frontendCoinflipArr = {};
            }
            console.log("vor load chat")
            loadChatMessages(function (messageString) {
                console.log("vor load user stats")
                loadUserStats(req.session.steamId,function (totalWon,totalLost,totalProfitText) {
                    console.log("vor fetch and prep")
                    databaseManager.fetchAndPrepareHistory([req.session.steamId],function (history) {
                        console.log("whre i shld be")
                        res.render('coinflip', {
                            "steam": {
                                "link": req.session.steamProfileurl,
                                "id": req.session.steamId,
                                "name": req.session.steamName,
                                "avatar": req.session.steamAvatar
                            },
                            "headerValues": {"totalItems": totalItems, "totalValue": totalValue.toFixed(2), "totalGames": totalGames},
                            "yourStats": {"totalWon": totalWon, "totalLost": totalLost, "totalProfit": totalProfitText},
                            "content": { "chatTemplates": messageString},
                            "clientsideArr" : JSON.stringify(frontendCoinflipArr),
                            "cfHistory" : JSON.stringify(history)
                        });
                    })
                    //res.render("coinflipTestversion");
                    //res.render('coinflip', {"steam": {"link": req.session.steamProfileurl,"id": req.session.steamId,"name": req.session.steamName,"data": string,"avatar": req.session.steamAvatar,"messages" : chatmessagestring}});
                })
            })

        })

        //return res.redirect('/auth/notlisted/logout');
    }
});

function loadUserStats(steam64,callback) {
    connection.query('SELECT * FROM `user` WHERE steam64 = ?',[steam64], function (error, results, fields) {
        if(results[0] === undefined) {
            callback(0.00.toFixed(2),0.00.toFixed(2),"<span style='color:green'>"+0.00.toFixed(2)+"</span>");
        } else {
            var totalWon = parseFloat(results[0]["totalWon"]).toFixed(2);
            var totalLost = parseFloat(results[0]["totalLost"]).toFixed(2);

            var totalProfit = totalWon - totalLost;
            if (totalProfit < 0) {
                var totalProfitText = "<span style='color:red'>" + totalProfit.toFixed(2) + "</span>"
            } else {
                var totalProfitText = "<span style='color:green'>" + totalProfit.toFixed(2) + "</span>"
            }
            callback(totalWon, totalLost, totalProfitText);
        }
    })
}

function loadChatMessages(callback) {
    connection.query('SELECT * FROM `chat` ORDER BY id DESC limit 10', function (error, results, fields) {
        var chatmessagestring = "";
        results.reverse().forEach(function (val,index) {
/*            chatmessagestring += '<div class="block"><a target="_blank" href="'+val["steamProfile"]+'"><img src="'+val["steamIcon"]+'" alt="" class="img-responsive player-thumb"></a>'+
                '<div class="player-chat">'+
                '<p class="player-name"><a target="_blank" href="'+val["steamProfile"]+'">'+val["steamName"]+'</a></p><span class="text-main-content">'+val["message"]+'</span>'+
                '</div></div>';*/
            var specialStatus = "";
            var specialTag = "";
            switch (val["status"]) {
                case 1:
                    specialStatus += "#fff" //NORMIE
                    break;
                case 2:
                    specialStatus += "lightgreen" //MOD
                    specialTag = '[MOD]'
                    break;
                case 3:
                    specialStatus += "gold" //ADMIN
                    specialTag = '[ADMIN]'
                    break;
                case 4:
                    specialStatus += "darkred" //YOUTUBER
                    specialTag = '[YT]'
                    break;
            }

            chatmessagestring += '' +
            '<div class="chat__item">'+
                '<div class="chat__photo"><a target="_blank" href="'+val["steamProfile"]+'"><img src="'+val["steamIcon"]+'" alt="Avatar"></a></div>'+
                '<div class="chat__message">'+
                    '<h5 class="message__author" style="color: '+specialStatus+'"><a target="_blank" href="'+val["steamProfile"]+'">'+specialTag+val["steamName"]+'</a></h5>'+
                    '<p class="message__text">'+val["message"]+'</p>'+
                '</div>'+
            '</div>'
        })
        callback(chatmessagestring);
    })
}

function loadAllCoinflips(callback) {
    console.log("in load all coinflips to check for endless loop")
    var finishedFlips = 0;
    var totalValue = 0;
    var totalGames = 0;
    var totalItems = 0;
    var frontedCoinflipContent = {};
    //IF COINFLIP IS ALREADY DONE BUT I FORGOT TO CLEAR IT OR SERVER CRASHED AND DIDNT CLEAR DONT LOAD IT
    //TODO 14.12 CHECK HERE WHY 1 COINFLIP DIDNT GET OUTPUT ; MAYBE LOG ALL THE LOOPS AND STUFF
    //TODO MAYBE CHECK HERE WHAT IF SERVER CRASHED AND JOIN ATTEMPT DIDNT GET CLEARED WE ARE HERE FOR LIFETIME
    connection.query('SELECT * FROM `coinflip` WHERE trade_accepted = ? ORDER BY value DESC',[1], function (error, coinflipGames, fields) {
        if(coinflipGames[0] === undefined) {
            callback(totalItems, totalValue, totalGames, frontedCoinflipContent);
        }
        coinflipGames.forEach(function (results2,index) {
            if((((Date.now() - results2["createdDate"]) / 1000) / 60) < 30) {
                if(results2["finished"] == 1) {
                    if ((((Date.now() - results2["offerAcceptedStart"]) / 1000) / 60) > 5) {
                        finishedFlips++;
                        if (finishedFlips == coinflipGames.length) {
                            console.log("finished loading coinflips games")
                            callback(totalItems, totalValue, totalGames, frontedCoinflipContent);
                        }
                        return;
                    }
                }
                //TODO MIGHT NEED TO DO SOME MORE CHECKS HERE BUT WILL DO THAT LATER
                var frontendContentCFID = results2["id"];
                frontedCoinflipContent[frontendContentCFID] = {};

                frontedCoinflipContent[frontendContentCFID]["serverhash"] = results2["serverhash"];
                frontedCoinflipContent[frontendContentCFID]["winner"] = results2["winner"];
                frontedCoinflipContent[frontendContentCFID]["winnerPerc"] = results2["winning_perc"];

                frontedCoinflipContent[frontendContentCFID]["p1"] = {};
                frontedCoinflipContent[frontendContentCFID]["p1"]["image"] = results2["steamAvatar"];
                frontedCoinflipContent[frontendContentCFID]["p1"]["url"] = results2["steamUrl"];
                frontedCoinflipContent[frontendContentCFID]["p1"]["name"] = results2["steamName"];
                frontedCoinflipContent[frontendContentCFID]["p1"]["value"] = parseFloat(results2["value"]);
                frontedCoinflipContent[frontendContentCFID]["p1"]["site"] = results2["site_chosen"];
                frontedCoinflipContent[frontendContentCFID]["p1"]["createdDate"] = results2["createdDate"];

                frontedCoinflipContent[frontendContentCFID]["p2"] = {};
                frontedCoinflipContent[frontendContentCFID]["p2"]["image"] = results2["steamAvatarv2"];
                frontedCoinflipContent[frontendContentCFID]["p2"]["url"] = results2["steamUrlv2"];
                frontedCoinflipContent[frontendContentCFID]["p2"]["name"] = results2["steamNamev2"];
                frontedCoinflipContent[frontendContentCFID]["p2"]["value"] = parseFloat(results2["valuev2"]);
                frontedCoinflipContent[frontendContentCFID]["p2"]["site"] = results2["site_chosenv2"];
                frontedCoinflipContent[frontendContentCFID]["p2"]["joinDate"] = results2["joinAttemptStart"];
                if (results2["trade_acceptedv2"] == 1) {
                    frontedCoinflipContent[frontendContentCFID]["p2"]["joined"] = true;
                    totalValue += parseFloat(results2["value"])
                    totalValue += parseFloat(results2["valuev2"])
                } else {
                    totalValue += parseFloat(results2["value"])
                    frontedCoinflipContent[frontendContentCFID]["p2"]["joined"] = false;
                }
                frontedCoinflipContent[frontendContentCFID]["p2"]["acceptedDate"] = results2["offerAcceptedStart"];

                connection.query('SELECT * FROM `items` WHERE coinflip_id = ? AND mode = 0 ORDER BY price DESC', [results2["id"]], function (error, results, fields) {

                    frontedCoinflipContent[frontendContentCFID]["p1items"] = {};
                    results.forEach(function (val, ind) {
                        frontedCoinflipContent[frontendContentCFID]["p1items"][ind] = {};
                        frontedCoinflipContent[frontendContentCFID]["p1items"][ind]["iconurl"] = val["iconurl"];
                        frontedCoinflipContent[frontendContentCFID]["p1items"][ind]["hashname"] = val["market_hash_name"];
                        frontedCoinflipContent[frontendContentCFID]["p1items"][ind]["val"] = parseFloat(val["price"]);
                        totalItems++;
                    })

                    connection.query('SELECT * FROM `items` WHERE coinflip_id = ? AND mode = 1 ORDER BY price DESC', [results2["id"]], function (error, results4, fields) {

                        frontedCoinflipContent[frontendContentCFID]["p2items"] = {};
                        results4.forEach(function (val, ind) {
                            frontedCoinflipContent[frontendContentCFID]["p2items"][ind] = {};
                            frontedCoinflipContent[frontendContentCFID]["p2items"][ind]["iconurl"] = val["iconurl"];
                            frontedCoinflipContent[frontendContentCFID]["p2items"][ind]["hashname"] = val["market_hash_name"];
                            frontedCoinflipContent[frontendContentCFID]["p2items"][ind]["val"] = parseFloat(val["price"]);
                            totalItems++;
                        })

                        finishedFlips++;
                        totalGames++;
                        if (finishedFlips == coinflipGames.length) {
                            console.log("finished loading coinflips games")
                            callback(totalItems, totalValue, totalGames, frontedCoinflipContent);
                        }
                    });
                })
            } else {
                finishedFlips++;
                if (finishedFlips == coinflipGames.length) {
                    console.log("finished loading coinflips games")
                    callback(totalItems, totalValue, totalGames, frontedCoinflipContent);
                }
            }
        })
    });
}


module.exports = router;
