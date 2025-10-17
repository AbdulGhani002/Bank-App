const express = require("express");
const sendEmail = require("../utils/email");

const router = express.Router();

// Lightweight health check
router.get("/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Email transport health check
router.get("/health/email", async (req, res) => {
  const result = await sendEmail.verify();
  const status = result.ok ? 200 : 500;
  res.status(status).json({
    ok: result.ok,
    message: result.ok ? "SMTP transport OK" : "SMTP transport failed",
    error: result.error || null,
  });
});

module.exports = router;
