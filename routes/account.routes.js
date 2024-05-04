const express = require('express');

const router = express.Router();

const accountController = require('../controllers/account.controller');

const authMiddleware = require('../middlewares/auth-middleware');

router.get('/deposit',authMiddleware.requireAuth, accountController.getDepositMoney);

router.post('/deposit',authMiddleware.requireAuth, accountController.depositMoney);

router.get('/pay',authMiddleware.requireAuth, accountController.getPaymentPage);
router.post('/pay',authMiddleware.requireAuth, accountController.makePayment);

router.get('/transactions' ,authMiddleware.requireAuth, accountController.getTransactions);
router.get('/transactions/:transactionId',authMiddleware.requireAuth , accountController.getTransactionDetails);
module.exports = router;