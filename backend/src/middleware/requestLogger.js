const { logger } = require('../utils/logger');

function requestLogger(req, res, next) {
  const startTime = Date.now();
  const requestId = req.id || req.headers['x-request-id'] || 'unknown';

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const path = req.originalUrl || req.url;
    const userId = req.user?.id || req.user?._id || req.userId || undefined;

    const meta = {
      requestId,
      method,
      path,
      statusCode,
      durationMs,
      ...(userId ? { userId } : {}),
      ip: req.ip || req.socket?.remoteAddress
    };

    const message = `${method} ${path} ${statusCode} - ${durationMs}ms`;

    if (statusCode >= 500) {
      logger.error(message, meta);
    } else if (statusCode >= 400) {
      logger.warn(message, meta);
    } else {
      logger.info(message, meta);
    }
  });

  next();
}

module.exports = requestLogger;
