const db = require('../utils/db');

/**
 * Clinic Model - Multi-clinic support
 */

async function createClinic({ name, address, phone, email, active = true }) {
  const res = await db.query(
    `INSERT INTO clinics (name, address, phone, email, active, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
    [name, address || null, phone || null, email || null, active]
  );
  return res.rows[0];
}

async function getClinicById(id) {
  const res = await db.query('SELECT * FROM clinics WHERE id = $1', [id]);
  return res.rows[0];
}

async function getAllClinics() {
  const res = await db.query('SELECT * FROM clinics ORDER BY name');
  return res.rows;
}

async function getActiveClinics() {
  const res = await db.query('SELECT * FROM clinics WHERE active = true ORDER BY name');
  return res.rows;
}

async function updateClinic(id, { name, address, phone, email, active }) {
  const res = await db.query(
    `UPDATE clinics 
     SET name = COALESCE($1, name),
         address = COALESCE($2, address),
         phone = COALESCE($3, phone),
         email = COALESCE($4, email),
         active = COALESCE($5, active)
     WHERE id = $6 RETURNING *`,
    [name, address, phone, email, active, id]
  );
  return res.rows[0];
}

async function deleteClinic(id) {
  // Check if clinic has users
  const users = await db.query('SELECT COUNT(*) as count FROM users WHERE clinic_id = $1', [id]);
  if (parseInt(users.rows[0].count) > 0) {
    // Soft delete - just mark as inactive
    const res = await db.query(
      'UPDATE clinics SET active = false WHERE id = $1 RETURNING *',
      [id]
    );
    return { softDeleted: true, clinic: res.rows[0] };
  }
  
  // Hard delete if no users
  const res = await db.query('DELETE FROM clinics WHERE id = $1 RETURNING *', [id]);
  return { softDeleted: false, clinic: res.rows[0] };
}

async function getClinicStats(id) {
  const stats = {
    users: 0,
    roles: 0,
    permissions: 0,
    files: 0,
    backups: 0
  };
  
  try {
    const users = await db.query('SELECT COUNT(*) as count FROM users WHERE clinic_id = $1', [id]);
    stats.users = parseInt(users.rows[0].count);
    
    const roles = await db.query('SELECT COUNT(*) as count FROM roles WHERE clinic_id = $1', [id]);
    stats.roles = parseInt(roles.rows[0].count);
    
    const permissions = await db.query('SELECT COUNT(*) as count FROM permissions WHERE clinic_id = $1', [id]);
    stats.permissions = parseInt(permissions.rows[0].count);
    
    const files = await db.query('SELECT COUNT(*) as count FROM file_logs WHERE clinic_id = $1', [id]);
    stats.files = parseInt(files.rows[0].count);
  } catch (error) {
    console.error('Error getting clinic stats:', error);
  }
  
  return stats;
}

module.exports = {
  createClinic,
  getClinicById,
  getAllClinics,
  getActiveClinics,
  updateClinic,
  deleteClinic,
  getClinicStats
};
