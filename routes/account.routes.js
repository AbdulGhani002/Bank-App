const express = require('express');

const router = express.Router();

const accountController = require('../controllers/account.controller');

router.get('/deposit', accountController.getDepositMoney);

router.post('/deposit', accountController.depositMoney);

router.get('/pay', accountController.getPaymentPage);
router.post('/pay', accountController.makePayment);

router.get('/transactions' , accountController.getTransactions);
router.get('/transactions/:transactionId' , accountController.getTransactionDetails);
module.exports = router;