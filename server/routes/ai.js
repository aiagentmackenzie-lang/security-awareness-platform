/**
 * AI API Routes
 * Security Awareness Platform
 * 
 * AI-powered endpoints for recommendations and feedback
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { 
  generateScenarioRecommendation, 
  generateFeedback,
  generateLearningPath 
} = require('../services/aiService.js');
const { getUserStats } = require('../db/progress.js');
const { getScenarioById } = require('../db/scenarios.js');

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
 * POST /api/ai/recommend
 * Get AI-powered scenario recommendation
 */
router.post('/recommend',
  requireAuth,
  body('weaknesses').optional().isArray(),
  body('recentScenarios').optional().isArray(),
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
      const userId = req.user.userId;
      const { weaknesses = [], recentScenarios = [] } = req.body;

      // Get user stats if weaknesses not provided
      let weakCategories = weaknesses;
      if (weakCategories.length === 0) {
        const stats = await getUserStats(userId);
        weakCategories = stats.categories?.filter(c => c.accuracy < 70).map(c => ({
          category: c.risk_category,
          accuracy: parseInt(c.accuracy)
        })) || [];
      }

      const recommendation = await generateScenarioRecommendation(
        userId,
        weakCategories,
        recentScenarios
      );

      res.json({
        success: true,
        data: recommendation
      });
    } catch (error) {
      console.error('Recommendation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate recommendation'
        }
      });
    }
  }
);

/**
 * POST /api/ai/feedback
 * Get AI-generated personalized feedback
 */
router.post('/feedback',
  requireAuth,
  body('scenarioId').isString().notEmpty(),
  body('isCorrect').isBoolean(),
  body('selectedOptions').optional().isArray(),
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
      const userId = req.user.userId;
      const { scenarioId, isCorrect, selectedOptions = [] } = req.body;

      // Get scenario details
      const scenario = await getScenarioById(scenarioId);
      if (!scenario) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Scenario not found'
          }
        });
      }

      // Get user history for this category
      const userStats = await getUserStats(userId);
      const categoryHistory = userStats.categories?.find(
        c => c.risk_category === scenario.type
      ) || {};

      const feedback = await generateFeedback(
        userId,
        scenario,
        isCorrect,
        selectedOptions,
        {
          attempts: categoryHistory.total_attempts || 0,
          accuracy: categoryHistory.accuracy || 0
        }
      );

      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      console.error('Feedback error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate feedback'
        }
      });
    }
  }
);

/**
 * POST /api/ai/learning-path
 * Get AI-generated learning path
 */
router.post('/learning-path',
  requireAuth,
  async (req, res) => {
    try {
      const userId = req.user.userId;

      // Get user stats
      const userStats = await getUserStats(userId);

      const learningPath = await generateLearningPath(userId, {
        totalScore: userStats.totalAttempts * 10, // approximate
        accuracy: userStats.accuracy,
        currentStreak: userStats.currentStreak,
        categories: userStats.categories?.reduce((acc, c) => {
          acc[c.risk_category] = c;
          return acc;
        }, {})
      });

      res.json({
        success: true,
        data: learningPath
      });
    } catch (error) {
      console.error('Learning path error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate learning path'
        }
      });
    }
  }
);

module.exports = router;
