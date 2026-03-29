import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './ScoreBoard.css';

/**
 * ScoreBoard Component
 * Displays current score, streak, level, and recent badge
 */
export function ScoreBoard({ score, streak, level, badge, compact = false }) {
  const [animate, setAnimate] = useState(false);

  // Animate on score change
  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 500);
    return () => clearTimeout(timer);
  }, [score]);

  // Get streak fire count
  const getStreakFires = (s) => {
    if (s >= 30) return '🔥🔥🔥';
    if (s >= 7) return '🔥🔥';
    if (s >= 3) return '🔥';
    return '⚡';
  };

  // Get level color
  const getLevelColor = (l) => {
    const colors = {
      1: '#94a3b8',
      2: '#3b82f6',
      3: '#8b5cf6',
      4: '#f59e0b',
      5: '#dc2626',
      6: '#10b981'
    };
    return colors[l] || '#94a3b8';
  };

  if (compact) {
    return (
      <div className="scoreboard-compact">
        <div className="compact-stat">
          <span className="compact-value">{score}</span>
          <span className="compact-label">PTS</span>
        </div>
        {streak > 0 && (
          <div className="compact-stat streak">
            <span className="compact-value">{getStreakFires(streak)}</span>
            <span className="compact-label">{streak}d</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="scoreboard">
      {/* Score */}
      <div className={`score-display ${animate ? 'animate' : ''}`}>
        <span className="score-value">{score.toLocaleString()}</span>
        <span className="score-label">Points</span>
      </div>

      {/* Level */}
      {level && (
        <div className="level-display">
          <div 
            className="level-badge"
            style={{ borderColor: getLevelColor(level.level) }}
          >
            <span className="level-number">Lv.{level.level}</span>
          </div>
          <span className="level-name">{level.name}</span>
          <div className="level-progress">
            <div 
              className="level-progress-fill"
              style={{ 
                width: `${level.progress}%`,
                background: getLevelColor(level.level)
              }}
            />
          </div>
        </div>
      )}

      {/* Streak */}
      {streak > 0 && (
        <div className="streak-display">
          <span className="streak-icon">{getStreakFires(streak)}</span>
          <span className="streak-count">{streak} Day{streak !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Recent Badge */}
      {badge && (
        <div className="recent-badge">
          <span className="badge-icon">{badge.icon}</span>
          <span className="badge-name">{badge.name}</span>
        </div>
      )}
    </div>
  );
}

ScoreBoard.propTypes = {
  score: PropTypes.number.isRequired,
  streak: PropTypes.number,
  level: PropTypes.shape({
    level: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    progress: PropTypes.number,
    nextLevelAt: PropTypes.number
  }),
  badge: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }),
  compact: PropTypes.bool
};

export default ScoreBoard;