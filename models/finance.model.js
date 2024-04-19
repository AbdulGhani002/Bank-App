class Finance {
    constructor(transactionType,amount,date,senderAccountNumber,recieverAccountNumber) {
        this.transactionType = transactionType;
        this.amount = amount;
        this.date = date;
        this.senderAccountNumber = senderAccountNumber;
        this.recieverAccountNumber = recieverAccountNumber;
    }
    let transactionData ={
        transactionType: this.transactionType,
        amount: this.amount,
        date: this.date,
        senderAccountNumber: this.senderAccountNumber,
        recieverAccountNumber: this.recieverAccountNumber,
    }
    async makeTransaction(transactionType) {
        if(!transactionType) {
            return null;
        }
        return this.transactionData;
    }
}