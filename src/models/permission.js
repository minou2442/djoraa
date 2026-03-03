const db = require('../utils/db');

/**
 * Create a permission
 * @param {Object} data - Permission data
 * @returns {Promise<Object>} Created permission
 */
async function createPermission({ code, name, description, category }) {
  try {
    const res = await db.query(
      `INSERT INTO permissions (code, name, description, category)
       VALUES ($1, $2, $3, $4)
       RETURNING id, code, name, description, category, created_at`,
      [code, name, description, category]
    );
    return res.rows[0];
  } catch (error) {
    throw new Error(`Failed to create permission: ${error.message}`);
  }
}

/**
 * Get permission by ID
 * @param {number} id - Permission ID
 * @returns {Promise<Object>} Permission object
 */
async function getPermissionById(id) {
  try {
    const res = await db.query(
      'SELECT * FROM permissions WHERE id = $1',
      [id]
    );
    return res.rows[0];
  } catch (error) {
    throw new Error(`Failed to get permission: ${error.message}`);
  }
}

/**
 * Get permission by code
 * @param {string} code - Permission code
 * @returns {Promise<Object>} Permission object
 */
async function getPermissionByCode(code) {
  try {
    const res = await db.query(
      'SELECT * FROM permissions WHERE code = $1',
      [code]
    );
    return res.rows[0];
  } catch (error) {
    throw new Error(`Failed to get permission: ${error.message}`);
  }
}

/**
 * Get all permissions
 * @param {string} category - Optional category filter
 * @returns {Promise<Array>} Permissions list
 */
async function getPermissions(category = null) {
  try {
    let query = 'SELECT * FROM permissions';
    const params = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }

    query += ' ORDER BY category, code';

    const res = await db.query(query, params);
    return res.rows;
  } catch (error) {
    throw new Error(`Failed to get permissions: ${error.message}`);
  }
}

/**
 * Get permissions by category
 * @param {string} category - Category name
 * @returns {Promise<Array>} Permissions list
 */
async function getPermissionsByCategory(category) {
  try {
    const res = await db.query(
      'SELECT * FROM permissions WHERE category = $1 ORDER BY code',
      [category]
    );
    return res.rows;
  } catch (error) {
    throw new Error(`Failed to get permissions: ${error.message}`);
  }
}

/**
 * Get all permission categories
 * @returns {Promise<Array>} Categories list
 */
async function getCategories() {
  try {
    const res = await db.query(
      'SELECT DISTINCT category FROM permissions ORDER BY category'
    );
    return res.rows.map(row => row.category);
  } catch (error) {
    throw new Error(`Failed to get categories: ${error.message}`);
  }
}

/**
 * Update permission
 * @param {number} id - Permission ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated permission
 */
async function updatePermission(id, data) {
  const { name, description } = data;

  try {
    const res = await db.query(
      `UPDATE permissions SET name = $2, description = $3 WHERE id = $1
       RETURNING *`,
      [id, name, description]
    );
    return res.rows[0];
  } catch (error) {
    throw new Error(`Failed to update permission: ${error.message}`);
  }
}

/**
 * Delete permission
 * @param {number} id - Permission ID
 * @returns {Promise<boolean>} Success status
 */
async function deletePermission(id) {
  try {
    // First remove all role-permission associations
    await db.query('DELETE FROM role_permissions WHERE permission_id = $1', [id]);
    // Then delete the permission
    await db.query('DELETE FROM permissions WHERE id = $1', [id]);
    return true;
  } catch (error) {
    throw new Error(`Failed to delete permission: ${error.message}`);
  }
}

module.exports = {
  createPermission,
  getPermissionById,
  getPermissionByCode,
  getPermissions,
  getPermissionsByCategory,
  getCategories,
  updatePermission,
  deletePermission
};
