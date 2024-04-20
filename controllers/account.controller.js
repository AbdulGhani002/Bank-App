const db = require("../data/database");
const mongodb = require("mongodb");
const ObjectId = mongodb.ObjectId;
const logger = require("../utils/logger");
const Transaction = require("../models/transaction.model");

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
  res.render("customer/deposit-money", {
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
    const transactionRecipt = new Transaction(
      accountId,
      "Deposit",
      amount,
      new Date(),
      account.accountNumber,
      account.accountNumber
    );
    transactionRecipt.makeTransaction();

    res.redirect("/home?userId=" + userId + "&accountId=" + accountId);
  } catch (error) {
    console.error("Error depositing money:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getPaymentPage = async (req, res) => {
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
const makePayment = async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    const userId = req.body.userId;
    const senderAccountId = req.body.accountId;
    const receiverAccountNumber = req.body.recieverAccountNumber;
    const senderAccount = await db
      .getDb()
      .collection("Accounts")
      .findOne({ _id: new ObjectId(senderAccountId) });
    const receiverAccount = await db
      .getDb()
      .collection("Accounts")
      .findOne({ accountNumber: receiverAccountNumber });
    if (!receiverAccount) {
      return res.status(404).send("Receiver Account not found");
    }
    if (!senderAccount) {
      return res.status(404).send("Your Account not found");
    }
    const currentSenderBalance = parseFloat(senderAccount.balance);
    if (currentSenderBalance < amount) {
      return res.status(400).send("Insufficient Balance");
    }
    const recieverCurrentBalance = parseFloat(receiverAccount.balance);
    const reciverUpdatedBalance = recieverCurrentBalance + amount;
    const senderUpdatedBalance = currentSenderBalance - amount;
    try {
      await db
        .getDb()
        .collection("Accounts")
        .updateOne(
          { accountNumber: receiverAccountNumber },
          { $set: { balance: reciverUpdatedBalance } }
        );
    } catch (error) {
      console.log("Error updating reciever balance", error);
    }
    await db
      .getDb()
      .collection("Accounts")
      .updateOne(
        { _id: new ObjectId(senderAccountId) },
        { $set: { balance: senderUpdatedBalance } }
      );
    const transactionData = new Transaction(
      senderAccountId,
      "Payment",
      amount,
      new Date(),
      senderAccount.accountNumber,
      receiverAccountNumber
    );
    transactionData.makeTransaction();
    res.redirect("/home?userId=" + userId + "&accountId=" + senderAccountId);
  } catch (error) {
    console.error("Error depositing money:", error);
    res.status(500).send("Internal Server Error");
  }
};
const getTransactions = async (req, res) => {
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
  const transactions = await Transaction.getTransactionsByAccount(accountId);
  res.render("customer/transactions", {
    userData: userData,
    accountDetails: accountDetails,
    transactions:transactions
  });
};
module.exports = {
  getDepositMoney,
  depositMoney,
  getPaymentPage,
  makePayment,
  getTransactions
};
