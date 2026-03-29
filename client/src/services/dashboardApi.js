/**
 * Static Dashboard API Service
 * For GitHub Pages deployment - uses localStorage instead of backend
 */

// Static demo data
const DEMO_USER = {
  id: 'demo-user',
  displayName: 'Demo User',
  totalScore: 245,
  currentStreak: 3,
  longestStreak: 7,
  riskScore: 42,
  joinedAt: '2024-03-01'
};

const DEMO_BADGES = [
  { id: 'first-report', name: 'First to Report', icon: '🚩', earnedAt: '2024-03-15' },
  { id: 'streak-3', name: '3-Day Streak', icon: '🔥', earnedAt: '2024-03-28' },
  { id: 'phishing-expert', name: 'Phishing Spotter', icon: '🎣', earnedAt: '2024-03-20' },
  { id: 'password-guru', name: 'Password Guru', icon: '🔐', earnedAt: '2024-03-25' }
];

const LEADERBOARD_DATA = [
  { rank: 1, userId: 'user-1', displayName: 'Security Pro', score: 1240, streak: 15, accuracy: 92, attempts: 45 },
  { rank: 2, userId: 'user-2', displayName: 'Phish Spotter', score: 980, streak: 8, accuracy: 88, attempts: 38 },
  { rank: 3, userId: 'demo-user', displayName: 'Demo User', score: 245, streak: 3, accuracy: 68, attempts: 12 },
  { rank: 4, userId: 'user-4', displayName: 'Cyber Learner', score: 180, streak: 2, accuracy: 65, attempts: 10 },
  { rank: 5, userId: 'user-5', displayName: 'Newbie', score: 45, streak: 0, accuracy: 45, attempts: 5 }
];

// Storage key
const STORAGE_KEY = 'security-awareness-data';

/**
 * Get stored data or initialize with defaults
 */
function getStoredData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading localStorage:', e);
  }
  
  // Initialize with defaults
  const defaultData = {
    user: DEMO_USER,
    badges: DEMO_BADGES,
    attempts: [
      { scenarioId: 'phish-002', title: 'CEO Wire Transfer Request', isCorrect: false, scoreDelta: -15, createdAt: '2024-03-29T10:00:00Z' },
      { scenarioId: 'browse-001', title: 'HTTP Website', isCorrect: true, scoreDelta: 10, createdAt: '2024-03-29T09:45:00Z' },
      { scenarioId: 'pwd-001', title: 'Create Strong Password', isCorrect: true, scoreDelta: 12, createdAt: '2024-03-29T09:30:00Z' },
      { scenarioId: 'social-001', title: 'LinkedIn Invitation', isCorrect: true, scoreDelta: 8, createdAt: '2024-03-28T15:20:00Z' },
      { scenarioId: 'phish-001', title: 'Mailbox Full Alert', isCorrect: false, scoreDelta: -10, createdAt: '2024-03-28T10:15:00Z' }
    ],
    categories: {
      phishing: { completed: 3, total: 4, accuracy: 75 },
      passwords: { completed: 3, total: 3, accuracy: 67 },
      social_engineering: { completed: 3, total: 3, accuracy: 67 },
      safe_browsing: { completed: 3, total: 4, accuracy: 50 }
    }
  };
  
  saveStoredData(defaultData);
  return defaultData;
}

/**
 * Save data to localStorage
 */
function saveStoredData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

/**
 * Simulate API delay
 */
function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get complete dashboard data
 */
export async function getDashboardData(userId = 'demo-user') {
  await delay();
  const data = getStoredData();
  
  const totalAttempts = data.attempts.length;
  const correctAttempts = data.attempts.filter(a => a.isCorrect).length;
  
  return {
    user: data.user,
    progress: {
      totalAttempts,
      correctAnswers: correctAttempts,
      accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
      avgTimeSeconds: 28,
      totalScenarios: 14,
      completedScenarios: totalAttempts
    },
    categories: data.categories,
    badges: data.badges,
    recentAttempts: data.attempts.slice(0, 10),
    reports: 2
  };
}

/**
 * Get user statistics
 */
export async function getUserStats(userId = 'demo-user') {
  await delay();
  const data = getStoredData();
  
  const totalAttempts = data.attempts.length;
  const correctAttempts = data.attempts.filter(a => a.isCorrect).length;
  
  return {
    user: data.user,
    progress: {
      totalAttempts,
      correctAnswers: correctAttempts,
      accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0
    },
    categories: data.categories,
    reports: 2
  };
}

/**
 * Get user's badges
 */
export async function getUserBadges(userId = 'demo-user') {
  await delay();
  const data = getStoredData();
  return data.badges;
}

/**
 * Get recent attempts
 */
export async function getRecentAttempts(userId = 'demo-user', limit = 10) {
  await delay();
  const data = getStoredData();
  return data.attempts.slice(0, limit);
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(category = 'overall', limit = 20) {
  await delay(200);
  
  // Simulate category filtering
  let leaderboard = [...LEADERBOARD_DATA];
  
  if (category !== 'overall') {
    // Shuffle slightly for variety in category views
    leaderboard = leaderboard.map((entry, i) => ({
      ...entry,
      score: Math.floor(entry.score * (0.8 + Math.random() * 0.4))
    })).sort((a, b) => b.score - a.score)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));
  }
  
  return {
    category,
    leaderboard: leaderboard.slice(0, limit)
  };
}

/**
 * Get chart data
 */
export async function getChartData(userId = 'demo-user', days = 30) {
  await delay(300);
  
  const data = getStoredData();
  
  return {
    activity: [
      { date: '2024-03-23', attempts: 2, correct: 1, accuracy: 50, points: 5 },
      { date: '2024-03-24', attempts: 1, correct: 1, accuracy: 100, points: 12 },
      { date: '2024-03-25', attempts: 3, correct: 2, accuracy: 67, points: 15 },
      { date: '2024-03-26', attempts: 0, correct: 0, accuracy: 0, points: 0 },
      { date: '2024-03-27', attempts: 2, correct: 1, accuracy: 50, points: 3 },
      { date: '2024-03-28', attempts: 2, correct: 1, accuracy: 50, points: -2 },
      { date: '2024-03-29', attempts: 3, correct: 2, accuracy: 67, points: 7 }
    ],
    categories: Object.entries(data.categories).map(([cat, stats]) => ({
      category: cat,
      total: stats.total,
      correct: Math.floor(stats.total * stats.accuracy / 100),
      accuracy: stats.accuracy
    })),
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
}

/**
 * Save a scenario attempt
 */
export async function saveAttempt(attempt) {
  const data = getStoredData();
  
  data.attempts.unshift({
    ...attempt,
    createdAt: new Date().toISOString()
  });
  
  // Update user score
  data.user.totalScore += attempt.scoreDelta || 0;
  
  // Update category stats
  if (attempt.riskCategory && data.categories[attempt.riskCategory]) {
    const cat = data.categories[attempt.riskCategory];
    cat.completed += 1;
    if (attempt.isCorrect) {
      cat.correct = (cat.correct || 0) + 1;
    }
    cat.accuracy = Math.round((cat.correct / cat.completed) * 100);
  }
  
  saveStoredData(data);
  return attempt;
}

/**
 * Reset all data (for testing)
 */
export function resetData() {
  localStorage.removeItem(STORAGE_KEY);
}