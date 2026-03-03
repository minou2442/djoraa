const User = require('../models/user');
const Role = require('../models/role');
const AuditService = require('../services/auditService');

/**
 * Create a new user
 * POST /api/users
 */
async function createUser(req, res) {
  try {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      user_type,
      phone,
      specialization,
      license_number,
      role_ids = []
    } = req.body;

    // Validate required fields
    if (!username || !email || !password || !first_name || !last_name || !user_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create user
    const newUser = await User.createUser({
      clinic_id: req.clinic_id,
      username,
      email,
      password,
      first_name,
      last_name,
      user_type,
      phone,
      specialization,
      license_number
    });

    // Assign roles
    for (const roleId of role_ids) {
      await User.assignRole(newUser.id, roleId);
    }

    // Log audit
    await AuditService.logUserAction(
      req.user.id,
      'create_user',
      newUser.id,
      null,
      { ...newUser, role_ids },
      req.ip,
      req.clinic_id
    );

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get all users in clinic
 * GET /api/users
 */
async function getUsers(req, res) {
  try {
    const {
      limit = 50,
      offset = 0,
      user_type = null,
      is_active = true
    } = req.query;

    const users = await User.getUsersByClinic(req.clinic_id, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      user_type,
      is_active: is_active === 'false' ? false : true
    });

    res.json({
      total: users.length,
      limit,
      offset,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get specific user with roles and permissions
 * GET /api/users/:id
 */
async function getUserById(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);

    const user = await User.getById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify clinic access
    if (user.clinic_id !== req.clinic_id) {
      return res.status(403).json({ error: 'Forbidden. Cannot access this user.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Update user
 * PUT /api/users/:id
 */
async function updateUser(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const {
      first_name,
      last_name,
      email,
      phone,
      specialization,
      is_active
    } = req.body;

    // Get current user for audit
    const oldUser = await User.getById(userId);
    if (!oldUser || oldUser.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user
    const updatedUser = await User.updateUser(userId, {
      first_name,
      last_name,
      email,
      phone,
      specialization,
      is_active
    });

    // Log audit
    await AuditService.logUserAction(
      req.user.id,
      'update_user',
      userId,
      oldUser,
      updatedUser,
      req.ip,
      req.clinic_id
    );

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Deactivate/delete user
 * DELETE /api/users/:id
 */
async function deleteUser(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);

    // Verify user exists and belongs to clinic
    const user = await User.getById(userId);
    if (!user || user.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cannot delete yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own user account' });
    }

    // Delete user
    await User.deleteUser(userId);

    // Log audit
    await AuditService.logUserAction(
      req.user.id,
      'delete_user',
      userId,
      user,
      null,
      req.ip,
      req.clinic_id
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get user roles
 * GET /api/users/:id/roles
 */
async function getUserRoles(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);

    // Verify user exists
    const user = await User.getById(userId);
    if (!user || user.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'User not found' });
    }

    const roles = await User.getRoles(userId);

    res.json({ roles });
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Assign role to user
 * POST /api/users/:id/roles
 */
async function assignRole(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role_id } = req.body;

    if (!role_id) {
      return res.status(400).json({ error: 'role_id required' });
    }

    // Verify user exists
    const user = await User.getById(userId);
    if (!user || user.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify role exists
    const role = await Role.getRoleById(role_id, req.clinic_id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Assign role
    await User.assignRole(userId, role_id);

    // Log audit
    await AuditService.logUserAction(
      req.user.id,
      'assign_role',
      userId,
      null,
      { role_id, role_code: role.code },
      req.ip,
      req.clinic_id
    );

    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Remove role from user
 * DELETE /api/users/:id/roles/:roleId
 */
async function removeRole(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const roleId = parseInt(req.params.roleId, 10);

    // Verify user exists
    const user = await User.getById(userId);
    if (!user || user.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify role exists
    const role = await Role.getRoleById(roleId, req.clinic_id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Remove role
    await User.removeRole(userId, roleId);

    // Log audit
    await AuditService.logUserAction(
      req.user.id,
      'remove_role',
      userId,
      { role_id: roleId, role_code: role.code },
      null,
      req.ip,
      req.clinic_id
    );

    res.json({ message: 'Role removed successfully' });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get user permissions
 * GET /api/users/:id/permissions
 */
async function getUserPermissions(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);

    // Verify user exists
    const user = await User.getById(userId);
    if (!user || user.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'User not found' });
    }

    const permissions = await User.getPermissions(userId);

    res.json({ permissions });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Check if user has permission
 * POST /api/users/:id/check-permission
 */
async function checkPermission(req, res) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { permission } = req.body;

    if (!permission) {
      return res.status(400).json({ error: 'permission required' });
    }

    // Verify user exists
    const user = await User.getById(userId);
    if (!user || user.clinic_id !== req.clinic_id) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hasPermission = await User.hasPermission(userId, permission);

    res.json({ hasPermission, permission });
  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserRoles,
  assignRole,
  removeRole,
  getUserPermissions,
  checkPermission
};
