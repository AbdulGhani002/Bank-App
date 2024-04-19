const User = require('../models/user.model');
const validation = require('../utils/validation');
const Account = require("../models/account.model");
const logger = require("../utils/logger");


function getSignup(req, res) {

    res.render('customer/auth/create-account');
}

async function signup(req, res, next) {
    const enteredData = {
        email: req.body.email,
        confirmEmail: req.body['confirm-email'],
        password: req.body.password,
        fullname: req.body.fullname,
        street: req.body.street,
        postal: req.body.postal,
        city: req.body.city,
    };

    if (
        !validation.userDetailsAreValid(
            req.body.email,
            req.body.password,
            req.body.fullname,
            req.body.street,
            req.body.postal,
            req.body.city
        ) ||
        !validation.emailIsConfirmed(req.body.email, req.body['confirm-email'])
    ) {
        res.redirect('/signup');
        return;
    }

    const user = new User(
        req.body.email,
        req.body.password,
        req.body.fullname,
        req.body.street,
        req.body.postal,
        req.body.city
    );

    try {
        const existsAlready = await user.existsAlready();

        if (existsAlready) {
            res.redirect('/signup');
            return;
        }

        await user.signup();
    } catch (error) {
        next(error);
        return;
    }

    res.redirect('/login');
}

function getLogin(req, res) {
    res.render('customer/auth/login');
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
        res.redirect('/login');
        return;
    }

    const passwordIsCorrect = await user.hasMatchingPassword(
        existingUser.password
    );
    if (!passwordIsCorrect) {
        res.redirect('/login');
        return;
    }

    let existingAccount;
    try {
        existingAccount= await user.getAccountDetails(existingUser);
    } catch (error){
        console.log(error)
    }
    res.redirect('/home?userId=' + existingUser._id + '&accountId=' + existingAccount._id);
}

async function createUserAndAccount(req, res) {
    const { email, password, fullname, birthday, street, city, postalCode } =
        req.body;

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
    createUserAndAccount
};
