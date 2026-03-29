/**
 * Security Awareness Platform - API Routes: Dashboard
 * User stats, badges, progress, and leaderboards
 * 
 * NOTE: Currently uses mock data. Database integration ready.
 */

const express = require('express');
const router = express.Router();
const { param, query, validationResult } = require('express-validator');

// Mock data store - replace with DB calls when database is set up
const mockUsers = {
  'demo-user': {
    id: 'demo-user',
    displayName: 'Demo User',
    totalScore: 245,
    currentStreak: 3,
    longestStreak: 7,
    riskScore: 42,
    joinedAt: '2024-03-01'
  }
};

const mockAttempts = [
  { scenarioId: 'phish-002', title: 'CEO Wire Transfer Request', isCorrect: false, scoreDelta: -15, createdAt: '2024-03-29T10:00:00Z' },
  { scenarioId: 'browse-001', title: 'HTTP Website', isCorrect: true, scoreDelta: 10, createdAt: '2024-03-29T09:45:00Z' },
  { scenarioId: 'pwd-001', title: 'Create Strong Password', isCorrect: true, scoreDelta: 12, createdAt: '2024-03-29T09:30:00Z' },
  { scenarioId: 'social-001', title: 'LinkedIn Invitation', isCorrect: true, scoreDelta: 8, createdAt: '2024-03-28T15:20:00Z' },
  { scenarioId: 'phish-001', title: 'Mailbox Full Alert', isCorrect: false, scoreDelta: -10, createdAt: '2024-03-28T10:15:00Z' }
];

const mockBadges = [
  { id: 'first-report', name: 'First to Report', icon: '🚩', earnedAt: '2024-03-15' },
  { id: 'streak-3', name: '3-Day Streak', icon: '🔥', earnedAt: '2024-03-28' },
  { id: 'phishing-expert', name: 'Phishing Spotter', icon: '🎣', earnedAt: '2024-03-20' },
  { id: 'password-guru', name: 'Password Guru', icon: '🔐', earnedAt: '2024-03-25' }
];

const mockCategoryProgress = {
  phishing: { completed: 3, total: 4, accuracy: 75 },
  passwords: { completed: 3, total: 3, accuracy: 67 },
  social_engineering: { completed: 3, total: 3, accuracy: 67 },
  safe_browsing: { completed: 3, total: 4, accuracy: 50 }
};

const mockLeaderboard = [
  { rank: 1, userId: 'user-1', displayName: 'Security Pro', score: 1240, streak: 15, accuracy: 92, attempts: 45 },
  { rank: 2, userId: 'user-2', displayName: 'Phish Spotter', score: 980, streak: 8, accuracy: 88, attempts: 38 },
  { rank: 3, userId: 'demo-user', displayName: 'Demo User', score: 245, streak: 3, accuracy: 68, attempts: 12 },
  { rank: 4, userId: 'user-4', displayName: 'Cyber Learner', score: 180, streak: 2, accuracy: 65, attempts: 10 },
  { rank: 5, userId: 'user-5', displayName: 'Newbie', score: 45, streak: 0, accuracy: 45, attempts: 5 }
];

const mockChartData = {
  activity: [
    { date: '2024-03-23', attempts: 2, correct: 1, accuracy: 50, points: 5 },
    { date: '2024-03-24', attempts: 1, correct: 1, accuracy: 100, points: 12 },
    { date: '2024-03-25', attempts: 3, correct: 2, accuracy: 67, points: 15 },
    { date: '2024-03-26', attempts: 0, correct: 0, accuracy: 0, points: 0 },
    { date: '2024-03-27', attempts: 2, correct: 1, accuracy: 50, points: 3 },
    { date: '2024-03-28', attempts: 2, correct: 1, accuracy: 50, points: -2 },
    { date: '2024-03-29', attempts: 3, correct: 2, accuracy: 67, points: 7 }
  ],
  categories: [
    { category: 'phishing', total: 4, correct: 3, accuracy: 75 },
    { category: 'passwords', total: 3, correct: 2, accuracy: 67 },
    { category: 'social_engineering', total: 3, correct: 2, accuracy: 67 },
    { category: 'safe_browsing', total: 4, correct: 2, accuracy: 50 }
  ],
  difficulty: [
    { difficulty: 'easy', total: 5, correct: 4, accuracy: 80 },
    { difficulty: 'medium', total: 6, correct: 4, accuracy: 67 },
    { difficulty: 'hard', total: 3, correct: 1, accuracy: 33 }
  ],
  trend: [
    { week: '2024-03-01', accuracy: 55 },
    { week: '2024-03-08', accuracy: 60 },
    { week: '2024-03-15', accuracy: 65 },
    { week: '2024-03-22', accuracy: 68 }
  ]
};

/**
 * GET /api/dashboard/user/:userId
 * Get complete dashboard data for a user
 */
router.get('/user/:userId',
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
      const user = mockUsers[userId] || mockUsers['demo-user'];
      
      // Calculate progress stats from mock attempts
      const totalAttempts = mockAttempts.length;
      const correctAttempts = mockAttempts.filter(a => a.isCorrect).length;
      const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

      res.json({
        success: true,
        data: {
          user,
          progress: {
            totalAttempts,
            correctAnswers: correctAttempts,
            accuracy,
            avgTimeSeconds: 28,
            totalScenarios: 14,
            completedScenarios: totalAttempts
          },
          categories: mockCategoryProgress,
          badges: mockBadges,
          recentAttempts: mockAttempts.slice(0, 10),
          reports: 2
        }
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
  param('userId').isString().notEmpty(),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const user = mockUsers[userId] || mockUsers['demo-user'];
      
      const totalAttempts = mockAttempts.length;
      const correctAttempts = mockAttempts.filter(a => a.isCorrect).length;

      res.json({
        success: true,
        data: {
          user,
          progress: {
            totalAttempts,
            correctAnswers: correctAttempts,
            accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0
          },
          categories: mockCategoryProgress,
          reports: 2
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
  param('userId').isString().notEmpty(),
  async (req, res) => {
    try {
      res.json({
        success: true,
        data: mockBadges
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
  param('userId').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      res.json({
        success: true,
        data: mockAttempts.slice(0, limit)
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

      res.json({
        success: true,
        data: {
          category,
          leaderboard: mockLeaderboard.slice(0, limit)
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
  param('userId').isString().notEmpty(),
  query('days').optional().isInt({ min: 1, max: 365 }),
  async (req, res) => {
    try {
      res.json({
        success: true,
        data: mockChartData
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