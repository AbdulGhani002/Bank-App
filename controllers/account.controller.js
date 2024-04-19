const db = require("../data/database");
const mongodb = require("mongodb");
const ObjectId = mongodb.ObjectId;
const logger = require("../utils/logger");

const getDepositMoney = async (req, res) => {
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
  res.render("customer/make-payments", {
    userData: userData,
    accountDetails: accountDetails,
  });
};
const depositMoney = async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    const userId = req.body.userId;
    const accountId = req.body.accountId;

    const account = await db
      .getDb()
      .collection("Accounts")
      .findOne({ _id: new ObjectId(accountId) });

    if (!account) {
      return res.status(404).send("Account not found");
    }

    const currentBalance = parseFloat(account.balance); 
    const updatedBalance = currentBalance + amount;
    await db
      .getDb()
      .collection("Accounts")
      .updateOne(
        { _id: new ObjectId(accountId) },
        { $set: { balance: updatedBalance } }
      );

    res.redirect("/home?userId=" + userId + "&accountId=" + accountId);
  } catch (error) {
    console.error("Error depositing money:", error);
    res.status(500).send("Internal Server Error");
  }
};
module.exports = {
  getDepositMoney,
  depositMoney,
};
