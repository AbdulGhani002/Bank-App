const mongodb = require("mongodb");
const CryptoJS = require("crypto-js");
const db = require("../data/database");
const ObjectId = mongodb.ObjectId;
const Transaction = require("../models/transaction.model");
const { error } = require("console");

const getDepositMoney = async (req, res) => {
  const encryptedExistingUserId = JSON.parse(req.cookies.existingUserId);
  const encryptedExistingAccountId = JSON.parse(req.cookies.existingAccountId);
  const existingUserId = CryptoJS.AES.decrypt(
    encryptedExistingUserId,
    process.env.SECRET_KEY
  ).toString(CryptoJS.enc.Utf8);
  const existingAccountId = CryptoJS.AES.decrypt(
    encryptedExistingAccountId,
    process.env.SECRET_KEY
  ).toString(CryptoJS.enc.Utf8);
  const userData = await db
    .getDb()
    .collection("Users")
    .findOne({ userId: existingUserId });
  const accountDetails = await db
    .getDb()
    .collection("Accounts")
    .findOne({ accountId: existingAccountId });
  if (!userData) {
    res.redirect("/login?error=Invalid email or password. Please try again.");
  }
  if (!accountDetails) {
    res.redirect("/login?error=Invalid email or password. Please try again.");
  }
  if (req.query.error) {
    return res.render("customer/deposit-money", {
      userData: userData,
      accountDetails: accountDetails,
      error: req.query.error,
    });
  }
  res.render("customer/deposit-money", {
    userData: userData,
    accountDetails: accountDetails,
    error: null,
  });
};
const depositMoney = async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);

    const encryptedExistingUserId = JSON.parse(req.cookies.existingUserId);
    const encryptedExistingAccountId = JSON.parse(
      req.cookies.existingAccountId
    );
    const existingUserId = CryptoJS.AES.decrypt(
      encryptedExistingUserId,
      process.env.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    const existingAccountId = CryptoJS.AES.decrypt(
      encryptedExistingAccountId,
      process.env.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    const userData = await db
      .getDb()
      .collection("Users")
      .findOne({ userId: existingUserId });
    const account = await db
      .getDb()
      .collection("Accounts")
      .findOne({ accountId: existingAccountId });

    if (!account) {
      return res.status(404).send("Account not found");
    }

    const currentBalance = parseFloat(account.balance);
    const updatedBalance = currentBalance + amount;
    await db
      .getDb()
      .collection("Accounts")
      .updateOne(
        { _id: new ObjectId(account._id) },
        { $set: { balance: updatedBalance } }
      );
    const transactionRecipt = new Transaction(
      account._id,
      "Deposit",
      amount,
      new Date(),
      account.accountNumber,
      account.accountNumber
    );
    transactionRecipt.makeTransaction();

    res.redirect("/home");
  } catch (error) {
    console.error("Error depositing money:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getPaymentPage = async (req, res) => {
  try{
    const encryptedExistingUserId = JSON.parse(req.cookies.existingUserId);
    const encryptedExistingAccountId = JSON.parse(req.cookies.existingAccountId);
    const existingUserId = CryptoJS.AES.decrypt(
      encryptedExistingUserId,
      process.env.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
    const existingAccountId = CryptoJS.AES.decrypt(
      encryptedExistingAccountId,
      process.env.SECRET_KEY
    ).toString(CryptoJS.enc.Utf8);
  } catch(error){
    console.log(error);
    return res.redirect("/login?error=Login to continue");
  }
  const userData = await db
    .getDb()
    .collection("Users")
    .findOne({ userId: existingUserId });
  const accountDetails = await db
    .getDb()
    .collection("Accounts")
    .findOne({ accountId: existingAccountId });
  if (!userData) {
    res.redirect("/login?error=Invalid email or password. Please try again.");
  }
  if (!accountDetails) {
    res.redirect("/login?error=Invalid email or password. Please try again.");
  }
  if (req.query.error) {
    return res.render("customer/make-payments", {
      userData: userData,
      accountDetails: accountDetails,
      error: req.query.error,
    });
  }
  res.render("customer/make-payments", {
    userData: userData,
    accountDetails: accountDetails,
    error: null,
  });
};
const makePayment = async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
      const encryptedExistingUserId = JSON.parse(req.cookies.existingUserId);
      const encryptedExistingAccountId = JSON.parse(
        req.cookies.existingAccountId
      );
      if(!encryptedExistingUserId || !encryptedExistingAccountId){
        return res.redirect("/pay?error=Error Occured! Try Again!!");
      }
      const existingUserId = CryptoJS.AES.decrypt(
        encryptedExistingUserId,
        process.env.SECRET_KEY
      ).toString(CryptoJS.enc.Utf8);
      const senderAccountId = CryptoJS.AES.decrypt(
        encryptedExistingAccountId,
        process.env.SECRET_KEY
      ).toString(CryptoJS.enc.Utf8);
    const senderAccount = await db
      .getDb()
      .collection("Accounts")
      .findOne({ accountId: senderAccountId });
    const receiverAccountNumber = req.body.recieverAccountNumber;

    const receiverAccount = await db
      .getDb()
      .collection("Accounts")
      .findOne({ accountNumber: receiverAccountNumber });
    if (!receiverAccount) {
      return res.redirect("/pay?error=Invalid Account Number");
    }
    if (!senderAccount) {
      return res.redirect("/pay?error=Account Not Found");
    }
    if (senderAccount.accountNumber === receiverAccountNumber) {
      return res.redirect("/pay?error=You cannot send money to yourself");
    }
    const currentSenderBalance = parseFloat(senderAccount.balance);
    if (currentSenderBalance < amount) {
      return res.redirect("/pay?error=Insufficient Balance");
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
        { accountId: senderAccountId },
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
    res.redirect("/home");
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
    transactions: transactions,
  });
};

const getTransactionDetails = async (req, res) => {
  const userId = req.query.userId;
  const senderAccountId = req.query.accountId;
  const transactionId = req.params.transactionId;

  try {
    console.log("Transaction ID:", transactionId);

    const userData = await db
      .getDb()
      .collection("Users")
      .findOne({ _id: new ObjectId(userId) });
    if (!userData) {
      console.log("User data not found");
      return res.redirect("/login");
    }

    const senderAccountDetails = await db
      .getDb()
      .collection("Accounts")
      .findOne({ _id: new ObjectId(senderAccountId) });
    if (!senderAccountDetails) {
      console.log("Sender account details not found");
      return res.redirect("/login");
    }

    const transaction = await db
      .getDb()
      .collection("Transactions")
      .findOne({ _id: new ObjectId(transactionId) });
    if (!transaction) {
      console.log("Transaction not found");
      return res.status(404).send("Transaction not found");
    }
    console.log(transaction.receiverAccountNumber);
    console.log("Receiver Account Number:", transaction.receiverAccountNumber);
    const receiverAccountDetails = await db
      .getDb()
      .collection("Accounts")
      .findOne({ accountNumber: transaction.receiverAccountNumber });
    if (!receiverAccountDetails) {
      console.log("Receiver account details not found");
      return res.status(404).send("Receiver account details not found");
    } else {
      console.log("Receiver account details found:", receiverAccountDetails);
    }

    const receiverUser = await db
      .getDb()
      .collection("Users")
      .findOne({ userId: receiverAccountDetails.accountId });
    if (!receiverUser) {
      console.log("Receiver user data not found");
      return res.status(404).send("Receiver user data not found");
    }

    console.log("Rendering transaction details page");
    res.render("customer/transaction-details", {
      userData: userData,
      senderAccountDetails: senderAccountDetails,
      transaction: transaction,
      receiverAccountDetails: receiverAccountDetails,
      receiverUser: receiverUser,
    });
  } catch (error) {
    console.error("Error retrieving transaction details:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  getDepositMoney,
  depositMoney,
  getPaymentPage,
  makePayment,
  getTransactions,
  getTransactionDetails,
};
