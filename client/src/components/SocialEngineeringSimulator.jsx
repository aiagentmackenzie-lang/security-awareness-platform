import { useState } from 'react';
import PropTypes from 'prop-types';
import './SocialEngineeringSimulator.css';

/**
 * SocialEngineeringSimulator Component
 * Chat/role-play simulation for social engineering detection
 */
export function SocialEngineeringSimulator({ scenario, onSubmit, onEvent }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPath, setSelectedPath] = useState([]);
  const [startTime] = useState(Date.now());
  const [showIdentity, setShowIdentity] = useState(false);

  // Parse scenario into chat messages
  const chatScenario = parseScenario(scenario);

  const handleOptionSelect = (optionIndex) => {
    const newPath = [...selectedPath, optionIndex];
    setSelectedPath(newPath);
    
    onEvent?.({
      type: 'option_selected',
      scenarioId: scenario.scenarioId,
      step: currentStep,
      choice: optionIndex
    });

    // Check if this leads to an ending
    const currentNode = getCurrentNode(chatScenario, newPath);
    if (currentNode.isEnding) {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const isCorrect = currentNode.isCorrect;
      
      // Map ending to option ID
      const optionId = isCorrect ? 'o2' : optionIndex === 0 ? 'o1' : 'o3';
      onSubmit([optionId], timeSpent);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleReport = () => {
    onEvent?.({
      type: 'reported',
      scenarioId: scenario.scenarioId
    });
  };

  const currentNode = getCurrentNode(chatScenario, selectedPath);

  return (
    <div className="social-engineering-simulator">
      {/* Scenario Header */}
      <div className="se-header">
        <div className="se-context">
          <span className="se-icon">🎭</span>
          <div className="se-info">
            <h3>{scenario.title}</h3>
            <p>{chatScenario.context}</p>
          </div>
        </div>
        <button 
          className="identity-toggle"
          onClick={() => setShowIdentity(!showIdentity)}
        >
          {showIdentity ? '🙈 Hide Identity' : '👤 Show Identity'}
        </button>
      </div>

      {/* Identity Card (if revealed) */}
      {showIdentity && (
        <div className="identity-card">
          <div className="identity-header">
            <span className="identity-avatar">{chatScenario.caller.avatar}</span>
            <div className="identity-details">
              <span className="identity-name">{chatScenario.caller.name}</span>
              <span className="identity-role">{chatScenario.caller.role}</span>
              <span className={`identity-status ${chatScenario.caller.isLegitimate ? 'legit' : 'suspicious'}`}>
                {chatScenario.caller.isLegitimate ? '✓ Verified' : '⚠️ Unverified'}
              </span>
            </div>
          </div>
          <div className="identity-flags">
            {chatScenario.caller.redFlags.map((flag, index) => (
              <div key={index} className="red-flag">
                🚩 {flag}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="chat-container">
        <div className="chat-messages">
          {/* Initial message */}
          <div className="chat-message incoming">
            <div className="message-avatar">{chatScenario.caller.avatar}</div>
            <div className="message-content">
              <p>{chatScenario.initialMessage}</p>
              <span className="message-time">Just now</span>
            </div>
          </div>

          {/* Path messages */}
          {selectedPath.map((choice, index) => {
            const node = getNodeAtDepth(chatScenario, index);
            const option = node.options[choice];
            
            return (
              <>
                {/* User response */}
                <div key={`user-${index}`} className="chat-message outgoing">
                  <div className="message-content">
                    <p>{option.text}</p>
                    <span className="message-time">Just now</span>
                  </div>
                  <div className="message-avatar">👤</div>
                </div>
                
                {/* System/Caller response */}
                {option.response && (
                  <div key={`response-${index}`} className="chat-message incoming">
                    <div className="message-avatar">{chatScenario.caller.avatar}</div>
                    <div className="message-content">
                      <p>{option.response}</p>
                      <span className="message-time">Just now</span>
                    </div>
                  </div>
                )}
              </>
            );
          })}
        </div>

        {/* Typing indicator */}
        {!currentNode.isEnding && (
          <div className="typing-indicator">
            <span>{chatScenario.caller.name} is typing</span>
            <span className="dots">...</span>
          </div>
        )}
      </div>

      {/* Decision Options */}
      {!currentNode.isEnding ? (
        <div className="decision-options">
          <h4>How do you respond?</h4>
          <div className="options-grid">
            {currentNode.options.map((option, index) => (
              <button
                key={index}
                className="decision-btn"
                onClick={() => handleOptionSelect(index)}
              >
                <span className="decision-icon">{option.icon}</span>
                <span className="decision-text">{option.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={`ending-panel ${currentNode.isCorrect ? 'success' : 'danger'}`}>
          <div className="ending-icon">
            {currentNode.isCorrect ? '✅' : '❌'}
          </div>
          <h4>{currentNode.endingTitle}</h4>
          <p>{currentNode.endingDescription}</p>
        </div>
      )}

      {/* Report Button */}
      <div className="se-footer">
        <button className="report-btn" onClick={handleReport}>
          🚩 Report Suspicious Activity
        </button>
      </div>
    </div>
  );
}

function parseScenario(scenario) {
  // Parse scenario data into structured chat format
  return {
    context: scenario.question,
    caller: {
      name: 'IT Support',
      role: 'Technical Support Agent',
      avatar: '👨‍💼',
      isLegitimate: false,
      redFlags: [
        'Called from unrecognized number',
        'Asked for password directly',
        'Created urgency pressure',
        'Did not verify through official channels'
      ]
    },
    initialMessage: "Hello, this is IT Support. We've detected suspicious activity on your account and need to verify your identity immediately. Can you please provide your current password so we can secure your account?",
    steps: [
      {
        options: [
          { 
            text: "Sure, my password is...", 
            icon: '🔓',
            response: "Thank you. Now I also need your MFA code that was just sent to your phone.",
            isCorrect: false
          },
          { 
            text: "I'll call IT back using the official number", 
            icon: '📞',
            response: "There's no time for that! Your account will be locked in 2 minutes!",
            isCorrect: true
          },
          { 
            text: "Can you verify your employee ID?", 
            icon: '🆔',
            response: "I'm calling from the emergency line, I don't have my ID with me. This is urgent!",
            isCorrect: true
          },
          { 
            text: "Let me check with my manager first", 
            icon: '👔',
            response: "Your manager is busy. I need this NOW to prevent account lockout.",
            isCorrect: true
          }
        ]
      }
    ]
  };
}

function getCurrentNode(scenario, path) {
  if (path.length === 0) {
    return {
      options: scenario.steps[0].options,
      isEnding: false
    };
  }
  
  // Check if any choice leads to ending
  const lastChoice = path[path.length - 1];
  const option = scenario.steps[0].options[lastChoice];
  
  if (option.isCorrect === false) {
    return {
      isEnding: true,
      isCorrect: false,
      endingTitle: 'Account Compromised',
      endingDescription: 'You provided your password to an attacker. Never share passwords via phone, email, or chat.'
    };
  }
  
  if (option.isCorrect) {
    return {
      isEnding: true,
      isCorrect: true,
      endingTitle: 'Threat Neutralized',
      endingDescription: 'Good job! You identified social engineering tactics and followed security protocols.'
    };
  }
  
  return { isEnding: false, options: [] };
}

function getNodeAtDepth(scenario, depth) {
  return scenario.steps[0];
}

SocialEngineeringSimulator.propTypes = {
  scenario: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onEvent: PropTypes.func
};

export default SocialEngineeringSimulator;