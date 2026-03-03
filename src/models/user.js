const db = require('../utils/db');
const bcrypt = require('bcrypt');

/**
 * Create a new user
 * @param {Object} data - User data
 * @returns {Promise<Object>} Created user
 */
async function createUser(data) {
  const {
    clinic_id,
    username,
    email,
    password,
    first_name,
    last_name,
    user_type,
    phone,
    specialization,
    license_number
  } = data;

  const hash = await bcrypt.hash(password, 10);
  
  try {
    const res = await db.query(
      `INSERT INTO users (clinic_id, username, email, password_hash, first_name, last_name, user_type, phone, specialization, license_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, clinic_id, username, email, first_name, last_name, user_type, phone, is_active, created_at`,
      [clinic_id, username, email, hash, first_name, last_name, user_type, phone, specialization, license_number]
    );
    return res.rows[0];
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

/**
 * Find user by username
 * @param {string} username - Username
 * @returns {Promise<Object>} User object
 */
async function findByUsername(username) {
  try {
    const res = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    return res.rows[0];
  } catch (error) {
    throw new Error(`Failed to find user: ${error.message}`);
  }
}

/**
 * Get user by ID with roles and permissions
 * @param {number} id - User ID
 * @returns {Promise<Object>} User with roles and permissions
 */
async function getById(id) {
  try {
    const userRes = await db.query(
      'SELECT id, clinic_id, username, email, first_name, last_name, user_type, phone, is_active, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userRes.rows.length === 0) {
      return null;
    }

    const user = userRes.rows[0];

    // Get roles
    const rolesRes = await db.query(
      `SELECT r.id, r.code, r.name, r.description FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [id]
    );

    // Get permissions
    const permissionsRes = await db.query(
      `SELECT DISTINCT p.id, p.code, p.name, p.category FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1`,
      [id]
    );

    user.roles = rolesRes.rows;
    user.permissions = permissionsRes.rows.map(p => p.code);

    return user;
  } catch (error) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

/**
 * Get all users in clinic
 * @param {number} clinic_id - Clinic ID
 * @param {Object} options - Pagination and filtering
 * @returns {Promise<Array>} Users list
 */
async function getUsersByClinic(clinic_id, options = {}) {
  const { limit = 50, offset = 0, user_type = null, is_active = true } = options;

  let query = `SELECT id, clinic_id, username, email, first_name, last_name, user_type, phone, is_active, created_at
               FROM users WHERE clinic_id = $1`;
  const params = [clinic_id];

  if (user_type) {
    query += ` AND user_type = $${params.length + 1}`;
    params.push(user_type);
  }

  if (is_active !== null) {
    query += ` AND is_active = $${params.length + 1}`;
    params.push(is_active);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  try {
    const res = await db.query(query, params);
    return res.rows;
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
}

/**
 * Update user
 * @param {number} id - User ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>} Updated user
 */
async function updateUser(id, data) {
  const { first_name, last_name, email, phone, specialization, is_active } = data;

  try {
    const res = await db.query(
      `UPDATE users SET 
       first_name = COALESCE($2, first_name),
       last_name = COALESCE($3, last_name),
       email = COALESCE($4, email),
       phone = COALESCE($5, phone),
       specialization = COALESCE($6, specialization),
       is_active = COALESCE($7, is_active),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, clinic_id, username, email, first_name, last_name, user_type, is_active`,
      [id, first_name, last_name, email, phone, specialization, is_active]
    );

    return res.rows[0];
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
}

/**
 * Change user password
 * @param {number} id - User ID
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Success status
 */
async function changePassword(id, newPassword) {
  const hash = await bcrypt.hash(newPassword, 10);

  try {
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hash, id]
    );
    return true;
  } catch (error) {
    throw new Error(`Failed to change password: ${error.message}`);
  }
}

/**
 * Deactivate user
 * @param {number} id - User ID
 * @returns {Promise<boolean>} Success status
 */
async function deactivateUser(id) {
  try {
    await db.query(
      'UPDATE users SET is_active = false WHERE id = $1',
      [id]
    );
    return true;
  } catch (error) {
    throw new Error(`Failed to deactivate user: ${error.message}`);
  }
}

/**
 * Delete user (soft delete)
 * @param {number} id - User ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteUser(id) {
  try {
    // Soft delete: deactivate instead of removing
    await db.query(
      'UPDATE users SET is_active = false WHERE id = $1',
      [id]
    );
    // Remove all roles
    await db.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
    return true;
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * Assign role to user
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {Promise<boolean>} Success status
 */
async function assignRole(userId, roleId) {
  try {
    await db.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, roleId]
    );
    return true;
  } catch (error) {
    throw new Error(`Failed to assign role: ${error.message}`);
  }
}

/**
 * Remove role from user
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {Promise<boolean>} Success status
 */
async function removeRole(userId, roleId) {
  try {
    await db.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
    return true;
  } catch (error) {
    throw new Error(`Failed to remove role: ${error.message}`);
  }
}

/**
 * Get user roles
 * @param {number} userId - User ID
 * @returns {Promise<Array>} User roles
 */
async function getRoles(userId) {
  try {
    const res = await db.query(
      `SELECT r.id, r.code, r.name, r.description FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );
    return res.rows;
  } catch (error) {
    throw new Error(`Failed to get user roles: ${error.message}`);
  }
}

/**
 * Get user permissions
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Permission codes
 */
async function getPermissions(userId) {
  try {
    const res = await db.query(
      `SELECT DISTINCT p.code FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );
    return res.rows.map(row => row.code);
  } catch (error) {
    throw new Error(`Failed to get permissions: ${error.message}`);
  }
}

/**
 * Check if user has permission
 * @param {number} userId - User ID
 * @param {string} permissionCode - Permission code
 * @returns {Promise<boolean>} Has permission
 */
async function hasPermission(userId, permissionCode) {
  try {
    const res = await db.query(
      `SELECT 1 FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1 AND p.code = $2
       LIMIT 1`,
      [userId, permissionCode]
    );
    return res.rows.length > 0;
  } catch (error) {
    throw new Error(`Failed to check permission: ${error.message}`);
  }
}

/**
 * Compare password
 * @param {string} password - Plain password
 * @param {string} hash - Password hash
 * @returns {Promise<boolean>} Match status
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Update last login
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function updateLastLogin(userId) {
  try {
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
    return true;
  } catch (error) {
    throw new Error(`Failed to update last login: ${error.message}`);
  }
}

module.exports = {
  createUser,
  findByUsername,
  getById,
  getUsersByClinic,
  updateUser,
  changePassword,
  deactivateUser,
  deleteUser,
  assignRole,
  removeRole,
  getRoles,
  getPermissions,
  hasPermission,
  comparePassword,
  updateLastLogin
};
