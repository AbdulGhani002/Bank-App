const express = require("express");
const { limiter } = require("../middlewares/rate-limiter");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth-middleware");

const router = express.Router();

router.get("/signup", limiter, authController.getSignup);
router.get("/login", limiter, authController.getLogin);
router.post("/signup", limiter, authController.createUserAndAccount);

router.post("/login", limiter, authController.login);
router.get("/logout", limiter, authController.logout);

router.get("/enable-2fa", authMiddleware.requireAuth, authController.getEnable2FA);
router.post("/enable-2fa", authMiddleware.requireAuth, authController.enable2FA);

router.get("/verify-2fa", authController.getVerify2FA);
router.post("/verify-2fa", authController.verify2FA);

router.get("/verify-email", authController.verifyEmail);

module.exports = router;
