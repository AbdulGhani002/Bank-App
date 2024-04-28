const session = require('express-session');
const sessionMiddleware = (req, res, next) => {
    if (req.user) {
        req.session.user = req.user;
    }
    console.log(req.session.user)
    next();
};
module.exports = sessionMiddleware;