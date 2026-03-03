const User = require('../models/user');
const AuditService = require('../services/auditService');

/**
 * Middleware to require a specific permission
 * @param {string|string[]} requiredPermissions - Permission code(s) needed
 * @param {boolean} requireAll - If true, user must have all permissions. If false, user needs at least one
 * @returns {Function} Express middleware
 */
function requirePermission(requiredPermissions, requireAll = true) {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return async (req, res, next) => {
    try {
      // User should be authenticated (set by auth middleware)
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
      }

      // Get user permissions
      const userPermissions = await User.getPermissions(req.user.id);

      // Check permission requirements
      let hasPermission = false;

      if (requireAll) {
        // User must have ALL required permissions
        hasPermission = permissions.every(perm => userPermissions.includes(perm));
      } else {
        // User must have AT LEAST ONE required permission
        hasPermission = permissions.some(perm => userPermissions.includes(perm));
      }

      if (!hasPermission) {
        // Log unauthorized access attempt
        await AuditService.logAccess(
          req.user.id,
          'access_denied',
          req.originalUrl,
          req.ip,
          permissions,
          req.user.clinic_id
        );

        return res.status(403).json({
          error: 'Forbidden. Insufficient permissions.',
          requiredPermissions: permissions,
          userPermissions
        });
      }

      // Permission granted, continue
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Internal server error during permission check' });
    }
  };
}

/**
 * Middleware to check if user has any role
 * @returns {Function} Express middleware
 */
function requireRole() {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const roles = await User.getRoles(req.user.id);

      if (roles.length === 0) {
        return res.status(403).json({ error: 'User has no assigned roles' });
      }

      // Attach roles to request for later use
      req.user.roles = roles;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Middleware to check user type
 * @param {string|string[]} userTypes - User type(s) allowed
 * @returns {Function} Express middleware
 */
function requireUserType(userTypes) {
  const types = Array.isArray(userTypes) ? userTypes : [userTypes];

  return (req, res, next) => {
    if (!req.user || !req.user.user_type) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!types.includes(req.user.user_type)) {
      return res.status(403).json({
        error: 'Forbidden. Invalid user type.',
        requiredUserTypes: types,
        userType: req.user.user_type
      });
    }

    next();
  };
}

/**
 * Middleware to ensure user belongs to clinic
 * @returns {Function} Express middleware
 */
function requireClinicAccess() {
  return (req, res, next) => {
    if (!req.user || !req.user.clinic_id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if clinic_id in request matches user's clinic
    const requestClinicId = parseInt(req.params.clinic_id || req.body.clinic_id, 10);

    if (requestClinicId && requestClinicId !== req.user.clinic_id) {
      return res.status(403).json({ error: 'Forbidden. Invalid clinic access.' });
    }

    // Set clinic_id on request for use in handlers
    req.clinic_id = req.user.clinic_id;
    next();
  };
}

module.exports = {
  requirePermission,
  requireRole,
  requireUserType,
  requireClinicAccess
};
