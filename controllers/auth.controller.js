const CryptoJs = require("crypto-js");
const User = require("../models/user.model");
const Account = require("../models/account.model");
const authMiddleware = require("../middlewares/auth-middleware");
const validation = require("../utils/validation");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const db = require("../data/database");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const emailValidator = require("email-validator");
const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
const { redirectWithError } = require("../utils/controller-utils");

function getSignup(req, res) {
  if (
    req.query.error === "User already exists. Please login." ||
    req.query.error === "Error creating user. Please try again." ||
    req.query.error === "Error creating account. Please try again." ||
    req.query.error === "Invalid input. Please try again." ||
    req.query.error === "Passwords do not match. Please try again."
  ) {
    return res.render("customer/auth/create-account", {
      error: req.query.error,
      email: req.query.email,
      password: null,
      confirmPassword: null,
      fullname: req.query.fullname,
      csrfToken: req.csrfToken(),
      birthday: null,
      street: req.query.street,
      city: req.query.city,
      postalCode: req.query.postalCode,
      userData:null,
      accountDetails:null,
    });
  }
  res.render("customer/auth/create-account", {
    error: null,
    email: null,
    password: null,
    csrfToken: req.csrfToken(),
    confirmPassword: null,
    fullname: null,
    birthday: null,
    street: null,
    city: null,
    postalCode: null,
    userData:null,
    accountDetails:null
  });
}

function getLogin(req, res) {
  if (
    req.query.error === "Invalid email or password. Please try again." ||
    req.query.successMessage ===
      "Account created successfully. Please login." ||
    req.query.error === "Login to continue"
  ) {
    return res.render("customer/auth/login", {
      error: req.query.error,
      email: req.query.email,
      password: null,
      csrfToken: req.csrfToken(),
      successMessage: req.query.successMessage,
      userData:null,
      accountDetails:null,
    });
  }
  res.render("customer/auth/login", {
    error: null,
    email: null,
    password: null,
    csrfToken: req.csrfToken(),
    successMessage: null,
    userData:null,
    accountDetails:null,
  });
}

async function login(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
  const user = new User(email, password);
  let existingUser;
  try {
    existingUser = await user.getUserByEmail(user.email);
  } catch (error) {
    next(error);
    return;
  }

  if (!existingUser) {
    return redirectWithError(
      res,
      "/login",
      "Invalid email or password. Please try again.",
      { email, password }
    );
  }

  if (!existingUser.isVerified) {
    return res.status(401).render("shared/error", {
      message: "Your account is not verified. Please check your email.",
    });
  }

  const passwordIsCorrect = await user.hasMatchingPassword(
    existingUser.password
  );
  if (!passwordIsCorrect) {
    return redirectWithError(
      res,
      "/login",
      "Invalid email or password. Please try again.",
      { email, password }
    );
  }

  if (existingUser.twoFactorEnabled) {
    req.session.userId = existingUser._id;
    return res.redirect("/verify-2fa");
  }

  const userToken = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
  res.cookie("jwt", userToken, {
    httpOnly: true,
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.redirect("/home");
}

function getEnable2FA(req, res) {
  const secret = speakeasy.generateSecret({
    name: "Mianwali Code House Bank",
  });
  qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
    res.render("customer/auth/enable-2fa", {
      secret: secret.base32,
      qrCode: data_url,
      csrfToken: req.csrfToken(),
      error: null,
      userData: res.locals.user,
      accountDetails: null,
    });
  });
}

async function enable2FA(req, res) {
  const { secret, token } = req.body;
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
  });

  if (verified) {
    await db
      .getDb()
      .collection("Users")
      .updateOne(
        { _id: res.locals.user._id },
        { $set: { twoFactorSecret: secret, twoFactorEnabled: true } }
      );
    res.redirect("/home");
  } else {
    qrcode.toDataURL(
      `otpauth://totp/Mianwali%20Code%20House%20Bank?secret=${secret}`,
      (err, data_url) => {
        res.render("customer/auth/enable-2fa", {
          secret: secret,
          qrCode: data_url,
          csrfToken: req.csrfToken(),
          error: "Invalid token. Please try again.",
          userData: res.locals.user,
          accountDetails: null,
        });
      }
    );
  }
}

function getVerify2FA(req, res) {
  res.render("customer/auth/verify-2fa", {
    csrfToken: req.csrfToken(),
    error: null,
    userData: null,
    accountDetails: null,
  });
}

async function verify2FA(req, res) {
  const { token } = req.body;
  const user = await db
    .getDb()
    .collection("Users")
    .findOne({ _id: new ObjectId(req.session.userId) });

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token: token,
  });

  if (verified) {
    const userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    res.cookie("jwt", userToken, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect("/home");
  } else {
    res.render("customer/auth/verify-2fa", {
      csrfToken: req.csrfToken(),
      error: "Invalid token. Please try again.",
      userData: null,
      accountDetails: null,
    });
  }
}

function logout(req, res) {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/");
}

async function createUserAndAccount(req, res, next) {
  const { email, password, fullname, birthday, street, city, postalCode } =
    req.body;

  if (!emailValidator.validate(email)) {
    return res.status(400).render("shared/error", {
      message: "Invalid email address.",
    });
  }

  const user = new User(
    email,
    password,
    fullname,
    birthday,
    street,
    city,
    postalCode
  );

  try {
    const userExists = await user.userAlreadyExists();
    if (userExists) {
      return res.status(409).render("shared/error", {
        message: "User already exists.",
      });
    }

    const result = await user.signup();
    if (result.success) {
      await Account.create(result.userId);

      const verificationLink = `http://localhost:5500/verify-email?token=${result.verificationToken}`;
      try {
        await sendEmail(
          email,
          "Verify Your Email",
          `Please click this link to verify your email: ${verificationLink}`
        );
      } catch (error) {
        console.error("Failed to send verification email:", error);
        // Optionally, handle the error, e.g., by showing a message to the user
      }

      res.redirect(
        "/login?message=Registration successful! Please check your email to verify your account."
      );
    } else {
      next(new Error("User could not be created."));
    }
  } catch (error) {
    return next(error);
  }
}

async function verifyEmail(req, res, next) {
  const token = req.query.token;

  try {
    const user = await db
      .getDb()
      .collection("Users")
      .findOne({ verificationToken: { $eq: token } });

    if (!user) {
      return res.status(404).render("shared/error", {
        message: "Invalid verification token.",
      });
    }

    await db
      .getDb()
      .collection("Users")
      .updateOne(
        { _id: user._id },
        { $set: { isVerified: true }, $unset: { verificationToken: "" } }
      );

    res.redirect("/login?message=Email verified successfully! You can now log in.");
  } catch (error) {
    return next(error);
  }
}

const createToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
module.exports = {
  getSignup: getSignup,
  getLogin: getLogin,
  login: login,
  logout: logout,
  createUserAndAccount: createUserAndAccount,
  getEnable2FA: getEnable2FA,
  enable2FA: enable2FA,
  getVerify2FA: getVerify2FA,
  verify2FA: verify2FA,
  verifyEmail: verifyEmail,
};

