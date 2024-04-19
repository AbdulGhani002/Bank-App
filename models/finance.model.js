const db = require('../data/database')
class Finance {
    constructor(transactionType,amount,date,senderAccountNumber,recieverAccountNumber) {
        this.transactionType = transactionType;
        this.amount = amount;
        this.date = date;
        this.senderAccountNumber = senderAccountNumber;
        this.recieverAccountNumber = recieverAccountNumber;
    }
    transactionData ={
        transactionType: this.transactionType,
        amount: this.amount,
        date: this.date,
        senderAccountNumber: this.senderAccountNumber,
        recieverAccountNumber: this.recieverAccountNumber,
    }
    async makeTransaction() {
        if(!this.transactionType) {
            return null;
        }
        if(this.transactionType == 'add-money'){
            this.getAccount(accountNumber).then(account => {
                account.balance +=this.amount;
            })
        }
        return this.transactionData;
    }
    async getAccount(accountNumber) {
       return db.getDb().collection("Accounts").findOne({accountNumber: accountNumber});
    }
}