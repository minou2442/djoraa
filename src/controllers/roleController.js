const Role = require('../models/role');
const Permission = require('../models/permission');
const AuditService = require('../services/auditService');

/**
 * Create a new role
 * POST /api/roles
 */
async function createRole(req, res) {
  try {
    const { code, name, description, user_type } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'code and name are required' });
    }

    const newRole = await Role.createRole({
      clinic_id: req.clinic_id,
      code,
      name,
      description,
      user_type
    });

    // Log audit
    await AuditService.logAction(
      req.user.id,
      'role',
      'create',
      newRole.id,
      null,
      newRole,
      req.ip,
      req.clinic_id
    );

    res.status(201).json({
      message: 'Role created successfully',
      role: newRole
    });
  } catch (err) {
    console.error('Create role error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Get all roles for clinic
 * GET /api/roles
 */
async function listRoles(req, res) {
  try {
    const clinic_id = req.clinic_id;
    const roles = await Role.getRolesByClinic(clinic_id);

    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => ({
        ...role,
        permissions: await Role.getRolePermissions(role.id)
      }))
    );

    res.json({
      total: rolesWithPermissions.length,
      roles: rolesWithPermissions
    });
  } catch (err) {
    console.error('List roles error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Get system roles (shared across clinics)
 * GET /api/roles/system
 */
async function listSystemRoles(req, res) {
  try {
    const roles = await Role.getSystemRoles();

    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => ({
        ...role,
        permissions: await Role.getRolePermissions(role.id)
      }))
    );

    res.json({
      total: rolesWithPermissions.length,
      roles: rolesWithPermissions
    });
  } catch (err) {
    console.error('List system roles error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Get specific role by ID
 * GET /api/roles/:roleId
 */
async function getRole(req, res) {
  try {
    const { roleId } = req.params;
    const clinic_id = req.clinic_id;

    const role = await Role.getRoleById(roleId, clinic_id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    // Get permissions
    const permissions = await Role.getRolePermissions(roleId);

    res.json({
      ...role,
      permissions
    });
  } catch (err) {
    console.error('Get role error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Update role
 * PUT /api/roles/:roleId
 */
async function updateRole(req, res) {
  try {
    const { roleId } = req.params;
    const { name, description } = req.body;
    const clinic_id = req.clinic_id;

    // Verify role exists and belongs to clinic
    const role = await Role.getRoleById(roleId, clinic_id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    // Prevent updating system roles
    if (role.is_system_role) {
      return res.status(403).json({ error: 'Cannot modify system roles' });
    }

    // Update role
    const updatedRole = await Role.updateRole(roleId, { name, description }, clinic_id);

    // Log audit
    await AuditService.logAction(
      req.user.id,
      'role',
      'update',
      roleId,
      role,
      updatedRole,
      req.ip,
      clinic_id
    );

    res.json({
      message: 'Role updated successfully',
      role: updatedRole
    });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Delete role
 * DELETE /api/roles/:roleId
 */
async function deleteRole(req, res) {
  try {
    const { roleId } = req.params;
    const clinic_id = req.clinic_id;

    // Verify role exists and belongs to clinic
    const role = await Role.getRoleById(roleId, clinic_id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    // Prevent deleting system roles
    if (role.is_system_role) {
      return res.status(403).json({ error: 'Cannot delete system roles' });
    }

    // Delete role
    await Role.deleteRole(roleId, clinic_id);

    // Log audit
    await AuditService.logAction(
      req.user.id,
      'role',
      'delete',
      roleId,
      role,
      null,
      req.ip,
      clinic_id
    );

    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error('Delete role error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Get role permissions
 * GET /api/roles/:roleId/permissions
 */
async function getRolePermissions(req, res) {
  try {
    const { roleId } = req.params;
    const clinic_id = req.clinic_id;

    // Verify role exists
    const role = await Role.getRoleById(roleId, clinic_id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    const permissions = await Role.getRolePermissions(roleId);

    res.json({ permissions });
  } catch (err) {
    console.error('Get role permissions error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Add permission to role
 * POST /api/roles/:roleId/permissions
 */
async function assignPermission(req, res) {
  try {
    const { roleId } = req.params;
    const { permissionId } = req.body || req.params;
    const clinic_id = req.clinic_id;

    if (!permissionId) {
      return res.status(400).json({ error: 'permissionId required' });
    }

    // Verify role exists
    const role = await Role.getRoleById(roleId, clinic_id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    // Prevent modifying system roles
    if (role.is_system_role) {
      return res.status(403).json({ error: 'Cannot modify system role permissions' });
    }

    // Verify permission exists
    const permission = await Permission.getPermissionById(permissionId);
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // Add permission
    await Role.assignPermissionToRole(roleId, permissionId);

    // Log audit
    await AuditService.logAction(
      req.user.id,
      'role_permission',
      'assign',
      roleId,
      null,
      { permission_id: permissionId, permission_code: permission.code },
      req.ip,
      clinic_id
    );

    res.json({ message: 'Permission assigned successfully' });
  } catch (err) {
    console.error('Assign permission error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

/**
 * Remove permission from role
 * DELETE /api/roles/:roleId/permissions/:permissionId
 */
async function removePermission(req, res) {
  try {
    const { roleId, permissionId } = req.params;
    const clinic_id = req.clinic_id;

    // Verify role exists
    const role = await Role.getRoleById(roleId, clinic_id);
    if (!role) return res.status(404).json({ error: 'Role not found' });

    // Prevent modifying system roles
    if (role.is_system_role) {
      return res.status(403).json({ error: 'Cannot modify system role permissions' });
    }

    // Verify permission exists
    const permission = await Permission.getPermissionById(permissionId);
    if (!permission) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    // Remove permission
    await Role.removePermissionFromRole(roleId, permissionId);

    // Log audit
    await AuditService.logAction(
      req.user.id,
      'role_permission',
      'remove',
      roleId,
      { permission_id: permissionId, permission_code: permission.code },
      null,
      req.ip,
      clinic_id
    );

    res.json({ message: 'Permission removed successfully' });
  } catch (err) {
    console.error('Remove permission error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}

module.exports = {
  createRole,
  getRole,
  listRoles,
  listSystemRoles,
  updateRole,
  deleteRole,
  getRolePermissions,
  assignPermission,
  removePermission
};
