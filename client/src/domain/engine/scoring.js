/**
 * Security Awareness Platform - Scoring Engine
 * Gamification logic: scores, streaks, difficulty multipliers, badges
 */

// Base points for different outcomes
const BASE_POINTS = {
  correct: 10,
  incorrect: -10,
  report: 5,
  streakBonus: 2
};

// Category multipliers (higher risk = higher reward)
const CATEGORY_MULTIPLIERS = {
  phishing: 1.5,
  passwords: 1.3,
  social_engineering: 1.4,
  safe_browsing: 1.2
};

// Difficulty multipliers
const DIFFICULTY_MULTIPLIERS = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.0
};

/**
 * Calculate score delta for a scenario attempt
 * @param {boolean} isCorrect - Whether answer was correct
 * @param {string} category - Risk category
 * @param {string} difficulty - Scenario difficulty
 * @param {number} streak - Current streak
 * @param {boolean} reported - Whether user reported the scenario
 * @returns {number} Score delta
 */
function calculateScoreDelta(isCorrect, category, difficulty, streak = 0, reported = false) {
  const base = isCorrect ? BASE_POINTS.correct : BASE_POINTS.incorrect;
  const catMult = CATEGORY_MULTIPLIERS[category] || 1;
  const diffMult = DIFFICULTY_MULTIPLIERS[difficulty] || 1;
  const streakBonus = isCorrect ? streak * BASE_POINTS.streakBonus : 0;
  const reportBonus = reported ? BASE_POINTS.report : 0;

  return Math.round((base * catMult * diffMult) + streakBonus + reportBonus);
}

/**
 * Update streak based on attempt result
 * @param {number} currentStreak - Current streak
 * @param {boolean} isCorrect - Whether answer was correct
 * @param {string} lastAttemptDate - ISO date of last attempt
 * @returns {Object} New streak info
 */
function updateStreak(currentStreak, isCorrect, lastAttemptDate) {
  const today = new Date().toDateString();
  const lastDate = lastAttemptDate ? new Date(lastAttemptDate).toDateString() : null;
  
  // Already completed today
  if (lastDate === today) {
    return {
      currentStreak,
      longestStreak: currentStreak,
      streakMaintained: true,
      isNewDay: false
    };
  }

  // Check if streak continues (yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  let newStreak = currentStreak;
  let streakMaintained = false;

  if (lastDate === yesterday.toDateString()) {
    // Continuing streak
    if (isCorrect) {
      newStreak = currentStreak + 1;
      streakMaintained = true;
    }
  } else if (!lastDate || lastDate !== yesterday.toDateString()) {
    // New streak or broken
    newStreak = isCorrect ? 1 : 0;
    streakMaintained = isCorrect;
  }

  return {
    currentStreak: newStreak,
    longestStreak: Math.max(currentStreak, newStreak),
    streakMaintained,
    isNewDay: true
  };
}

/**
 * Calculate risk score based on user performance
 * @param {number} currentRisk - Current risk score (0-100)
 * @param {boolean} isCorrect - Whether answer was correct
 * @param {string} severity - 'low' | 'medium' | 'high'
 * @returns {number} New risk score (0-100)
 */
function calculateRiskScore(currentRisk, isCorrect, severity) {
  const impactMap = {
    low: 5,
    medium: 10,
    high: 15
  };

  const impact = impactMap[severity] || 5;
  const change = isCorrect ? -impact : impact;
  const newRisk = Math.max(0, Math.min(100, currentRisk + change));

  return Math.round(newRisk);
}

/**
 * Check if user qualifies for any badges
 * @param {Object} userStats - User statistics
 * @param {Array} earnedBadgeIds - Already earned badge IDs
 * @returns {Array} Newly earned badges
 */
function checkBadgeQualification(userStats, earnedBadgeIds = []) {
  const newBadges = [];

  const badgeCriteria = [
    {
      id: 'first-attempt',
      name: 'First Steps',
      description: 'Complete your first scenario',
      icon: '🎯',
      check: (stats) => stats.totalAttempts >= 1
    },
    {
      id: 'first-correct',
      name: 'Spot On',
      description: 'Get your first correct answer',
      icon: '✅',
      check: (stats) => stats.correctAnswers >= 1
    },
    {
      id: 'streak-3',
      name: '3-Day Streak',
      description: 'Complete scenarios 3 days in a row',
      icon: '🔥',
      check: (stats) => stats.currentStreak >= 3
    },
    {
      id: 'streak-7',
      name: 'Week Warrior',
      description: 'Complete scenarios 7 days in a row',
      icon: '⚡',
      check: (stats) => stats.currentStreak >= 7
    },
    {
      id: 'streak-30',
      name: 'Security Champion',
      description: 'Complete scenarios 30 days in a row',
      icon: '👑',
      check: (stats) => stats.currentStreak >= 30
    },
    {
      id: 'score-100',
      name: 'Century',
      description: 'Reach 100 total points',
      icon: '💯',
      check: (stats) => stats.totalScore >= 100
    },
    {
      id: 'score-500',
      name: 'High Scorer',
      description: 'Reach 500 total points',
      icon: '🏆',
      check: (stats) => stats.totalScore >= 500
    },
    {
      id: 'phishing-master',
      name: 'Phishing Spotter',
      description: 'Complete 5 phishing scenarios correctly',
      icon: '🎣',
      check: (stats) => stats.categoryStats?.phishing?.correct >= 5
    },
    {
      id: 'password-master',
      name: 'Password Pro',
      description: 'Complete 5 password scenarios correctly',
      icon: '🔐',
      check: (stats) => stats.categoryStats?.passwords?.correct >= 5
    },
    {
      id: 'se-master',
      name: 'Social Shield',
      description: 'Complete 5 social engineering scenarios correctly',
      icon: '🎭',
      check: (stats) => stats.categoryStats?.social_engineering?.correct >= 5
    },
    {
      id: 'browsing-master',
      name: 'Safe Surfer',
      description: 'Complete 5 safe browsing scenarios correctly',
      icon: '🌐',
      check: (stats) => stats.categoryStats?.safe_browsing?.correct >= 5
    },
    {
      id: 'first-report',
      name: 'First to Report',
      description: 'Report your first suspicious scenario',
      icon: '🚩',
      check: (stats) => stats.reports >= 1
    },
    {
      id: 'reporter-10',
      name: 'Security Sentinel',
      description: 'Report 10 suspicious scenarios',
      icon: '🚨',
      check: (stats) => stats.reports >= 10
    },
    {
      id: 'accuracy-80',
      name: 'Sharp Eye',
      description: 'Maintain 80% accuracy over 20+ attempts',
      icon: '🎯',
      check: (stats) => stats.totalAttempts >= 20 && (stats.correctAnswers / stats.totalAttempts) >= 0.8
    },
    {
      id: 'perfect-day',
      name: 'Perfect Day',
      description: 'Get 5 correct answers in a single day',
      icon: '⭐',
      check: (stats) => stats.dailyCorrect >= 5
    }
  ];

  for (const badge of badgeCriteria) {
    if (!earnedBadgeIds.includes(badge.id) && badge.check(userStats)) {
      newBadges.push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        earnedAt: new Date().toISOString()
      });
    }
  }

  return newBadges;
}

/**
 * Get level based on total score
 * @param {number} totalScore - User's total score
 * @returns {Object} Level info
 */
function getLevel(totalScore) {
  const levels = [
    { min: 0, level: 1, name: 'Novice', title: 'Security Novice' },
    { min: 100, level: 2, name: 'Apprentice', title: 'Security Apprentice' },
    { min: 250, level: 3, name: 'Adept', title: 'Security Adept' },
    { min: 500, level: 4, name: 'Expert', title: 'Security Expert' },
    { min: 1000, level: 5, name: 'Master', title: 'Security Master' },
    { min: 2000, level: 6, name: 'Champion', title: 'Security Champion' }
  ];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalScore >= levels[i].min) {
      const nextLevel = levels[i + 1];
      return {
        ...levels[i],
        progress: nextLevel ? ((totalScore - levels[i].min) / (nextLevel.min - levels[i].min)) * 100 : 100,
        nextLevelAt: nextLevel?.min || null
      };
    }
  }

  return levels[0];
}

/**
 * Calculate category-specific stats
 * @param {Array} attempts - User's attempts
 * @returns {Object} Stats per category
 */
function calculateCategoryStats(attempts) {
  const stats = {
    phishing: { total: 0, correct: 0 },
    passwords: { total: 0, correct: 0 },
    social_engineering: { total: 0, correct: 0 },
    safe_browsing: { total: 0, correct: 0 }
  };

  for (const attempt of attempts) {
    const cat = attempt.riskCategory;
    if (stats[cat]) {
      stats[cat].total++;
      if (attempt.isCorrect) {
        stats[cat].correct++;
      }
    }
  }

  return stats;
}

module.exports = {
  calculateScoreDelta,
  updateStreak,
  calculateRiskScore,
  checkBadgeQualification,
  getLevel,
  calculateCategoryStats,
  BASE_POINTS,
  CATEGORY_MULTIPLIERS,
  DIFFICULTY_MULTIPLIERS
};