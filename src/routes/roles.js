const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { verifyToken } = require('../middleware/auth');
const { requirePermission, requireClinicAccess } = require('../middleware/rbacMiddleware');

// Middleware to verify token and clinic access
router.use(verifyToken);
router.use(requireClinicAccess);

/**
 * Role Management Endpoints
 */

// Create new role (requires role_management_create_role permission)
router.post('/',
  requirePermission('role_management_create_role'),
  roleController.createRole
);

// Get all roles for clinic (requires role_management_read_role permission)
router.get('/',
  requirePermission('role_management_read_role'),
  roleController.listRoles
);

// Get system roles (shared across clinics)
router.get('/system/list',
  requirePermission('role_management_read_role'),
  roleController.listSystemRoles
);

// Get specific role (requires role_management_read_role permission)
router.get('/:roleId',
  requirePermission('role_management_read_role'),
  roleController.getRole
);

// Update role (requires role_management_update_role permission)
router.put('/:roleId',
  requirePermission('role_management_update_role'),
  roleController.updateRole
);

// Delete role (requires role_management_delete_role permission)
router.delete('/:roleId',
  requirePermission('role_management_delete_role'),
  roleController.deleteRole
);

/**
 * Role Permission Mapping Endpoints
 */

// Get role permissions (requires role_management_read_role permission)
router.get('/:roleId/permissions',
  requirePermission('role_management_read_role'),
  roleController.getRolePermissions
);

// Add permission to role (requires role_management_assign_permissions permission)
router.post('/:roleId/permissions',
  requirePermission('role_management_assign_permissions'),
  roleController.assignPermission
);

// Remove permission from role (requires role_management_assign_permissions permission)
router.delete('/:roleId/permissions/:permissionId',
  requirePermission('role_management_assign_permissions'),
  roleController.removePermission
);

module.exports = router;
