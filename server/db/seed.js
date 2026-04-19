/**
 * Database Seed Script
 * Security Awareness Platform
 * 
 * Seeds initial scenario data and badges
 * Usage: node db/seed.js
 */

const { query } = require('./pool.js');
const bcrypt = require('bcryptjs');

// Demo users for testing
const demoUsers = [
  {
    email: 'demo@example.com',
    password: 'demo12345',
    displayName: 'Demo User',
    role: 'learner'
  },
  {
    email: 'test@example.com', 
    password: 'test12345',
    displayName: 'Test User',
    role: 'learner'
  },
  {
    email: 'admin@example.com',
    password: 'admin12345',
    displayName: 'Admin User',
    role: 'admin'
  }
];

// 13 scenarios across 4 modules
const scenarios = [
  // Phishing Module (4 scenarios)
  {
    scenario_id: 'phishing-001',
    type: 'phishing',
    title: 'Suspicious Email Subject Line',
    question: 'You receive an email with the subject: "URGENT: Your Account Will Be Suspended Today!" The sender appears to be your bank but the email address looks slightly off. What do you do?',
    explanation: 'Legitimate banks never use urgent, threatening language to pressure immediate action. Always verify through official channels.',
    difficulty: 'easy',
    tags: ['email', 'urgency', 'spoofing'],
    options: [
      { option_id: 'a', label: 'Click the link immediately to secure your account', is_correct: false },
      { option_id: 'b', label: 'Ignore it completely without checking', is_correct: false },
      { option_id: 'c', label: 'Log into your bank via official website or app to check', is_correct: true },
      { option_id: 'd', label: 'Reply to the email asking if it\'s real', is_correct: false }
    ]
  },
  {
    scenario_id: 'phishing-002',
    type: 'phishing',
    title: 'Fake Invoice Attachment',
    question: 'You receive an email with an attachment labeled "Invoice_Due.pdf.exe" from an unknown sender claiming you owe money for a service you don\'t recognize. What\'s the safest action?',
    explanation: '.exe files are executable programs, not documents. Never open executable attachments from unknown sources - they often contain malware.',
    difficulty: 'easy',
    tags: ['attachment', 'malware', 'invoice'],
    options: [
      { option_id: 'a', label: 'Open it to see what service it\'s for', is_correct: false },
      { option_id: 'b', label: 'Delete the email immediately', is_correct: true },
      { option_id: 'c', label: 'Forward it to your IT department and open it', is_correct: false },
      { option_id: 'd', label: 'Save it for later review', is_correct: false }
    ]
  },
  {
    scenario_id: 'phishing-003',
    type: 'phishing',
    title: 'Credential Harvesting Page',
    question: 'A popup appears claiming your password expired. The URL shows "secure-bank-login.tk" instead of your bank\'s domain. What\'s wrong?',
    explanation: '.tk domains are often used for malicious sites. Always verify the exact domain matches your bank\'s official website.',
    difficulty: 'medium',
    tags: ['url', 'domain', 'credential-theft'],
    options: [
      { option_id: 'a', label: 'Enter your credentials - it says "secure"', is_correct: false },
      { option_id: 'b', label: 'Close the popup and manually navigate to your bank', is_correct: true },
      { option_id: 'c', label: 'Call the number in the popup', is_correct: false },
      { option_id: 'd', label: 'Take a screenshot and then enter credentials', is_correct: false }
    ]
  },
  {
    scenario_id: 'phishing-004',
    type: 'phishing',
    title: 'CEO Impersonation (Whaling)',
    question: 'You get an email from your "CEO" asking you to urgently wire money to a new vendor. The email address is ceo@company-secure-mail.com instead of the usual domain. What do you do?',
    explanation: 'CEO fraud uses urgency and authority. Always verify unusual financial requests through a separate communication channel.',
    difficulty: 'hard',
    tags: ['whaling', 'ceo-fraud', 'wire-transfer'],
    options: [
      { option_id: 'a', label: 'Process the wire immediately - it\'s urgent', is_correct: false },
      { option_id: 'b', label: 'Reply asking for confirmation', is_correct: false },
      { option_id: 'c', label: 'Call the CEO directly using known contact info', is_correct: true },
      { option_id: 'd', label: 'Forward to accounting to process', is_correct: false }
    ]
  },
  
  // Password Security Module (3 scenarios)
  {
    scenario_id: 'password-001',
    type: 'passwords',
    title: 'Password Reuse Risk',
    question: 'You\'ve been using the same password "Summer2023!" for your email, banking, and social media for years. A news report says your email provider had a data breach. What\'s the risk?',
    explanation: 'Password reuse means one breach compromises all accounts. Always use unique passwords and change them after breaches.',
    difficulty: 'easy',
    tags: ['password-reuse', 'breach', 'uniqueness'],
    options: [
      { option_id: 'a', label: 'Only change your email password - others are fine', is_correct: false },
      { option_id: 'b', label: 'Change all passwords immediately and use unique ones', is_correct: true },
      { option_id: 'c', label: 'Wait and see if anything happens', is_correct: false },
      { option_id: 'd', label: 'Add "2" to the end for banking', is_correct: false }
    ]
  },
  {
    scenario_id: 'password-002',
    type: 'passwords',
    title: 'MFA Bypass Attempt',
    question: 'You receive a text message with a 6-digit code you didn\'t request, followed by a phone call from "your bank" asking you to confirm the code. What do you do?',
    explanation: 'Never share MFA codes. Scammers trigger codes then call pretending to be support to trick you into sharing them.',
    difficulty: 'medium',
    tags: ['mfa', 'social-engineering', 'verification-code'],
    options: [
      { option_id: 'a', label: 'Give them the code to help secure your account', is_correct: false },
      { option_id: 'b', label: 'Hang up and call your bank directly', is_correct: true },
      { option_id: 'c', label: 'Text the code back to the number', is_correct: false },
      { option_id: 'd', label: 'Enter the code in your banking app', is_correct: false }
    ]
  },
  {
    scenario_id: 'password-003',
    type: 'passwords',
    title: 'Password Manager Trust',
    question: 'Your coworker recommends a free password manager but you\'ve never heard of the company. It asks for full access to your browser data. Should you use it?',
    explanation: 'Use only well-known, audited password managers. Unknown tools may steal your data. Look for open-source or established commercial options.',
    difficulty: 'medium',
    tags: ['password-manager', 'trust', 'privacy'],
    options: [
      { option_id: 'a', label: 'Yes - free tools are just as good', is_correct: false },
      { option_id: 'b', label: 'Research and choose a reputable option like Bitwarden or 1Password', is_correct: true },
      { option_id: 'c', label: 'Use it only for unimportant accounts', is_correct: false },
      { option_id: 'd', label: 'Write passwords in a text file instead', is_correct: false }
    ]
  },
  
  // Social Engineering Module (3 scenarios)
  {
    scenario_id: 'social-001',
    type: 'social_engineering',
    title: 'Fake Tech Support Call',
    question: 'Someone calls claiming to be from Microsoft Support, saying your computer has viruses. They want remote access to "fix" it. What\'s the correct response?',
    explanation: 'Microsoft never calls users unsolicited. This is a common tech support scam to steal data or install malware.',
    difficulty: 'easy',
    tags: ['tech-support', 'phone-scam', 'remote-access'],
    options: [
      { option_id: 'a', label: 'Give them access - they\'re from Microsoft', is_correct: false },
      { option_id: 'b', label: 'Hang up immediately', is_correct: true },
      { option_id: 'c', label: 'Ask them to prove they\'re legitimate', is_correct: false },
      { option_id: 'd', label: 'Give them your credit card for the fix', is_correct: false }
    ]
  },
  {
    scenario_id: 'social-002',
    type: 'social_engineering',
    title: 'Tailgating Attempt',
    question: 'You\'re entering your office building with your badge when a person in a suit carrying a laptop bag says "I forgot my badge upstairs, can you let me in?" They look professional. What do you do?',
    explanation: 'Never tailgate strangers. Even well-dressed individuals may be unauthorized. Everyone must badge in individually.',
    difficulty: 'medium',
    tags: ['physical-security', 'tailgating', 'impersonation'],
    options: [
      { option_id: 'a', label: 'Let them in - they look official', is_correct: false },
      { option_id: 'b', label: 'Direct them to security/reception', is_correct: true },
      { option_id: 'c', label: 'Ask for their name and look it up', is_correct: false },
      { option_id: 'd', label: 'Enter first and hold the door', is_correct: false }
    ]
  },
  {
    scenario_id: 'social-003',
    type: 'social_engineering',
    title: 'Social Media Information Gathering',
    question: 'A "recruiter" on LinkedIn messages you about a job, asking for your personal email, phone number, and current salary "for their records." Their profile was created last week. What\'s suspicious?',
    explanation: 'New profiles requesting personal info are red flags. Legitimate recruiters use established platforms and don\'t need sensitive details upfront.',
    difficulty: 'medium',
    tags: ['social-media', 'recruiter-scam', 'information-gathering'],
    options: [
      { option_id: 'a', label: 'Share the information - it\'s a job opportunity', is_correct: false },
      { option_id: 'b', label: 'Report and block; verify through company website', is_correct: true },
      { option_id: 'c', label: 'Give only your phone number', is_correct: false },
      { option_id: 'd', label: 'Ask them to send a formal offer first', is_correct: false }
    ]
  },
  
  // Safe Browsing Module (4 scenarios)
  {
    scenario_id: 'browser-001',
    type: 'safe_browsing',
    title: 'HTTP vs HTTPS',
    question: 'You\'re about to enter credit card details on a checkout page. The URL shows "http://" instead of "https://" and there\'s no lock icon. What does this mean?',
    explanation: 'HTTP sites don\'t encrypt data. Never enter sensitive information on HTTP pages - your data could be intercepted.',
    difficulty: 'easy',
    tags: ['https', 'encryption', 'browser'],
    options: [
      { option_id: 'a', label: 'It\'s fine - proceed with the purchase', is_correct: false },
      { option_id: 'b', label: 'Don\'t enter payment info; look for HTTPS or shop elsewhere', is_correct: true },
      { option_id: 'c', label: 'It only matters for banking sites', is_correct: false },
      { option_id: 'd', label: 'Refresh the page to get HTTPS', is_correct: false }
    ]
  },
  {
    scenario_id: 'browser-002',
    type: 'safe_browsing',
    title: 'Certificate Warning',
    question: 'Your browser shows a big red warning: "Your connection is not private" and "NET::ERR_CERT_AUTHORITY_INVALID" when visiting a shopping site. What should you do?',
    explanation: 'Certificate errors indicate potential man-in-the-middle attacks. Never proceed past these warnings for any site handling sensitive data.',
    difficulty: 'medium',
    tags: ['certificate', 'ssl', 'man-in-the-middle'],
    options: [
      { option_id: 'a', label: 'Click "Advanced" and proceed anyway', is_correct: false },
      { option_id: 'b', label: 'Leave the site and report it', is_correct: true },
      { option_id: 'c', label: 'Try the HTTP version instead', is_correct: false },
      { option_id: 'd', label: 'Disable your antivirus and try again', is_correct: false }
    ]
  },
  {
    scenario_id: 'browser-003',
    type: 'safe_browsing',
    title: 'Typosquatting Domain',
    question: 'You want to visit amazon.com but accidentally type "amaz0n.com" (with a zero). The site looks like Amazon but something feels off. What\'s happening?',
    explanation: 'Typosquatting uses lookalike domains to trick users. Always double-check URLs, especially for popular sites.',
    difficulty: 'medium',
    tags: ['typosquatting', 'domain', 'lookalike'],
    options: [
      { option_id: 'a', label: 'It\'s probably a mirror site - proceed', is_correct: false },
      { option_id: 'b', label: 'Close the tab and type the correct URL', is_correct: true },
      { option_id: 'c', label: 'Log in to check if it works', is_correct: false },
      { option_id: 'd', label: 'Bookmark it for later', is_correct: false }
    ]
  },
  {
    scenario_id: 'browser-004',
    type: 'safe_browsing',
    title: 'Public Wi-Fi Session Hijacking',
    question: 'You\'re at a coffee shop using free Wi-Fi and notice the network is named "Starbucks_Free_WiFi" but it\'s unsecured (no password). You log into your email. What\'s the risk?',
    explanation: 'Unsecured Wi-Fi can be fake hotspots. Attackers can intercept unencrypted traffic. Always use VPN or cellular data for sensitive tasks.',
    difficulty: 'hard',
    tags: ['public-wifi', 'session-hijacking', 'evil-twin'],
    options: [
      { option_id: 'a', label: 'No risk - public Wi-Fi is safe', is_correct: false },
      { option_id: 'b', label: 'Stop using it; use VPN or cellular for sensitive data', is_correct: true },
      { option_id: 'c', label: 'Only risk if someone is watching', is_correct: false },
      { option_id: 'd', label: 'Log out quickly to reduce exposure', is_correct: false }
    ]
  }
];

// Badge definitions
const badges = [
  { badge_id: 'first-steps', name: 'First Steps', description: 'Complete your first scenario', icon: '🎯', criteria_type: 'scenarios_completed', criteria_value: 1 },
  { badge_id: 'quick-learner', name: 'Quick Learner', description: 'Complete 5 scenarios', icon: '📚', criteria_type: 'scenarios_completed', criteria_value: 5 },
  { badge_id: 'security-novice', name: 'Security Novice', description: 'Complete 10 scenarios', icon: '🛡️', criteria_type: 'scenarios_completed', criteria_value: 10 },
  { badge_id: 'phishing-hunter', name: 'Phishing Hunter', description: 'Complete all phishing scenarios', icon: '🎣', criteria_type: 'category_complete', criteria_value: 4 },
  { badge_id: 'password-pro', name: 'Password Pro', description: 'Complete all password scenarios', icon: '🔐', criteria_type: 'category_complete', criteria_value: 3 },
  { badge_id: 'social-sleuth', name: 'Social Sleuth', description: 'Complete all social engineering scenarios', icon: '🕵️', criteria_type: 'category_complete', criteria_value: 3 },
  { badge_id: 'safe-browser', name: 'Safe Browser', description: 'Complete all safe browsing scenarios', icon: '🌐', criteria_type: 'category_complete', criteria_value: 4 },
  { badge_id: 'perfect-score', name: 'Perfect Score', description: 'Get a perfect streak of 5', icon: '⭐', criteria_type: 'perfect_streak', criteria_value: 5 },
  { badge_id: 'streak-master', name: 'Streak Master', description: 'Achieve a 7-day streak', icon: '🔥', criteria_type: 'daily_streak', criteria_value: 7 },
  { badge_id: 'security-expert', name: 'Security Expert', description: 'Complete all scenarios with 90%+ accuracy', icon: '🏆', criteria_type: 'overall_accuracy', criteria_value: 90 },
  { badge_id: 'helpful-reporter', name: 'Helpful Reporter', description: 'Report 3 suspicious scenarios', icon: '📢', criteria_type: 'reports_submitted', criteria_value: 3 },
  { badge_id: 'speed-demon', name: 'Speed Demon', description: 'Complete a scenario in under 30 seconds', icon: '⚡', criteria_type: 'speed_record', criteria_value: 30 },
  { badge_id: 'top-performer', name: 'Top Performer', description: 'Reach top 10 on the leaderboard', icon: '🥇', criteria_type: 'leaderboard_rank', criteria_value: 10 },
  { badge_id: 'risk-analyst', name: 'Risk Analyst', description: 'View your risk profile', icon: '📊', criteria_type: 'profile_viewed', criteria_value: 1 },
  { badge_id: 'community-champion', name: 'Community Champion', description: 'Help improve 5 scenarios with feedback', icon: '🤝', criteria_type: 'feedback_given', criteria_value: 5 }
];

async function seedScenarios() {
  console.log('\n🌱 Seeding scenarios...');
  
  for (const scenario of scenarios) {
    // Check if scenario exists
    const existing = await query(
      'SELECT id FROM scenarios WHERE scenario_id = $1',
      [scenario.scenario_id]
    );
    
    if (existing.rows.length > 0) {
      console.log(`  ⏩ Skipping ${scenario.scenario_id} - already exists`);
      continue;
    }
    
    // Insert scenario
    const scenarioResult = await query(
      `INSERT INTO scenarios (scenario_id, type, title, question, explanation, difficulty, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        scenario.scenario_id,
        scenario.type,
        scenario.title,
        scenario.question,
        scenario.explanation,
        scenario.difficulty,
        scenario.tags
      ]
    );
    
    const scenarioId = scenarioResult.rows[0].id;
    
    // Insert options
    for (const option of scenario.options) {
      await query(
        `INSERT INTO scenario_options (scenario_id, option_id, label, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [scenarioId, option.option_id, option.label, option.is_correct]
      );
    }
    
    console.log(`  ✅ Created ${scenario.scenario_id}: ${scenario.title}`);
  }
  
  console.log(`✅ Scenarios seeded successfully`);
}

async function seedBadges() {
  console.log('\n🏅 Seeding badges...');
  
  for (const badge of badges) {
    // Check if badge exists
    const existing = await query(
      'SELECT id FROM badges WHERE badge_id = $1',
      [badge.badge_id]
    );
    
    if (existing.rows.length > 0) {
      console.log(`  ⏩ Skipping ${badge.badge_id} - already exists`);
      continue;
    }
    
    await query(
      `INSERT INTO badges (badge_id, name, description, icon, criteria_type, criteria_value)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        badge.badge_id,
        badge.name,
        badge.description,
        badge.icon,
        badge.criteria_type,
        badge.criteria_value
      ]
    );
    
    console.log(`  ✅ Created ${badge.badge_id}: ${badge.name}`);
  }
  
  console.log(`✅ Badges seeded successfully`);
}

async function seedUsers() {
  console.log('\n🌱 Seeding demo users...');
  
  for (const user of demoUsers) {
    // Check if user exists
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [user.email]
    );
    
    if (existing.rows.length > 0) {
      console.log(`  ⏩ Skipping ${user.email} - already exists`);
      continue;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(user.password, 12);
    
    // Insert user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, display_name, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id`,
      [user.email, passwordHash, user.displayName, user.role]
    );
    
    const userId = userResult.rows[0].id;
    
    // Initialize risk profiles for all categories
    const categories = ['phishing', 'passwords', 'social_engineering', 'safe_browsing'];
    for (const category of categories) {
      await query(
        `INSERT INTO user_risk_profiles (user_id, category)
         VALUES ($1, $2)
         ON CONFLICT (user_id, category) DO NOTHING`,
        [userId, category]
      );
    }
    
    console.log(`  ✅ Created user: ${user.email} / Password: ${user.password}`);
  }
  
  console.log(`✅ Users seeded successfully`);
}

async function seed() {
  console.log('\n🔧 Security Awareness Platform - Database Seeding\n');
  
  try {
    await seedScenarios();
    await seedBadges();
    await seedUsers();
    
    // Show counts
    const scenarioCount = await query('SELECT COUNT(*) FROM scenarios');
    const badgeCount = await query('SELECT COUNT(*) FROM badges');
    const userCount = await query('SELECT COUNT(*) FROM users');
    
    console.log('\n📊 Database seeded:');
    console.log(`   • Scenarios: ${scenarioCount.rows[0].count}`);
    console.log(`   • Badges: ${badgeCount.rows[0].count}`);
    console.log(`   • Users: ${userCount.rows[0].count}`);
    console.log('\n✅ Seeding complete!\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seed();
}

module.exports = { seedScenarios, seedBadges, seedUsers };
