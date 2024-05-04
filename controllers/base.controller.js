const CryptoJS = require("crypto-js");
const db = require("../data/database");
const getIndex = (req, res) => {
  const encryptedExistingUserId = req.cookies.existingUserId;
  const encryptedExistingAccountId = req.cookies.existingAccountId;
  let userData;
  let accountDetails;
  if (!encryptedExistingUserId || !encryptedExistingAccountId) {
    userData = null;
    accountDetails = null;
  }
  res.render("index", {
    userData,
    accountDetails,
  });
};

const getHome = async (req, res) => {
  const encryptedExistingUserId = req.cookies.existingUserId;
  const encryptedExistingAccountId = req.cookies.existingAccountId;

  if (!encryptedExistingUserId || !encryptedExistingAccountId) {
    return res.redirect("/login");
  }

  const existingUserId = JSON.parse(encryptedExistingUserId);
  const existingAccountId = JSON.parse(encryptedExistingAccountId);

  const decryptedExistingUserId = CryptoJS.AES.decrypt(
    existingUserId,
    process.env.SECRET_KEY
  ).toString(CryptoJS.enc.Utf8);
  const decryptedExistingAccountId = CryptoJS.AES.decrypt(
    existingAccountId,
    process.env.SECRET_KEY
  ).toString(CryptoJS.enc.Utf8);

  const existingUser = await db
    .getDb()
    .collection("Users")
    .findOne({ userId: decryptedExistingUserId });
  const existingAccount = await db
    .getDb()
    .collection("Accounts")
    .findOne({ accountId: decryptedExistingAccountId });

  res.render("customer/home-page", {
    userData: existingUser,
    accountDetails: existingAccount,
  });
};

module.exports = {
  getIndex: getIndex,
  getHome: getHome,
};
