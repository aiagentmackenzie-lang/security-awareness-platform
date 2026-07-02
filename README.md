# Security Awareness Platform

An open-source security awareness training application for everyone.

**Learn. Practice. Stay Safe.**

This platform helps individuals, students, educators, and organizations build practical skills in identifying and mitigating social engineering, phishing, and cyber threats through interactive, hands-on scenarios.

## Overview

Cybersecurity is for everyone. Whether you're a student, professional, teacher, or just curious — this platform gives you practical skills to protect yourself and others online.

**No prior experience required.** Start with the basics and build confidence through realistic simulations across four essential security domains:

- **Phishing Detection** — Identify suspicious emails, spoofed domains, and credential harvesting attempts
- **Password Security** — Practice secure password creation and MFA best practices  
- **Social Engineering** — Recognize manipulation tactics in phone calls, messages, and physical interactions
- **Safe Browsing** — Spot malicious websites, certificate warnings, and unsafe network conditions

## Features

### Interactive Training
- 14 realistic security scenarios with branching decision paths
- Immediate feedback with detailed explanations
- Difficulty progression from beginner to advanced
- Category-specific skill tracking

### AI-Powered Personalization
- Smart scenario recommendations based on performance gaps
- Generated personalized feedback explaining mistakes
- Adaptive learning paths tailored to individual progress
- Cost-optimized model selection (Claude 3.5 Sonnet with rule-based fallback)

### Progress Tracking
- Points system with streak multipliers
- 15 achievement badge definitions seeded (badge-awarding logic is not yet implemented)
- Category accuracy breakdowns
- Global and category-specific leaderboards
- 30-day activity analytics

### Security-First Architecture
- JWT-based authentication with bcrypt password hashing
- PostgreSQL database with parameterized queries
- Rate limiting on all endpoints
- Helmet.js security headers and CORS configuration
- Input validation via express-validator

> ⚠️ **Dev defaults:** The included `server/.env` is a development convenience. Before any real deployment, generate a strong `JWT_SECRET`, restrict `CLIENT_URL`, and review the CORS/rate-limit settings. Refresh tokens are currently stored in memory and will be lost on server restart.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite |
| Backend | Express.js + Node.js |
| Database | PostgreSQL 14+ |
| AI | OpenRouter API (Claude 3.5 Sonnet) |
| Auth | JWT (access/refresh tokens) |
| Security | bcrypt, helmet, rate-limit |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- OpenRouter API key (optional, for AI features)

### Installation

```bash
# Clone repository
git clone https://github.com/aiagentmackenzie-lang/security-awareness-platform.git
cd security-awareness-platform

# Install dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..

# Configure environment
# A development .env is already present, but you should start from the example
# and generate your own JWT_SECRET for anything other than local testing.
cp server/.env.example server/.env
# Edit server/.env — set DB credentials and generate a strong JWT_SECRET
nano server/.env

# Setup database (PostgreSQL must be running)
psql -U postgres -c "CREATE DATABASE security_awareness;"
cd server && node db/migrate.js && node db/seed.js && cd ..

# Start development servers
# Terminal 1: Backend (port 3000)
cd server && npm run dev

# Terminal 2: Frontend (port 5173, proxies /api to backend)
cd client && npm run dev
```

Access the application at `http://localhost:5173`

**Demo accounts** (after seeding — local development only):

| Email | Password | Role |
|-------|----------|------|
| `demo@example.com` | `demo12345` | learner |
| `test@example.com` | `test12345` | learner |
| `admin@example.com` | `admin12345` | admin |

> These accounts use intentionally weak passwords for local testing. Do not use them in any production or publicly exposed instance.

## API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Scenarios
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scenarios` | List all scenarios |
| GET | `/api/scenarios/next` | Get AI-recommended scenario |
| POST | `/api/scenarios/:id/submit` | Submit answer |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/user/:id` | Full dashboard data |
| GET | `/api/dashboard/leaderboard` | Global rankings |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/recommend` | Scenario recommendation |
| POST | `/api/ai/feedback` | Personalized feedback |
| POST | `/api/ai/learning-path` | Customized study plan |

## Deployment

### Docker (local development / preview only)

```bash
# Start the database and app locally
docker-compose up -d
```

What starts:
- PostgreSQL database
- Node.js application server (serves the API on port 3000)

What is **not** production-ready out of the box:
- The `nginx` service is optional (`--profile production`) and expects SSL certificates at `./nginx/ssl/`, which are not provided.
- Migrations and seeds are not automatically run by `docker-compose up`. Run `node db/migrate.js && node db/seed.js` inside the app container after the database is healthy, or add an init script.
- The server Dockerfile builds the React client into `public/`, but the Express app does not currently serve static files; the Vite dev server or a separate static host is needed for the UI in development.

Treat this as a local preview, not a production deployment template.

### Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3000
CLIENT_URL=https://yourdomain.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=security_awareness
DB_USER=your_user
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_64_character_secret
JWT_EXPIRES_IN=24h

# AI (optional)
OPENROUTER_API_KEY=your_key_here
```

## Current Limitations & Honest State

This project is a working learning/demo prototype, not a production-ready SaaS. Before showing or deploying it, be aware of the following:

- **No automated tests or CI.** `npm test` in the server exits with "No tests found". There is no `.github/workflows/`.
- **Badges are defined but not awarded.** The 15 badge records exist in the database seed, but no code evaluates whether a user has earned them.
- **Analytics and events endpoints exist but are not wired.** `server/routes/analytics.js` and `server/routes/events.js` are implemented but never mounted in `server/index.js`, so `/api/analytics` and `/api/events` return 404.
- **Refresh tokens live in memory.** All refresh tokens are lost when the Node process restarts.
- **Client lint is not clean.** `npm run lint` in `client/` currently reports errors and warnings.
- **Docker path needs work.** The compose stack starts Postgres and the API, but migrations/seeds are manual, the server does not serve the built frontend, and the nginx profile is incomplete.
- **Some auth routes need attention.** `/api/auth/logout-all` expects `req.user` set by middleware but no middleware is mounted on that route.

If you are looking at this as a portfolio piece, the most honest story is: *the client-side training fallback and the core Express API work, but the full-stack deployment, testing, and several secondary features are still being built.*

## Why This Approach

**Security training effectiveness** depends on relevance and repetition. Generic slideshows fail because they don't adapt to individual knowledge gaps. This platform aims to solve that through:

1. **Scenario-based learning** — Realistic situations create muscle memory
2. **Adaptive difficulty** — Weak areas get more attention
3. **Immediate feedback** — Mistakes corrected while context is fresh
4. **Gamification** — Streaks and leaderboards drive engagement
5. **AI augmentation** — Personalized explanations at scale, with rule-based fallback when the API is unavailable

The hybrid architecture (AI + rule-based fallback) ensures the platform degrades gracefully when no API key is configured or rate limits are hit.

## License

MIT License — Open source and free to use, modify, and distribute.

This project is designed to be a resource for:
- **Students** learning cybersecurity fundamentals
- **Teachers** building security awareness curricula
- **Companies** training employees on social engineering threats
- **Communities** promoting digital safety

**You are encouraged to:**
- Fork and customize for your organization
- Translate scenarios for your region
- Add new scenario types and modules
- Integrate with your LMS or training platform
- Contribute improvements back to the community

Knowledge about security threats should be freely accessible to everyone.

## Acknowledgments

Built with React, Express, PostgreSQL, and OpenRouter.
