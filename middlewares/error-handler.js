const db = require("../data/database");
const CryptoJS = require("crypto-js");

const handleError = async (err, req, res, next) => {
  console.error(err.stack);
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
  const statusCode = err.statusCode || 500;

  res.status(statusCode).render("shared/500", {
    userData: existingUser,
    accountDetails: existingAccount,
  });
};

module.exports = handleError;
