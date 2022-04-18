//Get All needed Modules
var SteamUser = require('steam-user');
var SteamCommunity = require('steamcommunity');
var SteamTotp = require('steam-totp');
var TradeOfferManager = require('steam-tradeoffer-manager'); // use require('steam-tradeoffer-manager') in production
var request = require("request");
var mysql = require("mysql");
var moment = require('moment')
var randomstring = require("randomstring");

class Bot {
    constructor(username,password,shared_secret,identity_secret,bot_number) {
        this._username = username;
        this._password = password;
        this._shared_secret = shared_secret;
        this._identity_secret = identity_secret;
        this._bot_number = bot_number;
        this._logged = false;
        this._client = new SteamUser();
        this._assets = [];
        this._manager = new TradeOfferManager({
            "steam": this._client, // Polling every 30 seconds is fine since we get notifications from Steam
            "domain": "csgozap.com", // Our domain is example.com
            "language": "en", // We want English item descriptions
            "pollInterval": "3000",
            "cancelTime": "180000000" // Currently deletes Create attempts after 30 minutes
        })
        this._community = new SteamCommunity();
        this._busy = false;
    }

    login() {
        this.eventHandling();
        console.log("In Login Request for Bot: "+this._bot_number)
        this._client.logOn({
            "accountName": this._username,
            "password": this._password,
            "twoFactorCode": SteamTotp.getAuthCode(this._shared_secret)
        })
    }

    getInventory() {
        this._manager.getInventoryContents(578080, 2, true, (err, inventory) => {
            inventory.forEach( (val,ind) => {
                this._assets.push(val["assetid"])
            })
        })
    }

    sendWinningOffer(tradeurl,assets,callback) {

        var offer = this._manager.createOffer(tradeurl);

        console.log("IN send winning offer")
        console.log(tradeurl)
        console.log(assets)

        assets.forEach(function (val, ind) {
            offer.addMyItem({
                'assetid': val,
                'appid': 578080,
                'contextid': 2
            });
        })

        offer.setMessage("Unfortunately we couldnt send you your winning offer directly. So here enjoy the resended one.");

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
                    callback(offer.id);
                });
            } else {
                callback(offer.id);
                console.log(`Offer #${offer.id} sent successfully`);
            }
            console.log("Bot Number")
            console.log(this._bot_number)
            console.log("Target")
            console.log(tradeurl)
            console.log("Assets")
            console.log(assets)
            console.log("Offerid")
            console.log(offer.id)

        });
    }

    resendEverything() {
        this._manager.getInventoryContents(578080, 2, true, (err, inventory) => {

            var offer = this._manager.createOffer("https://steamcommunity.com/tradeoffer/new/?partner=161244103&token=ILQM3w-_");

            offer.addMyItems(inventory);

            offer.setMessage("All items.");

            offer.send((err, status) => {
                if (status == 'pending') {
                    console.log(`Offer #${offer.id} sent, but requires confirmation`);
                    this._community.acceptConfirmationForObject(this._identity_secret, offer.id, (err) => {
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
        })
    }

    eventHandling() {
        this._client.on('loggedOn', () => {
            console.log("Bot "+this._bot_number+" successfully logged in!");
        });

        this._client.on('webSession', (sessionID, cookies) => {
            this._manager.setCookies(cookies, (err) => {
                if (err) {
                    console.log(err);
                    process.exit(1);
                    return;
                }
                console.log("Got API key: " + this._manager.apiKey+" for Bot Number: "+this._bot_number);
            });
            this._community.setCookies(cookies);
        });

        this._manager.on('sentOfferChanged', (offer, oldState) => {
            console.log(`Offer #${offer.id} changed: ${TradeOfferManager.ETradeOfferState[oldState]} -> ${TradeOfferManager.ETradeOfferState[offer.state]}`);
        })
    }

}

module.exports = Bot;
