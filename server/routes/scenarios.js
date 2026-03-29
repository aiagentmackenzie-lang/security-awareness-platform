/**
 * Security Awareness Platform - API Routes: Scenarios
 * Scenario retrieval and submission endpoints
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { 
  getScenarioById, 
  getRandomScenario, 
  getScenariosByType,
  getAllScenarios,
  getScenarioCounts
} = require('../../src/domain/engine/scenarios');
const { evaluateAnswer, validateSubmission } = require('../../src/domain/engine/evaluator');

/**
 * GET /api/scenarios
 * Get all scenarios with optional filtering
 */
router.get('/', (req, res) => {
  const { type, difficulty, limit = 50 } = req.query;
  
  let scenarios = getAllScenarios();
  
  // Filter by type
  if (type) {
    scenarios = scenarios.filter(s => s.type === type);
  }
  
  // Filter by difficulty
  if (difficulty) {
    scenarios = scenarios.filter(s => s.difficulty === difficulty);
  }
  
  // Limit results
  scenarios = scenarios.slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: scenarios,
    meta: {
      total: scenarios.length,
      filters: { type, difficulty }
    }
  });
});

/**
 * GET /api/scenarios/counts
 * Get scenario counts by type
 */
router.get('/counts', (req, res) => {
  res.json({
    success: true,
    data: getScenarioCounts()
  });
});

/**
 * GET /api/scenarios/next
 * Get the next scenario for a user (random for now)
 */
router.get('/next', (req, res) => {
  const { type, difficulty } = req.query;
  
  let scenario;
  
  // Try to get a scenario matching criteria
  if (type) {
    const typeScenarios = getScenariosByType(type);
    if (difficulty) {
      scenario = typeScenarios.find(s => s.difficulty === difficulty);
    }
    if (!scenario && typeScenarios.length > 0) {
      scenario = typeScenarios[Math.floor(Math.random() * typeScenarios.length)];
    }
  }
  
  // Fallback to random
  if (!scenario) {
    scenario = getRandomScenario();
  }
  
  res.json({
    success: true,
    data: scenario
  });
});

/**
 * GET /api/scenarios/:id
 * Get a specific scenario by ID
 */
router.get('/:id', 
  param('id').isString().notEmpty(),
  (req, res) => {
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
    
    const scenario = getScenarioById(req.params.id);
    
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
  }
);

/**
 * POST /api/scenarios/:id/submit
 * Submit an answer for a scenario
 */
router.post('/:id/submit',
  param('id').isString().notEmpty(),
  body('selectedOptionIds').isArray({ min: 1 }),
  body('timeSpentSeconds').optional().isInt({ min: 0 }),
  body('userId').optional().isString(),
  (req, res) => {
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
    
    const scenario = getScenarioById(req.params.id);
    
    if (!scenario) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Scenario with ID '${req.params.id}' not found`
        }
      });
    }
    
    // Additional validation
    const validation = validateSubmission(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.errors.join(', ')
        }
      });
    }
    
    // Evaluate the answer
    const { selectedOptionIds, timeSpentSeconds, userId } = req.body;
    const evaluation = evaluateAnswer(scenario, selectedOptionIds);
    
    // Add time spent if provided
    if (timeSpentSeconds) {
      evaluation.timeSpentSeconds = timeSpentSeconds;
    }
    
    // TODO: Persist to database
    // - Save scenario attempt
    // - Update user score/streak
    // - Check for badge awards
    // - Update risk profile
    
    res.json({
      success: true,
      data: {
        scenarioId: scenario.scenarioId,
        evaluation,
        timestamp: new Date().toISOString()
      }
    });
  }
);

module.exports = router;