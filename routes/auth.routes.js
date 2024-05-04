const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.get("/signup", authController.getSignup);
router.get("/login", authController.getLogin);
router.post("/signup", authController.createUserAndAccount);

router.post("/login", authController.login);
router.get("/logout", authController.logout);

module.exports = router;
