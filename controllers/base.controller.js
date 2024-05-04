const authMiddleware = require('../middlewares/auth-middleware');
const getIndex = (req, res) => {
  res.render("index");
};

const getHome = (req, res) => {
  const existingUser = JSON.parse(req.cookies.existingUser);
  const existingAccount = JSON.parse(req.cookies.existingAccount);
  res.render("customer/home-page", {
    userData: existingUser,
    accountDetails: existingAccount,
  });
};
module.exports = {
  getIndex: getIndex,
  getHome:getHome
};
