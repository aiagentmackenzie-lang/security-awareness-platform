import { useState } from 'react';
import PropTypes from 'prop-types';
import './PhishingSimulator.css';

/**
 * PhishingSimulator Component
 * Realistic fake inbox UI for phishing detection training
 */
export function PhishingSimulator({ scenario, onSubmit, onEvent }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [showHeaders, setShowHeaders] = useState(false);
  const [startTime] = useState(Date.now());

  // Parse scenario data for email display
  const emailData = parseEmailScenario(scenario);

  const handleOptionSelect = (optionId) => {
    setSelectedIds([optionId]);
    onEvent?.({
      type: 'option_selected',
      scenarioId: scenario.scenarioId,
      optionId
    });
  };

  const handleLinkHover = (url, isSafe) => {
    setHoveredLink({ url, isSafe });
    onEvent?.({
      type: 'link_hovered',
      scenarioId: scenario.scenarioId,
      metadata: { url, isSafe }
    });
  };

  const handleReport = () => {
    onEvent?.({
      type: 'reported',
      scenarioId: scenario.scenarioId
    });
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0) return;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    onSubmit(selectedIds, timeSpent);
  };

  return (
    <div className="phishing-simulator">
      {/* Email Client Chrome */}
      <div className="email-client">
        {/* Toolbar */}
        <div className="email-toolbar">
          <button className="toolbar-btn">← Back</button>
          <button className="toolbar-btn">🗑️ Delete</button>
          <button className="toolbar-btn">⚠️ Report</button>
          <button 
            className="toolbar-btn"
            onClick={() => setShowHeaders(!showHeaders)}
          >
            {showHeaders ? 'Hide' : 'Show'} Headers
          </button>
        </div>

        {/* Email Headers */}
        <div className="email-headers">
          <div className="header-row">
            <span className="header-label">From:</span>
            <span className="header-value sender">
              <span className="sender-name">{emailData.senderName}</span>
              <span className="sender-email">{emailData.senderEmail}</span>
            </span>
          </div>
          <div className="header-row">
            <span className="header-label">To:</span>
            <span className="header-value">you@company.com</span>
          </div>
          <div className="header-row">
            <span className="header-label">Subject:</span>
            <span className="header-value subject">{emailData.subject}</span>
          </div>
          <div className="header-row">
            <span className="header-label">Date:</span>
            <span className="header-value">{emailData.date}</span>
          </div>

          {showHeaders && (
            <div className="raw-headers">
              <pre>{emailData.rawHeaders}</pre>
            </div>
          )}
        </div>

        {/* Email Body */}
        <div className="email-body">
          <div 
            className="email-content"
            dangerouslySetInnerHTML={{ __html: emailData.body }}
            onClick={(e) => {
              if (e.target.tagName === 'A') {
                e.preventDefault();
                const href = e.target.getAttribute('href');
                const optionId = emailData.links.find(l => l.url === href)?.optionId;
                if (optionId) {
                  handleOptionSelect(optionId);
                }
              }
            }}
            onMouseOver={(e) => {
              if (e.target.tagName === 'A') {
                const href = e.target.getAttribute('href');
                const link = emailData.links.find(l => l.url === href);
                if (link) {
                  handleLinkHover(href, link.isSafe);
                }
              }
            }}
          />
        </div>

        {/* Link Preview */}
        {hoveredLink && (
          <div className={`link-preview ${hoveredLink.isSafe ? 'safe' : 'suspicious'}`}>
            <span className="link-url">{hoveredLink.url}</span>
            <span className="link-status">
              {hoveredLink.isSafe ? '✓ Known domain' : '⚠️ Suspicious link'}
            </span>
          </div>
        )}
      </div>

      {/* Action Panel */}
      <div className="action-panel">
        <h4>What do you do?</h4>
        
        <div className="action-options">
          {scenario.options.map((option) => (
            <button
              key={option.optionId}
              className={`action-btn ${selectedIds.includes(option.optionId) ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(option.optionId)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="action-footer">
          <button className="report-link" onClick={handleReport}>
            🚩 Mark as Phishing
          </button>
          <button 
            className="submit-btn"
            onClick={handleSubmit}
            disabled={selectedIds.length === 0}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function parseEmailScenario(scenario) {
  // Extract email components from scenario
  const lines = scenario.question.split('\n');
  
  return {
    senderName: 'IT Support',
    senderEmail: '<it-support@payroII-company.com>',
    subject: 'URGENT: Your mailbox is full',
    date: new Date().toLocaleString(),
    body: `
      <p>Dear User,</p>
      <p>Your mailbox has exceeded its storage limit. You must <a href="http://payroII-company.com/update" class="link-danger">click here</a> to verify your account and prevent email loss.</p>
      <p>Failure to act within 24 hours will result in account suspension.</p>
      <p>Best regards,<br/>IT Security Team</p>
    `,
    rawHeaders: `From: it-support@payroII-company.com\nTo: you@company.com\nSubject: URGENT: Your mailbox is full\nDate: ${new Date().toUTCString()}\nX-Mailer: Outlook`,
    links: [
      { url: 'http://payroII-company.com/update', optionId: 'o1', isSafe: false },
      { url: 'https://portal.company.com', optionId: 'o2', isSafe: true }
    ]
  };
}

PhishingSimulator.propTypes = {
  scenario: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onEvent: PropTypes.func
};

export default PhishingSimulator;