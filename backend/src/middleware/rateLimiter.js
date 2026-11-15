const rateLimit = require('express-rate-limit');
const { config } = require('../config/env');

const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: config.RATE_LIMIT_MAX || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString()
  },
  skip: () => config.NODE_ENV === 'test' // Skip global rate limit in test unless explicitly enabled
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Max 10 attempts per 15 minutes for login/register
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many authentication attempts from this IP, please try again in 15 minutes.',
    timestamp: new Date().toISOString()
  },
  skip: () => config.NODE_ENV === 'test'
});

module.exports = {
  apiLimiter,
  authLimiter
};
