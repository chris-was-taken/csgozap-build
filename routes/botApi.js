var express = require('express');
var router = express.Router();
var http = require('http');



router.get('/', function(req, res, next) {
    if(!req.session.steamId || req.session.steamId !== "76561198121509831") {
        //return res.redirect('/');
        console.log("nap");
    }
    console.log("up");
    //res.render('game', {"steam": {"link": req.session.steamProfileurl,"id": req.session.steamId,"name": req.session.steamName,"avatar": req.session.steamAvatar}});
});

router.post('/sendOffer', function(req, res, next) {



    var options = {
        host: "37.228.134.147",
        port: 3000,
        path: '/doTrade',
        method: 'POST',
        tradeUrl: "Tawegfatwgtawtgawgawgawg"
    };

    http.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
        });
    }).end();
    console.log("dada");
    res.redirect("/game");
});

module.exports = router;
