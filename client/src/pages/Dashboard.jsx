import { useState, useEffect } from 'react';
import { getDashboardData, getChartData } from '../services/dashboardApi.js';
import './Dashboard.css';

// const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Dashboard Page Component
 * User stats, progress, and achievements
 */
export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = 'demo-user'; // TODO: Get from auth context

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard data and chart data in parallel
        const [dashboardData, charts] = await Promise.all([
          getDashboardData(userId),
          getChartData(userId, 30)
        ]);

        setStats(dashboardData);
        setChartData(charts);
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError(err.message || 'Failed to load dashboard data');
        
        // Fallback: Use localStorage data if API fails
        loadFallbackData();
      } finally {
        setLoading(false);
      }
    }

    // Try API first, fallback to localStorage
    loadDashboardData();
  }, [userId]);

  // Fallback to localStorage if API fails
  function loadFallbackData() {
    try {
      const savedProgress = localStorage.getItem('security-awareness-progress');
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        setStats({
          user: parsed.user || {
            displayName: 'Demo User',
            totalScore: parsed.totalScore || 0,
            currentStreak: parsed.currentStreak || 0,
            longestStreak: parsed.longestStreak || 0,
            riskScore: parsed.riskScore || 50,
            joinedAt: new Date().toISOString()
          },
          progress: parsed.progress || {
            totalScenarios: 14,
            completedScenarios: parsed.completedScenarios?.length || 0,
            accuracy: parsed.accuracy || 0
          },
          categories: parsed.categories || {},
          badges: parsed.badges || [],
          recentAttempts: parsed.recentAttempts || []
        });
      }
    } catch (e) {
      console.error('Fallback data error:', e);
    }
  }

  // Get risk level
  const getRiskLevel = (score) => {
    if (score <= 30) return { text: 'Low Risk', color: '#10B981', icon: '🟢' };
    if (score <= 60) return { text: 'Medium Risk', color: '#F59E0B', icon: '🟡' };
    return { text: 'High Risk', color: '#DC2626', icon: '🔴' };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  // Calculate progress percentage
  const getProgressPercentage = (completed, total) => {
    if (!total) return 0;
    return Math.round((completed / total) * 100);
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="dashboard-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Failed to load dashboard</h2>
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use stats if available, otherwise show empty state
  const user = stats?.user || {};
  const progress = stats?.progress || {};
  const categories = stats?.categories || {};
  const badges = stats?.badges || [];
  const recentAttempts = stats?.recentAttempts || [];
  
  const riskLevel = getRiskLevel(user.riskScore);
  const overallProgress = getProgressPercentage(
    progress.completedScenarios || 0, 
    progress.totalScenarios || 14
  );

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <p>Welcome back, {user.displayName || 'User'}! Here's your security awareness progress.</p>
      </header>

      {error && (
        <div className="warning-banner">
          <span>⚠️</span> {error} (showing cached data)
        </div>
      )}

      <div className="dashboard-grid">
        {/* Overview Stats */}
        <section className="dashboard-card stats-card">
          <h2>Overview</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{user.totalScore || 0}</span>
              <span className="stat-label">Total Points</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">🔥 {user.currentStreak || 0}</span>
              <span className="stat-label">Current Streak</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{progress.accuracy || 0}%</span>
              <span className="stat-label">Accuracy</span>
            </div>
            <div className="stat-item risk">
              <span className="stat-number" style={{ color: riskLevel.color }}>
                {user.riskScore || 0}
              </span>
              <span className="stat-label">{riskLevel.text}</span>
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="overall-progress">
            <div className="progress-label">
              <span>Overall Progress</span>
              <span>{progress.completedScenarios || 0}/{progress.totalScenarios || 14} scenarios</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </section>

        {/* Category Progress */}
        <section className="dashboard-card categories-card">
          <h2>📚 Module Progress</h2>
          <div className="categories-list">
            {Object.entries(categories).length > 0 ? (
              Object.entries(categories).map(([key, data]) => {
                const icons = {
                  phishing: '🎣',
                  passwords: '🔐',
                  social_engineering: '🎭',
                  safe_browsing: '🌐'
                };
                const progressPct = data.total > 0 
                  ? Math.round((data.completed / data.total) * 100) 
                  : 0;
                return (
                  <div key={key} className="category-progress">
                    <div className="category-header">
                      <span className="category-name">
                        {icons[key]} {key.replace('_', ' ')}
                      </span>
                      <span className="category-stats">
                        {data.completed}/{data.total} • {data.accuracy || 0}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <p>No module progress yet. Start training to see your stats!</p>
                <a href="/training" className="button-primary">Start Training</a>
              </div>
            )}
          </div>
        </section>

        {/* Activity Chart (if data available) */}
        {chartData?.activity?.length > 0 && (
          <section className="dashboard-card chart-card">
            <h2>📈 Activity (Last 30 Days)</h2>
            <div className="chart-container">
              <ActivityChart data={chartData.activity} />
            </div>
          </section>
        )}

        {/* Badges */}
        <section className="dashboard-card badges-card">
          <h2>🏆 Achievements</h2>
          <div className="badges-grid">
            {badges.length > 0 ? (
              badges.map((badge, index) => (
                <div key={badge.id || index} className="badge-item">
                  <span className="badge-icon">{badge.icon || '🏅'}</span>
                  <span className="badge-name">{badge.name}</span>
                  <span className="badge-date">{formatDate(badge.earned_at || badge.earnedAt)}</span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No badges earned yet. Complete scenarios to unlock achievements!</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="dashboard-card activity-card">
          <h2>📝 Recent Activity</h2>
          <div className="activity-list">
            {recentAttempts.length > 0 ? (
              recentAttempts.map((attempt, index) => (
                <div key={index} className="activity-item">
                  <span className="activity-status">
                    {attempt.is_correct || attempt.correct ? '✅' : '❌'}
                  </span>
                  <div className="activity-details">
                    <span className="activity-title">
                      {attempt.title || `Scenario ${attempt.scenario_id}`}
                    </span>
                    <span className="activity-score">
                      {attempt.score_delta > 0 ? `+${attempt.score_delta}` : attempt.score_delta}
                    </span>
                  </div>
                  <span className="activity-time">
                    {formatRelativeTime(attempt.created_at || attempt.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No recent activity. Complete your first scenario!</p>
                <a href="/training" className="button-primary">Start Training</a>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Simple Activity Chart Component
 */
function ActivityChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.attempts), 1);
  
  return (
    <div className="activity-chart">
      <div className="chart-bars">
        {data.slice(-7).map((day, index) => (
          <div key={index} className="chart-bar-container">
            <div 
              className="chart-bar"
              style={{ 
                height: `${(day.attempts / maxValue) * 100}%`,
                backgroundColor: day.correct >= day.attempts / 2 ? '#10B981' : '#F59E0B'
              }}
              title={`${formatDate(day.date)}: ${day.attempts} attempts, ${day.accuracy}% accuracy`}
            />
            <span className="chart-label">{new Date(day.date).getDate()}</span>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#10B981' }}></span>
          Good Performance
        </span>
        <span className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#F59E0B' }}></span>
          Needs Practice
        </span>
      </div>
    </div>
  );
}

export default Dashboard;