var express = require('express');
var router = express.Router();
var apicall = require('./apicalls');
var databaseManager = require("./databaseManager");
var xss = require("xss");

module.exports = router;
router.use(require('cookie-parser')());

var passport = require('passport');
router.use(passport.initialize());
router.use(passport.session());
var OpenIDStrategy = require('passport-openid').Strategy;

var SteamStrategy = new OpenIDStrategy({
        providerURL: 'http://steamcommunity.com/openid',
        stateless: true,
        returnURL: 'https://csgozap.com/auth/return',
        realm: 'https://csgozap.com/',
    },
    function(identifier, done) {
        process.nextTick(function () {
            var user = {
                identifier: identifier,
                steamId: identifier.match(/\d+$/)[0]
            };
            return done(null, user);
        });
    });

passport.use(SteamStrategy);
passport.serializeUser(function(user, done) {
    done(null, user.identifier);
});
passport.deserializeUser(function(identifier, done) {
    done(null, {
        identifier: identifier,
        steamId: identifier.match(/\d+$/)[0]
    });
});
router.post('/login', passport.authenticate('openid'));
//router.get('/login/developer/cj', passport.authenticate('openid'));
router.get('/return', passport.authenticate('openid'),
    function(request, response) {
        if (request.user) { // && ( request.user.steamId == "76561198121509831" || request.user.steamId == "76561198088051125")
            request.session.steamId = request.user.steamId;
            apicall.steamapi(request.session.steamId, request, response, function (items) {
                var parsedData = JSON.parse(items);
                var basepath = parsedData.response.players[0];
                console.log(basepath);
                //var name = xss(basepath['personaname']);
                var name = basepath['personaname'].replace(/(<([^>]+)>)/ig, "");
                if(name.toLowerCase().includes("csgozap.com")) {
                } else {
                    var urlRegex =/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig;
                    name = name.replace(urlRegex,"*");
                }

                //name = name.replace('<',"&lt;");
                //name = name.replace('>',"&gt;");
                request.session.steamName = name;
                request.session.steamProfileurl = basepath['profileurl'];
                console.log(request.session.steamProfileurl);
                console.log(basepath['profileurl']);
                console.log(parsedData.response.players[0]['profileurl']);
                request.session.steamAvatar = basepath['avatar'];
                request.session.steamAvatarmedium = basepath['avatarmedium'];
                request.session.steamAvatarfull = basepath['avatarfull'];
                console.log(basepath['avatarfull'])

                //TODO ALSO NEED TO CHECK FOR IF USER ALREAD EXIST
                databaseManager.insertNewUser(request.session.steamId , function () {
                    response.redirect('/coinflip');
                });
            });
        } else {
            console.log("klappt ned so ganzt");
            response.redirect('/');
        }
    });

router.get('/notlisted/logout', function (request, response) {
    request.logout();
    request.session.destroy();
    response.redirect('/');
});

router.post('/logout', function(request, response) {
    request.logout();
    request.session.destroy();
    response.redirect('/');
});
