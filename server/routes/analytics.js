/**
 * Security Awareness Platform - API Routes: Analytics
 * Metrics computation and insights endpoints
 */

const express = require('express');
const router = express.Router();
const { 
  computePhishingMetrics, 
  computeOverallMetrics,
  generateInsights,
  calculateCategoryRiskScores,
  calculateHesitationMetrics
} = require('../../src/domain/analytics/metrics');

// Mock data - replace with DB queries
const mockEvents = [
  { userId: 'demo-user', scenarioId: 'phish-001', eventType: 'scenario_viewed', timestamp: '2024-03-29T10:00:00Z' },
  { userId: 'demo-user', scenarioId: 'phish-001', eventType: 'option_hovered', optionId: 'o1', timestamp: '2024-03-29T10:00:05Z' },
  { userId: 'demo-user', scenarioId: 'phish-001', eventType: 'option_selected', optionId: 'o1', timestamp: '2024-03-29T10:00:12Z' },
  { userId: 'demo-user', scenarioId: 'phish-001', eventType: 'submitted', timestamp: '2024-03-29T10:00:12Z' },
  { userId: 'demo-user', scenarioId: 'browse-001', eventType: 'scenario_viewed', timestamp: '2024-03-29T09:45:00Z' },
  { userId: 'demo-user', scenarioId: 'browse-001', eventType: 'option_selected', optionId: 'o2', timestamp: '2024-03-29T09:45:08Z' },
  { userId: 'demo-user', scenarioId: 'browse-001', eventType: 'submitted', timestamp: '2024-03-29T09:45:08Z' },
  { userId: 'demo-user', scenarioId: 'browse-001', eventType: 'reported', timestamp: '2024-03-29T09:45:10Z' }
];

const mockResults = [
  { scenarioId: 'phish-001', riskCategory: 'phishing', isCorrect: false, timeSpentSeconds: 12 },
  { scenarioId: 'browse-001', riskCategory: 'safe_browsing', isCorrect: true, timeSpentSeconds: 8 },
  { scenarioId: 'pwd-001', riskCategory: 'passwords', isCorrect: true, timeSpentSeconds: 15 }
];

/**
 * GET /api/analytics/user/:userId
 * Get comprehensive user analytics
 */
router.get('/user/:userId', (req, res) => {
  const { userId } = req.params;

  // Filter data for user
  const userEvents = mockEvents.filter(e => e.userId === userId);
  const userResults = mockResults.filter(r => 
    userEvents.some(e => e.scenarioId === r.scenarioId)
  );

  // Compute metrics
  const overallMetrics = computeOverallMetrics(userEvents, userResults);
  const phishingMetrics = computePhishingMetrics(userEvents, userResults);
  const insights = generateInsights(overallMetrics);
  const riskScores = calculateCategoryRiskScores(overallMetrics);
  const hesitationMetrics = calculateHesitationMetrics(userEvents);

  res.json({
    success: true,
    data: {
      userId,
      summary: {
        totalAttempts: userResults.length,
        correctAnswers: userResults.filter(r => r.isCorrect).length,
        accuracy: userResults.length > 0 
          ? Math.round((userResults.filter(r => r.isCorrect).length / userResults.length) * 100)
          : 0
      },
      categories: overallMetrics,
      phishing: phishingMetrics,
      riskScores,
      hesitation: hesitationMetrics,
      insights
    }
  });
});

/**
 * GET /api/analytics/user/:userId/category/:category
 * Get metrics for specific category
 */
router.get('/user/:userId/category/:category', (req, res) => {
  const { userId, category } = req.params;

  const userEvents = mockEvents.filter(e => e.userId === userId);
  const userResults = mockResults.filter(r => 
    r.riskCategory === category &&
    userEvents.some(e => e.scenarioId === r.scenarioId)
  );

  const categoryEvents = userEvents.filter(e => 
    userResults.some(r => r.scenarioId === e.scenarioId)
  );

  const avgTime = userResults.length > 0
    ? Math.round(userResults.reduce((sum, r) => sum + r.timeSpentSeconds, 0) / userResults.length)
    : 0;

  res.json({
    success: true,
    data: {
      userId,
      category,
      totalAttempts: userResults.length,
      correctAnswers: userResults.filter(r => r.isCorrect).length,
      accuracy: userResults.length > 0 
        ? Math.round((userResults.filter(r => r.isCorrect).length / userResults.length) * 100)
        : 0,
      avgTimeSpentSeconds: avgTime,
      reportRate: categoryEvents.filter(e => e.eventType === 'reported').length / (userResults.length || 1),
      hesitation: calculateHesitationMetrics(categoryEvents)
    }
  });
});

/**
 * GET /api/analytics/insights/:userId
 * Get personalized insights only
 */
router.get('/insights/:userId', (req, res) => {
  const { userId } = req.params;

  const userEvents = mockEvents.filter(e => e.userId === userId);
  const userResults = mockResults.filter(r => 
    userEvents.some(e => e.scenarioId === r.scenarioId)
  );

  const overallMetrics = computeOverallMetrics(userEvents, userResults);
  const insights = generateInsights(overallMetrics);

  res.json({
    success: true,
    data: {
      userId,
      insights,
      generatedAt: new Date().toISOString()
    }
  });
});

/**
 * GET /api/analytics/trends
 * Get platform-wide trends (admin only)
 */
router.get('/trends', (req, res) => {
  // TODO: Add admin check

  res.json({
    success: true,
    data: {
      totalUsers: 156,
      totalAttempts: 3421,
      avgAccuracy: 68,
      topWeakness: 'phishing',
      topStrength: 'passwords',
      avgRiskScore: 47,
      period: 'last_30_days'
    }
  });
});

module.exports = router;