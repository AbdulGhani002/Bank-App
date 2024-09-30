const express = require("express");
const { limiter } = require("../middlewares/rate-limiter");

const router = express.Router();

const accountController = require("../controllers/account.controller");

const authMiddleware = require("../middlewares/auth-middleware");

router.get(
  "/deposit",
  authMiddleware.requireAuth,
  limiter,
  accountController.getDepositMoney
);

router.post(
  "/deposit",
  authMiddleware.requireAuth,
  limiter,
  accountController.depositMoney
);

router.get(
  "/pay",
  authMiddleware.requireAuth,
  limiter,
  accountController.getPaymentPage
);
router.post(
  "/pay",
  authMiddleware.requireAuth,
  limiter,
  accountController.makePayment
);

router.get(
  "/transactions",
  authMiddleware.requireAuth,
  limiter,
  accountController.getTransactions
);
router.get(
  "/transactions/:transactionId",
  authMiddleware.requireAuth,
  limiter,
  accountController.getTransactionDetails
);
router.get(
  "/statement",
  authMiddleware.requireAuth,
  limiter,
  accountController.getStatement
);
router.get(
  "/statement/generate-pdf",
  authMiddleware.requireAuth,
  limiter,
  accountController.generatePDF
);
module.exports = router;
