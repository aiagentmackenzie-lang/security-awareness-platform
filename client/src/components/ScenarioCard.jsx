import { useState } from 'react';
import PropTypes from 'prop-types';
import './ScenarioCard.css';

/**
 * ScenarioCard Component
 * Displays a scenario question with selectable options
 */
export function ScenarioCard({ scenario, onSubmit, onEvent }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [startTime] = useState(Date.now());

  // Track scenario viewed event
  const handleView = () => {
    if (onEvent) {
      onEvent({
        type: 'scenario_viewed',
        scenarioId: scenario.scenarioId
      });
    }
  };

  // Track option hover event
  const handleOptionHover = (optionId) => {
    if (onEvent) {
      onEvent({
        type: 'option_hovered',
        scenarioId: scenario.scenarioId,
        optionId
      });
    }
  };

  // Toggle option selection
  const toggleOption = (optionId) => {
    setSelectedIds((prev) => {
      const isMultiSelect = scenario.correctOptionIds.length > 1;
      
      if (isMultiSelect) {
        // Multi-select: toggle
        return prev.includes(optionId) 
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId];
      } else {
        // Single-select: replace
        return [optionId];
      }
    });

    // Track option selected event
    if (onEvent) {
      onEvent({
        type: 'option_selected',
        scenarioId: scenario.scenarioId,
        optionId
      });
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (selectedIds.length === 0) return;

    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);
    
    onSubmit(selectedIds, timeSpentSeconds);

    // Track submit event
    if (onEvent) {
      onEvent({
        type: 'submitted',
        scenarioId: scenario.scenarioId,
        selectedOptionIds: selectedIds
      });
    }
  };

  // Handle report action
  const handleReport = () => {
    if (onEvent) {
      onEvent({
        type: 'reported',
        scenarioId: scenario.scenarioId
      });
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'var(--color-success)';
      case 'medium':
        return 'var(--color-warning)';
      case 'hard':
        return 'var(--color-danger)';
      default:
        return 'var(--color-text-muted)';
    }
  };

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
    <div className="scenario-card" onLoad={handleView}>
      {/* Header */}
      <div className="scenario-header">
        <div className="scenario-meta">
          <span className="scenario-category">
            {getCategoryIcon(scenario.type)} {scenario.type.replace('_', ' ')}
          </span>
          <span 
            className="scenario-difficulty"
            style={{ color: getDifficultyColor(scenario.difficulty) }}
          >
            {scenario.difficulty.toUpperCase()}
          </span>
        </div>
        <button 
          className="report-btn"
          onClick={handleReport}
          title="Report this scenario"
        >
          🚩 Report
        </button>
      </div>

      {/* Title */}
      <h2 className="scenario-title">{scenario.title}</h2>

      {/* Question */}
      <div className="scenario-question">
        <p>{scenario.question}</p>
      </div>

      {/* Options */}
      <div className="scenario-options">
        {scenario.options.map((option) => (
          <button
            key={option.optionId}
            type="button"
            className={`option-btn ${selectedIds.includes(option.optionId) ? 'selected' : ''}`}
            onClick={() => toggleOption(option.optionId)}
            onMouseEnter={() => handleOptionHover(option.optionId)}
          >
            <span className="option-indicator">
              {selectedIds.includes(option.optionId) ? '✓' : '○'}
            </span>
            <span className="option-label">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="scenario-footer">
        <p className="selection-hint">
          {scenario.correctOptionIds.length > 1 
            ? `Select ${scenario.correctOptionIds.length} options` 
            : 'Select one option'}
        </p>
        <button
          type="button"
          className="submit-btn"
          onClick={handleSubmit}
          disabled={selectedIds.length === 0}
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
}

ScenarioCard.propTypes = {
  scenario: PropTypes.shape({
    scenarioId: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    question: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
      optionId: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })).isRequired,
    correctOptionIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    difficulty: PropTypes.string.isRequired
  }).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onEvent: PropTypes.func
};

export default ScenarioCard;