const User = require("../models/user.model");
const validation = require("../utils/validation");
const Account = require("../models/account.model");
const logger = require("../utils/logger");

function getSignup(req, res) {
  res.render("customer/auth/create-account");
}

function getLogin(req, res) {
  res.render("customer/auth/login");
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
    res.redirect("/login");
    return;
  }

  const passwordIsCorrect = await user.hasMatchingPassword(
    existingUser.password
  );
  if (!passwordIsCorrect) {
    res.redirect("/login");
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
      res.redirect("/signup");
      return;
    }
    if (!validation.passwordIsConfirmed(password, confirmPassword)) {
      res.redirect("/signup");
      return;
    }
    const userExists = await newUser.userAlreadyExists();
    if (userExists) {
      return res.redirect("/signup");
    }

    const signupResult = await newUser.signup();
    if (!signupResult.success) {
      return res.redirect("/signup");
    }

    const createdUser = await newUser.getUserByEmail(email);

    if (createdUser && createdUser.userId) {
      const newAccount = new Account(createdUser.userId, 500);

      await newAccount.createBankAccount();

      return res.redirect("/login");
    } else {
      return res.redirect("/signup");
    }
  } catch (error) {
    logger.error("Error during user and account creation:", error);

    return res.redirect("/signup");
  }
}
module.exports = {
  getSignup,
  getLogin,
  login,
  createUserAndAccount,
};
