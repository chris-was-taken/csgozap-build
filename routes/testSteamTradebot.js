var express = require('express');
var router = express.Router();
var apicall = require('./apicalls');
var fs = require('fs');
var crypto = require('crypto');

var Steam = require('steam');
var SteamWebLogOn = require('steam-weblogon');
var getSteamAPIKey = require('steam-web-api-key');
var SteamTradeOffers = require('steam-tradeoffers'); // change to 'steam-tradeoffers' if not running from the examples subdirectory

var admin = '76561198121509831'; // put your steamid here so the bot can accept your offers

var logOnOptions = {
    account_name: 'csgozap_lovely_guy1',
    password: "!CJ.bOt.beSt?2017"
};

var authCode = 'J4VQ5'; // code received by email

try {
    logOnOptions.sha_sentryfile = getSHA1(fs.readFileSync('sentry'));
} catch (e) {
    if (authCode !== '') {
        logOnOptions.auth_code = authCode;
    }
}

// if we've saved a server list, use it
if (fs.existsSync('servers')) {
    Steam.servers = JSON.parse(fs.readFileSync('servers'));
}

var steamClient = new Steam.SteamClient();
var steamUser = new Steam.SteamUser(steamClient);
var steamFriends = new Steam.SteamFriends(steamClient);
var steamWebLogOn = new SteamWebLogOn(steamClient, steamUser);
var offers = new SteamTradeOffers();

steamClient.connect();
steamClient.on('connected', function() {
    steamUser.logOn(logOnOptions);
});

function offerItems() {
    offers.loadMyInventory({
        appId: 440,
        contextId: 2
    }, function(err, items) {
        var item;
        // picking first tradable item
        for (var i = 0; i < items.length; i++) {
            if (items[i].tradable) {
                item = items[i];
                break;
            }
        }
        // if there is such an item, making an offer with it
        if (item) {
            offers.makeOffer ({
                partnerSteamId: admin,
                itemsFromMe: [
                    {
                        appid: 440,
                        contextid: 2,
                        amount: 1,
                        assetid: item.id
                    }
                ],
                itemsFromThem: [],
                message: 'This is test'
            }, function(err, response) {
                if (err) {
                    throw err;
                }
                console.log(response);
            });
        }
    });
}

steamClient.on('logOnResponse', function(logonResp) {
    if (logonResp.eresult === Steam.EResult.OK) {
        console.log('Logged in!');
        steamFriends.setPersonaState(Steam.EPersonaState.Online);

        steamWebLogOn.webLogOn(function(sessionID, newCookie) {
            getSteamAPIKey({
                sessionID: sessionID,
                webCookie: newCookie
            }, function(err, APIKey) {
                offers.setup({
                    sessionID: sessionID,
                    webCookie: newCookie,
                    APIKey: APIKey
                });
                offerItems();
            });
        });
    }
});

steamClient.on('servers', function(servers) {
    fs.writeFile('servers', JSON.stringify(servers));
});

steamUser.on('updateMachineAuth', function(sentry, callback) {
    fs.writeFileSync('sentry', sentry.bytes);
    callback({ sha_file: getSHA1(sentry.bytes) });
});

function getSHA1(bytes) {
    var shasum = crypto.createHash('sha1');
    shasum.end(bytes);
    return shasum.read();
}

function handleOffers() {
    offers.getOffers({
        get_received_offers: 1,
        active_only: 1,
        time_historical_cutoff: Math.round(Date.now() / 1000)
    }, function(error, body) {
        if (
            body
            && body.response
            && body.response.trade_offers_received
        ) {
            body.response.trade_offers_received.forEach(function(offer) {
                if (offer.trade_offer_state === 2) {
                    if (offer.steamid_other === admin) {
                        offers.acceptOffer({
                            tradeOfferId: offer.tradeofferid,
                            partnerSteamId: offer.steamid_other
                        });
                    } else {
                        offers.declineOffer({tradeOfferId: offer.tradeofferid});
                    }
                }
            });
        }
    });
}

steamUser.on('tradeOffers', function(number) {
    if (number > 0) {
        handleOffers();
    }
});

function getSHA1(bytes) {
    var shasum = crypto.createHash('sha1');
    shasum.end(bytes);
    return shasum.read();
}
/**router.get('/', function(req, res, next) {
    if(!req.session.steamId || req.session.steamId !== "76561198121509831") {
        return res.redirect('/');
    }
    res.render('game', {"steam": {"link": req.session.steamProfileurl,"id": req.session.steamId,"name": req.session.steamName,"avatar": req.session.steamAvatar}});
});*/


module.exports = router;
