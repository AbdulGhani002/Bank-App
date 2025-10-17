const { v4: uuidv4 } = require("uuid");
const db = require("../data/database");

class Account {
  constructor(userId, balance) {
    this.userId = userId; 
    this.balance = balance || 0;
    this.createdAt = new Date();
    this.accountNumber = this.generateAccountNumber();
  }

  generateAccountNumber() {
    const prefix = "MHCA";
    const uniqueId = uuidv4().split("-").join("").toUpperCase().substring(0, 8);
    return `${prefix}-${uniqueId}`;
  }

  static async create(userId) {
    const account = new Account(userId);
    try {
      // Prevent duplicate account for the same user
      const existing = await db.getDb().collection("Accounts").findOne({ userId });
      if (existing) {
        return existing; // Return existing account document
      }
      const newAccount = {
        userId: account.userId,
        accountNumber: account.accountNumber,
        balance: account.balance,
        createdAt: account.createdAt,
      };
      const result = await db.getDb().collection("Accounts").insertOne(newAccount);
      return { _id: result.insertedId, ...newAccount };
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  }

  async createAccount() {
    try {
      const newAccount = {
        userId: this.userId, // Storing the ObjectId
        accountNumber: this.accountNumber,
        balance: this.balance,
      };
      await db.getDb().collection("Accounts").insertOne(newAccount);
    } catch (error) {
      console.error("Error creating account:", error);
      throw error;
    }
  }

  async getAccountData() {
    try {
      const account = await db
        .getDb()
        .collection("Accounts")
        .findOne({ userId: this.userId });
      if (!account) {
        throw new Error("Account not found!");
      } else {
        return account;
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static async getAccountById(id) {
    try {
      const account = await db
        .getDb()
        .collection("Accounts")
        .findOne({ _id: id });
      if (!account) {
        throw new Error("Account not found!");
      } else {
        return account;
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  static async getAccountByUserId(userId) {
    try {
      const account = await db
        .getDb()
        .collection("Accounts")
        .findOne({ userId });
      if (!account) {
        throw new Error("Account not found!");
      } else {
        return account;
      }
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}

module.exports = Account;
