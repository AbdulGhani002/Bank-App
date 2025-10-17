const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    headers: true,
    // Explicitly trust proxy addresses since app enables trust proxy
    trustProxy: true,
  });

  module.exports = {limiter};