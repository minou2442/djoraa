// tenant middleware for multi-clinic isolation

// attach clinic id from JWT payload to request for convenience
function attachClinic(req, res, next) {
  if (req.user && req.user.clinic_id) {
    req.clinic_id = req.user.clinic_id;
  }
  next();
}

// ensure that user may only operate on their own clinic unless superadmin
function requireSameClinic(req, res, next) {
  const userClinic = req.user && req.user.clinic_id;
  const { clinic_id: bodyClinic } = req.body || {};
  const paramClinic = req.params && req.params.clinicId;

  // superadmin bypasses
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }

  // determine which clinic is being targeted
  const targetClinic = bodyClinic || paramClinic;
  if (targetClinic && parseInt(targetClinic, 10) !== parseInt(userClinic, 10)) {
    return res.status(403).json({ message: 'Access denied for this clinic' });
  }

  // if no target clinic is provided we allow (e.g. creating a resource implying current clinic)
  next();
}

module.exports = { attachClinic, requireSameClinic };
