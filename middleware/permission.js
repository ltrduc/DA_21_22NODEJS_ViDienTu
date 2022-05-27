module.exports.Admin = (req, res, next) => {
    if (req.session.user.role > 0) {
        return res.redirect('/');
    }
    next();
}

module.exports.User = (req, res, next) => {
    if (req.session.user.role > 1) {
        return res.redirect('/auth/logout');
    }
    next();
}

module.exports.AccountActivated = (req, res, next) => {
    if (req.session.user.activate.account_activated == 0) {
        req.flash('error', 'Tính năng này chỉ dành cho các tài khoản đã được xác minh!');
        return res.redirect('/');
    }
    next();
}