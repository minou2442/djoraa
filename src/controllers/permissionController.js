const Permission = require('../models/permission');
const AuditService = require('../services/auditService');

/**
 * Create a new permission (admin only)
 * POST /api/permissions
 */
async function createPermission(req, res) {
  try {
    const { code, name, description, category } = req.body;

    if (!code || !name || !category) {
      return res.status(400).json({ error: 'code, name, and category are required' });
    }

    const permission = await Permission.createPermission({
      code,
      name,
      description,
      category
    });

    // Log audit
    await AuditService.logAction(
      req.user.id,
      'permission',
      'create',
      permission.id,
      null,
      permission,
      req.ip,
      req.clinic_id
    );

    res.status(201).json({
      message: 'Permission created successfully',
      permission
    });
  } catch (err) {
    console.error('Create permission error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Get all permissions or permissions by category
 * GET /api/permissions?category=user_management
 */
async function listPermissions(req, res) {
  try {
    const { category } = req.query;

    let permissions;
    if (category) {
      permissions = await Permission.getPermissionsByCategory(category);
    } else {
      permissions = await Permission.getPermissions();
    }

    res.json({
      total: permissions.length,
      permissions
    });
  } catch (err) {
    console.error('List permissions error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Get permission by ID
 * GET /api/permissions/:permissionId
 */
async function getPermission(req, res) {
  try {
    const { permissionId } = req.params;
    const permission = await Permission.getPermissionById(permissionId);

    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    res.json(permission);
  } catch (err) {
    console.error('Get permission error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Get permission by code
 * GET /api/permissions/code/:code
 */
async function getPermissionByCode(req, res) {
  try {
    const { code } = req.params;
    const permission = await Permission.getPermissionByCode(code);

    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    res.json(permission);
  } catch (err) {
    console.error('Get permission by code error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Get all permission categories
 * GET /api/permissions/categories
 */
async function getCategories(req, res) {
  try {
    const categories = await Permission.getCategories();
    res.json({
      categories,
      total: categories.length
    });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Update permission
 * PUT /api/permissions/:permissionId
 */
async function updatePermission(req, res) {
  try {
    const { permissionId } = req.params;
    const { name, description } = req.body;

    // Get current permission for audit
    const oldPermission = await Permission.getPermissionById(permissionId);
    if (!oldPermission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // Update permission
    const permission = await Permission.updatePermission(permissionId, {
      name,
      description
    });

    // Log audit
    await AuditService.logAction(
      req.user.id,
      'permission',
      'update',
      permissionId,
      oldPermission,
      permission,
      req.ip,
      req.clinic_id
    );

    res.json({
      message: 'Permission updated successfully',
      permission
    });
  } catch (err) {
    console.error('Update permission error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Delete permission
 * DELETE /api/permissions/:permissionId
 */
async function deletePermission(req, res) {
  try {
    const { permissionId } = req.params;

    // Get permission for audit
    const permission = await Permission.getPermissionById(permissionId);
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // Delete permission
    await Permission.deletePermission(permissionId);

    // Log audit
    await AuditService.logAction(
      req.user.id,
      'permission',
      'delete',
      permissionId,
      permission,
      null,
      req.ip,
      req.clinic_id
    );

    res.json({ message: 'Permission deleted successfully' });
  } catch (err) {
    console.error('Delete permission error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

module.exports = {
  createPermission,
  getPermission,
  getPermissionByCode,
  listPermissions,
  getCategories,
  updatePermission,
  deletePermission
};
