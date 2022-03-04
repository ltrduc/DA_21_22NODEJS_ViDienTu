const express = require('express');
const router = express.Router();

router.get('/', function (req, res, next) {
    var fullname =  req.session.user.fullname;
    res.send('Xin chào: ' + fullname);
});

module.exports = router;