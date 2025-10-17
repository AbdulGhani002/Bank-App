const nodemailer = require('nodemailer');

const requiredEnv = [
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USER",
  "EMAIL_PASS",
  "EMAIL_FROM",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.warn(`Email config warning: missing ${key}. Emails may fail to send.`);
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Could not send email.");
  }
}

// Attach a transport verification helper without changing the default export shape
sendEmail.verify = async function verifyEmailTransport() {
  try {
    await transporter.verify();
    return { ok: true };
  } catch (error) {
    console.error("Email transport verify failed:", error);
    return { ok: false, error: String(error) };
  }
};

module.exports = sendEmail;
