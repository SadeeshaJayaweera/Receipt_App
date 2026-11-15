const express = require('express');
const mongoose = require('mongoose');
const { config } = require('../config/env');

const router = express.Router();

/**
 * GET /api/health
 * Comprehensive system health and metrics overview (backward-compatible)
 */
router.get('/', async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const memory = process.memoryUsage();

  res.status(200).json({
    status: 'OK',
    mongodb: isDbConnected ? 'Connected' : 'Disconnected',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    memory: {
      rss: `${Math.round(memory.rss / (1024 * 1024))}MB`,
      heapTotal: `${Math.round(memory.heapTotal / (1024 * 1024))}MB`,
      heapUsed: `${Math.round(memory.heapUsed / (1024 * 1024))}MB`
    }
  });
});

/**
 * GET /api/health/live
 * Kubernetes / Docker container liveness probe (fast ping)
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/health/ready
 * Readiness probe: checks if backing database is reachable and ready to serve traffic
 */
router.get('/ready', async (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    return res.status(503).json({
      status: 'unready',
      database: 'disconnected',
      message: 'Backing MongoDB connection is not established',
      timestamp: new Date().toISOString()
    });
  }

  // Ping database if connected to verify responsive read/write
  try {
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const latencyMs = Date.now() - startTime;

    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      dbLatencyMs: latencyMs,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(503).json({
      status: 'unready',
      database: 'error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
