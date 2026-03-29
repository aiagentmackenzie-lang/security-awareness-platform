import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import './PasswordChallenge.css';

/**
 * PasswordChallenge Component
 * Interactive password strength training with real-time feedback
 */
export function PasswordChallenge({ scenario, onSubmit, onEvent }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [startTime] = useState(Date.now());
  const [attempts, setAttempts] = useState([]);

  // Calculate password strength
  const strength = useMemo(() => calculateStrength(password), [password]);

  // Track events
  const handleInput = (value) => {
    setPassword(value);
    onEvent?.({
      type: 'password_input',
      scenarioId: scenario.scenarioId,
      length: value.length
    });
  };

  const handleSubmit = () => {
    if (!password) return;
    
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const isCorrect = strength.score >= 3; // Medium or better
    
    // Find matching option based on strength
    let selectedOptionId = 'o1'; // Default to weak
    if (strength.score >= 4) selectedOptionId = 'o3';
    else if (strength.score >= 3) selectedOptionId = 'o2';
    
    onSubmit([selectedOptionId], timeSpent);
  };

  const handleHint = () => {
    onEvent?.({
      type: 'hint_requested',
      scenarioId: scenario.scenarioId
    });
  };

  return (
    <div className="password-challenge">
      <div className="challenge-header">
        <span className="challenge-icon">🔐</span>
        <h3>{scenario.title}</h3>
        <span className="difficulty-badge">{scenario.difficulty}</span>
      </div>

      <p className="challenge-description">{scenario.question}</p>

      <div className="password-input-container">
        <div className="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Enter a strong password..."
            className={`password-input strength-${strength.label.toLowerCase()}`}
          />
          <button 
            className="toggle-visibility"
            onClick={() => setShowPassword(!showPassword)}
            type="button"
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        {/* Strength Meter */}
        <div className="strength-meter">
          <div className="strength-bars">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`strength-bar ${level <= strength.score ? 'active' : ''} ${strength.color}`}
              />
            ))}
          </div>
          <span className="strength-label">{strength.label}</span>
        </div>

        {/* Real-time Feedback */}
        <div className="password-feedback">
          <div className="feedback-item">
            <span className={strength.hasLength ? 'pass' : 'fail'}>
              {strength.hasLength ? '✓' : '○'}
            </span>
            At least 12 characters
          </div>
          <div className="feedback-item">
            <span className={strength.hasUppercase ? 'pass' : 'fail'}>
              {strength.hasUppercase ? '✓' : '○'}
            </span>
            Uppercase letters
          </div>
          <div className="feedback-item">
            <span className={strength.hasLowercase ? 'pass' : 'fail'}>
              {strength.hasLowercase ? '✓' : '○'}
            </span>
            Lowercase letters
          </div>
          <div className="feedback-item">
            <span className={strength.hasNumbers ? 'pass' : 'fail'}>
              {strength.hasNumbers ? '✓' : '○'}
            </span>
            Numbers
          </div>
          <div className="feedback-item">
            <span className={strength.hasSymbols ? 'pass' : 'fail'}>
              {strength.hasSymbols ? '✓' : '○'}
            </span>
            Special characters (!@#$%)
          </div>
        </div>

        {/* Entropy Display */}
        {password && (
          <div className="entropy-display">
            <div className="entropy-bar">
              <div 
                className="entropy-fill"
                style={{ width: `${Math.min(strength.entropy / 100 * 100, 100)}%` }}
              />
            </div>
            <span className="entropy-text">
              Entropy: {strength.entropy} bits
              {strength.entropy < 50 && ' (Weak)'}
              {strength.entropy >= 50 && strength.entropy < 80 && ' (Good)'}
              {strength.entropy >= 80 && ' (Strong)'}
            </span>
          </div>
        )}

        {/* Crack Time Estimate */}
        {password && (
          <div className="crack-time">
            <span className="crack-label">Estimated crack time:</span>
            <span className="crack-value">{strength.crackTime}</span>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="password-tips">
        <h4>💡 Tips for Strong Passwords</h4>
        <ul>
          <li>Use a passphrase (4+ random words)</li>
          <li>Mix character types unpredictably</li>
          <li>Avoid dictionary words and patterns</li>
          <li>Consider using a password manager</li>
        </ul>
      </div>

      <div className="challenge-actions">
        <button className="hint-btn" onClick={handleHint}>
          💡 Need a hint?
        </button>
        <button 
          className="submit-btn"
          onClick={handleSubmit}
          disabled={!password || strength.score < 2}
        >
          Submit Password
        </button>
      </div>
    </div>
  );
}

function calculateStrength(password) {
  if (!password) {
    return {
      score: 0,
      label: 'Empty',
      color: 'gray',
      entropy: 0,
      crackTime: 'Instant',
      hasLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumbers: false,
      hasSymbols: false
    };
  }

  const hasLength = password.length >= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (hasUppercase) score++;
  if (hasLowercase) score++;
  if (hasNumbers) score++;
  if (hasSymbols) score++;

  // Calculate entropy
  let poolSize = 0;
  if (hasLowercase) poolSize += 26;
  if (hasUppercase) poolSize += 26;
  if (hasNumbers) poolSize += 10;
  if (hasSymbols) poolSize += 32;
  
  const entropy = poolSize > 0 
    ? Math.round(password.length * Math.log2(poolSize))
    : 0;

  // Estimate crack time
  let crackTime = 'Instant';
  if (entropy > 40) crackTime = 'Seconds';
  if (entropy > 60) crackTime = 'Minutes';
  if (entropy > 80) crackTime = 'Days';
  if (entropy > 100) crackTime = 'Years';
  if (entropy > 120) crackTime = 'Centuries';

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const colors = ['red', 'red', 'orange', 'yellow', 'green', 'green'];

  return {
    score: Math.min(score, 5),
    label: labels[Math.min(score, 5)],
    color: colors[Math.min(score, 5)],
    entropy,
    crackTime,
    hasLength,
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSymbols
  };
}

PasswordChallenge.propTypes = {
  scenario: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onEvent: PropTypes.func
};

export default PasswordChallenge;