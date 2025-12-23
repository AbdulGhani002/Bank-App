const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const db = require("../data/database");
const { getUserAccountStatus } = require("../utils/verification");

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

const requireAuth = async (req, res, next) => {
  if (res.locals.user) {
    // Check if user's account is locked
    const accountStatus = await getUserAccountStatus(res.locals.user._id);
    if (accountStatus.status === 'locked') {
      return res.status(403).redirect(`/account-locked?message=${encodeURIComponent(accountStatus.message)}`);
    }
    next();
  } else {
    res.redirect("/login?error=Login%20to%20continue");
  }
};

module.exports = { requireAuth, checkUser };
