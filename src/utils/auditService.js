const db = require('../utils/db');

/**
 * Log an audit event
 * @param {Object} params - Audit log parameters
 * @param {number} params.clinic_id - Clinic ID
 * @param {number} params.user_id - User ID who performed the action
 * @param {string} params.action - Action type (CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, etc.)
 * @param {string} params.resource - Resource type (user, role, permission, file, patient, etc.)
 * @param {number} params.resource_id - ID of the affected resource
 * @param {string} params.details - Additional details as JSON string
 * @param {string} params.ip_address - Client IP address
 */
async function logAuditEvent({ clinic_id, user_id, action, resource, resource_id, details, ip_address }) {
  try {
    await db.query(
      `INSERT INTO audit_logs (clinic_id, user_id, action, resource, resource_id, details, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [clinic_id, user_id, action, resource, resource_id, details || null, ip_address || null]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Get audit logs with filters
 */
async function getAuditLogs(filters = {}) {
  const { clinic_id, user_id, action, resource, start_date, end_date, limit = 100, offset = 0 } = filters;
  
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (clinic_id) {
    query += ` AND clinic_id = $${paramIndex}`;
    params.push(clinic_id);
    paramIndex++;
  }

  if (user_id) {
    query += ` AND user_id = $${paramIndex}`;
    params.push(user_id);
    paramIndex++;
  }

  if (action) {
    query += ` AND action = $${paramIndex}`;
    params.push(action);
    paramIndex++;
  }

  if (resource) {
    query += ` AND resource = $${paramIndex}`;
    params.push(resource);
    paramIndex++;
  }

  if (start_date) {
    query += ` AND created_at >= $${paramIndex}`;
    params.push(start_date);
    paramIndex++;
  }

  if (end_date) {
    query += ` AND created_at <= $${paramIndex}`;
    params.push(end_date);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * Get audit log by ID
 */
async function getAuditLogById(id) {
  const result = await db.query('SELECT * FROM audit_logs WHERE id = $1', [id]);
  return result.rows[0];
}

/**
 * Get audit statistics for a clinic
 */
async function getAuditStats(clinic_id, days = 30) {
  const result = await db.query(
    `SELECT 
       action,
       resource,
       COUNT(*) as count
     FROM audit_logs 
     WHERE clinic_id = $1 
       AND created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY action, resource
     ORDER BY count DESC`,
    [clinic_id]
  );
  return result.rows;
}

module.exports = {
  logAuditEvent,
  getAuditLogs,
  getAuditLogById,
  getAuditStats
};
