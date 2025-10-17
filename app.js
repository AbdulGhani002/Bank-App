require("dotenv").config();
const express = require("express");
const csurf = require("csurf");
const { join } = require("path");
const helmet = require("helmet");
const session = require("express-session");
const db = require("./data/database");
const rateLimiterMiddleware = require("./middlewares/rate-limiter");
const baseRoutes = require("./routes/base.routes");
const authRoutes = require("./routes/auth.routes");
const accountRoutes = require("./routes/account.routes");
const healthRoutes = require("./routes/health.routes");
const adminRoutes = require("./routes/admin.routes");
const adminLinkageRoutes = require("./routes/admin-linkage.routes");
const cookieParser = require("cookie-parser");
const { checkUser, requireAuth } = require("./middlewares/auth-middleware");

const errorHandlerMiddleware = require("./middlewares/error-handler");
const listEndpoints = require("express-list-endpoints");

const app = express();
// Trust the first proxy (safer than enabling for all). Adjust if your deployment uses more hops.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      // Harden against mixed content and clickjacking per Sonar hotspot review
      upgradeInsecureRequests: [],
      blockAllMixedContent: [],
      frameAncestors: ["'none'"],
    },
  })
);
app.use(helmet.hsts({ maxAge: 15552000 }));
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));

app.set("view engine", "ejs");
app.set("views", join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.static("pictures"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimiterMiddleware.limiter);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    },
  })
);

if (process.env.NODE_ENV === 'test') {
  // In tests, bypass CSRF while keeping templates functional
  app.use((req, res, next) => {
    if (typeof req.csrfToken !== 'function') {
      req.csrfToken = () => 'test-csrf-token';
    }
    next();
  });
} else {
  const csrfProtection = csurf({ cookie: { secure: true, httpOnly: true, sameSite: 'lax' } });
  app.use(csrfProtection);
}


app.use(checkUser);
app.use(baseRoutes);
app.use(authRoutes);
app.use(accountRoutes);
app.use(healthRoutes);
app.use(adminRoutes);
app.use(adminLinkageRoutes);

// Admin-only routes listing
function requireAdmin(req, res, next) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (res.locals.user && adminEmail && res.locals.user.email === adminEmail) {
    return next();
  }
  return res.status(403).send("Forbidden");
}
app.get('/routes', requireAuth, requireAdmin, (req, res) => {
  res.json(listEndpoints(app));
});
app.use(errorHandlerMiddleware);

if (require.main === module) {
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
}

module.exports = app;
