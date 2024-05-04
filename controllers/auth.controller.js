const User = require("../models/user.model");
const validation = require("../utils/validation");
const Account = require("../models/account.model");
const logger = require("../utils/logger");

function getSignup(req, res) {
  if(req.query.error === "User already exists. Please login." || req.query.error === "Error creating user. Please try again." || req.query.error === "Error creating account. Please try again." || req.query.error === "Invalid input. Please try again." || req.query.error === "Passwords do not match. Please try again."){
    return res.render("customer/auth/create-account", {error: req.query.error});
  }
  res.render("customer/auth/create-account" ,{error: null});
}

function getLogin(req, res) {
  if(req.query.error === "Invalid email or password. Please try again."|| req.query.error === "Invalid email or password. Please try again."){
    return res.render("customer/auth/login", {error: req.query.error});
  }
  res.render("customer/auth/login" , {error: null});
}

async function login(req, res, next) {
  const user = new User(req.body.email, req.body.password);
  let existingUser;
  try {
    existingUser = await user.getUserByEmail(user.email);
  } catch (error) {
    next(error);
    return;
  }

  if (!existingUser) {
    res.redirect("/login?error=Invalid email or password. Please try again.");
    return;
  }

  const passwordIsCorrect = await user.hasMatchingPassword(
    existingUser.password
  );
  if (!passwordIsCorrect) {
    res.redirect("/login?error=Invalid email or password. Please try again.");
    return;
  }

  let existingAccount;
  try {
    existingAccount = await user.getAccountDetails(existingUser);
  } catch (error) {
    console.log(error);
  }
  res.redirect(
    "/home?userId=" + existingUser._id + "&accountId=" + existingAccount._id
  );
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
      res.redirect("/signup?error=Invalid input. Please try again.");
      return;
    }
    if (!validation.passwordIsConfirmed(password, confirmPassword)) {
      res.redirect("/signup?error=Passwords do not match. Please try again.");
      return;
    }
    const userExists = await newUser.userAlreadyExists();
    if (userExists) {
      return res.redirect("/signup?error=User already exists. Please login.");
    }

    const signupResult = await newUser.signup();
    if (!signupResult.success) {
      return res.redirect("/signup?error=Error creating user. Please try again.");
    }

    const createdUser = await newUser.getUserByEmail(email);

    if (createdUser && createdUser.userId) {
      const newAccount = new Account(createdUser.userId, 500);

      await newAccount.createBankAccount();

      return res.redirect("/login");
    } else {
      return res.redirect("/signup?error=Error creating account. Please try again.");
    }
  } catch (error) {
    logger.error("Error during user and account creation:", error);

    return res.redirect("/signup?error=Error creating user. Please try again.");
  }
}
module.exports = {
  getSignup,
  getLogin,
  login,
  createUserAndAccount,
};
