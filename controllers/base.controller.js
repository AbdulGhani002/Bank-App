const mongodb = require("mongodb");
const db = require("../data/database");
const ObjectId = mongodb.ObjectId;
const getIndex = (req, res) => {
  res.render("index");
};

const getHome = async (req, res) => {
  const userId = req.query.userId;
  const accountId = req.query.accountId;
  const userData = await db
    .getDb()
    .collection("Users")
    .findOne({ _id: new ObjectId(userId) });
  if (!userData) {
    res.redirect("/login");
  }
  const accountDetails = await db
    .getDb()
    .collection("Accounts")
    .findOne({ _id: new ObjectId(accountId) });
  if (!accountDetails) {
    res.redirect("/login");
  }
  res.render("customer/home-page", {
    userData: userData,
    accountDetails: accountDetails,
    req: req,
  });
};

module.exports = {
  getIndex: getIndex,
  getHome: getHome,
};
