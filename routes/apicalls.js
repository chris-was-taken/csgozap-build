var https = require('https');
var request = require('request');

var steamapi = function (steamid, req, res, callback) {
    var options = {
        host: "api.steampowered.com",
        port: 443,
        path: '/ISteamUser/GetPlayerSummaries/v0002/?key=74C1E93DA3D6A5E45C6724D9EE9969F2&steamids='+steamid,
        method: 'GET'
    };

    var reqGet = https.request(options, function(res) {
        res.on('data', function(d) {
            callback(d);
        });
    });
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });
};

module.exports = {
    steamapi: steamapi
};