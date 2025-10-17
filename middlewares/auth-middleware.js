const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const db = require("../data/database");

const checkUser = async (req, res, next) => {
  const userToken = req.cookies.jwt;
  if (userToken) {
    try {
      const decodedToken = jwt.verify(userToken, process.env.JWT_SECRET);
      const user = await db
        .getDb()
        .collection("Users")
        .findOne({ _id: new ObjectId(decodedToken.id) });
      res.locals.user = user;
    } catch (err) {
      console.log(err.message);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
};

const requireAuth = (req, res, next) => {
  if (res.locals.user) {
    next();
  } else {
    res.redirect("/login?error=Login First.");
  }
};

module.exports = { requireAuth, checkUser };
