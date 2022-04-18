var express = require('express');
var router = express.Router();
var dbManager = require('./databaseManager')
var shopBot = require("./shopBotHandler")

router.get('/', function(req, res, next) {
    if(!req.session.steamId) {
        return res.redirect('/');
    } else {
        console.log("befoire calling da inv0")
        shopBot.loadBotInventory(function (inventory) {
            console.log("afta dem inv call")
            dbManager.getAffiliateInfos(req.session.steamId,function (infoArr) {

                var level = 1;
                if(infoArr["amount"] >= 3000) {
                    level = 4
                } else if (infoArr["amount"] >= 1000) {
                    level = 3
                } else if (infoArr["amount"] >= 500) {
                    level = 2
                }

                res.render('testaff', {
                    "af": {
                        "code": infoArr["code"],
                        "coins": infoArr["coins"].toFixed(2),
                        "amount": infoArr["amount"],
                        "totalearning": infoArr["totalearning"].toFixed(2),
                        "collected": infoArr["collected"].toFixed(2),
                        "betamount": infoArr["betamount"].toFixed(2),
                        "level": level,
                        "available": (infoArr["totalearning"] - infoArr["collected"]).toFixed(2)
                    },
                    "shopItems" : JSON.stringify(inventory)
                })
            })
        })
    }
});



module.exports = router;
