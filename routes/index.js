var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index');
});

router.post('/', function (req, res, next) {
    var roomid = req.body['roomid'];
    res.redirect('/room/' + roomid);
});

router.get('/room/:roomid', function (req, res, next) {
    res.render('room');
});

module.exports = router;
