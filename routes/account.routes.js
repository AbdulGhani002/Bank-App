const express = require('express');

const router = express.Router();

const accountController = require('../controllers/account.controller');

router.get('/deposit', accountController.getDepositMoney);

router.post('/deposit', accountController.depositMoney);

module.exports = router;