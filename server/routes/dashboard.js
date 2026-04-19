/**
 * Security Awareness Platform - API Routes: Dashboard
 * User stats, badges, progress, and leaderboards (PostgreSQL)
 */

const express = require('express');
const router = express.Router();
const { param, query, validationResult } = require('express-validator');
const { getUserById } = require('../db/users.js');
const { 
  getDashboardData, 
  getUserStats, 
  getUserBadges, 
  getUserAttempts,
  getGlobalLeaderboard,
  getCategoryLeaderboard 
} = require('../db/progress.js');

/**
 * Authentication middleware
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }
  
  const token = authHeader.substring(7);
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production-64-characters-long';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }
    });
  }
}

/**
 * GET /api/dashboard/user/:userId
 * Get complete dashboard data for a user
 */
router.get('/user/:userId',
  requireAuth,
  param('userId').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user ID',
          details: errors.array()
        }
      });
    }

    try {
      const { userId } = req.params;
      
      // Verify user can only access their own data (unless admin)
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only access your own dashboard data'
          }
        });
      }

      const data = await getDashboardData(userId);
      
      if (!data) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load dashboard data'
        }
      });
    }
  }
);

/**
 * GET /api/dashboard/user/:userId/stats
 * Get user statistics only
 */
router.get('/user/:userId/stats',
  requireAuth,
  param('userId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Verify authorization
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
      }

      const stats = await getUserStats(userId);
      const user = await getUserById(userId);
      
      res.json({
        success: true,
        data: {
          user,
          stats
        }
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load user stats'
        }
      });
    }
  }
);

/**
 * GET /api/dashboard/user/:userId/badges
 * Get user's earned badges
 */
router.get('/user/:userId/badges',
  requireAuth,
  param('userId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Verify authorization
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
      }

      const badges = await getUserBadges(userId);
      
      res.json({
        success: true,
        data: badges
      });
    } catch (error) {
      console.error('Badges error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load badges'
        }
      });
    }
  }
);

/**
 * GET /api/dashboard/user/:userId/attempts
 * Get user's recent attempts
 */
router.get('/user/:userId/attempts',
  requireAuth,
  param('userId').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 10;
      
      // Verify authorization
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
      }

      const attempts = await getUserAttempts(userId, { limit });
      
      res.json({
        success: true,
        data: attempts
      });
    } catch (error) {
      console.error('Attempts error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load attempts'
        }
      });
    }
  }
);

/**
 * GET /api/dashboard/leaderboard
 * Get global leaderboard
 */
router.get('/leaderboard',
  query('category').optional().isIn(['phishing', 'passwords', 'social_engineering', 'safe_browsing', 'overall']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
    try {
      const category = req.query.category || 'overall';
      const limit = parseInt(req.query.limit) || 20;

      let leaderboard;
      if (category === 'overall') {
        leaderboard = await getGlobalLeaderboard(limit);
      } else {
        leaderboard = await getCategoryLeaderboard(category, limit);
      }

      res.json({
        success: true,
        data: {
          category,
          leaderboard
        }
      });
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load leaderboard'
        }
      });
    }
  }
);

/**
 * GET /api/dashboard/charts/user/:userId
 * Get chart data for user analytics
 */
router.get('/charts/user/:userId',
  requireAuth,
  param('userId').isString().notEmpty(),
  query('days').optional().isInt({ min: 1, max: 365 }),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const days = parseInt(req.query.days) || 30;
      
      // Verify authorization
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
      }

      const stats = await getUserStats(userId);
      
      // Format data for charts
      const activity = stats.recentActivity.map(a => ({
        date: a.date,
        attempts: parseInt(a.attempts) || 0,
        correct: parseInt(a.correct) || 0,
        accuracy: parseInt(a.accuracy) || 0
      }));
      
      const categories = stats.categories.map(c => ({
        category: c.risk_category,
        accuracy: parseInt(c.accuracy) || 0,
        attempts: parseInt(c.total_attempts) || 0
      }));

      res.json({
        success: true,
        data: {
          activity: activity.slice(0, days),
          categories,
          summary: {
            totalAttempts: stats.totalAttempts,
            accuracy: stats.accuracy,
            currentStreak: stats.currentStreak
          }
        }
      });
    } catch (error) {
      console.error('Charts error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load chart data'
        }
      });
    }
  }
);

module.exports = router;
