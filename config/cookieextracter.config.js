const CryptoJS = require("crypto-js");
function encryptId(id) {
  return CryptoJS.AES.encrypt(id, process.env.SECRET_KEY).toString();
}
function getAccountDetails(req) {
  const encryptedExistingAccountId = req.cookies.existingAccountId;
  let accountDetails;
  if (!encryptedExistingAccountId) {
    accountDetails = null;
    res.redirect("/login")
  }
  return accountDetails;
}
function getUserDetails(req) {
  const encryptedExistingUserId = req.cookies.existingUserId;

  let userData;
  if (!encryptedExistingUserId) {
    userData = null;
    res.redirect("/login")
  }
  return userData;
}
function decryptId(id) {
  const parsedId = JSON.parse(id);
  return CryptoJS.AES.decrypt(parsedId, process.env.SECRET_KEY).toString(CryptoJS.enc.Utf8);
}
module.exports = { getAccountDetails, getUserDetails, encryptId,decryptId };
