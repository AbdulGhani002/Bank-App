const CryptoJs = require("crypto-js");
const User = require("../models/user.model");
const validation = require("../utils/validation");
const Account = require("../models/account.model");
const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");

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
      password: req.query.password,
      confirmPassword: req.query.confirmPassword,
      fullname: req.query.fullname,
      birthday: req.query.birthday,
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
    confirmPassword: null,
    fullname: null,
    birthday: null,
    street: null,
    city: null,
    postalCode: null,
    userData:null,
    accountDetails:null,
  });
}

function getLogin(req, res) {
  if (
    req.query.error === "Invalid email or password. Please try again." ||
    req.query.error === "Invalid email or password. Please try again." ||
    req.query.successMessage ===
      "Account created successfully. Please login." ||
    req.query.error === "Login to continue"
  ) {
    return res.render("customer/auth/login", {
      error: req.query.error,
      email: req.query.email,
      password: req.query.password,
      successMessage: req.query.successMessage,
      userData:null,
      accountDetails:null,
    });
  }
  res.render("customer/auth/login", {
    error: null,
    email: null,
    password: null,
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
    res.redirect(
      "/login?error=Invalid email or password. Please try again.&email=" +
        email +
        "&password=" +
        password
    );
    return;
  }

  const passwordIsCorrect = await user.hasMatchingPassword(
    existingUser.password
  );
  if (!passwordIsCorrect) {
    res.redirect(
      "/login?error=Invalid email or password. Please try again.&" +
        "email=" +
        email +
        "&password=" +
        password
    );
    return;
  }

  let existingAccount;
  try {
    existingAccount = await user.getAccountDetails(existingUser);
  } catch (error) {
    console.log(error);
  }
  const token = createToken(existingUser.userId);
  res.cookie("jwt", token, {
    maxAge: 3 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  });
  const existingUserId = CryptoJs.AES.encrypt(
    existingUser.userId,
    process.env.SECRET_KEY
  ).toString();
  const existingAccountId = CryptoJs.AES.encrypt(
    existingAccount.accountId,
    process.env.SECRET_KEY
  ).toString();
  res.cookie("existingUserId", JSON.stringify(existingUserId));
  res.cookie("existingAccountId", JSON.stringify(existingAccountId));

  res.redirect("/home");
}

async function createUserAndAccount(req, res) {
  const {
    email,
    password,
    fullname,
    birthday,
    street,
    city,
    postalCode,
    confirmPassword,
  } = req.body;

  try {
    const newUser = new User(
      email,
      password,
      fullname,
      birthday,
      street,
      city,
      postalCode
    );
    if (
      !validation.userDetailsAreValid(
        email,
        password,
        fullname,
        street,
        postalCode,
        city
      )
    ) {
      res.redirect(
        "/signup?error=Invalid input. Please try again.&email=" +
          email +
          "&password=" +
          password +
          "&confirmPassword=" +
          confirmPassword +
          "&fullname=" +
          fullname +
          "&birthday=" +
          birthday +
          "&street=" +
          street +
          "&city=" +
          city +
          "&postalCode=" +
          postalCode
      );
      return;
    }
    if (!validation.passwordIsConfirmed(password, confirmPassword)) {
      res.redirect(
        "/signup?error=Passwords do not match. Please try again.&email=" +
          email +
          "&password=" +
          password +
          "&confirmPassword=" +
          confirmPassword +
          "&fullname=" +
          fullname +
          "&birthday=" +
          birthday +
          "&street=" +
          street +
          "&city=" +
          city +
          "&postalCode=" +
          postalCode
      );
      return;
    }
    const userExists = await newUser.userAlreadyExists();
    if (userExists) {
      return res.redirect(
        "/signup?error=User already exists. Please login.&email=" +
          email +
          "&password=" +
          password +
          "&confirmPassword=" +
          confirmPassword +
          "&fullname=" +
          fullname +
          "&birthday=" +
          birthday +
          "&street=" +
          street +
          "&city=" +
          city +
          "&postalCode=" +
          postalCode
      );
    }

    const signupResult = await newUser.signup();
    if (!signupResult.success) {
      return res.redirect(
        "/signup?error=Error creating user. Please try again.&email=" +
          email +
          "&password=" +
          password +
          "&confirmPassword=" +
          confirmPassword +
          "&fullname=" +
          fullname +
          "&birthday=" +
          birthday +
          "&street=" +
          street +
          "&city=" +
          city +
          "&postalCode=" +
          postalCode
      );
    }

    const createdUser = await newUser.getUserByEmail(email);

    if (createdUser && createdUser.userId) {
      const newAccount = new Account(createdUser.userId, 500);

      await newAccount.createBankAccount();

      return res.redirect(
        "/login?successMessage=Account created successfully. Please login."
      );
    } else {
      return res.redirect(
        "/signup?error=Error creating account. Please try again.&email=" +
          email +
          "&password=" +
          password +
          "&confirmPassword=" +
          confirmPassword +
          "&fullname=" +
          fullname +
          "&birthday=" +
          birthday +
          "&street=" +
          street +
          "&city=" +
          city +
          "&postalCode=" +
          postalCode
      );
    }
  } catch (error) {
    logger.error("Error during user and account creation:", error);

    return res.redirect(
      "/signup?error=Error creating user. Please try again.&email=" +
        email +
        "&password=" +
        password +
        "&confirmPassword=" +
        confirmPassword +
        "&fullname=" +
        fullname +
        "&birthday=" +
        birthday +
        "&street=" +
        street +
        "&city=" +
        city +
        "&postalCode=" +
        postalCode
    );
  }
}
const createToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
async function logout(req, res) {
  res.cookie("existingUserId", "", {
    maxAge: 1,
  });
  res.cookie("existingAccountId", "", {
    maxAge: 1,
  });
  res.cookie("jwt", "", {
    maxAge: 1,
  });
  res.redirect("/login");
}
module.exports = {
  getSignup,
  getLogin,
  login,
  createUserAndAccount,
  logout,
};
