// RBAC middleware: checks if user has required role or permission

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const { role } = req.user;
    if (allowedRoles.includes(role)) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden - insufficient role' });
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    const { permissions = [] } = req.user;
    if (permissions.includes(permission)) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden - missing permission' });
  };
}

module.exports = { requireRole, requirePermission };
