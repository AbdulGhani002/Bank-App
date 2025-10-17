const db = require("../data/database");

const getIndex = (req, res) => {
  if (res.locals.user) {
    return res.redirect("/home");
  }
  res.render("index", {
    userData: null,
    accountDetails: null,
  });
};

const getHome = async (req, res) => {
  const userData = res.locals.user;
  if (!userData) {
    return res.redirect("/login");
  }
  // Strictly find account by the logged-in user's ObjectId to avoid mismatches
  const accountDetails = await db
    .getDb()
    .collection("Accounts")
    .findOne({ userId: userData._id });

  res.render("customer/home-page", {
    userData: userData,
    accountDetails: accountDetails,
  });
};

module.exports = {
  getIndex: getIndex,
  getHome: getHome,
};
