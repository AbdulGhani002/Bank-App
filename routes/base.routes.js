const express = require("express");
const { limiter } = require("../middlewares/rate-limiter");
const baseController = require("../controllers/base.controller");
const authMiddleware = require("../middlewares/auth-middleware");
const router = express.Router();

router.get("/", limiter, baseController.getIndex);
router.get(
  "/home",
  authMiddleware.requireAuth,
  limiter,
  baseController.getHome
);
module.exports = router;
