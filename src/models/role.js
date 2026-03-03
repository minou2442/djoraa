const db = require('../utils/db');

/**
 * Create a new role
 * @param {Object} data - Role data
 * @returns {Promise<Object>} Created role
 */
async function createRole({ clinic_id, code, name, description, user_type = null }) {
  try {
    const res = await db.query(
      `INSERT INTO roles (clinic_id, code, name, description, user_type, is_system_role)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING id, clinic_id, code, name, description, user_type, is_system_role, created_at`,
      [clinic_id, code, name, description, user_type]
    );
    return res.rows[0];
  } catch (error) {
    throw new Error(`Failed to create role: ${error.message}`);
  }
}

/**
 * Get role by ID
 * @param {number} id - Role ID
 * @param {number} clinic_id - Clinic ID (optional, for multi-tenant)
 * @returns {Promise<Object>} Role object
 */
async function getRoleById(id, clinic_id = null) {
  try {
    let query = 'SELECT * FROM roles WHERE id = $1';
    const params = [id];

    if (clinic_id) {
      query += ' AND clinic_id = $2';
      params.push(clinic_id);
    }

    const res = await db.query(query, params);
    return res.rows[0];
  } catch (error) {
    throw new Error(`Failed to get role: ${error.message}`);
  }
}

/**
 * Get role by code
 * @param {string} code - Role code
 * @param {number} clinic_id - Clinic ID (optional)
 * @returns {Promise<Object>} Role object
 */
async function getRoleByCode(code, clinic_id = null) {
  try {
    let query = 'SELECT * FROM roles WHERE code = $1';
    const params = [code];

    if (clinic_id) {
      query += ' AND clinic_id = $2';
      params.push(clinic_id);
    }

    const res = await db.query(query, params);
    return res.rows[0];
  } catch (error) {
    throw new Error(`Failed to get role: ${error.message}`);
  }
}

/**
 * Get all roles for clinic
 * @param {number} clinic_id - Clinic ID
 * @returns {Promise<Array>} Roles list
 */
async function getRolesByClinic(clinic_id) {
  try {
    const res = await db.query(
      'SELECT * FROM roles WHERE clinic_id = $1 ORDER BY name',
      [clinic_id]
    );
    return res.rows;
  } catch (error) {
    throw new Error(`Failed to get roles: ${error.message}`);
  }
}

/**
 * Get system roles (shared across clinics)
 * @returns {Promise<Array>} System roles
 */
async function getSystemRoles() {
  try {
    const res = await db.query(
      'SELECT * FROM roles WHERE is_system_role = true ORDER BY name'
    );
    return res.rows;
  } catch (error) {
    throw new Error(`Failed to get system roles: ${error.message}`);
  }
}

/**
 * Update role
 * @param {number} id - Role ID
 * @param {Object} data - Update data
 * @param {number} clinic_id - Clinic ID (optional)
 * @returns {Promise<Object>} Updated role
 */
async function updateRole(id, data, clinic_id = null) {
  const { name, description } = data;

  try {
    let query = `UPDATE roles SET name = $2, description = $3 WHERE id = $1`;
    const params = [id, name, description];

    if (clinic_id) {
      query += ` AND clinic_id = $${params.length + 1}`;
      params.push(clinic_id);
    }

    query += ' RETURNING *';

    const res = await db.query(query, params);
    return res.rows[0];
  } catch (error) {
    throw new Error(`Failed to update role: ${error.message}`);
  }
}

/**
 * Delete role
 * @param {number} id - Role ID
 * @param {number} clinic_id - Clinic ID (optional)
 * @returns {Promise<boolean>} Success status
 */
async function deleteRole(id, clinic_id = null) {
  try {
    let query = 'DELETE FROM roles WHERE id = $1';
    const params = [id];

    if (clinic_id) {
      query += ' AND clinic_id = $2 AND is_system_role = false';
      params.push(clinic_id);
    }

    await db.query(query, params);
    return true;
  } catch (error) {
    throw new Error(`Failed to delete role: ${error.message}`);
  }
}

/**
 * Get role permissions
 * @param {number} roleId - Role ID
 * @returns {Promise<Array>} Permissions list
 */
async function getRolePermissions(roleId) {
  try {
    const res = await db.query(
      `SELECT p.id, p.code, p.name, p.description, p.category FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [roleId]
    );
    return res.rows;
  } catch (error) {
    throw new Error(`Failed to get role permissions: ${error.message}`);
  }
}

/**
 * Assign permission to role
 * @param {number} roleId - Role ID
 * @param {number} permissionId - Permission ID
 * @returns {Promise<boolean>} Success status
 */
async function assignPermissionToRole(roleId, permissionId) {
  try {
    await db.query(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [roleId, permissionId]
    );
    return true;
  } catch (error) {
    throw new Error(`Failed to assign permission: ${error.message}`);
  }
}

/**
 * Remove permission from role
 * @param {number} roleId - Role ID
 * @param {number} permissionId - Permission ID
 * @returns {Promise<boolean>} Success status
 */
async function removePermissionFromRole(roleId, permissionId) {
  try {
    await db.query(
      'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
      [roleId, permissionId]
    );
    return true;
  } catch (error) {
    throw new Error(`Failed to remove permission: ${error.message}`);
  }
}

module.exports = {
  createRole,
  getRoleById,
  getRoleByCode,
  getRolesByClinic,
  getSystemRoles,
  updateRole,
  deleteRole,
  getRolePermissions,
  assignPermissionToRole,
  removePermissionFromRole
};
