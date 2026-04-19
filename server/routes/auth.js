/**
 * Security Awareness Platform - API Routes: Authentication
 * JWT-based auth with PostgreSQL database
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { createUser, getUserByEmail, verifyPassword, getUserById } = require('../db/users.js');

// JWT Configuration from environment
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-64-characters-long';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// In-memory refresh token store (use Redis in production)
const refreshTokens = new Map();

/**
 * Generate JWT tokens
 */
function generateTokens(userId, email, role = 'learner') {
  const accessToken = jwt.sign(
    { userId, email, role, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('displayName').trim().isLength({ min: 2, max: 50 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: errors.array()
        }
      });
    }

    try {
      const { email, password, displayName } = req.body;

      // Create user in database
      const user = await createUser({ email, password, displayName, role: 'learner' });

      // Generate tokens with role
      const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);
      refreshTokens.set(refreshToken, user.id);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            role: user.role,
            totalScore: 0,
            riskScore: 0,
            currentStreak: 0,
            longestStreak: 0
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: JWT_EXPIRES_IN
          }
        }
      });
    } catch (error) {
      if (error.code === 'DUPLICATE_EMAIL') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'An account with this email already exists'
          }
        });
      }
      
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create account'
        }
      });
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user and issue tokens
 */
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: errors.array()
        }
      });
    }

    try {
      const { email, password } = req.body;

      // Find user in database
      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // Check if account is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Account has been disabled'
          }
        });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      // Generate tokens with role
      const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);
      refreshTokens.set(refreshToken, user.id);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            role: user.role,
            totalScore: user.total_score,
            riskScore: user.risk_score,
            currentStreak: user.current_streak,
            longestStreak: user.longest_streak,
            lastActivityAt: user.last_activity_at,
            createdAt: user.created_at
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: JWT_EXPIRES_IN
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to authenticate'
        }
      });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh',
  body('refreshToken').exists(),
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token exists
      const userId = refreshTokens.get(refreshToken);
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid or expired refresh token'
          }
        });
      }

      // Verify token signature
      const decoded = jwt.verify(refreshToken, JWT_SECRET);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Find user
      const user = await getUserById(userId);
      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'User not found or disabled'
          }
        });
      }

      // Generate new tokens with role
      const tokens = generateTokens(user.id, user.email, user.role);
      refreshTokens.delete(refreshToken);
      refreshTokens.set(tokens.refreshToken, user.id);

      res.json({
        success: true,
        data: {
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: JWT_EXPIRES_IN
          }
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    }
  }
);

/**
 * POST /api/auth/logout
 * Revoke refresh token
 */
router.post('/logout',
  body('refreshToken').optional(),
  async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        refreshTokens.delete(refreshToken);
      }

      res.json({
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to logout'
        }
      });
    }
  }
);

/**
 * POST /api/auth/logout-all
 * Revoke all user sessions (requires auth)
 */
router.post('/logout-all',
  async (req, res) => {
    try {
      // Get user from auth middleware (attached to req)
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        });
      }

      // Remove all refresh tokens for this user
      for (const [token, uid] of refreshTokens.entries()) {
        if (uid === userId) {
          refreshTokens.delete(token);
        }
      }

      res.json({
        success: true,
        data: {
          message: 'All sessions logged out'
        }
      });
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to logout all sessions'
        }
      });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user (requires auth)
 */
router.get('/me',
  async (req, res) => {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'No token provided'
          }
        });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Find user in database
      const user = await getUserById(decoded.userId);
      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not found or disabled'
          }
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            role: user.role,
            totalScore: user.total_score,
            riskScore: user.risk_score,
            currentStreak: user.current_streak,
            longestStreak: user.longest_streak,
            lastActivityAt: user.last_activity_at,
            createdAt: user.created_at,
            updatedAt: user.updated_at
          }
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token'
        }
      });
    }
  }
);

module.exports = router;
