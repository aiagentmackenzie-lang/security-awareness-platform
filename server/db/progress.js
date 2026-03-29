/**
 * Security Awareness Platform - Progress Persistence API
 * Database operations for user progress, scores, and attempts
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'security_awareness',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

// Test connection
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

/**
 * Save a scenario attempt
 * @param {Object} attempt - Attempt data
 * @returns {Promise<Object>} Saved attempt
 */
async function saveAttempt(attempt) {
  const query = `
    INSERT INTO scenario_attempts (
      user_id, scenario_id, selected_option_ids, is_correct, 
      score_delta, time_spent_seconds, risk_category
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const values = [
    attempt.userId,
    attempt.scenarioId,
    attempt.selectedOptionIds,
    attempt.isCorrect,
    attempt.scoreDelta,
    attempt.timeSpentSeconds,
    attempt.riskCategory
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Save a behavioral event
 * @param {Object} event - Event data
 * @returns {Promise<Object>} Saved event
 */
async function saveEvent(event) {
  const query = `
    INSERT INTO behavior_events (
      user_id, scenario_id, event_type, option_id,
      metadata, session_id, user_agent, ip_address
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [
    event.userId,
    event.scenarioId,
    event.eventType,
    event.optionId,
    event.metadata ? JSON.stringify(event.metadata) : null,
    event.sessionId,
    event.userAgent,
    event.ipAddress
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Update user score and stats
 * @param {string} userId - User ID
 * @param {Object} updates - Score updates
 * @returns {Promise<Object>} Updated user
 */
async function updateUserScore(userId, updates) {
  const query = `
    UPDATE users
    SET 
      total_score = total_score + $2,
      risk_score = GREATEST(0, LEAST(100, risk_score + $3)),
      current_streak = $4,
      longest_streak = GREATEST(longest_streak, $4),
      last_activity_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;

  const values = [
    userId,
    updates.scoreDelta || 0,
    updates.riskDelta || 0,
    updates.newStreak || 0
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Award badges to user
 * @param {string} userId - User ID
 * @param {Array} badgeIds - Badge IDs to award
 */
async function awardBadges(userId, badgeIds) {
  const query = `
    INSERT INTO user_badges (user_id, badge_id)
    SELECT $1, id FROM badges WHERE badge_id = ANY($2)
    ON CONFLICT DO NOTHING
  `;

  await pool.query(query, [userId, badgeIds]);
}

/**
 * Get user's earned badges
 * @param {string} userId - User ID
 * @returns {Promise<Array>} User's badges
 */
async function getUserBadges(userId) {
  const query = `
    SELECT b.badge_id, b.name, b.description, b.icon, ub.earned_at
    FROM user_badges ub
    JOIN badges b ON ub.badge_id = b.id
    WHERE ub.user_id = $1
    ORDER BY ub.earned_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

/**
 * Get user's statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User stats
 */
async function getUserStats(userId) {
  // Get basic user info
  const userQuery = 'SELECT * FROM users WHERE id = $1';
  const userResult = await pool.query(userQuery, [userId]);
  const user = userResult.rows[0];

  if (!user) return null;

  // Get attempt counts
  const attemptsQuery = `
    SELECT 
      COUNT(*) as total_attempts,
      SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_answers,
      AVG(time_spent_seconds) as avg_time
    FROM scenario_attempts
    WHERE user_id = $1
  `;
  const attemptsResult = await pool.query(attemptsQuery, [userId]);

  // Get category stats
  const categoryQuery = `
    SELECT 
      risk_category,
      COUNT(*) as total,
      SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct
    FROM scenario_attempts
    WHERE user_id = $1
    GROUP BY risk_category
  `;
  const categoryResult = await pool.query(categoryQuery, [userId]);

  // Get report count
  const reportsQuery = `
    SELECT COUNT(*) as report_count
    FROM behavior_events
    WHERE user_id = $1 AND event_type = 'reported'
  `;
  const reportsResult = await pool.query(reportsQuery, [userId]);

  return {
    user: {
      id: user.id,
      displayName: user.display_name,
      totalScore: user.total_score,
      currentStreak: user.current_streak,
      longestStreak: user.longest_streak,
      riskScore: user.risk_score,
      joinedAt: user.created_at
    },
    progress: {
      totalAttempts: parseInt(attemptsResult.rows[0]?.total_attempts) || 0,
      correctAnswers: parseInt(attemptsResult.rows[0]?.correct_answers) || 0,
      accuracy: attemptsResult.rows[0]?.total_attempts 
        ? Math.round((attemptsResult.rows[0].correct_answers / attemptsResult.rows[0].total_attempts) * 100)
        : 0,
      avgTimeSeconds: Math.round(attemptsResult.rows[0]?.avg_time) || 0
    },
    categories: categoryResult.rows.reduce((acc, row) => {
      acc[row.risk_category] = {
        total: parseInt(row.total),
        correct: parseInt(row.correct),
        accuracy: Math.round((row.correct / row.total) * 100)
      };
      return acc;
    }, {}),
    reports: parseInt(reportsResult.rows[0]?.report_count) || 0
  };
}

/**
 * Get recent attempts
 * @param {string} userId - User ID
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} Recent attempts
 */
async function getRecentAttempts(userId, limit = 10) {
  const query = `
    SELECT 
      sa.scenario_id,
      s.title,
      sa.is_correct,
      sa.score_delta,
      sa.created_at
    FROM scenario_attempts sa
    JOIN scenarios s ON sa.scenario_id = s.id
    WHERE sa.user_id = $1
    ORDER BY sa.created_at DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [userId, limit]);
  return result.rows;
}

module.exports = {
  saveAttempt,
  saveEvent,
  updateUserScore,
  awardBadges,
  getUserBadges,
  getUserStats,
  getRecentAttempts,
  pool
};