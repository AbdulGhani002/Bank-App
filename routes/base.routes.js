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
module.exports = router;
