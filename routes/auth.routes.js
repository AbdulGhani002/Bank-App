const express = require("express");
const { limiter } = require("../middlewares/rate-limiter");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.get("/signup", limiter, authController.getSignup);
router.get("/login", limiter, authController.getLogin);
router.post("/signup", limiter, authController.createUserAndAccount);

router.post("/login", limiter, authController.login);
router.get("/logout", limiter, authController.logout);

module.exports = router;
