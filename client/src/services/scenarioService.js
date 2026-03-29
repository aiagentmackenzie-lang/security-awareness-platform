/**
 * Static Scenarios Service
 * For GitHub Pages deployment - uses in-memory data instead of backend
 */

import { scenarios } from '../domain/engine/scenarios.js';
import { evaluateAnswer } from '../domain/engine/evaluator.js';
import { saveAttempt } from './dashboardApi.js';

// Simulate API delay
function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get all scenarios
 */
export async function getAllScenarios() {
  await delay(200);
  return scenarios;
}

/**
 * Get a random scenario
 */
export async function getRandomScenario(type = null, difficulty = null) {
  await delay(200);
  
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
 */
export async function getScenarioById(id) {
  await delay(150);
  return scenarios.find(s => s.scenarioId === id) || null;
}

/**
 * Submit scenario answer
 */
export async function submitScenarioAnswer(scenarioId, selectedOptionIds, timeSpentSeconds = 0) {
  await delay(300);
  
  const scenario = scenarios.find(s => s.scenarioId === scenarioId);
  if (!scenario) {
    throw new Error('Scenario not found');
  }
  
  const evaluation = evaluateAnswer(scenario, selectedOptionIds);
  
  // Calculate score
  const basePoints = evaluation.correct ? 10 : -10;
  const multiplier = evaluation.riskCategory === 'phishing' ? 1.5 : 1;
  const scoreDelta = Math.round(basePoints * multiplier);
  
  // Save to localStorage
  await saveAttempt({
    scenarioId,
    title: scenario.title,
    isCorrect: evaluation.correct,
    scoreDelta,
    riskCategory: scenario.type,
    timeSpentSeconds
  });
  
  return {
    scenarioId,
    evaluation: {
      ...evaluation,
      scoreDelta,
      timeSpentSeconds
    },
    timestamp: new Date().toISOString()
  };
}