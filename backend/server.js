const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { config } = require('./src/config/env');
const requestIdMiddleware = require('./src/middleware/requestId');
const errorHandler = require('./src/middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./src/middleware/rateLimiter');
const { sanitizeMiddleware } = require('./src/middleware/sanitize');

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  config.FRONTEND_URL,
  /\.vercel\.app$/
].filter(Boolean);

// CORS configuration with strict production allowlist
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });

    if (isAllowed || config.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS origin denied'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}));

// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", ...allowedOrigins.filter(o => typeof o === 'string')]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));

app.use(compression());

// Strict request-size limits to protect against DoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Input sanitization against MongoDB operator injection & prototype pollution
app.use(sanitizeMiddleware);

// Global rate limiting
app.use('/api', apiLimiter);

app.use(requestIdMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] [${req.id}] ${req.method} ${req.path}`);
  next();
});

// MongoDB Connection (Only auto-connect if not in test environment without URI)
if (config.NODE_ENV !== 'test' && config.MONGODB_URI) {
  mongoose.connect(config.MONGODB_URI).then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
}

// Connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

// Routes
app.use('/api', require('./src/routes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Central error handling middleware
app.use(errorHandler);

// Only listen if not in Vercel serverless environment
if (config.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = config.PORT;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// Export for Vercel serverless
module.exports = app;
