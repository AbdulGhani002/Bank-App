const express = require("express");
const { requireAuth } = require("../middlewares/auth-middleware");
const db = require("../data/database");

const router = express.Router();

function requireAdmin(req, res, next) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (res.locals.user && adminEmail && res.locals.user.email === adminEmail) {
    return next();
  }
  return res.status(403).send("Forbidden");
}

router.get("/admin/linkage", requireAuth, requireAdmin, async (req, res) => {
  const user = res.locals.user;
  const account = await db.getDb().collection("Accounts").findOne({ userId: user._id });
  const duplicates = await db.getDb().collection("Accounts").countDocuments({ userId: user._id });
  res.render("shared/linkage", {
    csrfToken: req.csrfToken(),
    user,
    account,
    duplicates,
  });
});

module.exports = router;
