import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScenarioCard } from '../components/ScenarioCard';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { getRandomScenario, submitScenarioAnswer } from '../services/scenarioService.js';
import { api, isAuthenticated } from '../services/api.js';
import './Training.css';

/**
 * Training Page Component
 * Interactive scenario training with AI-powered recommendations and feedback
 */
export function Training() {
  const [searchParams] = useSearchParams();
  const [scenario, setScenario] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const filterType = searchParams.get('type');

  // Fetch AI recommendation on mount (if authenticated)
  useEffect(() => {
    if (isAuthenticated() && !filterType) {
      fetchAiRecommendation();
    }
  }, []);

  // Fetch AI recommendation
  const fetchAiRecommendation = async () => {
    if (!isAuthenticated()) return;
    
    try {
      const response = await api.post('/ai/recommend', {});
      setRecommendation(response.data.data);
    } catch (err) {
      console.warn('Failed to get AI recommendation:', err.message);
    }
  };

  // Fetch next scenario
  const fetchNextScenario = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAiFeedback(null);

    try {
      // Use AI recommendation if available
      const recType = recommendation?.recommendedType;
      const recDifficulty = recommendation?.recommendedDifficulty;
      
      const scenarioData = await getRandomScenario(
        filterType || recType,
        recDifficulty
      );
      
      if (!scenarioData) {
        throw new Error('No scenarios available');
      }
      
      setScenario(scenarioData);
    } catch (err) {
      console.error('Failed to load scenario:', err);
      setError('Failed to load scenario. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load scenario on mount
  useEffect(() => {
    fetchNextScenario();
  }, [filterType, recommendation]);

  // Fetch AI feedback after submission
  const fetchAiFeedback = async (scenarioId, isCorrect) => {
    if (!isAuthenticated()) return;
    
    setAiLoading(true);
    try {
      const response = await api.post('/ai/feedback', {
        scenarioId,
        isCorrect
      });
      setAiFeedback(response.data.data);
    } catch (err) {
      console.warn('Failed to get AI feedback:', err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Handle scenario submission
  const handleSubmit = async (selectedOptionIds, timeSpentSeconds) => {
    setLoading(true);

    try {
      const submitResult = await submitScenarioAnswer(
        scenario.id || scenario.scenarioId,
        selectedOptionIds,
        timeSpentSeconds
      );

      setResult(submitResult);
      
      // Fetch AI feedback for authenticated users
      if (isAuthenticated()) {
        fetchAiFeedback(scenario.id || scenario.scenarioId, submitResult.isCorrect);
      }
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
    setAiFeedback(null);
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
        {recommendation?.aiPowered && (
          <span className="ai-badge" title={recommendation.reasoning}>
            🤖 AI Recommended
          </span>
        )}
      </header>

      <div className="training-content">
        {result ? (
          <FeedbackPanel
            result={result}
            aiFeedback={aiFeedback}
            aiLoading={aiLoading}
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
