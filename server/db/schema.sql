-- Security Awareness Platform Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'learner' CHECK (role IN ('learner', 'manager', 'admin')),
    is_active BOOLEAN DEFAULT true,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    total_score INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Risk profile breakdown per user
CREATE TABLE user_risk_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('phishing', 'passwords', 'social_engineering', 'safe_browsing')),
    score INTEGER DEFAULT 50 CHECK (score BETWEEN 0 AND 100),
    attempts_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category)
);

-- Scenarios table
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('phishing', 'passwords', 'social_engineering', 'safe_browsing')),
    title VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    explanation TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scenario options
CREATE TABLE scenario_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    option_id VARCHAR(50) NOT NULL,
    label TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scenario attempts/results
CREATE TABLE scenario_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
    selected_option_ids UUID[] NOT NULL,
    is_correct BOOLEAN NOT NULL,
    score_delta INTEGER NOT NULL,
    time_spent_seconds INTEGER,
    risk_category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Behavioral events telemetry
CREATE TABLE behavior_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'scenario_viewed',
        'option_hovered',
        'option_selected',
        'submitted',
        'reported',
        'closed',
        'link_clicked',
        'link_hovered'
    )),
    option_id UUID REFERENCES scenario_options(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    session_id VARCHAR(100),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Badges/achievements
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100),
    criteria_type VARCHAR(50) NOT NULL,
    criteria_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User badges earned
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- Sessions for analytics
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_risk_score ON users(risk_score);

CREATE INDEX idx_scenarios_type ON scenarios(type);
CREATE INDEX idx_scenarios_difficulty ON scenarios(difficulty);
CREATE INDEX idx_scenarios_active ON scenarios(is_active);

CREATE INDEX idx_attempts_user_id ON scenario_attempts(user_id);
CREATE INDEX idx_attempts_scenario_id ON scenario_attempts(scenario_id);
CREATE INDEX idx_attempts_created_at ON scenario_attempts(created_at);

CREATE INDEX idx_events_user_id ON behavior_events(user_id);
CREATE INDEX idx_events_type ON behavior_events(event_type);
CREATE INDEX idx_events_created_at ON behavior_events(created_at);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_profiles_updated_at BEFORE UPDATE ON user_risk_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();