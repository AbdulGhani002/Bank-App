const db = require('../data/database');

class Transaction {
    constructor(transactionType, amount, date, senderAccountNumber, receiverAccountNumber) {
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
            };

            await db.getDb().collection("Transactions").insertOne(transactionData);

            return transactionData;
        } catch (error) {
            console.error("Error making transaction:", error);
            throw error;
        }
    }
}

module.exports = Transaction;
