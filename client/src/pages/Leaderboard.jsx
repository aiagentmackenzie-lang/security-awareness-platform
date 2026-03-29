import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/dashboardApi.js';
import './Leaderboard.css';

/**
 * Leaderboard Page Component
 * Global rankings and user standings
 */
export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [category, setCategory] = useState('overall');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRank, setUserRank] = useState(null);

  const categories = [
    { id: 'overall', label: 'Overall', icon: '🏆' },
    { id: 'phishing', label: 'Phishing', icon: '🎣' },
    { id: 'passwords', label: 'Passwords', icon: '🔐' },
    { id: 'social_engineering', label: 'Social Engineering', icon: '🎭' },
    { id: 'safe_browsing', label: 'Safe Browsing', icon: '🌐' }
  ];

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        setError(null);

        const data = await getLeaderboard(category, 20);
        setLeaderboard(data.leaderboard);

        // Find current user's rank
        const currentUser = data.leaderboard.find(u => u.userId === 'demo-user');
        setUserRank(currentUser);
      } catch (err) {
        console.error('Leaderboard error:', err);
        setError(err.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
  }, [category]);

  const getMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    if (rank <= 10) return 'rank-top10';
    return '';
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Failed to load leaderboard</h2>
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <header className="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <p>See how you rank against other security champions</p>
      </header>

      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-tab ${category === cat.id ? 'active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            <span className="tab-icon">{cat.icon}</span>
            <span className="tab-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* User's Standing Card */}
      {userRank && (
        <section className="user-standing-card">
          <div className="standing-header">
            <span className="standing-rank">{getMedal(userRank.rank)}</span>
            <div className="standing-info">
              <span className="standing-name">Your Position</span>
              <span className="standing-stats">
                {userRank.score} points • {userRank.accuracy}% accuracy
              </span>
            </div>
          </div>
          <div className="standing-details">
            <div className="standing-stat">
              <span className="stat-value">{userRank.streak}</span>
              <span className="stat-label">Day Streak</span>
            </div>
            <div className="standing-stat">
              <span className="stat-value">{userRank.attempts}</span>
              <span className="stat-label">Scenarios</span>
            </div>
          </div>
        </section>
      )}

      {/* Leaderboard Table */}
      <section className="leaderboard-table-container">
        <div className="leaderboard-table">
          <div className="table-header">
            <span className="col-rank">Rank</span>
            <span className="col-user">User</span>
            <span className="col-score">Score</span>
            <span className="col-accuracy">Accuracy</span>
            <span className="col-streak">Streak</span>
          </div>

          <div className="table-body">
            {leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className={`table-row ${entry.userId === 'demo-user' ? 'current-user' : ''} ${getRankClass(entry.rank)}`}
              >
                <span className="col-rank">
                  <span className="rank-badge">{getMedal(entry.rank)}</span>
                </span>
                <span className="col-user">
                  <span className="user-avatar">
                    {entry.displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="user-name">
                    {entry.displayName}
                    {entry.userId === 'demo-user' && (
                      <span className="you-badge">You</span>
                    )}
                  </span>
                </span>
                <span className="col-score">{entry.score.toLocaleString()}</span>
                <span className="col-accuracy">{entry.accuracy}%</span>
                <span className="col-streak">
                  {entry.streak > 0 && <span className="streak-indicator">🔥 {entry.streak}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Climb */}
      <section className="climb-tips">
        <h2>📈 How to Climb the Ranks</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">🎯</span>
            <h3>Accuracy Matters</h3>
            <p>Correct answers earn more points. Take time to analyze each scenario.</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🔥</span>
            <h3>Keep the Streak</h3>
            <p>Train daily to maintain your streak. Streaks multiply your points.</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">🏅</span>
            <h3>Complete All Modules</h3>
            <p>Don't skip categories. Balanced skills score higher.</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">⚡</span>
            <h3>Speed Bonus</h3>
            <p>Quick, correct responses earn extra points. But don't rush!</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Leaderboard;
