/**
 * Security Awareness Platform - Domain Types
 * TypeScript type definitions for all domain models
 */

// Risk categories
export type RiskCategory =
  | "phishing"
  | "passwords"
  | "social_engineering"
  | "safe_browsing";

// Difficulty levels
export type Difficulty = "easy" | "medium" | "hard";

// User roles
export type UserRole = "learner" | "manager" | "admin";

// Event types for behavioral telemetry
export type EventType =
  | "scenario_viewed"
  | "option_hovered"
  | "option_selected"
  | "submitted"
  | "reported"
  | "closed"
  | "link_clicked"
  | "link_hovered";

// Scenario option
export interface ScenarioOption {
  id: string;
  optionId: string;
  label: string;
  isCorrect: boolean;
}

// Scenario definition
export interface Scenario {
  id: string;
  scenarioId: string;
  type: RiskCategory;
  title: string;
  question: string;
  options: ScenarioOption[];
  correctOptionIds: string[];
  explanation: string;
  difficulty: Difficulty;
  tags: string[];
  metadata?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Scenario result after evaluation
export interface ScenarioResult {
  scenarioId: string;
  userId: string;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  isCorrect: boolean;
  explanation: string;
  riskCategory: RiskCategory;
  scoreDelta: number;
  timeSpentSeconds?: number;
  createdAt: string;
}

// Behavioral event
export interface BehaviorEvent {
  id?: string;
  userId: string;
  scenarioId?: string;
  eventType: EventType;
  optionId?: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: string;
}

// User profile
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  riskScore: number;
  totalScore: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Risk profile per category
export interface UserRiskProfile {
  id: string;
  userId: string;
  category: RiskCategory;
  score: number;
  attemptsCount: number;
  correctCount: number;
  createdAt: string;
  updatedAt: string;
}

// Badge/achievement
export interface Badge {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  icon?: string;
  criteriaType: string;
  criteriaValue: number;
  createdAt: string;
}

// User earned badge
export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  badge?: Badge;
}

// Gamification score
export interface Score {
  total: number;
  currentStreak: number;
  longestStreak: number;
  lastAttemptAt?: string;
}

// Metrics computed from behavioral data
export interface BehavioralMetrics {
  userId: string;
  category: RiskCategory;
  unsafeActionRate: number;
  reportRate: number;
  timeToFirstReportMs?: number;
  repeatOffenderRate: number;
  averageTimeSpentSeconds?: number;
  totalAttempts: number;
  correctAttempts: number;
  updatedAt: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Authentication
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
}