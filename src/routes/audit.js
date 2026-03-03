const express = require('express');
const router = express.Router();
const AuditService = require('../services/auditService');
const { verifyToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbacMiddleware');

// All audit routes require authentication
router.use(verifyToken);

/**
 * GET /api/audit/logs
 * Get audit logs with filters
 * Supports: user_id, resource_type, action, start_date, end_date, limit, offset
 * Requires: system_config_view_audit_log permission
 */
router.get('/logs',
  requirePermission('system_config_view_audit_log'),
  async (req, res) => {
    try {
      const { user_id, resource_type, action, start_date, end_date, limit, offset } = req.query;

      const logs = await AuditService.getAuditLogs(req.clinic_id, {
        user_id: user_id ? parseInt(user_id, 10) : null,
        resource_type,
        action,
        start_date,
        end_date,
        limit: limit ? parseInt(limit, 10) : 100,
        offset: offset ? parseInt(offset, 10) : 0
      });

      res.json({
        total: logs.length,
        limit: limit || 100,
        offset: offset || 0,
        logs
      });
    } catch (err) {
      console.error('Get audit logs error:', err);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  }
);

/**
 * GET /api/audit/logs/:id
 * Get specific audit log by ID
 */
router.get('/logs/:id',
  requirePermission('system_config_view_audit_log'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const log = await AuditService.getAuditLogs(req.clinic_id, { limit: 1, offset: 0 });

      if (!log || log.length === 0) {
        return res.status(404).json({ error: 'Audit log not found' });
      }

      res.json(log[0]);
    } catch (err) {
      console.error('Get audit log error:', err);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  }
);

/**
 * GET /api/audit/resource/:resourceType/:resourceId
 * Get audit history for a specific resource
 */
router.get('/resource/:resourceType/:resourceId',
  requirePermission('system_config_view_audit_log'),
  async (req, res) => {
    try {
      const { resourceType, resourceId } = req.params;

      const history = await AuditService.getResourceHistory(resourceType, parseInt(resourceId, 10));

      res.json({
        resourceType,
        resourceId,
        total: history.length,
        history
      });
    } catch (err) {
      console.error('Get resource history error:', err);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  }
);

/**
 * GET /api/audit/user/:userId
 * Get audit activity for a specific user
 */
router.get('/user/:userId',
  requirePermission('system_config_view_audit_log'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { start_date, end_date, limit, offset } = req.query;

      const activity = await AuditService.getUserActivity(parseInt(userId, 10), {
        start_date,
        end_date,
        limit: limit ? parseInt(limit, 10) : 100,
        offset: offset ? parseInt(offset, 10) : 0
      });

      res.json({
        userId,
        total: activity.length,
        activity
      });
    } catch (err) {
      console.error('Get user activity error:', err);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  }
);

/**
 * GET /api/audit/report
 * Generate audit report with filters
 */
router.get('/report',
  requirePermission('system_config_view_audit_log'),
  async (req, res) => {
    try {
      const { user_id, resource_type, start_date, end_date, limit, offset } = req.query;

      const report = await AuditService.generateReport(req.clinic_id, {
        limit: limit ? parseInt(limit, 10) : 1000,
        offset: offset ? parseInt(offset, 10) : 0,
        startDate: start_date,
        endDate: end_date,
        user_id: user_id ? parseInt(user_id, 10) : null,
        resource_type
      });

      res.json(report);
    } catch (err) {
      console.error('Generate audit report error:', err);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  }
);

/**
 * DELETE /api/audit/cleanup
 * Clean up old audit logs (admin only)
 * Query param: days (default: 90)
 */
router.delete('/cleanup',
  requirePermission('system_config_view_audit_log'),
  async (req, res) => {
    try {
      const { days = 90 } = req.query;

      const deleted = await AuditService.cleanupOldLogs(parseInt(days, 10));

      res.json({
        message: `Cleaned up ${deleted} audit logs older than ${days} days`,
        deleted
      });
    } catch (err) {
      console.error('Cleanup audit logs error:', err);
      res.status(500).json({ error: err.message || 'Server error' });
    }
  }
);

module.exports = router;
