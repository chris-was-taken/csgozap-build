var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "YOUR USERNAME",
    password: "YOUR PASSWORD",
    socketPath: '/var/run/mysqld/mysqld.sock' //if incorrect find out the path of YOUR .sock
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    con.query("CREATE DATABASE main", function (err, result) {
        if (err) throw err;
        console.log("Database 'main' created");
		
		var sql = "CREATE TABLE coinflip (steam64 VARCHAR(255), value VARCHAR(255), trade_accepted int, site_chosen int, tradeurl VARCHAR(255), finished int, winner VARCHAR(20), id int NOT NULL, winning_perc VARCHAR(60), steamName VARCHAR(255),"+
		+"steamAvatar VARCHAR(255), steamUrl VARCHAR(255), firstofferid VARCHAR(255), secondofferid VARCHAR(255), steam64v2 VARCHAR(255), valuev2 VARCHAR(255), trade_acceptedv2 int, tradeurlv2 VARCHAR(255), steamNamev2 VARCHAR(255), steamAvatarv2 VARCHAR(255), "+
		+"steamUrlv2 VARCHAR(255), site_chosenv2 int, winofferid VARCHAR(255), winofferid_accepted int, joinAttemptStart VARCHAR(255), offerAcceptedStart VARCHAR(255), bot_id int, firstOfferHash VARCHAR(255), secondOfferHash VARCHAR(255), player1hash"+
		+" VARCHAR(255), player2hash VARCHAR(255), serverhash VARCHAR(255), createdDate VARCHAR(255), createSendBack int DEFAULT 0, seed VARCHAR(255), secret VARCHAR(255))";
		con.query(sql, function (err, result) {
			if (err) throw err;
			console.log("Table 'coinflip' created");
			
			sql = "CREATE TABLE items (assetid VARCHAR(255), iconurl VARCHAR(255), market_hash_name VARCHAR(255), price VARCHAR(255), coinflip_id int, mode int, taxed int NOT NULL DEFAULT 0, taxed_and_send VARCHAR(255) DEFAULT 'no')";
			con.query(sql, function (err, result) {
				if (err) throw err;
				console.log("Table 'items' created");
			
				sql = "CREATE TABLE user (steam64 VARCHAR(255), tradelink VARCHAR(255), totalWon VARCHAR(255) DEFAULT '0.00', totalLost VARCHAR(255) DEFAULT '0.00', lastInventoryRefresh VARCHAR(255), id int NOT NULL, status int DEFAULT 1, banned VARCHAR(255) DEFAULT 'no')";
				con.query(sql, function (err, result) {
					if (err) throw err;
					console.log("Table 'user' created");
				
					sql = "CREATE TABLE chat (steam64 VARCHAR(255), steamIcon VARCHAR(255), steamName VARCHAR(255), steamProfile VARCHAR(255), message VARCHAR(255), id int NOT NULL, status int DEFAULT 1)";
					con.query(sql, function (err, result) {
						if (err) throw err;
						console.log("Table 'chat' created");
				
						sql = "CREATE TABLE prices (hashname VARCHAR(255), unstable int, price VARCHAR(255))";
						con.query(sql, function (err, result) {
							if (err) throw err;
							console.log("Table 'prices' created");
				
						})
				
					})
				
				})
			
			});
			
		});
		
    });
	
});