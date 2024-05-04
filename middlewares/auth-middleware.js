const jwt = require("jsonwebtoken");
const db = require("../data/database");
const requireAuth = (req, res, next) => {
  const userToken = req.cookies.jwtUserId;
  const accountToken = req.cookies.jwtAccountId;
  if (userToken && accountToken) {
    verifyToken(userToken);
    verifyToken(accountToken);
    next();
  } else {
    res.redirect("/login");
  }
};
const verifyToken = (token) => {
  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      console.log(err.message);
      res.redirect("/login");
    } else {
      console.log(decodedToken);
    }
  });
};
const checkUser = (req, res, next) => {
  const userToken = req.cookies.jwtUserId;
  if (userToken) {
    jwt.verify(userToken, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.locals.user = null;
        next();
      } else {
        console.log(decodedToken);
        const user = await db.getDb().collection("Users").findOne({_id: decodedToken.id});
        res.locals.user = user;
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};
const checkAccount = (req, res, next) => {
  const accountToken = req.cookies.jwtAccountId;
  if (accountToken) {
    jwt.verify(
      accountToken,
      process.env.JWT_SECRET,
      async (err, decodedToken) => {
        if (err) {
          console.log(err.message);
          res.locals.account = null;
          next();
        } else {
          console.log(decodedToken);
          const account = await db.getDb().collection("Accounts").findOne({_id: decodedToken.id});
          res.locals.account = account;
          next();
        }
      }
    );
  } else {
    res.locals.account = null;
    next();
  }
};
module.exports = { requireAuth, checkUser, checkAccount };
