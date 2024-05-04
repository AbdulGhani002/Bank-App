const jwt = require("jsonwebtoken");
const db = require("../data/database");
const requireAuth = (req, res, next) => {
  const userToken = req.cookies.jwt;
  if (userToken) {
    jwt.verify(userToken, process.env.JWT_SECRET, (err, decodedToken) => {
      if (!err) {
        next();
      } else {
        console.log(err);
        res.redirect("/login?error=Login First.");
      }
    });
  } else {
    res.redirect("/login?error=Invalid email or password. Please try again.");
  }
};
const checkUser = (req, res, next) => {
  const userToken = req.cookies.jwt;
  if (userToken) {
    jwt.verify(userToken, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.locals.user = null;
        next();
      } else {
        console.log(decodedToken);
        const user = await db
          .getDb()
          .collection("Users")
          .findOne({ _id: decodedToken.id });
        res.locals.user = user;
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};

module.exports = { requireAuth, checkUser };
