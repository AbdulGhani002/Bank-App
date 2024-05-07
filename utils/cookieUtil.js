const CryptoJS = require("crypto-js");
const db = require("../data/database");

async function decryptCookies(req) {
  const encryptedExistingUserId = req.cookies.existingUserId;
  const encryptedExistingAccountId = req.cookies.existingAccountId;

  if (!encryptedExistingUserId || !encryptedExistingAccountId) {
    return { userId: null, accountId: null };
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

  return { userId: decryptedExistingUserId, accountId: decryptedExistingAccountId };
}

async function getUserAndAccountDetails(userId, accountId) {
  const existingUser = await db.getDb().collection("Users").findOne({ userId });
  const existingAccount = await db.getDb().collection("Accounts").findOne({ accountId });
  return { existingUser, existingAccount };
}

module.exports = { decryptCookies, getUserAndAccountDetails };
