module.exports.Admin = (req, res, next) => {
    if (req.session.user.role == 0) {
        next();
    }
    return res.redirect('/');
}

module.exports.User = (req, res, next) => {
    if (req.session.user.role == 0 || req.session.user.role == 1) {
        next();
    }
    return res.redirect('/auth/logout');
}