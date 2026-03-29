import { useState } from 'react';
import PropTypes from 'prop-types';
import './SafeBrowserSimulator.css';

/**
 * SafeBrowserSimulator Component
 * Simulated browser window for safe browsing training
 */
export function SafeBrowserSimulator({ scenario, onSubmit, onEvent }) {
  const [startTime] = useState(Date.now());
  const [addressBarFocused, setAddressBarFocused] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  // Parse scenario data
  const browserScenario = parseScenario(scenario);

  const handleAction = (optionId) => {
    setSelectedOption(optionId);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    onSubmit([optionId], timeSpent);

    onEvent?.({
      type: 'option_selected',
      scenarioId: scenario.scenarioId,
      optionId
    });
  };

  const handleAddressBarClick = () => {
    setAddressBarFocused(true);
    onEvent?.({
      type: 'address_bar_clicked',
      scenarioId: scenario.scenarioId
    });
  };

  const handleCertificateClick = () => {
    setShowDetails(!showDetails);
    onEvent?.({
      type: 'certificate_clicked',
      scenarioId: scenario.scenarioId
    });
  };

  const handleReport = () => {
    onEvent?.({
      type: 'reported',
      scenarioId: scenario.scenarioId
    });
  };

  // Determine security status
  const isSecure = browserScenario.url.startsWith('https://');
  const hasValidCert = browserScenario.certificate.valid;
  const isSuspicious = browserScenario.flags.some(f => f.severity === 'high');

  return (
    <div className="safe-browser-simulator">
      {/* Browser Chrome */}
      <div className="browser-chrome">
        {/* Tab Bar */}
        <div className="browser-tabs">
          <div className="browser-tab active">
            <span className="tab-favicon">{browserScenario.favicon}</span>
            <span className="tab-title">{browserScenario.pageTitle}</span>
            <button className="tab-close">×</button>
          </div>
          <button className="tab-new">+</button>
        </div>

        {/* Address Bar */}
        <div className="browser-toolbar">
          <div className="nav-buttons">
            <button className="nav-btn">←</button>
            <button className="nav-btn">→</button>
            <button className="nav-btn">↻</button>
          </div>

          <div 
            className={`address-bar ${addressBarFocused ? 'focused' : ''}`}
            onClick={handleAddressBarClick}
          >
            <button 
              className={`security-icon ${isSecure ? 'secure' : 'insecure'} ${hasValidCert ? 'valid' : 'invalid'}`}
              onClick={(e) => {
                e.stopPropagation();
                handleCertificateClick();
              }}
            >
              {isSecure ? '🔒' : '⚠️'}
            </button>

            <span className={`protocol ${isSecure ? 'secure' : 'insecure'}`}>
              {isSecure ? 'https://' : 'http://'}
            </span>
            <span className="domain">{browserScenario.domain}</span>
            <span className="path">{browserScenario.path}</span>
          </div>
        </div>

        {/* Certificate Details Popup */}
        {showDetails && (
          <div className="cert-details">
            <div className="cert-header">
              <span className="cert-status">
                {hasValidCert ? '✓ Connection is secure' : '⚠️ Connection is not secure'}
              </span>
            </div>
            <div className="cert-info">
              <div className="cert-row">
                <span className="cert-label">Certificate:</span>
                <span className="cert-value">{browserScenario.certificate.issuer}</span>
              </div>
              <div className="cert-row">
                <span className="cert-label">Valid until:</span>
                <span className="cert-value">{browserScenario.certificate.expires}</span>
              </div>
              {!hasValidCert && (
                <div className="cert-warning">
                  ⚠️ Certificate is invalid or expired
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Page Content */}
      <div className="browser-content">
        {/* Warning Banner */}
        {isSuspicious && (
          <div className="warning-banner">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">
              This site may be deceptive. Attackers may be trying to steal your information.
            </span>
            <button className="warning-details">Details</button>
          </div>
        )}

        {/* Page Header */}
        <div className="page-header">
          <div className="site-branding">
            <span className="site-logo">{browserScenario.favicon}</span>
            <h1>{browserScenario.pageTitle}</h1>
          </div>
        </div>

        {/* Page Body */}
        <div className="page-body">
          <p>{browserScenario.content}</p>

          {/* Forms */}
          {browserScenario.hasForm && (
            <div className="login-form">
              <h3>🔐 Secure Login</h3>
              <div className="form-field">
                <label>Username</label>
                <input type="text" placeholder="Enter username" />
              </div>
              <div className="form-field">
                <label>Password</label>
                <input type="password" placeholder="Enter password" />
              </div>
              <button className="submit-form">Sign In</button>
            </div>
          )}

          {/* Download prompt */}
          {browserScenario.hasDownload && (
            <div className="download-prompt">
              <div className="download-icon">📦</div>
              <div className="download-info">
                <span className="download-name">{browserScenario.downloadName}</span>
                <span className="download-size">{browserScenario.downloadSize}</span>
              </div>
              <div className="download-actions">
                <button className="download-btn">Download</button>
                <button className="cancel-btn">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Flags Panel */}
      <div className="security-flags">
        <h4>🔍 Security Analysis</h4>
        <div className="flags-list">
          {browserScenario.flags.map((flag, index) => (
            <div key={index} className={`flag-item ${flag.severity}`}>
              <span className="flag-icon">
                {flag.severity === 'high' ? '🚩' : flag.severity === 'medium' ? '⚠️' : 'ℹ️'}
              </span>
              <span className="flag-text">{flag.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Panel */}
      <div className="browser-decision">
        <h4>What do you do?</h4>
        <div className="decision-options">
          {scenario.options.map((option) => (
            <button
              key={option.optionId}
              className={`browser-action-btn ${selectedOption === option.optionId ? 'selected' : ''}`}
              onClick={() => handleAction(option.optionId)}
              disabled={selectedOption !== null}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report Footer */}
      <div className="browser-footer">
        <button className="report-site-btn" onClick={handleReport}>
          🚩 Report this site
        </button>
      </div>
    </div>
  );
}

function parseScenario(scenario) {
  // Extract scenario details for browser simulation
  const isSecure = scenario.scenarioId.includes('secure');
  const isTyposquat = scenario.scenarioId.includes('typo');
  
  const domain = isTyposquat ? 'gooogle.com' : isSecure ? 'secure-bank.com' : 'paypa1-security.com';
  const protocol = isSecure ? 'https://' : 'http://';
  
  return {
    url: `${protocol}${domain}/login`,
    domain,
    path: '/login',
    protocol: isSecure ? 'https' : 'http',
    favicon: isSecure ? '🏦' : '🔴',
    pageTitle: isSecure ? 'Secure Bank Login' : 'Account Verification Required',
    content: scenario.question,
    certificate: {
      valid: isSecure,
      issuer: isSecure ? 'DigiCert Inc' : 'Unknown',
      expires: isSecure ? 'Dec 2025' : 'Expired',
      warnings: isSecure ? [] : ['Certificate expired', 'Self-signed certificate']
    },
    hasForm: true,
    hasDownload: scenario.scenarioId.includes('download'),
    downloadName: 'security_update.exe',
    downloadSize: '2.4 MB',
    flags: [
      ...(isSecure ? [] : [{ severity: 'high', message: 'Not using HTTPS encryption' }]),
      ...(isTyposquat ? [{ severity: 'high', message: 'Domain is a typosquat (gooogle vs google)' }] : []),
      ...(!isSecure ? [{ severity: 'medium', message: 'Invalid SSL certificate' }] : []),
      { severity: 'low', message: isSecure ? 'Domain registered for 10+ years' : 'Domain registered recently' }
    ]
  };
}

SafeBrowserSimulator.propTypes = {
  scenario: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onEvent: PropTypes.func
};

export default SafeBrowserSimulator;