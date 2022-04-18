//TODO WRITE CLEANUP SCRIPT FOR DATABASE TO REKK ALL OLDER THEN 2 WEEKS ?

//Required Base Modules
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var session = require('express-session');
//var tradeBot = require("./routes/botAccountTest");
var request = require("request");
var Filter = require('bad-words');
var customFilter = new Filter({placeHolder: '*'});
customFilter.removeWords(["hello","Hello"]);

var app = express();
var itemManager = require("./routes/itemManager");
var newManager = require("./routes/newManager");
var socketHandler = require("./routes/socketHandler");
var botHandler = require("./routes/botHandler");
var shopBotHandler = require("./routes/shopBotHandler");
var ChanceJS = require("chance");
var mysql = require("mysql");

//Testing
var debug = require('debug')('csgozap:server');
var http = require('http');
var server = http.createServer(app);
//var io = require('socket.io')(server);
server.listen(3000);

global.io = require('socket.io').listen(server);
/*io = require('socket.io').listen(server);
 console.log(io);
 app.set("webs",io);
 */

const connection = mysql.createConnection({
    host: "localhost",
    user: "main_query",
    password: 'z41"(H)Jhnfu("342',
    socketPath: '/var/run/mysqld/mysqld.sock',
    database: "main",
    charset: "utf8_general_ci"
});

//TODO FIND A BETTER WAY
/*process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
});*/

//Required Routing Modules
var index = require('./routes/index');
var coinflip = require('./routes/coinflip');
var toc = require('./routes/toc');
var support = require('./routes/support');
var faq = require('./routes/faq');
var provablyfair = require('./routes/proof');
var affiliates = require('./routes/affiliates');

var steamauth = require('./routes/steamauth');


var apiCalls = require('./routes/botApi');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
session = require("express-session")({
    secret: "inogkessigei243nio5",
    resave: true,
    saveUninitialized: true
}), sharedsession = require("express-socket.io-session");
app.use(session);
io.use(sharedsession(session));
//app.use(session({ resave: true, saveUninitialized: true, secret: "inogkessigei243nio5"}));
app.use(express.static(path.join(__dirname, 'public')));

//Routing
app.use('/', index);
app.use('/coinflip', coinflip);
app.use('/toc', toc);
app.use('/support', support);
app.use('/faq', faq);
app.use('/proof', provablyfair);
app.use('/auth', steamauth);
app.use('/apicall', apiCalls);
app.use('/affiliates', affiliates);
//
// app.use('/bot',tradeBot);

app.get('/giive', function(req, res, next) {
    botHandler.giveItemsBack();
    return res.redirect('https://steamcommunity.com/id/CrispySheesh/tradeoffers/');
})



// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

var totalUsers = 0;

global.socketConnections = [];

io.sockets.on('connection', function (socket) {

    //INITIAL SETUP
    socketConnections[socket.handshake.session.steamId] = socket;
    totalUsers++;
    io.sockets.emit('updateTotalUsers', totalUsers);


    //EVENT HANDLER

    //Gets Inventory Contents from Users Inventory
    socket.on("loadInventory",function () {
        newManager.loadInventory(socket.handshake.session.steamId,function (data) {
            socket.emit("inventoryLoaded",data);
        })
    })

    socket.on("loadBotShopInventory",function () {
        shopBotHandler.loadBotInventory(function (botInv) {
            socket.emit("botInventoryLoaded",botInv)
        })
    })

    socket.on("createBotCoinflip",function (botAssets,playerAssets) {
        getTradeurl(socket.handshake.session.steamId,function (url) {
            if(url != "fail") {

                let steamInfos = [];

                steamInfos["player64"] = socket.handshake.session.steamId;
                steamInfos["playerName"] = socket.handshake.session.steamName;
                steamInfos["playerImage"] = socket.handshake.session.steamAvatarmedium;
                steamInfos["playerProfile"] = socket.handshake.session.steamProfileurl;
                steamInfos["playerTradeurl"] = url;

                shopBotHandler.prepareBotCoinflip(steamInfos,botAssets,playerAssets,function (offerid,hash) {
                    socket.emit("createdBotCoinflip",offerid,hash)
                })

            } else {
                socket.emit("createdBotCoinflip","Unfortunatley your tradeurl got malformed, please reset it and try again!")
            }
        })
    })

    //Handle Create Request
    socket.on("createRequest",function (assets,siteChosen,player1secret) {

        var requestPackage = [];
        requestPackage["assets"] = assets;
        requestPackage["siteChosen"] = siteChosen;
        requestPackage["player1secret"] = player1secret;
        console.log(requestPackage)
        console.log("NABFBAFBUfbUFA")

        requestPackage["steamID"] = socket.handshake.session.steamId;
        requestPackage["steamName"] = socket.handshake.session.steamName;
        requestPackage["steamAvatar"] = socket.handshake.session.steamAvatarmedium;
        requestPackage["steamURL"] = socket.handshake.session.steamProfileurl;

        //..... Set all needed variables
        socketHandler.sendTrade(requestPackage,"create",function (offerId,secretHash) {
            socket.emit("finishedCreateRequest",offerId,secretHash);
        });


    })

    //Handle Join Request
    socket.on("joinRequest",function (assets,player2secret,coinflipId) {

        var requestPackage = [];
        requestPackage["assets"] = assets;
        requestPackage["player2secret"] = player2secret;
        requestPackage["coinflipId"] = parseInt(coinflipId);

        requestPackage["steamID"] = socket.handshake.session.steamId;
        requestPackage["steamName"] = socket.handshake.session.steamName;
        requestPackage["steamAvatar"] = socket.handshake.session.steamAvatarmedium;
        requestPackage["steamURL"] = socket.handshake.session.steamProfileurl;

        //..... Set all needed variables
        socketHandler.sendTrade(requestPackage,"join",function (offerId,secretHash) {
            socket.emit("finishedJoinRequest",offerId,secretHash);
        });


    })

    //Handle Affiliates
    socket.on("useAFCode",function (code) {
        var steam64 = socket.handshake.session.steamId

        connection.query('SELECT * FROM user WHERE af_code = ?',[code],function (err,res) {
            if(res[0] !== undefined && res[0] != null) {
                if(res[0]["steam64"] != steam64) {
                    connection.query('SELECT * FROM user WHERE steam64 = ?',[steam64],function (ez,aga) {
                        if(aga[0]["af_codeused"] === undefined || aga[0]["af_codeused"] == null) {
                            console.log("VOR DEM FAILURE SET ")
                            console.log(code)
                            console.log(steam64)
                            connection.query('UPDATE user SET af_codeused = ?, af_coins = ? WHERE steam64 = ?', [code,0.50, steam64], function (err, res2) {
                                connection.query('UPDATE user SET af_amount = ? WHERE af_code = ?', [++res[0]["af_amount"], code], function (err, res) {
                                    socket.emit("finishUseAFCode", "Success, you just got a free $0,50", "success")
                                })
                            })
                        } else {
                            socket.emit("finishUseAFCode","You have used an code already.")
                        }
                    })
                } else {
                    socket.emit("finishUseAFCode","You can't use your own code.")
                }
            } else {
                socket.emit("finishUseAFCode","This code doesn't exist.")
            }
        })
    })

    socket.on("setAFCode",function (code) {
        var steam64 = socket.handshake.session.steamId

        connection.query('SELECT * FROM user WHERE steam64 = ?',[steam64],function (err,erg) {
            connection.query('SELECT * FROM user WHERE af_code = ?',[code],function (err,res) {
                if(res[0] === undefined && res[0] == null) {
                    connection.query('UPDATE user SET af_code = ? WHERE steam64 = ?',[code,steam64],function (err,res) {
                        connection.query('UPDATE user SET af_codeused = ? WHERE af_codeused = ?',[code,erg[0]["af_code"]],function (err,res) {
                            socket.emit("finishSetAFCode","Successfully changed your code.","success")
                        })
                    })
                } else {
                    socket.emit("finishSetAFCode","This code already exists.")
                }
            })
        })
    })

    socket.on("placeBet",function (betamount, ovun, multiplier) {
        var steam64 = socket.handshake.session.steamId

        connection.query("SELECT * FROM user WHERE steam64 = ?",[steam64],function (err,res) {
            if(res[0]["af_coins"] >= betamount) {
                var rolledNumber = Math.random() * 100
                if(ovun == "over") {
                    if(rolledNumber > 100 - (90 / multiplier)) {
                        connection.query("UPDATE user SET af_coins = ? WHERE steam64 = ?",[(res[0]["af_coins"] - betamount) + betamount * multiplier,steam64],function (er,re) {
                            socket.emit("finishedBet","Congratulations you rolled "+rolledNumber+" and won "+betamount * multiplier)
                        })
                    } else {
                        connection.query("UPDATE user SET af_coins = ? WHERE steam64 = ?",[res[0]["af_coins"] - betamount,steam64],function (er,re) {
                            socket.emit("finishedBet","Unfortunatley you rolled "+rolledNumber+" and lost "+betamount)
                        })
                    }
                } else {
                    if(rolledNumber < 90 / multiplier) {
                        connection.query("UPDATE user SET af_coins = ? WHERE steam64 = ?",[(res[0]["af_coins"] - betamount) + betamount * multiplier,steam64],function (er,re) {
                            socket.emit("finishedBet","Congratulations you rolled "+rolledNumber+" and won "+betamount * multiplier)
                        })
                    } else {
                        connection.query("UPDATE user SET af_coins = ? WHERE steam64 = ?",[res[0]["af_coins"] - betamount,steam64],function (er,re) {
                            socket.emit("finishedBet","Unfortunatley you rolled "+rolledNumber+" and lost "+betamount)
                        })
                    }
                }
            } else {
                socket.emit("finishedBet","Unfortunatley you don't have enough balance to do that bet.")
            }
        })

    })

    socket.on("doHammela",function (hash,id) {

        connection.query("SELECT * FROM coinflip WHERE id = ?",[parseInt(id)],function (err,res) {
            var finalseed = res[0]["seed"] + res[0]["player1hash"] + hash;

            var chance = new ChanceJS(finalseed);

            var percantage = chance.floating({min:0, max: 100,fixed: 12});

            connection.query("UPDATE coinflip SET winning_perc = ? WHERE id = ?",[percantage,parseInt(id)],function (err,res) {
                socket.emit("reHammela",percantage);
            })

        })

    })


    //CLOSE SETUP
    socket.on('disconnect', function () {
        delete socketConnections[socket.handshake.session.steamId];
        totalUsers--;
        io.sockets.emit('updateTotalUsers', totalUsers);
    })


 


 


    //TODO PUT TRADEURL IN SESSION TO DENY QUERY EVERY TIME YOU RELOAD SITE
    if (socket.handshake.session.steamId !== undefined) {
        socket.on('setTradeurl', function (dataz) {
            check_for_tradeurl(socket.handshake.session.steamId, function (data) {
                if (data == true) {
                    changeTradeurl(socket.handshake.session.steamId, dataz, function () {
                        console.log("change tradeurl done");
                    })
                } else {
                    setTradeurl(socket.handshake.session.steamId, dataz, function () {
                        console.log("set tradeurl done");
                    })
                }
            })
        });
        /*
                    socket.on('changeTradeurl', function (data) {
                        changeTradeurl(socket.handshake.session.steamId, data, function () {
                            console.log("set tradeurl done");
                        })
                    });*/
        check_for_tradeurl(socket.handshake.session.steamId, function (data) {
            if (data) {
                console.log("Passet Tradeurl Task");
            } else {
                console.log("Failed Tradeurl Task");
                socket.emit("setTradeurl");
            }
        })

        // CHAT STARTS HERE *************************************************************************

        socket.on('newChatMessage', function (chatMessage) {
            //chatMessage = customFilter.clean(chatMessage); //Don't be an xxxxxx
            connection.query("SELECT * FROM user WHERE steam64 = ?",[socket.handshake.session.steamId],function (err,res) {
                if(res[0]["banned"] == "no") {
                    connection.query('INSERT INTO chat (steam64, steamIcon,steamName,steamProfile,message,status) VALUES (?,?,?,?,?,?)', [socket.handshake.session.steamId, socket.handshake.session.steamAvatarmedium, socket.handshake.session.steamName, socket.handshake.session.steamProfileurl, chatMessage, res[0]["status"]], function (error, results, fields) {

                        if (error) throw error;

                        console.log("New Chat message successfully inserted.");

                        var specialStatus = "";
                        var specialTag = "";
                        switch (res[0]["status"]) {
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

                        var clientsMessageString = '' +
                            '<div class="chat__item">' +
                            '<div class="chat__photo"><a target="_blank" href="'+socket.handshake.session.steamProfileurl+'"><img src="' + socket.handshake.session.steamAvatarmedium + '" alt="Avatar"></a></div>' +
                            '<div class="chat__message">' +
                            '<h5 class="message__author" style="color: ' + specialStatus + '"><a target="_blank" href="'+socket.handshake.session.steamProfileurl+'">'+specialTag + socket.handshake.session.steamName + '</a></h5>' +
                            '<p class="message__text">' + chatMessage + '</p>' +
                            '</div>' +
                            '</div>'

                        var senderMessageString = clientsMessageString; //TODO MAKE CUSTOM MESSAGE
                        //Pass back to sender
                        socket.emit("newChatMessage", senderMessageString);
                        //Pass back to Clientside to Display new Chat message to all users
                        socket.broadcast.emit('newChatMessage', clientsMessageString);
                    })
                } else {
                    socket.emit("newBannedMessage");
                }
            });
        })

        // CHAT ENDS HERE *************************************************************************


        socket.on('loadCoinflipWindow', function () {
            itemManager.getItemList(socket.handshake.session.steamId, function (data) {
                socket.emit("coinflipItemContent", data);
            });
        })
        socket.on('sendCoinflipInformations', function (data) {
            connection.query('SELECT * FROM `coinflip` WHERE `id` = ?', [data], function (error, results, fields) {
                socket.emit("coinflipInformations", results[0]);
            });
        })
        socket.on('joinCoinflip', function (items, coinflipId) {
            getTradeurl(socket.handshake.session.steamId, function (tradeurl) {
                console.log(tradeurl);
                itemManager.sendJoinTrade(socket.handshake.session.steamId, items, tradeurl, coinflipId, socket.handshake.session.steamName, socket.handshake.session.steamAvatar, socket.handshake.session.steamProfileurl, function (data) { //TODO PASS USERNAME AND USERICON HERE
                    socket.emit("tradesendJoin", data);
                })
            });
        })
        socket.on('loadJoinItems', function (dataz) {
            itemManager.getItemList(socket.handshake.session.steamId, function (data) {
                connection.query('SELECT * FROM `coinflip` WHERE `id` = ?', [parseInt(dataz)], function (error, results, fields) {
                    socket.emit("joinCoinflipWindowData", [data, results[0]["value"], results[0]["site_chosen"], results[0]["id"]]);
                })
            });
        })
        socket.on('giveItemsBack', function () {
            itemManager.giveItemsBack();
        })
        socket.on('createCoinflip', function (items, site) {
            getTradeurl(socket.handshake.session.steamId, function (tradeurl) {
                console.log(tradeurl);
                itemManager.sendTrade(socket.handshake.session.steamId, items, tradeurl, site, socket.handshake.session.steamName, socket.handshake.session.steamAvatar, socket.handshake.session.steamProfileurl, function (data) { //TODO PASS USERNAME AND USERICON HERE
                    socket.emit("tradesend", data);
                })
            });
        })
    } else {
        console.log("not logged in");
    }
});

function getTradeurl(steam64, callback) {
    connection.query('SELECT tradelink FROM user WHERE steam64 = ?', [steam64], function (error, results, fields) {
        if (error) console.log("error");

        if(results[0] !== undefined && results[0] != null) {
            callback(results[0]["tradelink"]);
        } else {
            callback("fail")
        }

    });
}

function check_for_tradeurl(steamid, callback) {
    var result = false;
    connection.query('SELECT * FROM user WHERE steam64 = ?', [steamid], function (error, results, fields) {
        if (error) console.log("error");
        if (results[0]["tradelink"] === undefined || results[0]["tradelink"] === null) {
        } else {
            result = true;
        }
        callback(result);
    });
};

function setTradeurl(steamid, tradeurl, callback) {
    console.log(steamid);
    connection.query('UPDATE user SET tradelink = ? WHERE steam64 = ?', [tradeurl, steamid], function (error, results, fields) {
        if (error) throw error;
        callback();
    });
}

function changeTradeurl(steamid, tradeurl, callback) {
    console.log(steamid);
    connection.query('UPDATE user SET tradelink = ? WHERE steam64 = ?', [tradeurl, steamid], function (error, results, fields) {
        if (error) throw error;
        callback();
    });
}
