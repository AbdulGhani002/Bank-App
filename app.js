const express = require("express");
const { join } = require("path");
const session = require("express-session");
const db = require("./data/database");
const baseRoutes = require("./routes/base.routes");
const authRoutes = require("./routes/auth.routes");
const accountRoutes = require("./routes/account.routes");
const sessionsConfig = require("./config/sessions");
const sessionMiddleware = require("./middlewares/session.middleware");

const errorHandlerMiddleware = require("./middlewares/error-handler");
const { json } = require("stream/consumers");

require("dotenv").config();
const app = express();

app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.static("pictures"));
app.use(express.urlencoded({ extended: true }));

app.use(session(sessionsConfig.sessionConfig));
app.use(sessionMiddleware);
app.use(baseRoutes);
app.use(authRoutes);
app.use(accountRoutes);
app.use(errorHandlerMiddleware);
db.connectToDatabase()
  .then(() => {
    app.listen(process.env.PORT || 5500);
  })
  .catch((error) => {
    console.log(error);
  });
