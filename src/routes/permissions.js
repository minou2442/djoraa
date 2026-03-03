const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { verifyToken } = require('../middleware/auth');
const { requirePermission, requireClinicAccess } = require('../middleware/rbacMiddleware');

// Middleware to verify token and clinic access
router.use(verifyToken);
router.use(requireClinicAccess);

/**
 * Permission Management Endpoints
 */

// Create new permission (requires permission_management_create permission)
router.post('/',
  requirePermission('permission_management_create'),
  permissionController.createPermission
);

// List all permissions (publicly readable)
router.get('/',
  permissionController.listPermissions
);

// Get permission categories (publicly readable)
router.get('/categories/list',
  permissionController.getCategories
);

// Get specific permission by ID (publicly readable)
router.get('/:permissionId',
  permissionController.getPermission
);

// Get permission by code (publicly readable)
router.get('/code/:code',
  permissionController.getPermissionByCode
);

// Update permission (requires permission_management_update permission)
router.put('/:permissionId',
  requirePermission('permission_management_update'),
  permissionController.updatePermission
);

// Delete permission (requires permission_management_delete permission)
router.delete('/:permissionId',
  requirePermission('permission_management_delete'),
  permissionController.deletePermission
);

module.exports = router;
