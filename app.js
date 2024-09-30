require("dotenv").config();
const express = require("express");
const csurf = require("csurf");
const { join } = require("path");
const db = require("./data/database");
const rateLimiterMiddleware = require("./middlewares/rate-limiter");
const baseRoutes = require("./routes/base.routes");
const authRoutes = require("./routes/auth.routes");
const accountRoutes = require("./routes/account.routes");
const cookieParser = require("cookie-parser");
const { checkUser, requireAuth } = require("./middlewares/auth-middleware");

const errorHandlerMiddleware = require("./middlewares/error-handler");

const app = express();

app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.static("pictures"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

app.use(rateLimiterMiddleware.limiter);
app.get("*", checkUser);
app.use(baseRoutes);
app.use(authRoutes);
app.use(accountRoutes);
app.use(errorHandlerMiddleware);

db.connectToDatabase()
  .then(() => {
    const port = process.env.PORT || 5500;
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });
