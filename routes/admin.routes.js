const express = require("express");
const { requireAuth } = require("../middlewares/auth-middleware");
const sendEmail = require("../utils/email");

const router = express.Router();

function requireAdmin(req, res, next) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return res.status(500).send("ADMIN_EMAIL not configured");
  }
  if (res.locals.user && res.locals.user.email === adminEmail) {
    return next();
  }
  return res.status(403).send("Forbidden");
}

router.get("/admin/email-test", requireAuth, requireAdmin, (req, res) => {
  res.render("shared/email-test", { csrfToken: req.csrfToken(), message: null, error: null });
});

router.post("/admin/email-test", requireAuth, requireAdmin, async (req, res) => {
  const { to, subject, text } = req.body;
  try {
    await sendEmail(to, subject || "Test Email", text || "This is a test email from Bank-App.");
    res.render("shared/email-test", { csrfToken: req.csrfToken(), message: "Email sent.", error: null });
  } catch (e) {
    res.render("shared/email-test", { csrfToken: req.csrfToken(), message: null, error: String(e) });
  }
});

module.exports = router;
