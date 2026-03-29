import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScenarioCard } from '../components/ScenarioCard';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { getRandomScenario, submitScenarioAnswer } from '../services/scenarioService.js';
import './Training.css';

/**
 * Training Page Component
 * Interactive scenario training with feedback (static version)
 */
export function Training() {
  const [searchParams] = useSearchParams();
  const [scenario, setScenario] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterType = searchParams.get('type');

  // Fetch next scenario
  const fetchNextScenario = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const scenarioData = await getRandomScenario(filterType);
      setScenario(scenarioData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load scenario on mount
  useEffect(() => {
    fetchNextScenario();
  }, [filterType]);

  // Handle scenario submission
  const handleSubmit = async (selectedOptionIds, timeSpentSeconds) => {
    setLoading(true);

    try {
      const result = await submitScenarioAnswer(
        scenario.scenarioId,
        selectedOptionIds,
        timeSpentSeconds
      );

      setResult(result.evaluation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle behavioral events
  const handleEvent = (event) => {
    // TODO: Send to analytics API
    console.log('Event:', event);
  };

  // Handle next scenario
  const handleNext = () => {
    fetchNextScenario();
  };

  // Handle retry (show scenario again)
  const handleRetry = () => {
    setResult(null);
  };

  if (loading && !scenario) {
    return (
      <div className="training-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading scenario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="training-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Something went wrong</h2>
          <p className="error-message">{error}</p>
          <button className="error-retry" onClick={fetchNextScenario}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="training-page">
      <header className="training-header">
        <h1>🎓 Training</h1>
        {filterType && (
          <span className="filter-badge">
            Module: {filterType.replace('_', ' ')}
          </span>
        )}
      </header>

      <div className="training-content">
        {result ? (
          <FeedbackPanel
            result={result}
            onNext={handleNext}
            onRetry={handleRetry}
          />
        ) : (
          scenario && (
            <ScenarioCard
              scenario={scenario}
              onSubmit={handleSubmit}
              onEvent={handleEvent}
            />
          )
        )}
      </div>
    </div>
  );
}

export default Training;