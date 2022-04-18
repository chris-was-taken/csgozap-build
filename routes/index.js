var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.session.steamId) {
      return res.redirect('/coinflip');
    }
    res.render('index');
});

module.exports = router;
