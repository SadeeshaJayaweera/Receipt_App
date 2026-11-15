const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { config } = require('./src/config/env');

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  config.FRONTEND_URL,
  /\.vercel\.app$/
].filter(Boolean);

// Middleware - Order matters!
// CORS must come before helmet for preflight requests
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Check if origin matches allowed origins
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Helmet with relaxed settings for development
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  }

  res.status(statusCode).json({
    status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
    message: err.message || 'Internal Server Error',
    ...(err.details ? { details: err.details } : {}),
    ...(config.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

// Only listen if not in Vercel serverless environment
if (config.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = config.PORT;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// Export for Vercel serverless
module.exports = app;
