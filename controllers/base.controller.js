const CryptoJS =require('crypto-js');
const db = require('../data/database');
const getIndex = (req, res) => {
  res.render("index");
};

const getHome =async (req, res) => {
  const encryptedExistingUserId = JSON.parse(req.cookies.existingUserId);
  const encryptedExistingAccountId = JSON.parse(req.cookies.existingAccountId);
  const existingUserId = CryptoJS.AES.decrypt(encryptedExistingUserId, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);
  const existingAccountId = CryptoJS.AES.decrypt(encryptedExistingAccountId, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);
  const existingUser = await db.getDb().collection('Users').findOne({userId: existingUserId});
  const existingAccount = await db.getDb().collection('Accounts').findOne({accountId:existingAccountId});
  res.render("customer/home-page", {
    userData: existingUser,
    accountDetails: existingAccount,
  });
};
module.exports = {
  getIndex: getIndex,
  getHome:getHome
};
