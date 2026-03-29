import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

/**
 * Home Page Component
 * Welcome screen with module selection and stats preview
 */
export function Home() {
  const [stats, setStats] = useState({
    totalScore: 0,
    scenariosCompleted: 0,
    currentStreak: 0,
    riskScore: 50
  });
  const [loading, setLoading] = useState(true);

  // Fetch user stats on mount
  useEffect(() => {
    // TODO: Replace with actual API call
    const mockStats = {
      totalScore: 245,
      scenariosCompleted: 12,
      currentStreak: 3,
      riskScore: 42
    };
    
    setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 500);
  }, []);

  // Module definitions
  const modules = [
    {
      id: 'phishing',
      title: 'Phishing Detection',
      description: 'Learn to spot fake emails, messages, and malicious links that try to steal your information.',
      icon: '🎣',
      color: '#3B82F6',
      count: 4,
      difficulty: 'Easy to Medium'
    },
    {
      id: 'passwords',
      title: 'Password Security',
      description: 'Master password creation, multi-factor authentication, and credential protection.',
      icon: '🔐',
      color: '#8B5CF6',
      count: 3,
      difficulty: 'Easy to Hard'
    },
    {
      id: 'social_engineering',
      title: 'Social Engineering',
      description: 'Recognize manipulation tactics used by attackers to exploit human trust.',
      icon: '🎭',
      color: '#F59E0B',
      count: 3,
      difficulty: 'Easy to Hard'
    },
    {
      id: 'safe_browsing',
      title: 'Safe Browsing',
      description: 'Navigate the web safely by identifying HTTPS, typosquatting, and malicious sites.',
      icon: '🌐',
      color: '#10B981',
      count: 4,
      difficulty: 'Easy to Hard'
    }
  ];

  // Get risk level text
  const getRiskLevel = (score) => {
    if (score <= 30) return { text: 'Low Risk', color: '#10B981' };
    if (score <= 60) return { text: 'Medium Risk', color: '#F59E0B' };
    return { text: 'High Risk', color: '#DC2626' };
  };

  const riskLevel = getRiskLevel(stats.riskScore);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>🛡️ Security Awareness Platform</h1>
          <p className="hero-subtitle">
            Master cybersecurity through realistic simulations. 
            Build habits that protect you from real-world threats.
          </p>
          <div className="hero-stats">
            {loading ? (
              <div className="loading-stats">Loading stats...</div>
            ) : (
              <>
                <div className="stat-card">
                  <span className="stat-value">{stats.totalScore}</span>
                  <span className="stat-label">Total Score</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.scenariosCompleted}</span>
                  <span className="stat-label">Scenarios</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">🔥 {stats.currentStreak}</span>
                  <span className="stat-label">Day Streak</span>
                </div>
                <div className="stat-card risk">
                  <span className="stat-value" style={{ color: riskLevel.color }}>
                    {stats.riskScore}
                  </span>
                  <span className="stat-label">{riskLevel.text}</span>
                </div>
              </>
            )}
          </div>

          <Link to="/training" className="cta-button">
            Start Training
          </Link>
        </div>
      </section>

      {/* Modules Section */}
      <section className="modules-section">
        <h2>Learning Modules</h2>
        <div className="modules-grid">
          {modules.map((module) => (
            <Link
              key={module.id}
              to={`/training?type=${module.id}`}
              className="module-card"
              style={{ '--module-color': module.color }}
            >
              <div className="module-icon">{module.icon}</div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <div className="module-meta">
                <span className="module-count">{module.count} scenarios</span>
                <span className="module-difficulty">{module.difficulty}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Realistic Simulations</h3>
            <p>Practice with scenarios that mirror actual attacks, not abstract quizzes.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Behavioral Analytics</h3>
            <p>Track your responses and identify your specific vulnerabilities.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Gamified Learning</h3>
            <p>Earn points, badges, and streaks as you build security habits.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Micro-Learning</h3>
            <p>Get targeted tips immediately after mistakes, not yearly training.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;