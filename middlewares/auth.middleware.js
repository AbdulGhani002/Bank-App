const jwt = require("jsonwebtoken");
const db = require("../data/database");
const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
            if (err) {
                console.error(err.message);
                res.redirect("/login");
            } else {
                console.log(decodedToken);
                next();
            }
        });
    } else {
        res.redirect("/login");
    }
}
const checkUser = async (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        try {
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decodedToken); 
            const user = await db.getDb().collection("Users").findOne({ 
                _id: decodedToken.id });
                if(!user){
                    res.redirect("/login");
                    next();
                }
            if (user) {
                const account = await db.getDb().collection("Accounts").findOne({ accountId: user.userId });
                if(!account){
                    res.redirect("/login");
                    next();
                }
                res.locals.user = user;
                res.locals.account = account;
                next();
            } else {
                res.locals.user = null;
                res.locals.account = null;
                next();
            }
        } catch (err) {
            console.error(err.message);
            res.locals.user = null;
            res.locals.account = null;
            next();
        }
    } else {
        res.locals.user = null;
        res.locals.account = null;
        res.redirect("/login");
    }
    next();
}

module.exports = {requireAuth, checkUser}