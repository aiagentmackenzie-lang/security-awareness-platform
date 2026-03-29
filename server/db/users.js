/**
 * User Repository Layer
 * Security Awareness Platform
 * 
 * Database operations for user management with bcrypt password hashing
 */

const bcrypt = require('bcryptjs');
const { query, getClient } = require('./pool.js');

const SALT_ROUNDS = 12;

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.password - Plain text password (will be hashed)
 * @param {string} userData.displayName - Display name
 * @param {string} [userData.role='learner'] - User role
 * @returns {Promise<Object>} Created user (without password)
 */
async function createUser({ email, password, displayName, role = 'learner' }) {
  // Validate input
  if (!email || !password || !displayName) {
    throw new Error('Email, password, and displayName are required');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const result = await query(
      `INSERT INTO users (email, password_hash, display_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, display_name, role, created_at`,
      [email.toLowerCase().trim(), passwordHash, displayName, role]
    );

    // Initialize risk profile for all categories
    const userId = result.rows[0].id;
    const categories = ['phishing', 'passwords', 'social_engineering', 'safe_browsing'];
    
    for (const category of categories) {
      await query(
        `INSERT INTO user_risk_profiles (user_id, category)
         VALUES ($1, $2)
         ON CONFLICT (user_id, category) DO NOTHING`,
        [userId, category]
      );
    }

    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') {
      // Unique constraint violation
      const error = new Error('Email already exists');
      error.code = 'DUPLICATE_EMAIL';
      throw error;
    }
    throw err;
  }
}

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserByEmail(email) {
  const result = await query(
    `SELECT id, email, password_hash, display_name, role, 
            is_active, risk_score, total_score, current_streak, 
            longest_streak, last_activity_at, created_at, updated_at
     FROM users 
     WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
  return result.rows[0] || null;
}

/**
 * Get user by ID
 * @param {string} id - User UUID
 * @returns {Promise<Object|null>} User object or null
 */
async function getUserById(id) {
  const result = await query(
    `SELECT id, email, display_name, role, is_active, 
            risk_score, total_score, current_streak, 
            longest_streak, last_activity_at, created_at, updated_at
     FROM users 
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Verify user password
 * @param {string} password - Plain text password
 * @param {string} passwordHash - Hashed password from database
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

/**
 * Update user's last activity timestamp
 * @param {string} userId - User UUID
 */
async function updateLastActivity(userId) {
  await query(
    `UPDATE users 
     SET last_activity_at = CURRENT_TIMESTAMP 
     WHERE id = $1`,
    [userId]
  );
}

/**
 * Update user scores and streaks
 * @param {string} userId - User UUID
 * @param {number} scoreDelta - Points to add
 * @param {boolean} extendStreak - Whether to extend streak
 */
async function updateUserStats(userId, scoreDelta, extendStreak = false) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Get current streak info
    const userResult = await client.query(
      `SELECT current_streak, longest_streak, total_score, last_activity_at
       FROM users WHERE id = $1`,
      [userId]
    );

    const user = userResult.rows[0];
    if (!user) {
      throw new Error('User not found');
    }

    // Check if streak should be extended (last activity was yesterday or today)
    let newStreak = user.current_streak;
    if (extendStreak) {
      const lastActivity = user.last_activity_at ? new Date(user.last_activity_at) : null;
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (!lastActivity || 
          lastActivity.toDateString() === yesterday.toDateString() ||
          lastActivity.toDateString() === today.toDateString()) {
        newStreak = user.current_streak + 1;
      } else {
        newStreak = 1; // Reset streak
      }
    }

    const longestStreak = Math.max(newStreak, user.longest_streak);
    const newTotalScore = user.total_score + scoreDelta;

    await client.query(
      `UPDATE users 
       SET total_score = $1, 
           current_streak = $2, 
           longest_streak = $3,
           last_activity_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [newTotalScore, newStreak, longestStreak, userId]
    );

    await client.query('COMMIT');
    return {
      totalScore: newTotalScore,
      currentStreak: newStreak,
      longestStreak
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Update user risk score
 * @param {string} userId - User UUID
 * @param {number} riskScore - New risk score (0-100)
 */
async function updateRiskScore(userId, riskScore) {
  await query(
    `UPDATE users SET risk_score = $1 WHERE id = $2`,
    [Math.max(0, Math.min(100, riskScore)), userId]
  );
}

/**
 * Update user risk profile for a category
 * @param {string} userId - User UUID
 * @param {string} category - Risk category
 * @param {number} score - Score (0-100)
 * @param {boolean} wasCorrect - Whether attempt was correct
 */
async function updateRiskProfile(userId, category, score, wasCorrect) {
  await query(
    `UPDATE user_risk_profiles 
     SET score = $1, 
         attempts_count = attempts_count + 1,
         correct_count = correct_count + CASE WHEN $2 THEN 1 ELSE 0 END,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $3 AND category = $4`,
    [score, wasCorrect, userId, category]
  );
}

/**
 * Get user with full profile including risk breakdown
 * @param {string} userId - User UUID
 * @returns {Promise<Object|null>} User with risk profiles
 */
async function getUserWithProfile(userId) {
  const user = await getUserById(userId);
  if (!user) return null;

  const riskProfilesResult = await query(
    `SELECT category, score, attempts_count, correct_count
     FROM user_risk_profiles 
     WHERE user_id = $1`,
    [userId]
  );

  return {
    ...user,
    riskProfiles: riskProfilesResult.rows
  };
}

/**
 * Get leaderboard rankings
 * @param {number} [limit=50] - Number of users to return
 * @returns {Promise<Array>} Top users by score
 */
async function getLeaderboard(limit = 50) {
  const result = await query(
    `SELECT id, display_name, total_score, longest_streak, 
            current_streak, last_activity_at
     FROM users 
     WHERE is_active = true
     ORDER BY total_score DESC, longest_streak DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

/**
 * Get category-specific leaderboard
 * @param {string} category - Risk category
 * @param {number} [limit=50] - Number of users
 * @returns {Promise<Array>} Top users by category score
 */
async function getCategoryLeaderboard(category, limit = 50) {
  const result = await query(
    `SELECT u.id, u.display_name, u.total_score, 
            rp.score as category_score, rp.attempts_count, rp.correct_count
     FROM users u
     JOIN user_risk_profiles rp ON u.id = rp.user_id
     WHERE u.is_active = true AND rp.category = $1
     ORDER BY rp.score DESC, rp.correct_count DESC
     LIMIT $2`,
    [category, limit]
  );
  return result.rows;
}

/**
 * Deactivate user account
 * @param {string} userId - User UUID
 */
async function deactivateUser(userId) {
  await query(
    `UPDATE users SET is_active = false WHERE id = $1`,
    [userId]
  );
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  verifyPassword,
  updateLastActivity,
  updateUserStats,
  updateRiskScore,
  updateRiskProfile,
  getUserWithProfile,
  getLeaderboard,
  getCategoryLeaderboard,
  deactivateUser
};
