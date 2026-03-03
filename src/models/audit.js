const db = require('../utils/db');

/**
 * Log an audit event
 * @param {Object} data - Audit data
 * @returns {Promise<Object>} Created audit log
 */
async function logAudit(data) {
  const {
    user_id,
    resource_type,
    action,
    resource_id,
    old_values,
    new_values,
    ip_address,
    clinic_id
  } = data;

  try {
    const res = await db.query(
      `INSERT INTO audit_log (user_id, resource_type, action, resource_id, old_values, new_values, ip_address, clinic_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user_id, resource_type, action, resource_id, JSON.stringify(old_values), JSON.stringify(new_values), ip_address, clinic_id]
    );
    return res.rows[0];
  } catch (error) {
    throw new Error(`Failed to log audit: ${error.message}`);
  }
}

/**
 * Get audit log by ID
 * @param {number} id - Audit log ID
 * @returns {Promise<Object>} Audit log entry
 */
async function getAuditById(id) {
  try {
    const res = await db.query(
      'SELECT * FROM audit_log WHERE id = $1',
      [id]
    );

    const row = res.rows[0];
    if (row) {
      row.old_values = JSON.parse(row.old_values || '{}');
      row.new_values = JSON.parse(row.new_values || '{}');
    }
    return row;
  } catch (error) {
    throw new Error(`Failed to get audit log: ${error.message}`);
  }
}

/**
 * Get audit logs for clinic
 * @param {number} clinic_id - Clinic ID
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} Audit logs
 */
async function getAuditLogs(clinic_id, options = {}) {
  const {
    limit = 100,
    offset = 0,
    user_id = null,
    resource_type = null,
    action = null,
    start_date = null,
    end_date = null
  } = options;

  let query = 'SELECT * FROM audit_log WHERE clinic_id = $1';
  const params = [clinic_id];

  if (user_id) {
    query += ` AND user_id = $${params.length + 1}`;
    params.push(user_id);
  }

  if (resource_type) {
    query += ` AND resource_type = $${params.length + 1}`;
    params.push(resource_type);
  }

  if (action) {
    query += ` AND action = $${params.length + 1}`;
    params.push(action);
  }

  if (start_date) {
    query += ` AND created_at >= $${params.length + 1}`;
    params.push(start_date);
  }

  if (end_date) {
    query += ` AND created_at <= $${params.length + 1}`;
    params.push(end_date);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  try {
    const res = await db.query(query, params);
    return res.rows.map(row => ({
      ...row,
      old_values: JSON.parse(row.old_values || '{}'),
      new_values: JSON.parse(row.new_values || '{}')
    }));
  } catch (error) {
    throw new Error(`Failed to get audit logs: ${error.message}`);
  }
}

/**
 * Get audit logs for a specific resource
 * @param {string} resource_type - Resource type (e.g., 'user', 'patient')
 * @param {number} resource_id - Resource ID
 * @returns {Promise<Array>} Audit logs
 */
async function getResourceAudit(resource_type, resource_id) {
  try {
    const res = await db.query(
      `SELECT * FROM audit_log WHERE resource_type = $1 AND resource_id = $2
       ORDER BY created_at DESC`,
      [resource_type, resource_id]
    );
    return res.rows.map(row => ({
      ...row,
      old_values: JSON.parse(row.old_values || '{}'),
      new_values: JSON.parse(row.new_values || '{}')
    }));
  } catch (error) {
    throw new Error(`Failed to get resource audit: ${error.message}`);
  }
}

/**
 * Get user audit activity
 * @param {number} user_id - User ID
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} Audit logs
 */
async function getUserActivity(user_id, options = {}) {
  const {
    limit = 100,
    offset = 0,
    start_date = null,
    end_date = null
  } = options;

  let query = 'SELECT * FROM audit_log WHERE user_id = $1';
  const params = [user_id];

  if (start_date) {
    query += ` AND created_at >= $${params.length + 1}`;
    params.push(start_date);
  }

  if (end_date) {
    query += ` AND created_at <= $${params.length + 1}`;
    params.push(end_date);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  try {
    const res = await db.query(query, params);
    return res.rows.map(row => ({
      ...row,
      old_values: JSON.parse(row.old_values || '{}'),
      new_values: JSON.parse(row.new_values || '{}')
    }));
  } catch (error) {
    throw new Error(`Failed to get user activity: ${error.message}`);
  }
}

/**
 * Count audit logs (with filters)
 * @param {number} clinic_id - Clinic ID
 * @param {Object} filters - Filter options
 * @returns {Promise<number>} Count
 */
async function countAuditLogs(clinic_id, filters = {}) {
  const { user_id = null, resource_type = null, action = null } = filters;

  let query = 'SELECT COUNT(*) FROM audit_log WHERE clinic_id = $1';
  const params = [clinic_id];

  if (user_id) {
    query += ` AND user_id = $${params.length + 1}`;
    params.push(user_id);
  }

  if (resource_type) {
    query += ` AND resource_type = $${params.length + 1}`;
    params.push(resource_type);
  }

  if (action) {
    query += ` AND action = $${params.length + 1}`;
    params.push(action);
  }

  try {
    const res = await db.query(query, params);
    return parseInt(res.rows[0].count, 10);
  } catch (error) {
    throw new Error(`Failed to count audit logs: ${error.message}`);
  }
}

/**
 * Delete old audit logs (cleanup)
 * @param {number} days - Delete logs older than N days
 * @returns {Promise<number>} Count of deleted records
 */
async function deleteOldAuditLogs(days) {
  try {
    const res = await db.query(
      `DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '${days} days'`
    );
    return res.rowCount;
  } catch (error) {
    throw new Error(`Failed to delete old audit logs: ${error.message}`);
  }
}

module.exports = {
  logAudit,
  getAuditById,
  getAuditLogs,
  getResourceAudit,
  getUserActivity,
  countAuditLogs,
  deleteOldAuditLogs
};
