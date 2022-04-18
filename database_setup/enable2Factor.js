var SteamUser = require('steam-user');
var client = new SteamUser();

var logOnOptions = {
    "accountName": "maokappachino",
    "password": 'Im.Just.Bot312'
};

client.logOn(logOnOptions);

client.on('loggedOn', function () {
    //Is used when new Account activates Two Factor and gives Back The 2 Needed secret key
/*    client.enableTwoFactor(function (response) {
     console.log(response);
     console.log( JSON.stringify(response));
    });*/
    //Mit secret keys 2 factor aktivieren
    client.finalizeTwoFactor("Hk4fC3wH3Ssv+J1AGstADT7uzt4=","42457",function (err) {
        console.log(err);
    });
    console.log("Logged into Steam");
});