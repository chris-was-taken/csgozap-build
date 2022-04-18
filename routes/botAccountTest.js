/*
var express = require('express');
var router = express.Router();
var http = require('http');
var bodyParser = require('body-parser');
var SteamUser = require('steam-user');
var SteamCommunity = require('steamcommunity');
var SteamTotp = require('steam-totp');
var TradeOfferManager = require('steam-tradeoffer-manager'); // use require('steam-tradeoffer-manager') in production
var fs = require('fs');
var itemsList = [];
var requestify = require('requestify');
var request = require("request");

var client = new SteamUser();
var manager = new TradeOfferManager({
    "steam": client, // Polling every 30 seconds is fine since we get notifications from Steam
    "domain": "csgozap.com", // Our domain is example.com
    "language": "en", // We want English item descriptions
    "pollInterval": "3000"
});
var community = new SteamCommunity();

// Steam logon options
var logOnOptions = {
    "accountName": "ioagvnoighn",
    "password": "!OUdaOJGNg!?",
    "twoFactorCode": SteamTotp.getAuthCode("W+AjQXY99PJxMZgSOIWPnJxwzzI=")
};

/!*if (fs.existsSync('polldata.json')) {
    manager.pollData = JSON.parse(fs.readFileSync('polldata.json'));
}*!/

client.logOn(logOnOptions);

router.use(bodyParser.json());

router.use(bodyParser.urlencoded({
    extended: true
}));

router.get('/', function(req, res, next) {
    console.log(SteamTotp.getAuthCode("W+AjQXY99PJxMZgSOIWPnJxwzzI="));
    console.log("peter pan ist gott");
    /!*client.getSteamGuardDetails(function (data,data2,data3,data4,data5,data6,data7) {
        console.log(data);
        console.log(data2);
        console.log(data3);
        console.log(data4);
        console.log(data5);
        console.log(data6);
        console.log(data7);
    });*!/
    var steamID = "76561198121509831";

    /!*var itemsToSend = [];
    itemsToSend.push({
        "routerid": 730,
        "contextid": 2,
        "amount": 1,
        "assetid": "9877946399"
    })
    itemsToSend = JSON.stringify(itemsToSend);
*!/
    console.log("for erro");
    sendTrade(null,"bla",function (data) {
       console.log("in tradero");
   })
});


/!*router.post("/doTrade", function (req,res) {
 console.log(req.tradeUrl);
 console.log(req.data);
 res.json({ a: 1 });
 });*!/


router.get("/giveitemsback" , function (game) {
    manager.getInventoryContents(730, 2, true, function(err, inventory) {
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
        offer.send(function(err, status) {
            if (err) {
                console.log(err);
                return;
            }

            if (status == 'pending') {
                // We need to confirm it
                console.log(`Offer #${offer.id} sent, but requires confirmation`);
                community.acceptConfirmationForObject("VGCRgK0LJT8J0q8E/eaCyVm3B1c=", offer.id, function(err) { //TODO SET ENV VARIABLES FOR IDENTIY AND AUTH SECRET
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
});

router.get("/getItems", function (req,res) {
    var steamID = "76561198088051125";
    manager.getUserInventoryContents(steamID, 730, 2, true, function (err, inventory) {
            console.log(inventory);
            console.log("after peter");
            if (err) {
                console.log(err);
                return;
            }

            if (inventory.length == 0) {
                // Inventory empty
                console.log("CS:GO inventory is empty");
                //  return;
            }
            var tradeText = "Offer for Coinflip Round start"; //TODO ADD COINFLIP ID
            /!* Must look like
             {
             "routerid": 730,
             "contextid": 2,
             "amount": 1,
             "assetid": "1627590398"
             }
             *!/

            // Create and send the offer
            // Lars @Test https://steamcommunity.com/tradeoffer/new/?partner=213098963&token=NiaNk9Yh
            //Crispy      https://steamcommunity.com/tradeoffer/new/?partner=161244103&token=ILQM3w-_
            console.log("for errorr2");
            var offer = manager.createOffer("https://steamcommunity.com/tradeoffer/new/?partner=127785397&token=0544ma3Q");
            console.log("for errorr3");
            var min = 0;
            var max = inventory.length;
            var x = Math.floor((Math.random() * (max - min)) + min);
            console.log(x);
            offer.addTheirItem(inventory[x]);
            console.log("for errorr4");
            offer.setMessage(tradeText);
            offer.send(function (err, status) {
                var response = "";
                if (err) {
                    console.log(err);
                   // callback(err);
                }
                if (status == 'pending') {
                    console.log(`Offer #${offer.id} sent, but requires confirmation`);
                    community.acceptConfirmationForObject("VGCRgK0LJT8J0q8E/eaCyVm3B1c=", offer.id, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(offer);

                            console.log("Offer confirmed");
                            //callback("https://steamcommunity.com/tradeoffer/"+offer.id+"/");
                        }
                    });
                } else {
                    console.log(`Offer #${offer.id} sent successfully`);
                    //callback("https://steamcommunity.com/tradeoffer/"+offer.id+"/");
                }
            });

            /!*console.log("Found " + inventory.length + " CS:GO items");
            for (var i = 0; i < inventory.length; i++) {
             getItemprice(inventory[i], function (data) {
             console.log("inv length = "+inventory.length);
             console.log("index = "+i);
             console.log("itemprice finished "+data);
             itemsList.push(inventory[i]);
             if (i == inventory.length-1) {
             console.log("vor item list sendd");
             res.send(itemsList);
             }
             })
             }
           inventory.forEach(function (currentValue,index) {
                getItemprice(currentValue, function (data) {
                    console.log(data);
                    itemsList.push(currentValue,JSON.parse(data)["average_price"]);
                    if (itemsList.length == inventory.length * 2) {
                        res.send(itemsList);
                    }
                })
            });*!/
            console.log("vor res send");
            //res.send(itemsList);
         //  itemsList = [];
    });

});

router.post("/getallcoinflips", function (req,res) {
    var results = [];
    pg.connect(connectionString, (err, client, done) => {
        if (err) {
            done();
            console.log(err);
            res.send(err);
        }
        var query = client.query("SELECT * FROM game WHERE complete = $1 AND offerstatus = $2", [false,true]);//, [data.steamid]);
        query.on('row', (row) => {
            results.push(row);
        });
        query.on('end', () => {
            done();
            res.send(results);
        });
    });
});

function getItemprice(items,callback) {
    console.log("in getitemprice with item    ------>     "+'http://csgobackpack.net/api/GetItemPrice/id='+items["market_hash_name"])
    requestify.get('http://csgobackpack.net/api/GetItemPrice/?currency=USD&id='+items["market_hash_name"])
        .then(function(response) {
                // Get the response body (JSON parsed or jQuery object for XMLs)
                callback(response.getBody());
            }
        );
}

function sendTrade(items,tradeurl,callback) {
    var tradeText = "This Trade is automatically send by CSGOZAP.com";
    /!* Must look like
     {
     "routerid": 730,
     "contextid": 2,
     "amount": 1,
     "assetid": "1627590398"
     }
     *!/

    // Create and send the offer
    // Lars @Test https://steamcommunity.com/tradeoffer/new/?partner=213098963&token=NiaNk9Yh
    //Crispy https://steamcommunity.com/tradeoffer/new/?partner=161244103&token=ILQM3w-_
    var offer = manager.createOffer("https://steamcommunity.com/tradeoffer/new/?partner=161244103&token=ILQM3w-_");
    offer.addTheirItem(     {
        "routerid": 730,
        "contextid": 2,
        "amount": 1,
        "assetid": "10034368092"
    });
    console.log("for errorr4");
    offer.setMessage(tradeText);
    offer.send(function (err, status) {
        var response = "";
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
                    callback("https://steamcommunity.com/tradeoffer/"+offer.id+"/");
                }
            });
        } else {
            console.log(`Offer #${offer.id} sent successfully`);
            callback("https://steamcommunity.com/tradeoffer/"+offer.id+"/");
        }
    });
}

client.on('loggedOn', function () {
    //Is used when new Account activates Two Factor and gives Back The 2 Needed secret key
    /!*client.enableTwoFactor(function (response) {
     console.log(response);
     console.log( JSON.stringify(response));
     });*!/
    //Mit secret keys 2 factor aktivieren
    /!*client.finalizeTwoFactor("cCJU52pZ/mdW+IOwTVN9xaBTvLc=","91986",function (err) {
     console.log(err);
     });*!/
    console.log("Logged into Steam");
});

client.on('webSession', function (sessionID, cookies) {
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


manager.on('sentOfferChanged', function(offer, oldState) {
    console.log(`Offer #${offer.id} changed: ${TradeOfferManager.ETradeOfferState[oldState]} -> ${TradeOfferManager.ETradeOfferState[offer.state]}`);
    if (TradeOfferManager.ETradeOfferState[offer.state].indexOf("Accepted") !== -1) {
        updateofferstatus(offer.id,function (data) {
            if (data.indexOf("successful") !== -1) {
                request.post(
                    'https://csgozap.com/openCoinflip',
                    function (error) {
                        if (!error) {
                            console.log("coinflip send to thingy");
                        } else {
                            console.log("coinflip not send to thingy ma chicks");
                        }
                        //callback(body);
                    }
                );
            }
            //CURRENTLY HERE TODO SEND SOMEHOW TO NORMAL SERVER SO I CAN DO SOME SOCKET STUFF THERE
        });
    }

});

manager.on('pollData', function(pollData) {
    fs.writeFile('polldata.json', JSON.stringify(pollData), function() {});
});



var path = require('path');




router.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

router.get("/",function (req,res)  {
    // res.redirect("www.csgozap.com");
    res.render("index");
});

// error handler
router.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.router.get('env') === 'development' ? err : {};

    // render the error page
    res.render("error");
    //res.redirect("www.csgozap.com");
});

module.exports = router;
*/
