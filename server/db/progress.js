/**
 * Progress Repository Layer
 * Security Awareness Platform
 * 
 * Database operations for tracking user progress, attempts, and achievements
 */

const { query, getClient } = require('./pool.js');

/**
 * Save a scenario attempt
 * @param {Object} attemptData - Attempt data
 * @param {string} attemptData.userId - User UUID
 * @param {string} attemptData.scenarioId - Scenario UUID
 * @param {string[]} attemptData.selectedOptionIds - Selected options
 * @param {boolean} attemptData.isCorrect - Whether answer was correct
 * @param {number} attemptData.scoreDelta - Points earned
 * @param {number} [attemptData.timeSpentSeconds] - Time spent
 * @param {string} attemptData.riskCategory - Category of scenario
 * @returns {Promise<Object>} Saved attempt
 */
async function saveAttempt({ userId, scenarioId, selectedOptionIds, isCorrect, scoreDelta, timeSpentSeconds = 0, riskCategory }) {
  const result = await query(
    `INSERT INTO scenario_attempts 
     (user_id, scenario_id, selected_option_ids, is_correct, score_delta, time_spent_seconds, risk_category)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, scenarioId, selectedOptionIds, isCorrect, scoreDelta, timeSpentSeconds, riskCategory]
  );
  return result.rows[0];
}

/**
 * Get user's attempt history
 * @param {string} userId - User UUID
 * @param {Object} options - Query options
 * @param {number} [options.limit=50] - Max results
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Promise<Array>} Attempt history with scenario details
 */
async function getUserAttempts(userId, { limit = 50, offset = 0 } = {}) {
  const result = await query(
    `SELECT sa.*, s.title as scenario_title, s.type as scenario_type
     FROM scenario_attempts sa
     JOIN scenarios s ON sa.scenario_id = s.id
     WHERE sa.user_id = $1
     ORDER BY sa.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

/**
 * Get user's total stats
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} User statistics
 */
async function getUserStats(userId) {
  // Total attempts and accuracy
  const attemptsResult = await query(
    `SELECT 
      COUNT(*) as total_attempts,
      COUNT(*) FILTER (WHERE is_correct = true) as correct_attempts,
      AVG(score_delta) as avg_score,
      SUM(time_spent_seconds) as total_time
     FROM scenario_attempts
     WHERE user_id = $1`,
    [userId]
  );
  
  const stats = attemptsResult.rows[0];
  
  // Category breakdown
  const categoriesResult = await query(
    `SELECT 
      risk_category,
      COUNT(*) as attempts,
      COUNT(*) FILTER (WHERE is_correct = true) as correct,
      AVG(score_delta) as avg_score
     FROM scenario_attempts
     WHERE user_id = $1
     GROUP BY risk_category`,
    [userId]
  );
  
  // Recent activity (last 30 days)
  const activityResult = await query(
    `SELECT 
      DATE(created_at) as date,
      COUNT(*) as attempts,
      COUNT(*) FILTER (WHERE is_correct = true) as correct
     FROM scenario_attempts
     WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY date DESC`,
    [userId]
  );
  
  // Calculate streak
  const streakResult = await query(
    `WITH daily_activity AS (
      SELECT DISTINCT DATE(created_at) as activity_date
      FROM scenario_attempts
      WHERE user_id = $1
      ORDER BY activity_date DESC
    ),
    streak_calc AS (
      SELECT 
        activity_date,
        activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date))::int AS streak_group
      FROM daily_activity
    )
    SELECT COUNT(*) as current_streak
    FROM streak_calc
    WHERE streak_group = (SELECT streak_group FROM streak_calc ORDER BY activity_date DESC LIMIT 1)`,
    [userId]
  );
  
  return {
    totalAttempts: parseInt(stats.total_attempts) || 0,
    correctAttempts: parseInt(stats.correct_attempts) || 0,
    accuracy: stats.total_attempts > 0 
      ? Math.round((stats.correct_attempts / stats.total_attempts) * 100) 
      : 0,
    averageScore: Math.round(stats.avg_score) || 0,
    totalTimeSpent: parseInt(stats.total_time) || 0,
    currentStreak: parseInt(streakResult.rows[0]?.current_streak) || 0,
    categories: categoriesResult.rows,
    recentActivity: activityResult.rows
  };
}

/**
 * Get user's recent attempts (last N days)
 * @param {string} userId - User UUID
 * @param {number} [days=30] - Number of days
 * @returns {Promise<Array>} Recent attempts
 */
async function getRecentAttempts(userId, days = 30) {
  const result = await query(
    `SELECT sa.*, s.title as scenario_title, s.type
     FROM scenario_attempts sa
     JOIN scenarios s ON sa.scenario_id = s.id
     WHERE sa.user_id = $1 
       AND sa.created_at >= CURRENT_DATE - INTERVAL '${days} days'
     ORDER BY sa.created_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Get weak categories for a user
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Categories with lowest accuracy
 */
async function getWeakCategories(userId) {
  const result = await query(
    `SELECT 
      risk_category,
      COUNT(*) as total_attempts,
      COUNT(*) FILTER (WHERE is_correct = true) as correct_attempts,
      CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE is_correct = true) * 100.0) / COUNT(*), 1)
        ELSE 0
      END as accuracy
     FROM scenario_attempts
     WHERE user_id = $1
     GROUP BY risk_category
     HAVING COUNT(*) >= 3
     ORDER BY accuracy ASC
     LIMIT 3`,
    [userId]
  );
  return result.rows;
}

/**
 * Get user's earned badges
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Badges with earned date
 */
async function getUserBadges(userId) {
  const result = await query(
    `SELECT b.*, ub.earned_at
     FROM badges b
     JOIN user_badges ub ON b.id = ub.badge_id
     WHERE ub.user_id = $1
     ORDER BY ub.earned_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Award a badge to user
 * @param {string} userId - User UUID
 * @param {string} badgeId - Badge UUID
 * @returns {Promise<Object|null>} Awarded badge or null if already has it
 */
async function awardBadge(userId, badgeId) {
  try {
    const result = await query(
      `INSERT INTO user_badges (user_id, badge_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, badge_id) DO NOTHING
       RETURNING *`,
      [userId, badgeId]
    );
    return result.rows[0] || null;
  } catch (err) {
    if (err.code === '23503') {
      // Foreign key violation - badge doesn't exist
      return null;
    }
    throw err;
  }
}

/**
 * Check if user has a badge
 * @param {string} userId - User UUID
 * @param {string} badgeId - Badge UUID
 * @returns {Promise<boolean>}
 */
async function hasBadge(userId, badgeId) {
  const result = await query(
    `SELECT 1 FROM user_badges WHERE user_id = $1 AND badge_id = $2`,
    [userId, badgeId]
  );
  return result.rows.length > 0;
}

/**
 * Get global leaderboard
 * @param {number} [limit=50] - Number of users
 * @returns {Promise<Array>} Top users
 */
async function getGlobalLeaderboard(limit = 50) {
  const result = await query(
    `SELECT 
      u.id,
      u.display_name,
      u.total_score,
      u.longest_streak,
      COUNT(DISTINCT sa.scenario_id) as scenarios_completed,
      CASE 
        WHEN COUNT(sa.id) > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE sa.is_correct = true) * 100.0) / COUNT(sa.id), 1)
        ELSE 0
      END as accuracy
     FROM users u
     LEFT JOIN scenario_attempts sa ON u.id = sa.user_id
     WHERE u.is_active = true
     GROUP BY u.id, u.display_name, u.total_score, u.longest_streak
     ORDER BY u.total_score DESC, u.longest_streak DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/**
 * Get category-specific leaderboard
 * @param {string} category - Risk category
 * @param {number} [limit=50] - Number of users
 * @returns {Promise<Array>} Top users in category
 */
async function getCategoryLeaderboard(category, limit = 50) {
  const result = await query(
    `SELECT 
      u.id,
      u.display_name,
      COUNT(*) as attempts,
      COUNT(*) FILTER (WHERE sa.is_correct = true) as correct_attempts,
      CASE 
        WHEN COUNT(*) > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE sa.is_correct = true) * 100.0) / COUNT(*), 1)
        ELSE 0
      END as accuracy,
      AVG(sa.score_delta) as avg_score
     FROM users u
     JOIN scenario_attempts sa ON u.id = sa.user_id
     WHERE sa.risk_category = $1 AND u.is_active = true
     GROUP BY u.id, u.display_name
     HAVING COUNT(*) >= 5
     ORDER BY accuracy DESC, AVG(sa.score_delta) DESC
     LIMIT $2`,
    [category, limit]
  );
  return result.rows;
}

/**
 * Get dashboard data for a user
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Complete dashboard data
 */
async function getDashboardData(userId) {
  const [stats, recentAttempts, weakCategories, badges, leaderboard] = await Promise.all([
    getUserStats(userId),
    getRecentAttempts(userId, 7),
    getWeakCategories(userId),
    getUserBadges(userId),
    getGlobalLeaderboard(10)
  ]);
  
  // Find user's rank
  const userRankResult = await query(
    `SELECT COUNT(*) + 1 as rank
     FROM users
     WHERE total_score > (SELECT total_score FROM users WHERE id = $1)
       AND is_active = true`,
    [userId]
  );
  
  return {
    stats,
    recentAttempts,
    weakCategories,
    badges,
    leaderboard,
    userRank: parseInt(userRankResult.rows[0]?.rank) || null
  };
}

module.exports = {
  saveAttempt,
  getUserAttempts,
  getUserStats,
  getRecentAttempts,
  getWeakCategories,
  getUserBadges,
  awardBadge,
  hasBadge,
  getGlobalLeaderboard,
  getCategoryLeaderboard,
  getDashboardData
};
