/**
 * Security Awareness Platform - Evaluation Engine
 * Evaluates user responses against scenario definitions
 */

/**
 * Evaluate a user's answer against a scenario
 * @param {Object} scenario - The scenario object
 * @param {string[]} selectedOptionIds - Array of selected option IDs
 * @returns {Object} Evaluation result
 */
function evaluateAnswer(scenario, selectedOptionIds) {
  // Validate inputs
  if (!scenario || !scenario.correctOptionIds) {
    throw new Error('Invalid scenario provided');
  }
  
  if (!Array.isArray(selectedOptionIds)) {
    throw new Error('selectedOptionIds must be an array');
  }

  // Convert to Sets for comparison
  const correctSet = new Set(scenario.correctOptionIds);
  const selectedSet = new Set(selectedOptionIds);

  // Check if all selected options are correct AND all correct options are selected
  const allCorrectSelected = scenario.correctOptionIds.every(id => selectedSet.has(id));
  const noIncorrectSelected = selectedOptionIds.every(id => correctSet.has(id));
  const isCorrect = allCorrectSelected && noIncorrectSelected && selectedOptionIds.length === scenario.correctOptionIds.length;

  // Determine severity based on scenario type and wrong choices
  let severity = 'low';
  let riskImpact = 0;

  if (!isCorrect) {
    // Calculate how wrong the answer is
    const wrongSelections = selectedOptionIds.filter(id => !correctSet.has(id));
    const missedCorrect = scenario.correctOptionIds.filter(id => !selectedSet.has(id));
    
    // High risk scenarios get higher penalty
    const typeMultipliers = {
      phishing: 1.5,
      passwords: 1.3,
      social_engineering: 1.4,
      safe_browsing: 1.2
    };
    
    const basePenalty = 10;
    const multiplier = typeMultipliers[scenario.type] || 1;
    const wrongChoicePenalty = wrongSelections.length * 5;
    const missedPenalty = missedCorrect.length * 3;
    
    riskImpact = Math.round((basePenalty + wrongChoicePenalty + missedPenalty) * multiplier);
    
    // Determine severity
    if (riskImpact >= 20) {
      severity = 'high';
    } else if (riskImpact >= 10) {
      severity = 'medium';
    }
  } else {
    // Reward correct answers
    const typeRewards = {
      phishing: 15,
      passwords: 12,
      social_engineering: 14,
      safe_browsing: 10
    };
    riskImpact = -typeRewards[scenario.type] || -10;
  }

  // Build recommended micro-learning based on mistake
  let recommendedLearning = null;
  if (!isCorrect) {
    recommendedLearning = generateMicroLearning(scenario, selectedOptionIds);
  }

  return {
    correct: isCorrect,
    severity,
    explanation: scenario.explanation,
    riskCategory: scenario.type,
    scoreDelta: isCorrect ? Math.abs(riskImpact) : -riskImpact,
    riskImpact,
    selectedOptionIds,
    correctOptionIds: scenario.correctOptionIds,
    recommendedLearning,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate micro-learning content based on mistake
 * @param {Object} scenario - The scenario
 * @param {string[]} selectedOptionIds - Wrong selections
 * @returns {Object|null} Micro-learning content
 */
function generateMicroLearning(scenario, selectedOptionIds) {
  const learningModules = {
    phishing: {
      title: 'Phishing Detection Tips',
      tips: [
        'Check the sender domain carefully - look for typos and suspicious addresses',
        'Hover over links to see the actual URL before clicking',
        'Be suspicious of urgency - attackers create false time pressure',
        'When in doubt, access services through bookmarks, not email links',
        'Report suspicious emails to your security team'
      ]
    },
    passwords: {
      title: 'Password Security Essentials',
      tips: [
        'Use a password manager to generate and store unique passwords',
        'Never reuse passwords across different accounts',
        'Enable multi-factor authentication wherever possible',
        'Use passphrases (4+ random words) instead of complex passwords',
        'Never share passwords or MFA codes with anyone'
      ]
    },
    social_engineering: {
      title: 'Social Engineering Defense',
      tips: [
        'Verify unexpected requests through a separate communication channel',
        'Be cautious of authority-based pressure tactics',
        'IT support will never ask for your password',
        'Verify in-person claims by calling official numbers',
        'Trust but verify - especially with urgent requests'
      ]
    },
    safe_browsing: {
      title: 'Safe Browsing Practices',
      tips: [
        'Always verify HTTPS and the correct domain before entering credentials',
        'Check URLs carefully for typosquatting (misspelled domains)',
        'Be cautious of browser permission requests',
        'Avoid sensitive activities on public Wi-Fi without a VPN',
        'Use bookmarks for important sites instead of clicking links'
      ]
    }
  };

  const module = learningModules[scenario.type];
  if (!module) return null;

  return {
    title: module.title,
    relevantTips: module.tips.slice(0, 3),
    relatedScenarios: scenario.tags.slice(0, 2)
  };
}

/**
 * Calculate time bonus for quick correct answers
 * @param {number} timeSpentSeconds - Time taken to answer
 * @param {string} difficulty - Scenario difficulty
 * @returns {number} Bonus points
 */
function calculateTimeBonus(timeSpentSeconds, difficulty) {
  if (!timeSpentSeconds) return 0;

  const timeThresholds = {
    easy: 30,
    medium: 45,
    hard: 60
  };

  const threshold = timeThresholds[difficulty] || 45;
  
  if (timeSpentSeconds <= threshold) {
    // Bonus for quick correct answers
    const quickness = threshold - timeSpentSeconds;
    return Math.min(Math.floor(quickness / 5), 5);
  }

  return 0;
}

/**
 * Validate scenario submission
 * @param {Object} body - Request body
 * @returns {Object} Validation result
 */
function validateSubmission(body) {
  const errors = [];

  if (!body) {
    return { valid: false, errors: ['Request body is required'] };
  }

  if (!Array.isArray(body.selectedOptionIds)) {
    errors.push('selectedOptionIds must be an array');
  }

  if (body.selectedOptionIds.length === 0) {
    errors.push('At least one option must be selected');
  }

  if (body.timeSpentSeconds !== undefined) {
    if (typeof body.timeSpentSeconds !== 'number' || body.timeSpentSeconds < 0) {
      errors.push('timeSpentSeconds must be a non-negative number');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  evaluateAnswer,
  calculateTimeBonus,
  validateSubmission,
  generateMicroLearning
};