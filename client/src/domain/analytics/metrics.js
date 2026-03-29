/**
 * Security Awareness Platform - Behavioral Analytics Engine
 * Compute metrics from behavioral events
 */

/**
 * Calculate phishing metrics
 * @param {Array} events - Behavior events
 * @param {Array} results - Scenario results
 * @returns {Object} Phishing metrics
 */
function computePhishingMetrics(events, results) {
  const phishingResults = results.filter(r => r.riskCategory === 'phishing');
  
  if (phishingResults.length === 0) {
    return {
      unsafeActionRate: 0,
      reportRate: 0,
      timeToFirstReportMs: null,
      repeatOffenderRate: 0
    };
  }

  const unsafeActions = phishingResults.filter(r => !r.isCorrect).length;
  const totalPhish = phishingResults.length;
  
  // Find reported events
  const reportedEvents = events.filter(e => 
    e.eventType === 'reported' && 
    results.some(r => r.scenarioId === e.scenarioId)
  );

  // Calculate time to report
  let timeToFirstReportMs = null;
  if (reportedEvents.length > 0) {
    const viewEvents = events.filter(e => e.eventType === 'scenario_viewed');
    
    for (const report of reportedEvents) {
      const view = viewEvents.find(v => v.scenarioId === report.scenarioId);
      if (view) {
        const viewTime = new Date(view.timestamp).getTime();
        const reportTime = new Date(report.timestamp).getTime();
        const diff = reportTime - viewTime;
        
        if (!timeToFirstReportMs || diff < timeToFirstReportMs) {
          timeToFirstReportMs = diff;
        }
      }
    }
  }

  // Calculate repeat offender rate
  const scenarioFails = {};
  for (const result of phishingResults) {
    if (!result.isCorrect) {
      scenarioFails[result.scenarioId] = (scenarioFails[result.scenarioId] || 0) + 1;
    }
  }
  const repeatOffenders = Object.values(scenarioFails).filter(count => count > 1).length;
  const uniqueScenarios = Object.keys(scenarioFails).length;

  return {
    unsafeActionRate: parseFloat((unsafeActions / totalPhish).toFixed(2)),
    reportRate: parseFloat((reportedEvents.length / totalPhish).toFixed(2)),
    timeToFirstReportMs,
    repeatOffenderRate: uniqueScenarios > 0 
      ? parseFloat((repeatOffenders / uniqueScenarios).toFixed(2)) 
      : 0,
    totalAttempts: totalPhish,
    unsafeActions,
    reports: reportedEvents.length
  };
}

/**
 * Calculate overall behavioral metrics
 * @param {Array} events - All behavior events
 * @param {Array} results - All scenario results
 * @returns {Object} Overall metrics
 */
function computeOverallMetrics(events, results) {
  const categories = ['phishing', 'passwords', 'social_engineering', 'safe_browsing'];
  const metrics = {};

  for (const category of categories) {
    const categoryResults = results.filter(r => r.riskCategory === category);
    const categoryEvents = events.filter(e => 
      categoryResults.some(r => r.scenarioId === e.scenarioId)
    );

    if (categoryResults.length === 0) {
      metrics[category] = {
        unsafeActionRate: 0,
        reportRate: 0,
        timeToFirstReportMs: null,
        repeatOffenderRate: 0,
        accuracy: 0
      };
      continue;
    }

    const unsafeActions = categoryResults.filter(r => !r.isCorrect).length;
    const reportedEvents = categoryEvents.filter(e => e.eventType === 'reported');
    
    // Average time spent
    const avgTimeSpent = categoryResults.reduce((sum, r) => sum + (r.timeSpentSeconds || 0), 0) 
      / categoryResults.length;

    metrics[category] = {
      unsafeActionRate: parseFloat((unsafeActions / categoryResults.length).toFixed(2)),
      reportRate: parseFloat((reportedEvents.length / categoryResults.length).toFixed(2)),
      timeToFirstReportMs: computeTimeToReport(categoryEvents),
      repeatOffenderRate: computeRepeatOffenderRate(categoryResults),
      accuracy: Math.round(
        (categoryResults.filter(r => r.isCorrect).length / categoryResults.length) * 100
      ),
      avgTimeSpentSeconds: Math.round(avgTimeSpent),
      totalAttempts: categoryResults.length,
      unsafeActions
    };
  }

  return metrics;
}

/**
 * Calculate time to first report
 * @param {Array} events - Category events
 * @returns {number|null} Time in ms
 */
function computeTimeToReport(events) {
  const reportedEvents = events.filter(e => e.eventType === 'reported');
  const viewEvents = events.filter(e => e.eventType === 'scenario_viewed');

  if (reportedEvents.length === 0 || viewEvents.length === 0) {
    return null;
  }

  let minTime = null;

  for (const report of reportedEvents) {
    const view = viewEvents.find(v => v.scenarioId === report.scenarioId);
    if (view) {
      const viewTime = new Date(view.timestamp).getTime();
      const reportTime = new Date(report.timestamp).getTime();
      const diff = reportTime - viewTime;

      if (diff > 0 && (!minTime || diff < minTime)) {
        minTime = diff;
      }
    }
  }

  return minTime;
}

/**
 * Calculate repeat offender rate
 * @param {Array} results - Category results
 * @returns {number} Rate
 */
function computeRepeatOffenderRate(results) {
  const scenarioFails = {};
  
  for (const result of results) {
    if (!result.isCorrect) {
      scenarioFails[result.scenarioId] = (scenarioFails[result.scenarioId] || 0) + 1;
    }
  }

  const repeatOffenders = Object.values(scenarioFails).filter(count => count > 1).length;
  const uniqueScenarios = Object.keys(scenarioFails).length;

  return uniqueScenarios > 0 ? parseFloat((repeatOffenders / uniqueScenarios).toFixed(2)) : 0;
}

/**
 * Generate user insights
 * @param {Object} metrics - Computed metrics
 * @returns {Array} Insights
 */
function generateInsights(metrics) {
  const insights = [];

  // Find weakest category
  const categoryScores = Object.entries(metrics).map(([cat, data]) => ({
    category: cat,
    accuracy: data.accuracy,
    unsafeRate: data.unsafeActionRate
  }));

  categoryScores.sort((a, b) => a.accuracy - b.accuracy);
  const weakest = categoryScores[0];

  if (weakest && weakest.accuracy < 50) {
    insights.push({
      type: 'weakness',
      category: weakest.category,
      message: `Your ${weakest.category.replace('_', ' ')} recognition needs improvement (${weakest.accuracy}% accuracy)`,
      priority: 'high'
    });
  }

  // Find strength
  const strongest = categoryScores[categoryScores.length - 1];
  if (strongest && strongest.accuracy > 80) {
    insights.push({
      type: 'strength',
      category: strongest.category,
      message: `Strong performance in ${strongest.category.replace('_', ' ')} (${strongest.accuracy}% accuracy)`,
      priority: 'low'
    });
  }

  // Report behavior
  const totalReports = Object.values(metrics).reduce((sum, m) => sum + (m.reportRate || 0), 0);
  if (totalReports === 0) {
    insights.push({
      type: 'improvement',
      message: 'Consider reporting suspicious scenarios to reinforce good habits',
      priority: 'medium'
    });
  }

  return insights;
}

/**
 * Calculate risk score per category
 * @param {Object} categoryMetrics - Metrics per category
 * @returns {Object} Risk scores (0-100)
 */
function calculateCategoryRiskScores(categoryMetrics) {
  const scores = {};

  for (const [category, metrics] of Object.entries(categoryMetrics)) {
    // Base risk on unsafe action rate
    let risk = Math.round(metrics.unsafeActionRate * 100);
    
    // Increase risk for repeat offenders
    if (metrics.repeatOffenderRate > 0.5) {
      risk += 20;
    }
    
    // Decrease risk for good report rate
    if (metrics.reportRate > 0.5) {
      risk -= 15;
    }

    scores[category] = Math.max(0, Math.min(100, risk));
  }

  return scores;
}

/**
 * Calculate hesitation metrics
 * @param {Array} events - Behavior events
 * @returns {Object} Hesitation data
 */
function calculateHesitationMetrics(events) {
  const hoverEvents = events.filter(e => e.eventType === 'option_hovered');
  const selectEvents = events.filter(e => e.eventType === 'option_selected');

  // Track hover duration before selection
  const hoverDurations = [];
  
  for (const select of selectEvents) {
    const hover = hoverEvents.find(h => 
      h.scenarioId === select.scenarioId && 
      h.optionId === select.optionId &&
      new Date(h.timestamp) < new Date(select.timestamp)
    );

    if (hover) {
      const duration = new Date(select.timestamp) - new Date(hover.timestamp);
      hoverDurations.push(duration);
    }
  }

  const avgHesitation = hoverDurations.length > 0
    ? hoverDurations.reduce((a, b) => a + b, 0) / hoverDurations.length
    : 0;

  return {
    avgHesitationMs: Math.round(avgHesitation),
    totalHovers: hoverEvents.length,
    hesitationRate: selectEvents.length > 0 
      ? hoverDurations.length / selectEvents.length 
      : 0
  };
}

module.exports = {
  computePhishingMetrics,
  computeOverallMetrics,
  generateInsights,
  calculateCategoryRiskScores,
  calculateHesitationMetrics,
  computeTimeToReport,
  computeRepeatOffenderRate
};