/**
 * Security Awareness Platform - Scenario Engine
 * Seed data and scenario management
 */

const scenarios = [
  // ========== PHISHING MODULE ==========
  {
    scenarioId: "phish-001",
    type: "phishing",
    title: "Mailbox Full Alert",
    question: "You receive an email claiming your mailbox is full and you must click a link to avoid losing emails. The sender appears to be 'IT Support' and the email looks professionally formatted.",
    explanation: "This is a classic phishing tactic. IT departments rarely send urgent links via email. The domain used is likely a look-alike (payroII vs payroll). Always access services through bookmarks or known URLs, not email links.",
    difficulty: "easy",
    tags: ["phishing", "email", "urgency", "it-support"],
    options: [
      { optionId: "o1", label: "Click the link immediately to fix the issue", isCorrect: false },
      { optionId: "o2", label: "Open a new tab and log into webmail via the known URL", isCorrect: true },
      { optionId: "o3", label: "Forward the email to IT and ask if it's legitimate", isCorrect: false },
      { optionId: "o4", label: "Reply to the email asking for confirmation", isCorrect: false }
    ],
    correctOptionIds: ["o2"]
  },
  {
    scenarioId: "phish-002",
    type: "phishing",
    title: "CEO Wire Transfer Request",
    question: "You receive an urgent email from your CEO asking you to process a wire transfer to a new vendor immediately. The CEO says they're in a meeting and can't be disturbed. The email address looks almost correct but has one character different.",
    explanation: "CEO fraud (BEC attacks) use urgency and authority to bypass normal procedures. Always verify unusual requests via a separate channel (phone, in-person). Check the sender domain carefully - even one character difference indicates spoofing.",
    difficulty: "medium",
    tags: ["phishing", "bec", "ceo-fraud", "urgency", "authority"],
    options: [
      { optionId: "o1", label: "Process the wire transfer immediately as requested", isCorrect: false },
      { optionId: "o2", label: "Reply to confirm the amount and account details", isCorrect: false },
      { optionId: "o3", label: "Call the CEO using a known number to verify", isCorrect: true },
      { optionId: "o4", label: "Forward to finance team to handle", isCorrect: false }
    ],
    correctOptionIds: ["o3"]
  },
  {
    scenarioId: "phish-003",
    type: "phishing",
    title: "Package Delivery Failure",
    question: "You receive a text message about a failed package delivery with a link to reschedule. You weren't expecting any packages, but the message looks official with a tracking number.",
    explanation: "Smishing (SMS phishing) often uses delivery scams. Legitimate carriers don't require you to click links to reschedule. Check your email for legitimate tracking notifications or contact the carrier directly through their official website.",
    difficulty: "easy",
    tags: ["phishing", "smishing", "delivery", "sms"],
    options: [
      { optionId: "o1", label: "Click the link to see package details", isCorrect: false },
      { optionId: "o2", label: "Delete the message - it's likely a scam", isCorrect: true },
      { optionId: "o3", label: "Reply STOP to opt out", isCorrect: false },
      { optionId: "o4", label: "Forward to your phone carrier as spam", isCorrect: false }
    ],
    correctOptionIds: ["o2"]
  },
  {
    scenarioId: "phish-004",
    type: "phishing",
    title: "Microsoft 365 Account Suspension",
    question: "An email warns that your Microsoft 365 account will be suspended in 24 hours due to suspicious activity. It includes a link to verify your identity and shows the Microsoft logo.",
    explanation: "Suspension threats create urgency. Hover over links to see the actual URL before clicking. Microsoft would not send account suspension warnings via email with immediate deadlines. Access your account directly through office.com.",
    difficulty: "medium",
    tags: ["phishing", "microsoft", "account", "suspension", "urgency"],
    options: [
      { optionId: "o1", label: "Click the link to verify your account", isCorrect: false },
      { optionId: "o2", label: "Log into Microsoft 365 directly via browser", isCorrect: true },
      { optionId: "o3", label: "Call the number in the email for support", isCorrect: false },
      { optionId: "o4", label: "Reply with your username to confirm identity", isCorrect: false }
    ],
    correctOptionIds: ["o2"]
  },

  // ========== PASSWORD SECURITY MODULE ==========
  {
    scenarioId: "pwd-001",
    type: "passwords",
    title: "Create Strong Password",
    question: "You need to create a password for a new work account. Which of the following is the strongest approach?",
    explanation: "Password managers generate unique, complex passwords for each account. Passphrases (4+ random words) are easier to remember and harder to crack than complex passwords. Reusing passwords across sites means one breach compromises all accounts.",
    difficulty: "easy",
    tags: ["passwords", "password-manager", "best-practice"],
    options: [
      { optionId: "o1", label: "Use your birthdate with exclamation mark: March2025!", isCorrect: false },
      { optionId: "o2", label: "Use the same strong password you use everywhere", isCorrect: false },
      { optionId: "o3", label: "Use a password manager to generate a unique 20-character password", isCorrect: true },
      { optionId: "o4", label: "Use a short complex password: X9#kL!", isCorrect: false }
    ],
    correctOptionIds: ["o3"]
  },
  {
    scenarioId: "pwd-002",
    type: "passwords",
    title: "MFA Request",
    question: "You receive an unexpected 2FA/MFA code on your phone, followed by an email saying there was a login attempt and asking you to confirm by entering the code.",
    explanation: "This is a real-time phishing attack. Attackers who have your password are trying to get your MFA code to complete their login. Never share MFA codes. If you didn't attempt to log in, change your password immediately.",
    difficulty: "hard",
    tags: ["passwords", "mfa", "2fa", "real-time-phishing"],
    options: [
      { optionId: "o1", label: "Enter the code to secure your account", isCorrect: false },
      { optionId: "o2", label: "Delete the email and change your password immediately", isCorrect: true },
      { optionId: "o3", label: "Reply asking if this is legitimate", isCorrect: false },
      { optionId: "o4", label: "Ignore it - it's probably a mistake", isCorrect: false }
    ],
    correctOptionIds: ["o2"]
  },
  {
    scenarioId: "pwd-003",
    type: "passwords",
    title: "Password Reset Link",
    question: "You receive a password reset email you didn't request. The email looks legitimate and has a link to reset your password.",
    explanation: "Unsolicited password reset emails may be attempts to get you to click malicious links. Don't click unknown links. If concerned, go directly to the website and use the legitimate password reset function.",
    difficulty: "medium",
    tags: ["passwords", "reset", "unsolicited"],
    options: [
      { optionId: "o1", label: "Click the link to see what's happening", isCorrect: false },
      { optionId: "o2", label: "Delete the email and manually check the account", isCorrect: true },
      { optionId: "o3", label: "Forward the email to the security team", isCorrect: true },
      { optionId: "o4", label: "Reply to the email asking who requested the reset", isCorrect: false }
    ],
    correctOptionIds: ["o2", "o3"]
  },

  // ========== SOCIAL ENGINEERING MODULE ==========
  {
    scenarioId: "se-001",
    type: "social_engineering",
    title: "IT Support Caller",
    question: "You receive a call from someone claiming to be from IT support. They say there's a problem with your account and need your password to fix it. They know your name and department.",
    explanation: "Legitimate IT will never ask for your password. This is vishing (voice phishing). Attackers can find names and departments from LinkedIn. Always verify through official channels - hang up and call IT directly using a known number.",
    difficulty: "easy",
    tags: ["social_engineering", "vishing", "it-support", "phone"],
    options: [
      { optionId: "o1", label: "Provide your password since they know your details", isCorrect: false },
      { optionId: "o2", label: "Hang up and call IT support using the official number", isCorrect: true },
      { optionId: "o3", label: "Ask them to send an email as verification", isCorrect: false },
      { optionId: "o4", label: "Give them a partial password to test if they're real", isCorrect: false }
    ],
    correctOptionIds: ["o2"]
  },
  {
    scenarioId: "se-002",
    type: "social_engineering",
    title: "LinkedIn Connection",
    question: "A recruiter with an impressive profile sends you a LinkedIn connection request and immediately messages you about a job opportunity. They ask for your personal email to send details.",
    explanation: "Fake LinkedIn profiles are common for data harvesting and social engineering. Verify profiles by checking mutual connections, activity history, and company legitimacy. Be cautious about moving conversations off-platform quickly.",
    difficulty: "medium",
    tags: ["social_engineering", "linkedin", "recruiter", "pretexting"],
    options: [
      { optionId: "o1", label: "Provide your personal email - it's a great opportunity", isCorrect: false },
      { optionId: "o2", label: "Verify their profile, check for mutual connections, proceed cautiously", isCorrect: true },
      { optionId: "o3", label: "Accept but don't provide email until you verify the company", isCorrect: true },
      { optionId: "o4", label: "Ignore - all LinkedIn recruiters are suspicious", isCorrect: false }
    ],
    correctOptionIds: ["o2", "o3"]
  },
  {
    scenarioId: "se-003",
    type: "social_engineering",
    title: "Help Desk Impersonation",
    question: "You're in a coffee shop and someone approaches saying they're from your company's IT department. They noticed your laptop and want to help you install security updates. They show you a company badge.",
    explanation: "In-person social engineering uses props and confidence. Real IT doesn't approach people in public places. Verify by calling your company's IT directly or checking with your manager. Never let strangers touch your work devices.",
    difficulty: "hard",
    tags: ["social_engineering", "in-person", "physical", "help-desk"],
    options: [
      { optionId: "o1", label: "Let them help since they have a badge", isCorrect: false },
      { optionId: "o2", label: "Decline and contact IT through official channels", isCorrect: true },
      { optionId: "o3", label: "Ask to see more identification", isCorrect: false },
      { optionId: "o4", label: "Agree but watch them carefully", isCorrect: false }
    ],
    correctOptionIds: ["o2"]
  },

  // ========== SAFE BROWSING MODULE ==========
  {
    scenarioId: "browse-001",
    type: "safe_browsing",
    title: "HTTP Website",
    question: "You need to check your bank statement and Google shows a result. The URL starts with 'http://' instead of 'https://' but the page looks identical to your bank's website.",
    explanation: "HTTP (not HTTPS) means the connection is not encrypted. Attackers can create look-alike sites without valid certificates. Always verify HTTPS and the correct domain before entering credentials. Type URLs directly or use bookmarks.",
    difficulty: "easy",
    tags: ["safe_browsing", "https", "tls", "banking"],
    options: [
      { optionId: "o1", label: "Proceed - the page looks correct", isCorrect: false },
      { optionId: "o2", label: "Close the tab and type the bank URL directly", isCorrect: true },
      { optionId: "o3", label: "Check if the lock icon appears elsewhere on the page", isCorrect: false },
      { optionId: "o4", label: "Try logging in to see if it works", isCorrect: false }
    ],
    correctOptionIds: ["o2"]
  },
  {
    scenarioId: "browse-002",
    type: "safe_browsing",
    title: "Download Permission",
    question: "A website asks for permission to download multiple files and access your clipboard. It's a productivity tool your colleague recommended.",
    explanation: "Browser permissions are powerful. Downloads and clipboard access can be used maliciously. Only grant permissions to trusted sites. Consider using the tool in a separate browser profile or sandboxed environment.",
    difficulty: "medium",
    tags: ["safe_browsing", "permissions", "downloads", "browser"],
    options: [
      { optionId: "o1", label: "Allow all permissions to use the tool", isCorrect: false },
      { optionId: "o2", label: "Research the tool first, limit permissions, or use sandbox", isCorrect: true },
      { optionId: "o3", label: "Allow downloads but deny clipboard access", isCorrect: false },
      { optionId: "o4", label: "Ask your colleague if it's safe", isCorrect: false }
    ],
    correctOptionIds: ["o2"]
  },
  {
    scenarioId: "browse-003",
    type: "safe_browsing",
    title: "Typosquatting Domain",
    question: "You type 'gooogle.com' by mistake and the site loads. It looks like Google's homepage but the URL has an extra 'o'. The search works normally.",
    explanation: "Typosquatting registers domains with common misspellings. These can be used for malware distribution or credential harvesting. Always check the URL bar before entering credentials. Use bookmarks for frequently visited sites.",
    difficulty: "medium",
    tags: ["safe_browsing", "typosquatting", "domain", "look-alike"],
    options: [
      { optionId: "o1", label: "Use the site since it works", isCorrect: false },
      { optionId: "o2", label: "Close the tab and navigate to the correct URL", isCorrect: true },
      { optionId: "o3", label: "Report the site to Google", isCorrect: true },
      { optionId: "o4", label: "Check if it has a security certificate first", isCorrect: false }
    ],
    correctOptionIds: ["o2", "o3"]
  },
  {
    scenarioId: "browse-004",
    type: "safe_browsing",
    title: "Public Wi-Fi Login",
    question: "At an airport, you connect to 'Free_Airport_WiFi' which requires creating an account. The page asks for your email and to create a password for 'WiFi access'.",
    explanation: "Public Wi-Fi can be run by attackers (evil twin attacks). They harvest credentials people reuse across services. Never use work passwords on public Wi-Fi login pages. Consider using a VPN or your phone's hotspot instead.",
    difficulty: "hard",
    tags: ["safe_browsing", "public-wifi", "evil-twin", "credentials"],
    options: [
      { optionId: "o1", label: "Create an account using your work email and password", isCorrect: false },
      { optionId: "o2", label: "Use your phone hotspot instead", isCorrect: true },
      { optionId: "o3", label: "Create an account with a unique throwaway password", isCorrect: true },
      { optionId: "o4", label: "Ask airport staff if this is the official WiFi", isCorrect: true }
    ],
    correctOptionIds: ["o2", "o3", "o4"]
  }
];

/**
 * Get a scenario by its ID
 * @param {string} id - The scenario ID
 * @returns {Object|null} The scenario or null if not found
 */
function getScenarioById(id) {
  return scenarios.find((s) => s.scenarioId === id) || null;
}

/**
 * Get a random scenario
 * @returns {Object} A random scenario
 */
function getRandomScenario() {
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

/**
 * Get scenarios filtered by type
 * @param {string} type - The scenario type
 * @returns {Array} Filtered scenarios
 */
function getScenariosByType(type) {
  return scenarios.filter((s) => s.type === type);
}

/**
 * Get scenarios filtered by difficulty
 * @param {string} difficulty - The difficulty level
 * @returns {Array} Filtered scenarios
 */
function getScenariosByDifficulty(difficulty) {
  return scenarios.filter((s) => s.difficulty === difficulty);
}

/**
 * Get all scenarios
 * @returns {Array} All scenarios
 */
function getAllScenarios() {
  return scenarios;
}

/**
 * Get scenario count by type
 * @returns {Object} Counts by type
 */
function getScenarioCounts() {
  return {
    total: scenarios.length,
    phishing: scenarios.filter(s => s.type === 'phishing').length,
    passwords: scenarios.filter(s => s.type === 'passwords').length,
    social_engineering: scenarios.filter(s => s.type === 'social_engineering').length,
    safe_browsing: scenarios.filter(s => s.type === 'safe_browsing').length
  };
}

module.exports = {
  scenarios,
  getScenarioById,
  getRandomScenario,
  getScenariosByType,
  getScenariosByDifficulty,
  getAllScenarios,
  getScenarioCounts
};