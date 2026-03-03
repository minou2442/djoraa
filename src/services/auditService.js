const AuditModel = require('../models/audit');

class AuditService {
  /**
   * Log an action
   * @param {number} userId - User ID
   * @param {string} resourceType - Type of resource (user, patient, appointment, etc.)
   * @param {string} action - Action performed (create, update, delete, view)
   * @param {number} resourceId - ID of the resource
   * @param {Object} oldValues - Previous values (for updates)
   * @param {Object} newValues - New values (for updates)
   * @param {string} ipAddress - IP address of request
   * @param {number} clinicId - Clinic ID
   * @returns {Promise<Object>} Audit log entry
   */
  static async logAction(userId, resourceType, action, resourceId, oldValues, newValues, ipAddress, clinicId) {
    try {
      const audit = await AuditModel.logAudit({
        user_id: userId,
        resource_type: resourceType,
        action,
        resource_id: resourceId,
        old_values: oldValues || null,
        new_values: newValues || null,
        ip_address: ipAddress,
        clinic_id: clinicId
      });

      return audit;
    } catch (error) {
      console.error('Failed to log audit:', error);
      // Don't throw - allow operation to continue even if audit fails
      return null;
    }
  }

  /**
   * Log user access (create, update, delete)
   * @param {number} userId - User ID
   * @param {string} action - Action (create_user, update_user, delete_user, etc.)
   * @param {number} resourceId - Resource ID
   * @param {Object} oldValues - Previous values
   * @param {Object} newValues - New values
   * @param {string} ipAddress - IP address
   * @param {number} clinicId - Clinic ID
   * @returns {Promise<Object>} Audit log
   */
  static async logUserAction(userId, action, resourceId, oldValues, newValues, ipAddress, clinicId) {
    return this.logAction(userId, 'user', action, resourceId, oldValues, newValues, ipAddress, clinicId);
  }

  /**
   * Log access attempt (permission check)
   * @param {number} userId - User ID
   * @param {string} action - Action attempted
   * @param {string} resource - Resource accessed
   * @param {string} ipAddress - IP address
   * @param {string[]} requiredPermissions - Permissions needed
   * @param {number} clinicId - Clinic ID
   * @returns {Promise<Object>} Audit log
   */
  static async logAccess(userId, action, resource, ipAddress, requiredPermissions, clinicId) {
    try {
      const audit = await AuditModel.logAudit({
        user_id: userId,
        resource_type: 'access_control',
        action,
        resource_id: null,
        old_values: null,
        new_values: { resource, requiredPermissions },
        ip_address: ipAddress,
        clinic_id: clinicId
      });

      return audit;
    } catch (error) {
      console.error('Failed to log access:', error);
      return null;
    }
  }

  /**
   * Get audit logs for clinic
   * @param {number} clinicId - Clinic ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Audit logs
   */
  static async getAuditLogs(clinicId, options = {}) {
    return AuditModel.getAuditLogs(clinicId, options);
  }

  /**
   * Get audit logs for a resource
   * @param {string} resourceType - Resource type
   * @param {number} resourceId - Resource ID
   * @returns {Promise<Array>} Audit logs
   */
  static async getResourceHistory(resourceType, resourceId) {
    return AuditModel.getResourceAudit(resourceType, resourceId);
  }

  /**
   * Get user activity
   * @param {number} userId - User ID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} User activity logs
   */
  static async getUserActivity(userId, options = {}) {
    return AuditModel.getUserActivity(userId, options);
  }

  /**
   * Count audit logs
   * @param {number} clinicId - Clinic ID
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} Count
   */
  static async countLogs(clinicId, filters = {}) {
    return AuditModel.countAuditLogs(clinicId, filters);
  }

  /**
   * Generate audit report
   * @param {number} clinicId - Clinic ID
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Report data
   */
  static async generateReport(clinicId, options = {}) {
    const {
      limit = 1000,
      offset = 0,
      startDate = null,
      endDate = null,
      user_id = null,
      resource_type = null
    } = options;

    const logs = await AuditModel.getAuditLogs(clinicId, {
      limit,
      offset,
      user_id,
      resource_type,
      start_date: startDate,
      end_date: endDate
    });

    const total = await AuditModel.countAuditLogs(clinicId, {
      user_id,
      resource_type
    });

    return {
      total,
      limit,
      offset,
      logs
    };
  }

  /**
   * Cleanup old audit logs
   * @param {number} days - Delete logs older than N days
   * @returns {Promise<number>} Count deleted
   */
  static async cleanupOldLogs(days = 90) {
    return AuditModel.deleteOldAuditLogs(days);
  }
}

module.exports = AuditService;
