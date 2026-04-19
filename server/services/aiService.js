/**
 * AI Service Layer
 * Security Awareness Platform
 * 
 * AI-powered scenario recommendations and personalized feedback
 * using OpenRouter API with cost optimization
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Rate limiting store (use Redis in production)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 300000; // 5 minutes cleanup interval

/**
 * Cleanup old entries from rate limit store to prevent memory leak
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [userId, timestamps] of rateLimitStore.entries()) {
    const recentRequests = timestamps.filter(timestamp => 
      now - timestamp < RATE_LIMIT_WINDOW_MS
    );
    if (recentRequests.length === 0) {
      rateLimitStore.delete(userId);
    } else {
      rateLimitStore.set(userId, recentRequests);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, RATE_LIMIT_CLEANUP_INTERVAL_MS);

/**
 * Check rate limit for a user
 * @param {string} userId - User UUID
 * @returns {boolean} Whether request is allowed
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = rateLimitStore.get(userId) || [];
  
  // Filter to recent requests only
  const recentRequests = userRequests.filter(timestamp => 
    now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitStore.set(userId, recentRequests);
  return true;
}

/**
 * Make OpenRouter API call
 * @param {string} prompt - User prompt
 * @param {string} [model='anthropic/claude-3.5-sonnet'] - Model to use
 * @returns {Promise<Object>} AI response
 */
async function callOpenRouter(prompt, model = 'anthropic/claude-3.5-sonnet') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
      'X-Title': 'Security Awareness Platform'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful security awareness training assistant. Provide clear, actionable advice in JSON format.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generate scenario recommendation based on user weaknesses
 * @param {string} userId - User UUID
 * @param {Array} weakCategories - Categories with low accuracy
 * @param {Array} recentScenarios - Recently completed scenario IDs
 * @returns {Promise<Object>} Recommendation with scenario type and difficulty
 */
async function generateScenarioRecommendation(userId, weakCategories = [], recentScenarios = []) {
  // Check rate limit
  if (!checkRateLimit(userId)) {
    // Return fallback recommendation if rate limited
    return generateFallbackRecommendation(weakCategories);
  }

  try {
    const prompt = `Based on the user's security training data:
- Weak categories: ${weakCategories.map(c => `${c.category} (${c.accuracy}% accuracy)`).join(', ') || 'none identified'}
- Recent scenarios completed: ${recentScenarios.join(', ') || 'none'}

Recommend the next scenario type and difficulty level.

Respond in JSON format:
{
  "recommendedType": "phishing|passwords|social_engineering|safe_browsing",
  "recommendedDifficulty": "easy|medium|hard",
  "reasoning": "brief explanation of why this recommendation",
  "focusArea": "what specific skill this will improve"
}`;

    const content = await callOpenRouter(prompt, 'anthropic/claude-3.5-sonnet');
    const recommendation = JSON.parse(content);
    
    return {
      ...recommendation,
      aiPowered: true,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('AI recommendation error:', err.message);
    return generateFallbackRecommendation(weakCategories);
  }
}

/**
 * Generate fallback recommendation (rule-based)
 * @param {Array} weakCategories - Weak categories
 * @returns {Object} Recommendation
 */
function generateFallbackRecommendation(weakCategories) {
  // Default recommendation
  const defaultRec = {
    recommendedType: 'phishing',
    recommendedDifficulty: 'medium',
    reasoning: 'Starting with phishing scenarios to build foundational awareness',
    focusArea: 'email security and link verification'
  };

  if (weakCategories.length === 0) {
    return {
      ...defaultRec,
      aiPowered: false
    };
  }

  // Pick weakest category
  const weakest = weakCategories[0];
  const difficulty = weakest.accuracy < 40 ? 'easy' : 
                     weakest.accuracy < 70 ? 'medium' : 'hard';

  const focusAreas = {
    phishing: 'email security and link verification',
    passwords: 'password management and multi-factor authentication',
    social_engineering: 'social manipulation tactics and verification',
    safe_browsing: 'web security and certificate validation'
  };

  return {
    recommendedType: weakest.category,
    recommendedDifficulty: difficulty,
    reasoning: `Focusing on ${weakest.category} where accuracy is ${weakest.accuracy}%`,
    focusArea: focusAreas[weakest.category] || 'general security awareness',
    aiPowered: false
  };
}

/**
 * Generate personalized feedback for a scenario attempt
 * @param {string} userId - User UUID
 * @param {Object} scenario - Scenario data
 * @param {boolean} isCorrect - Whether answer was correct
 * @param {Array} selectedOptions - Selected option IDs
 * @param {Object} userHistory - User's history in this category
 * @returns {Promise<Object>} Personalized feedback
 */
async function generateFeedback(userId, scenario, isCorrect, selectedOptions, userHistory = {}) {
  // Check rate limit (lower priority than recommendations)
  if (!checkRateLimit(userId)) {
    return generateFallbackFeedback(scenario, isCorrect);
  }

  try {
    const prompt = `Generate personalized feedback for a security awareness training scenario.

Scenario: "${scenario.title}"
Type: ${scenario.type}
Difficulty: ${scenario.difficulty}
User answer: ${isCorrect ? 'CORRECT' : 'INCORRECT'}
Explanation: "${scenario.explanation}"

User's history in ${scenario.type}: ${userHistory.attempts || 0} attempts, ${userHistory.accuracy || 0}% accuracy

Respond in JSON format:
{
  "praise": "positive reinforcement for correct answer OR encouraging message for incorrect",
  "keyLesson": "the single most important takeaway from this scenario",
  "practicalTip": "specific actionable advice for real-world application",
  "relatedConcept": "brief mention of related security concept to reinforce learning",
  "nextSteps": "what to watch for in similar situations"
}`;

    const content = await callOpenRouter(prompt, 'anthropic/claude-3.5-sonnet');
    const feedback = JSON.parse(content);
    
    return {
      ...feedback,
      aiPowered: true,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('AI feedback error:', err.message);
    return generateFallbackFeedback(scenario, isCorrect);
  }
}

/**
 * Generate fallback feedback (rule-based)
 * @param {Object} scenario - Scenario data
 * @param {boolean} isCorrect - Whether answer was correct
 * @returns {Object} Feedback
 */
function generateFallbackFeedback(scenario, isCorrect) {
  if (isCorrect) {
    return {
      praise: "Great job! You correctly identified the security issue.",
      keyLesson: scenario.explanation,
      practicalTip: "Apply this knowledge by always verifying before trusting.",
      relatedConcept: "Security awareness is about building good habits.",
      nextSteps: "Watch for similar patterns in your daily activities.",
      aiPowered: false
    };
  }

  return {
    praise: "Good attempt! Learning from mistakes is key to security awareness.",
    keyLesson: scenario.explanation,
    practicalTip: "Take an extra moment to verify before acting on suspicious communications.",
    relatedConcept: "Security threats often use urgency to bypass your critical thinking.",
    nextSteps: "Review this scenario type and look for similar patterns in future scenarios.",
    aiPowered: false
  };
}

/**
 * Generate learning path recommendation
 * @param {string} userId - User UUID
 * @param {Object} userStats - User's overall stats
 * @returns {Promise<Object>} Learning path recommendation
 */
async function generateLearningPath(userId, userStats = {}) {
  if (!checkRateLimit(userId)) {
    return generateFallbackLearningPath(userStats);
  }

  try {
    const prompt = `Create a personalized learning path for a security awareness trainee.

Current stats:
- Total score: ${userStats.totalScore || 0}
- Accuracy: ${userStats.accuracy || 0}%
- Current streak: ${userStats.currentStreak || 0} days
- Categories attempted: ${Object.keys(userStats.categories || {}).join(', ') || 'none'}

Respond in JSON format:
{
  "recommendedPath": ["category1", "category2", "category3"],
  "estimatedTimeToComplete": "X weeks",
  "focusAreas": ["area1", "area2"],
  "milestones": [
    { "at": 5, "description": "what to achieve" },
    { "at": 10, "description": "what to achieve" }
  ],
  "studyTips": ["tip1", "tip2"]
}`;

    const content = await callOpenRouter(prompt, 'anthropic/claude-3.5-sonnet');
    const path = JSON.parse(content);
    
    return {
      ...path,
      aiPowered: true,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('AI learning path error:', err.message);
    return generateFallbackLearningPath(userStats);
  }
}

/**
 * Generate fallback learning path
 * @param {Object} userStats - User stats
 * @returns {Object} Learning path
 */
function generateFallbackLearningPath(userStats) {
  return {
    recommendedPath: ['phishing', 'passwords', 'social_engineering', 'safe_browsing'],
    estimatedTimeToComplete: '2-3 weeks',
    focusAreas: ['email security', 'password management'],
    milestones: [
      { at: 5, description: 'Complete first category' },
      { at: 10, description: 'Achieve 70% accuracy' },
      { at: 14, description: 'Complete all scenarios' }
    ],
    studyTips: [
      'Practice daily to maintain streak',
      'Review incorrect answers',
      'Apply lessons to real emails'
    ],
    aiPowered: false
  };
}

module.exports = {
  generateScenarioRecommendation,
  generateFeedback,
  generateLearningPath
};
