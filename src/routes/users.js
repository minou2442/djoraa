const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const { requirePermission, requireClinicAccess } = require('../middleware/rbacMiddleware');

// Middleware to verify token and clinic access
router.use(verifyToken);
router.use(requireClinicAccess);

/**
 * User Management Endpoints
 */

// Create new user (requires user_management_create_user permission)
router.post('/',
  requirePermission('user_management_create_user'),
  userController.createUser
);

// Get all users in clinic (requires user_management_read_user permission)
router.get('/',
  requirePermission('user_management_read_user'),
  userController.getUsers
);

// Get specific user with roles and permissions
router.get('/:id',
  requirePermission('user_management_read_user'),
  userController.getUserById
);

// Update user (requires user_management_update_user permission)
router.put('/:id',
  requirePermission('user_management_update_user'),
  userController.updateUser
);

// Delete/deactivate user (requires user_management_delete_user permission)
router.delete('/:id',
  requirePermission('user_management_delete_user'),
  userController.deleteUser
);

/**
 * User Role Management Endpoints
 */

// Get user roles
router.get('/:id/roles',
  requirePermission('user_management_read_user'),
  userController.getUserRoles
);

// Assign role to user (requires role_management permission)
router.post('/:id/roles',
  requirePermission('user_management_manage_roles'),
  userController.assignRole
);

// Remove role from user (requires role_management permission)
router.delete('/:id/roles/:roleId',
  requirePermission('user_management_manage_roles'),
  userController.removeRole
);

/**
 * User Permission Endpoints
 */

// Get user permissions
router.get('/:id/permissions',
  requirePermission('user_management_read_user'),
  userController.getUserPermissions
);

// Check if user has permission
router.post('/:id/check-permission',
  requirePermission('user_management_read_user'),
  userController.checkPermission
);

module.exports = router;
