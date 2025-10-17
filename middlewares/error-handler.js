const db = require("../data/database");

const handleError = async (err, req, res, next) => {
  console.error(err.stack || err);
  const statusCode = err.statusCode || 500;

  const user = res.locals.user || null;
  let account = null;
  if (user) {
    account = await db.getDb().collection("Accounts").findOne({ userId: user._id });
  }

  res.status(statusCode).render("shared/500", {
    userData: user,
    accountDetails: account,
  });
};

module.exports = handleError;
