var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    if(!req.session.steamId || req.session.steamId !== "76561198121509831") {
        return res.redirect('/');
    }
    res.render('game', {"steam": {"link": req.session.steamProfileurl,"id": req.session.steamId,"name": req.session.steamName,"avatar": req.session.steamAvatar}});
});

module.exports = router;
