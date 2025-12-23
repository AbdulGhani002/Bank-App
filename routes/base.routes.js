const express = require("express");
const { limiter } = require("../middlewares/rate-limiter");
const baseController = require("../controllers/base.controller");
const authMiddleware = require("../middlewares/auth-middleware");
const router = express.Router();

console.log("Base router loaded."); 
router.get("/", limiter, (req, res, next) => {
    console.log("Request received for /"); 
    baseController.getIndex(req, res, next);
});

router.get(
  "/home",
  authMiddleware.requireAuth,
  limiter,
  baseController.getHome
);

router.get("/customer-support", limiter, (req, res) => {
  res.render("shared/customer-support", {
    userData: res.locals.user || null,
    accountDetails: null,
  });
});

router.get("/account-locked", limiter, (req, res) => {
  res.render("shared/account-locked", {
    message: req.query.message || "Your account has been locked.",
    userData: null,
    accountDetails: null,
  });
});

module.exports = router;
