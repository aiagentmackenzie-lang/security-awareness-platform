import PropTypes from 'prop-types';
import './FeedbackPanel.css';

/**
 * FeedbackPanel Component
 * Displays evaluation results and learning recommendations
 */
export function FeedbackPanel({ result, onNext, onRetry }) {
  if (!result) return null;

  const { correct, severity, explanation, scoreDelta, riskCategory, recommendedLearning } = result;

  // Get severity icon and color
  const getSeverityStyles = (sev) => {
    switch (sev) {
      case 'high':
        return { icon: '🔴', color: 'var(--color-danger)', label: 'High Risk' };
      case 'medium':
        return { icon: '🟡', color: 'var(--color-warning)', label: 'Medium Risk' };
      default:
        return { icon: '🟢', color: 'var(--color-success)', label: 'Low Risk' };
    }
  };

  const severityStyle = getSeverityStyles(severity);

  // Get category icon
  const getCategoryIcon = (type) => {
    switch (type) {
      case 'phishing':
        return '🎣';
      case 'passwords':
        return '🔐';
      case 'social_engineering':
        return '🎭';
      case 'safe_browsing':
        return '🌐';
      default:
        return '🛡️';
    }
  };

  return (
    <div className={`feedback-panel ${correct ? 'correct' : 'incorrect'}`}>
      {/* Result Header */}
      <div className="feedback-header">
        <div className="result-status">
          <span className="status-icon">{correct ? '✅' : '❌'}</span>
          <h3 className="status-text">{correct ? 'Correct!' : 'Not Quite'}</h3>
        </div>

        {!correct && (
          <div className="risk-badge" style={{ background: severityStyle.color }}>
            {severityStyle.icon} {severityStyle.label}
          </div>
        )}
      </div>

      {/* Score */}
      <div className="score-display">
        <span className={`score-value ${scoreDelta >= 0 ? 'positive' : 'negative'}`}>
          {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
        </span>
        <span className="score-label"> points</span>
      </div>

      {/* Explanation */}
      <div className="feedback-section">
        <h4>💡 Key Learning</h4>
        <p className="explanation-text">{explanation}</p>
      </div>

      {/* Category Info */}
      <div className="category-info">
        <span className="category-icon">{getCategoryIcon(riskCategory)}</span>
        <span className="category-name">{riskCategory.replace('_', ' ')}</span>
      </div>

      {/* Micro Learning */}
      {!correct && recommendedLearning && (
        <div className="micro-learning">
          <h4>📚 {recommendedLearning.title}</h4>
          <ul className="tips-list">
            {recommendedLearning.relevantTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="feedback-actions">
        {onRetry && !correct && (
          <button className="btn-secondary" onClick={onRetry}>
            Try Again
          </button>
        )}
        <button className="btn-primary" onClick={onNext}>
          {correct ? 'Next Scenario →' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

FeedbackPanel.propTypes = {
  result: PropTypes.shape({
    correct: PropTypes.bool.isRequired,
    severity: PropTypes.string,
    explanation: PropTypes.string.isRequired,
    scoreDelta: PropTypes.number.isRequired,
    riskCategory: PropTypes.string.isRequired,
    recommendedLearning: PropTypes.shape({
      title: PropTypes.string.isRequired,
      relevantTips: PropTypes.arrayOf(PropTypes.string).isRequired
    })
  }),
  onNext: PropTypes.func.isRequired,
  onRetry: PropTypes.func
};

export default FeedbackPanel;