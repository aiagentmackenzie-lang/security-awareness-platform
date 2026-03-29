/**
 * Scenario Service
 * Security Awareness Platform
 * 
 * Uses real backend API with localStorage fallback
 */

import { api, isAuthenticated } from './api.js';
import { saveAttempt } from './dashboardApi.js';

// Import static scenarios for fallback
const scenarios = [
  // Phishing scenarios
  {
    scenarioId: 'phishing-001',
    type: 'phishing',
    title: 'Suspicious Email Subject Line',
    question: 'You receive an email with the subject: "URGENT: Your Account Will Be Suspended Today!" The sender appears to be your bank but the email address looks slightly off. What do you do?',
    explanation: 'Legitimate banks never use urgent, threatening language to pressure immediate action. Always verify through official channels.',
    difficulty: 'easy',
    options: [
      { id: 'opt-1-1', option_id: 'a', label: 'Click the link immediately to secure your account', is_correct: false },
      { id: 'opt-1-2', option_id: 'b', label: 'Ignore it completely without checking', is_correct: false },
      { id: 'opt-1-3', option_id: 'c', label: 'Log into your bank via official website or app to check', is_correct: true },
      { id: 'opt-1-4', option_id: 'd', label: 'Reply to the email asking if it\'s real', is_correct: false }
    ]
  },
  {
    scenarioId: 'phishing-002',
    type: 'phishing',
    title: 'Fake Invoice Attachment',
    question: 'You receive an email with an attachment labeled "Invoice_Due.pdf.exe" from an unknown sender claiming you owe money for a service you don\'t recognize. What\'s the safest action?',
    explanation: '.exe files are executable programs, not documents. Never open executable attachments from unknown sources - they often contain malware.',
    difficulty: 'easy',
    options: [
      { id: 'opt-2-1', option_id: 'a', label: 'Open it to see what service it\'s for', is_correct: false },
      { id: 'opt-2-2', option_id: 'b', label: 'Delete the email immediately', is_correct: true },
      { id: 'opt-2-3', option_id: 'c', label: 'Forward it to your IT department and open it', is_correct: false },
      { id: 'opt-2-4', option_id: 'd', label: 'Save it for later review', is_correct: false }
    ]
  },
  {
    scenarioId: 'phishing-003',
    type: 'phishing',
    title: 'Credential Harvesting Page',
    question: 'A popup appears claiming your password expired. The URL shows "secure-bank-login.tk" instead of your bank\'s domain. What\'s wrong?',
    explanation: '.tk domains are often used for malicious sites. Always verify the exact domain matches your bank\'s official website.',
    difficulty: 'medium',
    options: [
      { id: 'opt-3-1', option_id: 'a', label: 'Enter your credentials - it says "secure"', is_correct: false },
      { id: 'opt-3-2', option_id: 'b', label: 'Close the popup and manually navigate to your bank', is_correct: true },
      { id: 'opt-3-3', option_id: 'c', label: 'Call the number in the popup', is_correct: false },
      { id: 'opt-3-4', option_id: 'd', label: 'Take a screenshot and then enter credentials', is_correct: false }
    ]
  },
  {
    scenarioId: 'phishing-004',
    type: 'phishing',
    title: 'CEO Impersonation (Whaling)',
    question: 'You get an email from your "CEO" asking you to urgently wire money to a new vendor. The email address is ceo@company-secure-mail.com instead of the usual domain. What do you do?',
    explanation: 'CEO fraud uses urgency and authority. Always verify unusual financial requests through a separate communication channel.',
    difficulty: 'hard',
    options: [
      { id: 'opt-4-1', option_id: 'a', label: 'Process the wire immediately - it\'s urgent', is_correct: false },
      { id: 'opt-4-2', option_id: 'b', label: 'Reply asking for confirmation', is_correct: false },
      { id: 'opt-4-3', option_id: 'c', label: 'Call the CEO directly using known contact info', is_correct: true },
      { id: 'opt-4-4', option_id: 'd', label: 'Forward to accounting to process', is_correct: false }
    ]
  },
  // Password scenarios
  {
    scenarioId: 'password-001',
    type: 'passwords',
    title: 'Password Reuse Risk',
    question: 'You\'ve been using the same password "Summer2023!" for your email, banking, and social media for years. A news report says your email provider had a data breach. What\'s the risk?',
    explanation: 'Password reuse means one breach compromises all accounts. Always use unique passwords and change them after breaches.',
    difficulty: 'easy',
    options: [
      { id: 'opt-5-1', option_id: 'a', label: 'Only change your email password - others are fine', is_correct: false },
      { id: 'opt-5-2', option_id: 'b', label: 'Change all passwords immediately and use unique ones', is_correct: true },
      { id: 'opt-5-3', option_id: 'c', label: 'Wait and see if anything happens', is_correct: false },
      { id: 'opt-5-4', option_id: 'd', label: 'Add "2" to the end for banking', is_correct: false }
    ]
  },
  {
    scenarioId: 'password-002',
    type: 'passwords',
    title: 'MFA Bypass Attempt',
    question: 'You receive a text message with a 6-digit code you didn\'t request, followed by a phone call from "your bank" asking you to confirm the code. What do you do?',
    explanation: 'Never share MFA codes. Scammers trigger codes then call pretending to be support to trick you into sharing them.',
    difficulty: 'medium',
    options: [
      { id: 'opt-6-1', option_id: 'a', label: 'Give them the code to help secure your account', is_correct: false },
      { id: 'opt-6-2', option_id: 'b', label: 'Hang up and call your bank directly', is_correct: true },
      { id: 'opt-6-3', option_id: 'c', label: 'Text the code back to the number', is_correct: false },
      { id: 'opt-6-4', option_id: 'd', label: 'Enter the code in your banking app', is_correct: false }
    ]
  },
  {
    scenarioId: 'password-003',
    type: 'passwords',
    title: 'Password Manager Trust',
    question: 'Your coworker recommends a free password manager but you\'ve never heard of the company. It asks for full access to your browser data. Should you use it?',
    explanation: 'Use only well-known, audited password managers. Unknown tools may steal your data. Look for open-source or established commercial options.',
    difficulty: 'medium',
    options: [
      { id: 'opt-7-1', option_id: 'a', label: 'Yes - free tools are just as good', is_correct: false },
      { id: 'opt-7-2', option_id: 'b', label: 'Research and choose a reputable option like Bitwarden or 1Password', is_correct: true },
      { id: 'opt-7-3', option_id: 'c', label: 'Use it only for unimportant accounts', is_correct: false },
      { id: 'opt-7-4', option_id: 'd', label: 'Write passwords in a text file instead', is_correct: false }
    ]
  },
  // Social Engineering scenarios
  {
    scenarioId: 'social-001',
    type: 'social_engineering',
    title: 'Fake Tech Support Call',
    question: 'Someone calls claiming to be from Microsoft Support, saying your computer has viruses. They want remote access to "fix" it. What\'s the correct response?',
    explanation: 'Microsoft never calls users unsolicited. This is a common tech support scam to steal data or install malware.',
    difficulty: 'easy',
    options: [
      { id: 'opt-8-1', option_id: 'a', label: 'Give them access - they\'re from Microsoft', is_correct: false },
      { id: 'opt-8-2', option_id: 'b', label: 'Hang up immediately', is_correct: true },
      { id: 'opt-8-3', option_id: 'c', label: 'Ask them to prove they\'re legitimate', is_correct: false },
      { id: 'opt-8-4', option_id: 'd', label: 'Give them your credit card for the fix', is_correct: false }
    ]
  },
  {
    scenarioId: 'social-002',
    type: 'social_engineering',
    title: 'Tailgating Attempt',
    question: 'You\'re entering your office building with your badge when a person in a suit carrying a laptop bag says "I forgot my badge upstairs, can you let me in?" They look professional. What do you do?',
    explanation: 'Never tailgate strangers. Even well-dressed individuals may be unauthorized. Everyone must badge in individually.',
    difficulty: 'medium',
    options: [
      { id: 'opt-9-1', option_id: 'a', label: 'Let them in - they look official', is_correct: false },
      { id: 'opt-9-2', option_id: 'b', label: 'Direct them to security/reception', is_correct: true },
      { id: 'opt-9-3', option_id: 'c', label: 'Ask for their name and look it up', is_correct: false },
      { id: 'opt-9-4', option_id: 'd', label: 'Enter first and hold the door', is_correct: false }
    ]
  },
  {
    scenarioId: 'social-003',
    type: 'social_engineering',
    title: 'Social Media Information Gathering',
    question: 'A "recruiter" on LinkedIn messages you about a job, asking for your personal email, phone number, and current salary "for their records." Their profile was created last week. What\'s suspicious?',
    explanation: 'New profiles requesting personal info are red flags. Legitimate recruiters use established platforms and don\'t need sensitive details upfront.',
    difficulty: 'medium',
    options: [
      { id: 'opt-10-1', option_id: 'a', label: 'Share the information - it\'s a job opportunity', is_correct: false },
      { id: 'opt-10-2', option_id: 'b', label: 'Report and block; verify through company website', is_correct: true },
      { id: 'opt-10-3', option_id: 'c', label: 'Give only your phone number', is_correct: false },
      { id: 'opt-10-4', option_id: 'd', label: 'Ask them to send a formal offer first', is_correct: false }
    ]
  },
  // Safe Browsing scenarios
  {
    scenarioId: 'browser-001',
    type: 'safe_browsing',
    title: 'HTTP vs HTTPS',
    question: 'You\'re about to enter credit card details on a checkout page. The URL shows "http://" instead of "https://" and there\'s no lock icon. What does this mean?',
    explanation: 'HTTP sites don\'t encrypt data. Never enter sensitive information on HTTP pages - your data could be intercepted.',
    difficulty: 'easy',
    options: [
      { id: 'opt-11-1', option_id: 'a', label: 'It\'s fine - proceed with the purchase', is_correct: false },
      { id: 'opt-11-2', option_id: 'b', label: 'Don\'t enter payment info; look for HTTPS or shop elsewhere', is_correct: true },
      { id: 'opt-11-3', option_id: 'c', label: 'It only matters for banking sites', is_correct: false },
      { id: 'opt-11-4', option_id: 'd', label: 'Refresh the page to get HTTPS', is_correct: false }
    ]
  },
  {
    scenarioId: 'browser-002',
    type: 'safe_browsing',
    title: 'Certificate Warning',
    question: 'Your browser shows a big red warning: "Your connection is not private" and "NET::ERR_CERT_AUTHORITY_INVALID" when visiting a shopping site. What should you do?',
    explanation: 'Certificate errors indicate potential man-in-the-middle attacks. Never proceed past these warnings for any site handling sensitive data.',
    difficulty: 'medium',
    options: [
      { id: 'opt-12-1', option_id: 'a', label: 'Click "Advanced" and proceed anyway', is_correct: false },
      { id: 'opt-12-2', option_id: 'b', label: 'Leave the site and report it', is_correct: true },
      { id: 'opt-12-3', option_id: 'c', label: 'Try the HTTP version instead', is_correct: false },
      { id: 'opt-12-4', option_id: 'd', label: 'Disable your antivirus and try again', is_correct: false }
    ]
  },
  {
    scenarioId: 'browser-003',
    type: 'safe_browsing',
    title: 'Typosquatting Domain',
    question: 'You want to visit amazon.com but accidentally type "amaz0n.com" (with a zero). The site looks like Amazon but something feels off. What\'s happening?',
    explanation: 'Typosquatting uses lookalike domains to trick users. Always double-check URLs, especially for popular sites.',
    difficulty: 'medium',
    options: [
      { id: 'opt-13-1', option_id: 'a', label: 'It\'s probably a mirror site - proceed', is_correct: false },
      { id: 'opt-13-2', option_id: 'b', label: 'Close the tab and type the correct URL', is_correct: true },
      { id: 'opt-13-3', option_id: 'c', label: 'Log in to check if it works', is_correct: false },
      { id: 'opt-13-4', option_id: 'd', label: 'Bookmark it for later', is_correct: false }
    ]
  },
  {
    scenarioId: 'browser-004',
    type: 'safe_browsing',
    title: 'Public Wi-Fi Session Hijacking',
    question: 'You\'re at a coffee shop using free Wi-Fi and notice the network is named "Starbucks_Free_WiFi" but it\'s unsecured (no password). You log into your email. What\'s the risk?',
    explanation: 'Unsecured Wi-Fi can be fake hotspots. Attackers can intercept unencrypted traffic. Always use VPN or cellular data for sensitive tasks.',
    difficulty: 'hard',
    options: [
      { id: 'opt-14-1', option_id: 'a', label: 'No risk - public Wi-Fi is safe', is_correct: false },
      { id: 'opt-14-2', option_id: 'b', label: 'Stop using it; use VPN or cellular for sensitive data', is_correct: true },
      { id: 'opt-14-3', option_id: 'c', label: 'Only risk if someone is watching', is_correct: false },
      { id: 'opt-14-4', option_id: 'd', label: 'Log out quickly to reduce exposure', is_correct: false }
    ]
  }
];

/**
 * Get all scenarios
 */
export async function getAllScenarios() {
  if (isAuthenticated()) {
    try {
      const response = await api.get('/scenarios');
      return response.data.data;
    } catch (err) {
      console.warn('API call failed, using fallback:', err.message);
    }
  }
  return scenarios;
}

/**
 * Get a random scenario
 * @param {string} type - Optional type filter
 * @param {string} difficulty - Optional difficulty filter
 */
export async function getRandomScenario(type = null, difficulty = null) {
  if (isAuthenticated()) {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (difficulty) params.append('difficulty', difficulty);
      const response = await api.get(`/scenarios/next?${params}`);
      return response.data.data;
    } catch (err) {
      console.warn('API call failed, using fallback:', err.message);
    }
  }
  
  // Fallback to static data
  let available = scenarios;
  if (type) {
    available = scenarios.filter(s => s.type === type);
  }
  if (difficulty) {
    available = available.filter(s => s.difficulty === difficulty);
  }
  if (available.length === 0) {
    available = scenarios;
  }
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Get scenario by ID
 * @param {string} id - Scenario ID (UUID or scenario_id)
 */
export async function getScenarioById(id) {
  if (isAuthenticated()) {
    try {
      const response = await api.get(`/scenarios/${id}`);
      return response.data.data;
    } catch (err) {
      console.warn('API call failed, using fallback:', err.message);
    }
  }
  
  return scenarios.find(s => s.scenarioId === id || s.id === id) || null;
}

/**
 * Submit scenario answer
 * @param {string} scenarioId - Scenario UUID
 * @param {string[]} selectedOptionIds - Selected option IDs
 * @param {number} timeSpentSeconds - Time spent in seconds
 */
export async function submitScenarioAnswer(scenarioId, selectedOptionIds, timeSpentSeconds = 0) {
  if (isAuthenticated()) {
    try {
      const response = await api.post(`/scenarios/${scenarioId}/submit`, {
        selectedOptionIds,
        timeSpentSeconds
      });
      return response.data.data;
    } catch (err) {
      console.warn('API call failed, using fallback:', err.message);
    }
  }
  
  // Fallback: evaluate locally and save to localStorage
  const scenario = scenarios.find(s => s.scenarioId === scenarioId || s.id === scenarioId);
  if (!scenario) {
    throw new Error('Scenario not found');
  }
  
  // Check if answer is correct
  const correctOptions = scenario.options.filter(o => o.is_correct);
  const selectedSet = new Set(selectedOptionIds);
  const correctSet = new Set(correctOptions.map(o => o.id));
  
  let isCorrect = false;
  if (selectedSet.size === correctSet.size) {
    isCorrect = [...selectedSet].every(id => correctSet.has(id));
  }
  
  // Calculate score
  const basePoints = isCorrect ? 10 : -5;
  const difficultyMultiplier = scenario.difficulty === 'easy' ? 1 : 
                                scenario.difficulty === 'hard' ? 2 : 1.5;
  const scoreDelta = Math.round(basePoints * difficultyMultiplier);
  
  // Save to localStorage
  await saveAttempt({
    scenarioId,
    title: scenario.title,
    isCorrect,
    scoreDelta,
    riskCategory: scenario.type,
    timeSpentSeconds
  });
  
  return {
    scenarioId,
    isCorrect,
    scoreDelta,
    correctOptions: correctOptions.map(o => o.id),
    explanation: scenario.explanation,
    timestamp: new Date().toISOString()
  };
}

/**
 * Get scenario counts
 */
export async function getScenarioCounts() {
  if (isAuthenticated()) {
    try {
      const response = await api.get('/scenarios/counts');
      return response.data.data;
    } catch (err) {
      console.warn('API call failed, using fallback:', err.message);
    }
  }
  
  const counts = scenarios.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total: scenarios.length,
    byType: counts
  };
}
