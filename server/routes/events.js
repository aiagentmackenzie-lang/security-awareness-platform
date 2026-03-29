/**
 * Security Awareness Platform - API Routes: Events
 * Behavioral telemetry ingestion
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

/**
 * POST /api/events
 * Ingest behavioral events
 */
router.post('/',
  body('events').isArray({ min: 1 }),
  body('events.*.userId').isString(),
  body('events.*.eventType').isIn([
    'scenario_viewed',
    'option_hovered',
    'option_selected',
    'submitted',
    'reported',
    'closed',
    'link_clicked',
    'link_hovered'
  ]),
  body('events.*.timestamp').isISO8601(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid event data',
          details: errors.array()
        }
      });
    }

    const { events } = req.body;

    try {
      // TODO: Persist events to database
      // For now, just acknowledge receipt
      
      const savedEvents = events.map(event => ({
        ...event,
        receivedAt: new Date().toISOString(),
        sessionId: event.sessionId || req.sessionID,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }));

      res.json({
        success: true,
        data: {
          saved: savedEvents.length,
          events: savedEvents
        }
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to save events'
        }
      });
    }
  }
);

/**
 * POST /api/events/report
 * Quick endpoint for reporting scenarios
 */
router.post('/report',
  body('scenarioId').isString(),
  body('userId').isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid report data'
        }
      });
    }

    const { scenarioId, userId } = req.body;

    const event = {
      userId,
      scenarioId,
      eventType: 'reported',
      timestamp: new Date().toISOString(),
      sessionId: req.sessionID,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    };

    // TODO: Save to database

    res.json({
      success: true,
      data: {
        message: 'Scenario reported',
        event
      }
    });
  }
);

module.exports = router;