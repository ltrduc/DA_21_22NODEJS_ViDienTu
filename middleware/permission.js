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

// module.exports.AccountDisabled = (req, res, next) => {
//     if (req.session.user.activate.account_disabled == 1) {
//         req.flash('error', 'Tài khoản này đã bị vô hiệu hóa, vui lòng liên hệ tổng đài 18001008!');
//         return res.redirect('/auth/logout');
//     }
//     next();
// }

// module.exports.AccountBlocked = (req, res, next) => {
//     if (req.session.user.activate.account_blocked == 0) {
//         return res.redirect('/');
//     }
//     next();
// }