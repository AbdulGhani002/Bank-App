const express = require("express");

const baseController = require("../controllers/base.controller");
const authMiddleware = require("../middlewares/auth-middleware");
const router = express.Router();

router.get("/", baseController.getIndex);
router.get('/home',authMiddleware.requireAuth,baseController.getHome)
module.exports = router;
