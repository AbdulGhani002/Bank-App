const mongodb = require("mongodb");
const CryptoJS = require("crypto-js");
const PDFDocument = require("pdfkit");
const db = require("../data/database");
const ObjectId = mongodb.ObjectId;
const Transaction = require("../models/transaction.model");

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
  let userData;
  let accountDetails;
  try {
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
    userData = await db
      .getDb()
      .collection("Users")
      .findOne({ userId: existingUserId });
    accountDetails = await db
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
  } catch (error) {
    console.log(error);
    return res.redirect("/login?error=Login to continue");
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
    if (!encryptedExistingUserId || !encryptedExistingAccountId) {
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
    return res.redirect("/login");
  }
  if (!accountDetails) {
    return res.redirect("/login");
  }
  const transactions = await Transaction.getTransactionsByAccount(
    existingAccountId
  );
  res.render("customer/transactions", {
    userData: userData,
    accountDetails: accountDetails,
    transactions: transactions,
  });
};

const getTransactionDetails = async (req, res) => {
  try {
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
    const senderAccountDetails = await db
      .getDb()
      .collection("Accounts")
      .findOne({ accountId: existingAccountId });
    const transactionId = req.params.transactionId;
    if (!userData) {
      return res.redirect("/login");
    }
    if (!senderAccountDetails) {
      return res.redirect("/login");
    }
    const transaction = await db
      .getDb()
      .collection("Transactions")
      .findOne({ _id: new ObjectId(transactionId) });
    if (!transaction) {
      return res.redirect("/login");
    }
    const receiverAccountDetails = await db
      .getDb()
      .collection("Accounts")
      .findOne({ accountNumber: transaction.receiverAccountNumber });
    if (!receiverAccountDetails) {
      return res.status(404).render("404");
    }
    const receiverUser = await db
      .getDb()
      .collection("Users")
      .findOne({ userId: receiverAccountDetails.accountId });
    if (!receiverUser) {
      return res.status(404).render("404");
    }
    res.render("customer/transaction-details", {
      userData: userData,
      senderAccountDetails: senderAccountDetails,
      transaction: transaction,
      accountDetails: senderAccountDetails,
      receiverAccountDetails: receiverAccountDetails,
      receiverUser: receiverUser,
    });
  } catch (error) {
    res.status(500).redirect("/500");
  }
};
const getStatement = async (req, res) => {
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
    return res.redirect("/login");
  }
  if (!accountDetails) {
    return res.redirect("/login");
  }
  const transactions = await Transaction.getTransactionsByAccount(
    existingAccountId
  );
  if (
    transactions.length == 0 ||
    transactions == null ||
    transactions == undefined
  ) {
    return res.render("customer/financial-statement", {
      userData: userData,
      accountDetails: accountDetails,
      transactions: transactions,
      firstTransactionDate: null,
      lastTransactionDate: null,
      currentDate: null,
    });
  } else {
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstTransactionDate = new Date(transactions[0].date);
    const lastTransactionDate = new Date(
      transactions[transactions.length - 1].date
    );
    const humanReadableFirstTransactionDate =
      firstTransactionDate.toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    const humanReadableLastTransactionDate =
      lastTransactionDate.toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      transaction.formattedDate = transactionDate.toLocaleString(
        "en-US",
        options
      );
    });

    const options = {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    };

    let currentDate = new Date();
    currentDate = currentDate.toLocaleDateString("en-US", options);
    res.render("customer/financial-statement", {
      userData: userData,
      accountDetails: accountDetails,
      transactions: transactions,
      firstTransactionDate: humanReadableFirstTransactionDate,
      lastTransactionDate: humanReadableLastTransactionDate,
      currentDate: currentDate,
    });
  }
};
const generatePDF = async (req, res) => {
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
    return res.redirect("/login");
  }
  if (!accountDetails) {
    return res.redirect("/login");
  }
  const transactions = await Transaction.getTransactionsByAccount(
    existingAccountId
  );

  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

  const firstTransactionDate = new Date(transactions[0].date);
  const lastTransactionDate = new Date(
    transactions[transactions.length - 1].date
  );

  const options = {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  };
  const humanReadableFirstTransactionDate =
    firstTransactionDate.toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const humanReadableLastTransactionDate =
    lastTransactionDate.toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.date);
    transaction.formattedDate = transactionDate.toLocaleString(
      "en-US",
      options
    );
  });
  let currentDate = new Date();
  currentDate = currentDate.toLocaleDateString("en-US", options);
  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${userData.name}-statement.pdf`
  );
  doc.pipe(res);
  doc.fontSize(20).text("Financial Statement", {
    align: "center",
  });
  doc.fontSize(15).text(`Name: ${userData.name}`);
  doc.text(`Email: ${userData.email}`);
  doc.text(`Account Number: ${accountDetails.accountNumber}`);
  doc.text(`Account Balance: ${accountDetails.balance}`);
  doc.text(`Current Date: ${currentDate}`, {
    align: "right",
  });
  doc.moveDown();
  doc.fontSize(20).text("Transactions", {
    align: "center",
  });
  doc.moveDown();
  transactions.forEach((transaction, index) => {
    doc.fontSize(15).text(`Transaction ${index + 1}`);
    doc.text(`Transaction Type: ${transaction.transactionType}`);
    doc.text(`Amount: ${transaction.amount}`);
    doc.text(`Date: ${transaction.formattedDate}`);
    doc.text(`Sender Account Number: ${transaction.senderAccountNumber}`);
    doc.text(`Receiver Account Number: ${transaction.receiverAccountNumber}`);
    doc.moveDown();
  });
  doc.end();
  res.download("document.pdf");
};
module.exports = {
  getDepositMoney,
  depositMoney,
  getPaymentPage,
  makePayment,
  getTransactions,
  getTransactionDetails,
  getStatement,
  generatePDF,
};
