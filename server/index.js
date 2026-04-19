/**
 * Security Awareness Platform - Main Server
 * Express.js API with PostgreSQL and security hardening
 */

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", CLIENT_URL],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: NODE_ENV === 'production' ? CLIENT_URL : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    }
  }
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.'
    }
  }
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      version: '1.0.0',
      database: 'PostgreSQL'
    }
  });
});

// Import routes
const authRoutes = require('./routes/auth.js');
const scenarioRoutes = require('./routes/scenarios.js');
const dashboardRoutes = require('./routes/dashboard.js');
const aiRoutes = require('./routes/ai.js');

// Wire routes - strict rate limit only on login/register
app.use('/api/auth/login', authLimiter, authRoutes);
app.use('/api/auth/register', authLimiter, authRoutes);
app.use('/api/auth', authRoutes); // other auth routes (refresh, me, logout) use general limiter
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDev = NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: isDev ? err.message : 'An internal error occurred',
      ...(isDev && { stack: err.stack })
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🛡️  Security Awareness Platform API');
  console.log('='.repeat(50));
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Port: ${PORT}`);
  console.log(`Client URL: ${CLIENT_URL}`);
  console.log(`Database: PostgreSQL`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
});

module.exports = app;
