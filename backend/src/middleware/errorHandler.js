const { config } = require('../config/env');
const { AppError } = require('../errors/AppError');

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;
  let status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

  // Handle Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    status = 'fail';
    message = `Invalid value for parameter: ${err.path}`;
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    status = 'fail';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. Must be unique.`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    status = 'fail';
    message = 'Validation Error';
    details = Object.values(err.errors || {}).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  const requestId = req.id || req.headers['x-request-id'] || 'unknown';

  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path} - 500 Error:`, err);
    if (config.NODE_ENV === 'production') {
      message = 'An unexpected error occurred on the server';
      details = null;
    }
  }

  res.status(statusCode).json({
    status,
    requestId,
    message,
    ...(details ? { details } : {}),
    ...(config.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
