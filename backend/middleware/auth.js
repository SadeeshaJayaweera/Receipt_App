const jwt = require('jsonwebtoken');
const { config } = require('../src/config/env');
const tokenBlacklistService = require('../src/services/tokenBlacklistService');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'fail', message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'No token provided' });
  }

  if (tokenBlacklistService.isRevoked(token)) {
    return res.status(401).json({ status: 'fail', message: 'Token has been revoked. Please sign in again.' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.userId = decoded.userId;
    req.token = token;
    req.tokenPayload = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'fail', message: 'Token has expired. Please sign in again.' });
    }
    return res.status(401).json({ status: 'fail', message: 'Invalid token' });
  }
};

module.exports = authMiddleware;