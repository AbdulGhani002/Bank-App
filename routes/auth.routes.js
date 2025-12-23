const express = require("express");
const { limiter } = require("../middlewares/rate-limiter");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth-middleware");

const router = express.Router();

router.get("/signup", limiter, authController.getSignup);
router.get("/login", limiter, (req, res) => res.redirect('/auth'));
router.get("/auth", limiter, authController.getAuthSPA);
router.post("/signup", limiter, authController.createUserAndAccount);

router.post("/login", limiter, authController.login);
router.post("/api/login", limiter, authController.loginApi);
router.post("/api/signup", limiter, authController.createUserAndAccountApi);
router.get("/logout", limiter, authController.logout);

router.post('/api/verify-2fa', limiter, authController.verify2FAApi);

router.get("/enable-2fa", authMiddleware.requireAuth, authController.getEnable2FA);
router.post("/enable-2fa", authMiddleware.requireAuth, authController.enable2FA);

router.get("/verify-2fa", authController.getVerify2FA);
router.post("/verify-2fa", authController.verify2FA);

router.get("/verify-email-2fa", authController.getVerifyEmail2FA);
router.post("/api/verify-email-2fa", authController.verifyEmail2FA);

router.get("/verify-email", authController.verifyEmail);

module.exports = router;
