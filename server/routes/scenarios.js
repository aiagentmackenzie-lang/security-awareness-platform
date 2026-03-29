/**
 * Security Awareness Platform - API Routes: Scenarios
 * Scenario retrieval and submission with PostgreSQL persistence
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { 
  getScenarioById, 
  getScenarioByScenarioId,
  getRandomScenario, 
  getAllScenarios,
  checkAnswer
} = require('../db/scenarios.js');
const { saveAttempt } = require('../db/progress.js');
const { 
  updateUserStats, 
  updateRiskProfile, 
  updateLastActivity 
} = require('../db/users.js');

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
 * GET /api/scenarios
 * Get all scenarios with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { type, difficulty } = req.query;
    
    const scenarios = await getAllScenarios({
      type: type || undefined,
      difficulty: difficulty || undefined,
      activeOnly: true
    });
    
    res.json({
      success: true,
      data: scenarios,
      meta: {
        total: scenarios.length,
        filters: { type, difficulty }
      }
    });
  } catch (error) {
    console.error('Get scenarios error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to load scenarios'
      }
    });
  }
});

/**
 * GET /api/scenarios/counts
 * Get scenario counts by type
 */
router.get('/counts', async (req, res) => {
  try {
    const scenarios = await getAllScenarios({ activeOnly: true });
    
    const counts = scenarios.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        total: scenarios.length,
        byType: counts
      }
    });
  } catch (error) {
    console.error('Get counts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to load counts'
      }
    });
  }
});

/**
 * GET /api/scenarios/next
 * Get the next scenario for a user
 */
router.get('/next', requireAuth, async (req, res) => {
  try {
    const { type, difficulty } = req.query;
    const userId = req.user.userId;
    
    const scenario = await getRandomScenario({
      type: type || undefined,
      difficulty: difficulty || undefined
    });
    
    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No scenarios available'
        }
      });
    }
    
    res.json({
      success: true,
      data: scenario
    });
  } catch (error) {
    console.error('Get next scenario error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get next scenario'
      }
    });
  }
});

/**
 * GET /api/scenarios/:id
 * Get a specific scenario by ID
 */
router.get('/:id', 
  param('id').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid scenario ID',
          details: errors.array()
        }
      });
    }
    
    try {
      const scenario = await getScenarioById(req.params.id);
      
      if (!scenario) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Scenario with ID '${req.params.id}' not found`
          }
        });
      }
      
      res.json({
        success: true,
        data: scenario
      });
    } catch (error) {
      console.error('Get scenario error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to load scenario'
        }
      });
    }
  }
);

/**
 * POST /api/scenarios/:id/submit
 * Submit an answer for a scenario
 */
router.post('/:id/submit',
  requireAuth,
  param('id').isString().notEmpty(),
  body('selectedOptionIds').isArray({ min: 1 }),
  body('timeSpentSeconds').optional().isInt({ min: 0 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid submission',
          details: errors.array()
        }
      });
    }
    
    try {
      const userId = req.user.userId;
      const scenarioId = req.params.id;
      const { selectedOptionIds, timeSpentSeconds = 0 } = req.body;
      
      // Get scenario
      const scenario = await getScenarioById(scenarioId);
      if (!scenario) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Scenario with ID '${scenarioId}' not found`
          }
        });
      }
      
      // Check answer
      const isCorrect = await checkAnswer(scenarioId, selectedOptionIds);
      
      // Calculate score
      const basePoints = isCorrect ? 10 : -5;
      const difficultyMultiplier = scenario.difficulty === 'easy' ? 1 : 
                                    scenario.difficulty === 'hard' ? 2 : 1.5;
      const scoreDelta = Math.round(basePoints * difficultyMultiplier);
      
      // Save attempt
      const attempt = await saveAttempt({
        userId,
        scenarioId,
        selectedOptionIds,
        isCorrect,
        scoreDelta,
        timeSpentSeconds,
        riskCategory: scenario.type
      });
      
      // Update user stats
      const stats = await updateUserStats(userId, scoreDelta, isCorrect);
      
      // Update risk profile
      const riskScore = isCorrect ? Math.max(0, 50 - (stats.correctAttempts * 2)) : 
                       Math.min(100, 50 + (stats.totalAttempts - stats.correctAttempts) * 5);
      await updateRiskProfile(userId, scenario.type, riskScore, isCorrect);
      
      // Update last activity
      await updateLastActivity(userId);
      
      res.json({
        success: true,
        data: {
          scenarioId: scenario.scenario_id,
          isCorrect,
          scoreDelta,
          correctOptions: scenario.options.filter(o => o.is_correct).map(o => o.id),
          explanation: scenario.explanation,
          userStats: stats,
          attemptId: attempt.id,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Submit answer error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to submit answer'
        }
      });
    }
  }
);

module.exports = router;
