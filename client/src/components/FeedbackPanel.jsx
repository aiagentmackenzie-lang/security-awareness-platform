import PropTypes from 'prop-types';
import './FeedbackPanel.css';

/**
 * FeedbackPanel Component
 * Displays evaluation results with AI-generated personalized feedback
 */
export function FeedbackPanel({ result, aiFeedback, aiLoading, onNext, onRetry }) {
  if (!result) return null;

  const { isCorrect, correctOptions, explanation, scoreDelta } = result;

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
    <div className={`feedback-panel ${isCorrect ? 'correct' : 'incorrect'}`}>
      {/* Result Header */}
      <div className="feedback-header">
        <div className="result-status">
          <span className="status-icon">{isCorrect ? '✅' : '❌'}</span>
          <h3 className="status-text">{isCorrect ? 'Correct!' : 'Not Quite'}</h3>
        </div>
        
        {aiFeedback?.aiPowered && (
          <div className="ai-badge">
            🤖 AI Powered
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

      {/* AI Feedback (if available) */}
      {aiLoading && (
        <div className="ai-loading">
          <span className="ai-spinner">🤖</span>
          <span>Generating personalized feedback...</span>
        </div>
      )}

      {aiFeedback && (
        <div className="ai-feedback-section">
          <div className="ai-feedback-praise">
            {aiFeedback.praise}
          </div>
          
          <div className="feedback-section">
            <h4>💡 Key Lesson</h4>
            <p className="explanation-text">{aiFeedback.keyLesson || explanation}</p>
          </div>
          
          <div className="feedback-section">
            <h4>🎯 Practical Tip</h4>
            <p className="tip-text">{aiFeedback.practicalTip}</p>
          </div>
          
          {aiFeedback.relatedConcept && (
            <div className="feedback-section related-concept">
              <h4>🔗 Related Concept</h4>
              <p>{aiFeedback.relatedConcept}</p>
            </div>
          )}
          
          {aiFeedback.nextSteps && (
            <div className="feedback-section next-steps">
              <h4>👣 Next Steps</h4>
              <p>{aiFeedback.nextSteps}</p>
            </div>
          )}
        </div>
      )}

      {/* Standard feedback (if no AI feedback) */}
      {!aiFeedback && !aiLoading && (
        <div className="feedback-section">
          <h4>💡 Key Learning</h4>
          <p className="explanation-text">{explanation}</p>
        </div>
      )}

      {/* Actions */}
      <div className="feedback-actions">
        {onRetry && !isCorrect && (
          <button className="btn-secondary" onClick={onRetry}>
            Try Again
          </button>
        )}
        <button className="btn-primary" onClick={onNext}>
          {isCorrect ? 'Next Scenario →' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}

FeedbackPanel.propTypes = {
  result: PropTypes.shape({
    isCorrect: PropTypes.bool.isRequired,
    scoreDelta: PropTypes.number.isRequired,
    explanation: PropTypes.string.isRequired
  }),
  aiFeedback: PropTypes.shape({
    aiPowered: PropTypes.bool,
    praise: PropTypes.string,
    keyLesson: PropTypes.string,
    practicalTip: PropTypes.string,
    relatedConcept: PropTypes.string,
    nextSteps: PropTypes.string
  }),
  aiLoading: PropTypes.bool,
  onNext: PropTypes.func.isRequired,
  onRetry: PropTypes.func
};

export default FeedbackPanel;
