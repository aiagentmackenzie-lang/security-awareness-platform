import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './BadgeNotification.css';

/**
 * BadgeNotification Component
 * Shows animated notification when user earns a badge
 */
export function BadgeNotification({ badges, onDismiss }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!badges || badges.length === 0) return;

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [currentIndex, badges]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (currentIndex < badges.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsVisible(true);
      } else {
        onDismiss?.();
      }
    }, 300);
  };

  if (!badges || badges.length === 0 || currentIndex >= badges.length) {
    return null;
  }

  const badge = badges[currentIndex];

  return (
    <div className={`badge-notification ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="badge-content">
        <div className="badge-icon-large">{badge.icon}</div>
        <div className="badge-text">
          <span className="badge-unlocked">🏆 Badge Unlocked!</span>
          <h4>{badge.name}</h4>
          <p>{badge.description}</p>
        </div>
        <button className="badge-dismiss" onClick={handleDismiss}>
          ✕
        </button>
      </div>
      
      {badges.length > 1 && (
        <div className="badge-counter">
          {currentIndex + 1} / {badges.length}
        </div>
      )}
    </div>
  );
}

BadgeNotification.propTypes = {
  badges: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired
  })),
  onDismiss: PropTypes.func
};

/**
 * BadgeGallery Component
 * Displays all earned badges
 */
export function BadgeGallery({ badges }) {
  if (!badges || badges.length === 0) {
    return (
      <div className="badge-gallery-empty">
        <span className="empty-icon">🏆</span>
        <p>Complete scenarios to earn badges!</p>
      </div>
    );
  }

  // Group badges by category
  const categories = {
    progress: badges.filter(b => ['first-attempt', 'first-correct', 'score-100', 'score-500'].includes(b.id)),
    streak: badges.filter(b => b.id.includes('streak')),
    category: badges.filter(b => b.id.includes('master')),
    other: badges.filter(b => 
      !['first-attempt', 'first-correct', 'score-100', 'score-500'].includes(b.id) &&
      !b.id.includes('streak') &&
      !b.id.includes('master')
    )
  };

  return (
    <div className="badge-gallery">
      {Object.entries(categories).map(([category, categoryBadges]) => 
        categoryBadges.length > 0 && (
          <div key={category} className="badge-category">
            <h4>{getCategoryTitle(category)}</h4>
            <div className="badge-grid">
              {categoryBadges.map((badge) => (
                <div key={badge.id} className="badge-card">
                  <span className="badge-icon">{badge.icon}</span>
                  <span className="badge-name">{badge.name}</span>
                  <span className="badge-desc">{badge.description}</span>
                  {badge.earnedAt && (
                    <span className="badge-date">
                      {new Date(badge.earnedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

BadgeGallery.propTypes = {
  badges: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    earnedAt: PropTypes.string
  }))
};

function getCategoryTitle(category) {
  const titles = {
    progress: '📈 Progress',
    streak: '🔥 Streaks',
    category: '🎯 Expertise',
    other: '🏆 Achievements'
  };
  return titles[category] || category;
}

export default { BadgeNotification, BadgeGallery };