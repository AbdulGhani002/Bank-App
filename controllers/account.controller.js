const mongodb = require("mongodb");
const CryptoJS = require("crypto-js");
const PDFDocument = require("pdfkit");
const db = require("../data/database");
const ObjectId = mongodb.ObjectId;
const Transaction = require("../models/transaction.model");
const sendEmail = require("../utils/email");
const { getCurrentAccount, enrichTransactions, formatDate } = require("../utils/transactions");

const getDepositMoney = async (req, res) => {
  const userData = res.locals.user;
  const accountDetails = await getCurrentAccount(userData);
  if (!userData) {
    res.redirect("/login?error=Invalid email or password. Please try again.");
  }
  if (!accountDetails) {
    res.redirect("/login?error=Invalid email or password. Please try again.");
  }
  if (req.query.error) {
    return res.render("customer/deposit-money", {
      userData: userData,
      csrfToken: req.csrfToken(),
      accountDetails: accountDetails,
      error: req.query.error,
    });
  }
  res.render("customer/deposit-money", {
    userData: userData,
    csrfToken: req.csrfToken(),
    accountDetails: accountDetails,
    error: null,
  });
};
const depositMoney = async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    const userData = res.locals.user;
    const account = await getCurrentAccount(userData);

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
    try {
      await sendEmail(
        res.locals.user.email,
        "Deposit Confirmation",
        `You have successfully deposited ${amount} into your account.`
      );
    } catch (e) {
      console.error("Failed to send deposit email:", e);
    }

    res.redirect("/home");
  } catch (error) {
    console.error("Error depositing money:", error);
    res.status(500).send("Internal Server Error");
  }
};

const getPaymentPage = async (req, res) => {
  const userData = res.locals.user;
  const accountDetails = await getCurrentAccount(userData);
  if (!userData) {
    res.redirect("/login?error=Invalid email or password. Please try again.");
  }
  if (!accountDetails) {
    res.redirect("/login?error=Invalid email or password. Please try again.");
  }
  if (req.query.error) {
    return res.render("customer/make-payments", {
      userData: userData,
      csrfToken: req.csrfToken(),
      accountDetails: accountDetails,
      error: req.query.error,
    });
  }
  res.render("customer/make-payments", {
    userData: userData,
    csrfToken: req.csrfToken(),
    accountDetails: accountDetails,
    error: null,
  });
};

const isValidAccountNumber = (accountNumber) => {
  const regex = /^[A-Z]{4}-[A-Z0-9]{8}$/;
  if (!regex.test(accountNumber)) {
    return false; 
  }

  const sanitizedAccountNumber = accountNumber.replace(/[^A-Z0-9-]/g, '');

  return sanitizedAccountNumber === accountNumber;
};

const makePayment = async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    const userData = res.locals.user;
    const receiverAccountNumber = req.body.recieverAccountNumber;
    const senderAccount = await db
      .getDb()
      .collection("Accounts")
      .findOne({ userId: new ObjectId(userData._id) });
    if (!isValidAccountNumber(receiverAccountNumber)) {
      return res.redirect("/pay?error=Invalid Account Number");
    }
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
        { userId: new ObjectId(userData._id) },
        { $set: { balance: senderUpdatedBalance } }
      );
    const transactionData = new Transaction(
      senderAccount._id,
      "Payment",
      amount,
      new Date(),
      senderAccount.accountNumber,
      receiverAccountNumber
    );
    transactionData.makeTransaction();
    try {
      await sendEmail(
        res.locals.user.email,
        "Payment Confirmation",
        `You have successfully sent ${amount} to ${receiverAccountNumber}.`
      );
    } catch (e) {
      console.error("Failed to send sender payment email:", e);
    }
    const receiver = await db
      .getDb()
      .collection("Users")
      .findOne({ _id: new ObjectId(receiverAccount.userId) });
    if (receiver && receiver.email) {
      try {
        await sendEmail(
          receiver.email,
          "Incoming Payment",
          `You have received ${amount} from ${senderAccount.accountNumber}.`
        );
      } catch (e) {
        console.error("Failed to send receiver payment email:", e);
      }
    }
    res.redirect("/home");
  } catch (error) {
    console.error("Error depositing money:", error);
    res.status(500).send("Internal Server Error");
  }
};
const getTransactions = async (req, res) => {
  const userData = res.locals.user;
  const accountDetails = await db
    .getDb()
    .collection("Accounts")
    .findOne({ userId: new ObjectId(userData._id) });
  if (!userData) {
    res.redirect("/login?error=Invalid email or password. Please try again.");
  }
  if (!accountDetails) {
    res.redirect("/login?error=Invalid email or password. Please try again.");
  }
  const transactionsRaw = await Transaction.getTransactionsByAccount(accountDetails.accountNumber);
  const transactions = await enrichTransactions(transactionsRaw, accountDetails.accountNumber);
  res.render("customer/transactions", {
    userData: userData,
    accountDetails: accountDetails,
    transactions: transactions,
  });
};

const getTransactionDetails = async (req, res) => {
  try {
    const userData = res.locals.user;
    const senderAccountDetails = await db
      .getDb()
      .collection("Accounts")
      .findOne({ userId: new ObjectId(userData._id) });
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
      .findOne({ _id: new ObjectId(receiverAccountDetails.userId) });
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
  const userData = res.locals.user;
  const accountDetails = await getCurrentAccount(userData);
  if (!userData) {
    return res.redirect("/login");
  }
  if (!accountDetails) {
    return res.redirect("/login");
  }
  const transactions = await Transaction.getTransactionsByAccount(accountDetails.accountNumber);
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
  }
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
  await enrichTransactions(transactions, accountDetails.accountNumber);

  let currentDate = formatDate(new Date(), options);
  res.render("customer/financial-statement", {
    userData: userData,
    accountDetails: accountDetails,
    transactions: transactions,
    firstTransactionDate: humanReadableFirstTransactionDate,
    lastTransactionDate: humanReadableLastTransactionDate,
    currentDate: currentDate,
  });
};
const generatePDF = async (req, res) => {
  const userData = res.locals.user;
  const accountDetails = await getCurrentAccount(userData);
  if (!userData) {
    return res.redirect("/login");
  }
  if (!accountDetails) {
    return res.redirect("/login");
  }
  const transactions = await Transaction.getTransactionsByAccount(accountDetails.accountNumber);
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
  }
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
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  await enrichTransactions(transactions, accountDetails.accountNumber);
  let currentDate = formatDate(new Date(), options);
  // Styled PDF generation
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${userData.name}-statement.pdf`
  );
  doc.pipe(res);
  // Header band
  doc.rect(40, 40, doc.page.width - 80, 60).fill('#1f2937');
  doc.fillColor('#ffffff').fontSize(22).text('Financial Statement', 50, 55, { align: 'left' });
  doc.fillColor('#ffffff').fontSize(10).text(`Generated: ${currentDate}`, 50, 85, { align: 'left' });

  // Reset fill
  doc.fillColor('#000000');
  doc.moveDown(3);
  // Account summary box
  const yStart = 120;
  doc.roundedRect(40, yStart, doc.page.width - 80, 80, 8).stroke('#e5e7eb');
  doc.fontSize(12)
    .text(`Name: ${userData.name}`, 55, yStart + 12)
    .text(`Email: ${userData.email}`, 55, yStart + 30)
    .text(`Account: ${accountDetails.accountNumber}`, 55, yStart + 48)
    .text(`Balance: ${accountDetails.balance}`, 320, yStart + 12)
    .text(`Period: Full History`, 320, yStart + 30);

  // Transactions table header
  const tableTop = yStart + 110;
  const colX = [50, 160, 260, 360, 470];
  doc.rect(40, tableTop - 20, doc.page.width - 80, 24).fill('#f3f4f6');
  doc.fillColor('#111827').fontSize(11);
  doc.text('Date', colX[0], tableTop - 16)
     .text('Type', colX[1], tableTop - 16)
     .text('Amount', colX[2], tableTop - 16)
     .text('Sender', colX[3], tableTop - 16)
     .text('Receiver', colX[4], tableTop - 16);

  // Rows
  let y = tableTop + 6;
  doc.fillColor('#000000').fontSize(10);
  transactions.forEach((t, idx) => {
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 60;
    }
    doc.text(t.formattedDate, colX[0], y, { width: 100 })
       .text(t.transactionType, colX[1], y, { width: 90 })
       .text(String(t.amount), colX[2], y, { width: 80 })
       .text(t.senderAccountNumber || '-', colX[3], y, { width: 100 })
       .text(t.receiverAccountNumber || '-', colX[4], y, { width: 120 });
    y += 18;
  });

  doc.end();
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
