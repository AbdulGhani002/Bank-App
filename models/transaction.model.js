const db = require('../data/database');

class Transaction {
    constructor(accountId,transactionType, amount, date, senderAccountNumber, receiverAccountNumber) {
        this.accountId = accountId; 
        this.transactionType = transactionType;
        this.amount = amount;
        this.date = date;
        this.senderAccountNumber = senderAccountNumber;
        this.receiverAccountNumber = receiverAccountNumber;
    }

    async makeTransaction() {
        try {
            if (!this.transactionType) {
                throw new Error("Transaction type is missing");
            }

            const transactionData = {
                transactionType: this.transactionType,
                amount: this.amount,
                date: this.date,
                senderAccountNumber: this.senderAccountNumber,
                receiverAccountNumber: this.receiverAccountNumber,
                accountId: this.accountId
            };

            await db.getDb().collection("Transactions").insertOne(transactionData);

            return transactionData;
        } catch (error) {
            console.error("Error making transaction:", error);
            throw error;
        }
    }

    static async getTransactionsByAccount(accountId) {
        try {
            return await db.getDb().collection("Transactions").find({ accountId }).toArray();
        } catch (error) {
            console.error("Error retrieving transactions:", error);
            throw error;
        }
    }
}

module.exports = Transaction;
