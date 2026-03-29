/**
 * Scenario Repository Layer
 * Security Awareness Platform
 * 
 * Database operations for scenarios and options
 */

const { query } = require('./pool.js');

/**
 * Get all scenarios
 * @param {Object} filters - Optional filters
 * @param {string} [filters.type] - Scenario type
 * @param {string} [filters.difficulty] - Difficulty level
 * @param {boolean} [filters.activeOnly=true] - Only active scenarios
 * @returns {Promise<Array>} All scenarios with options
 */
async function getAllScenarios({ type, difficulty, activeOnly = true } = {}) {
  let sql = `
    SELECT s.*, 
           json_agg(json_build_object(
             'id', o.id,
             'option_id', o.option_id,
             'label', o.label,
             'is_correct', o.is_correct
           ) ORDER BY o.option_id) as options
    FROM scenarios s
    LEFT JOIN scenario_options o ON s.id = o.scenario_id
  `;
  
  const conditions = [];
  const params = [];
  
  if (activeOnly) {
    conditions.push('s.is_active = true');
  }
  if (type) {
    conditions.push('s.type = $' + (params.length + 1));
    params.push(type);
  }
  if (difficulty) {
    conditions.push('s.difficulty = $' + (params.length + 1));
    params.push(difficulty);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += `
    GROUP BY s.id
    ORDER BY s.type, s.difficulty
  `;
  
  const result = await query(sql, params);
  return result.rows.map(row => ({
    ...row,
    options: row.options[0] === null ? [] : row.options
  }));
}

/**
 * Get scenario by UUID
 * @param {string} id - Scenario UUID
 * @returns {Promise<Object|null>} Scenario with options
 */
async function getScenarioById(id) {
  const result = await query(
    `SELECT s.*, 
            json_agg(json_build_object(
              'id', o.id,
              'option_id', o.option_id,
              'label', o.label,
              'is_correct', o.is_correct
            ) ORDER BY o.option_id) as options
     FROM scenarios s
     LEFT JOIN scenario_options o ON s.id = o.scenario_id
     WHERE s.id = $1
     GROUP BY s.id`,
    [id]
  );
  
  if (!result.rows[0]) return null;
  
  return {
    ...result.rows[0],
    options: result.rows[0].options[0] === null ? [] : result.rows[0].options
  };
}

/**
 * Get scenario by scenario_id (e.g., 'phishing-001')
 * @param {string} scenarioId - Scenario identifier
 * @returns {Promise<Object|null>} Scenario with options
 */
async function getScenarioByScenarioId(scenarioId) {
  const result = await query(
    `SELECT s.*, 
            json_agg(json_build_object(
              'id', o.id,
              'option_id', o.option_id,
              'label', o.label,
              'is_correct', o.is_correct
            ) ORDER BY o.option_id) as options
     FROM scenarios s
     LEFT JOIN scenario_options o ON s.id = o.scenario_id
     WHERE s.scenario_id = $1 AND s.is_active = true
     GROUP BY s.id`,
    [scenarioId]
  );
  
  if (!result.rows[0]) return null;
  
  return {
    ...result.rows[0],
    options: result.rows[0].options[0] === null ? [] : result.rows[0].options
  };
}

/**
 * Get a random scenario
 * @param {Object} filters - Optional filters
 * @param {string} [filters.type] - Scenario type
 * @param {string} [filters.difficulty] - Difficulty level
 * @param {string[]} [filters.excludeIds] - UUIDs to exclude
 * @returns {Promise<Object|null>} Random scenario
 */
async function getRandomScenario({ type, difficulty, excludeIds = [] } = {}) {
  let sql = `
    SELECT s.*, 
           json_agg(json_build_object(
             'id', o.id,
             'option_id', o.option_id,
             'label', o.label,
             'is_correct', o.is_correct
           ) ORDER BY o.option_id) as options
    FROM scenarios s
    LEFT JOIN scenario_options o ON s.id = o.scenario_id
    WHERE s.is_active = true
  `;
  
  const params = [];
  
  if (type) {
    sql += ` AND s.type = $${params.length + 1}`;
    params.push(type);
  }
  
  if (difficulty) {
    sql += ` AND s.difficulty = $${params.length + 1}`;
    params.push(difficulty);
  }
  
  if (excludeIds.length > 0) {
    sql += ` AND s.id NOT IN (${excludeIds.map((_, i) => `$${params.length + i + 1}`).join(',')})`;
    params.push(...excludeIds);
  }
  
  sql += `
    GROUP BY s.id
    ORDER BY RANDOM()
    LIMIT 1
  `;
  
  const result = await query(sql, params);
  
  if (!result.rows[0]) return null;
  
  return {
    ...result.rows[0],
    options: result.rows[0].options[0] === null ? [] : result.rows[0].options
  };
}

/**
 * Get scenarios by type
 * @param {string} type - Scenario type
 * @returns {Promise<Array>} Scenarios of that type
 */
async function getScenariosByType(type) {
  return getAllScenarios({ type });
}

/**
 * Get scenarios by difficulty
 * @param {string} difficulty - Difficulty level
 * @returns {Promise<Array>} Scenarios of that difficulty
 */
async function getScenariosByDifficulty(difficulty) {
  return getAllScenarios({ difficulty });
}

/**
 * Check if an answer is correct for a scenario
 * @param {string} scenarioId - Scenario UUID
 * @param {string[]} selectedOptionIds - Selected option UUIDs
 * @returns {Promise<boolean>} Whether the answer is correct
 */
async function checkAnswer(scenarioId, selectedOptionIds) {
  const result = await query(
    `SELECT id, is_correct
     FROM scenario_options
     WHERE scenario_id = $1`,
    [scenarioId]
  );
  
  const correctOptions = result.rows.filter(o => o.is_correct).map(o => o.id);
  const selectedSet = new Set(selectedOptionIds);
  const correctSet = new Set(correctOptions);
  
  // Answer is correct if all correct options are selected
  // and no incorrect options are selected
  if (selectedSet.size !== correctSet.size) return false;
  
  for (const id of selectedSet) {
    if (!correctSet.has(id)) return false;
  }
  
  return true;
}

/**
 * Get correct options for a scenario
 * @param {string} scenarioId - Scenario UUID
 * @returns {Promise<Array>} Correct option IDs
 */
async function getCorrectOptions(scenarioId) {
  const result = await query(
    `SELECT id, option_id, label
     FROM scenario_options
     WHERE scenario_id = $1 AND is_correct = true`,
    [scenarioId]
  );
  return result.rows;
}

/**
 * Mark scenario as presented (update timestamp)
 * @param {string} scenarioId - Scenario UUID
 */
async function markScenarioPresented(scenarioId) {
  await query(
    `UPDATE scenarios SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [scenarioId]
  );
}

/**
 * Get scenario statistics
 * @param {string} scenarioId - Scenario UUID
 * @returns {Promise<Object>} Attempt statistics
 */
async function getScenarioStats(scenarioId) {
  const result = await query(
    `SELECT 
      COUNT(*) as total_attempts,
      COUNT(*) FILTER (WHERE is_correct = true) as correct_attempts,
      AVG(score_delta) as avg_score,
      AVG(time_spent_seconds) as avg_time
     FROM scenario_attempts
     WHERE scenario_id = $1`,
    [scenarioId]
  );
  
  const stats = result.rows[0];
  return {
    totalAttempts: parseInt(stats.total_attempts) || 0,
    correctAttempts: parseInt(stats.correct_attempts) || 0,
    accuracy: stats.total_attempts > 0
      ? Math.round((stats.correct_attempts / stats.total_attempts) * 100)
      : 0,
    averageScore: Math.round(stats.avg_score) || 0,
    averageTimeSeconds: Math.round(stats.avg_time) || 0
  };
}

module.exports = {
  getAllScenarios,
  getScenarioById,
  getScenarioByScenarioId,
  getRandomScenario,
  getScenariosByType,
  getScenariosByDifficulty,
  checkAnswer,
  getCorrectOptions,
  markScenarioPresented,
  getScenarioStats
};
