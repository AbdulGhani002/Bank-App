const CryptoJS = require("crypto-js");
const db = require("../data/database");
const User = require("../models/user.model");
const Account = require("../models/account.model");
const getUserId = (req) => {
  const encryptedExistingUserId = req.cookies.existingUserId;
  if (!encryptedExistingUserId) {
    return null;
  }
  return JSON.parse(encryptedExistingUserId);
};
const getAccountId = (req) => {
  const encryptedExistingAccountId = req.cookies.existingAccountId;
  if (!encryptedExistingAccountId) {
    return null;
  }
  return JSON.parse(encryptedExistingAccountId);
};
const decrypt = (id) => {
  return CryptoJS.AES.decrypt(id, process.env.SECRET_KEY).toString(
    CryptoJS.enc.Utf8
  );
};
const getIndex = (req, res) => {
  res.render("index", {
    userData: null,
    accountDetails: null,
  });
};

const getHome = async (req, res) => {
  const existingUserId = getUserId(req);
  const existingAccountId = getAccountId(req);

  if (!existingUserId || !existingAccountId) {
    return res.redirect("/login");
  }

  const decryptedExistingUserId = decrypt(existingUserId);
  const decryptedExistingAccountId = decrypt(existingAccountId);

  const existingUser = await User.getUserById(decryptedExistingUserId);
  const existingAccount = await Account.getAccountById(
    decryptedExistingAccountId
  );

  res.render("customer/home-page", {
    userData: existingUser,
    accountDetails: existingAccount,
  });
};

module.exports = {
  getIndex: getIndex,
  getHome: getHome,
};
