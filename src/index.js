require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const fileRoutes = require('./routes/files');
const patientRoutes = require('./routes/patients');
const healthRoutes = require('./routes/health');
const clinicRoutes = require('./routes/clinics');
const auditRoutes = require('./routes/audit');
const radiologyRoutes = require('./routes/radiology');
const laboratoryRoutes = require('./routes/laboratory');
const appointmentRoutes = require('./routes/appointments');
const billingRoutes = require('./routes/billing');
const reportsRoutes = require('./routes/reports');
const waitingRoomRoutes = require('./routes/waitingRoom');
const medicationsRoutes = require('./routes/medications');
const inventoryRoutes = require('./routes/inventory');
const printingRoutes = require('./routes/printing');
const searchRoutes = require('./routes/search');
const dashboardRoutes = require('./routes/dashboard');
const { verifyToken } = require('./middleware/auth');
const { attachClinic } = require('./middleware/tenant');
const { securityHeaders, sanitizeInput, rateLimiter } = require('./middleware/security');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Security middleware
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(rateLimiter(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// public routes
app.use('/api/auth', authRoutes);

// health check (public)
app.use('/api/health', healthRoutes);

// middleware attaches clinic_id to requests after verifying token
app.use(verifyToken, attachClinic);
// clinic management (superadmin only)
app.use('/api/clinics', clinicRoutes);
// audit logging (superadmin/clinic_admin)
app.use('/api/audit', auditRoutes);
// user management (requires auth and tenant checks inside routes)
app.use('/api/users', userRoutes);
// role management
app.use('/api/roles', roleRoutes);
// permission management
app.use('/api/permissions', permissionRoutes);
// file management (upload, download, PDF, backups)
app.use('/api/files', fileRoutes);
// patient management (registry, medical history, documents)
app.use('/api/patients', patientRoutes);
// radiology & imaging management
app.use('/api/radiology', radiologyRoutes);
// laboratory management
app.use('/api/lab', laboratoryRoutes);
// appointment management
app.use('/api/appointments', appointmentRoutes);
// billing & finance
app.use('/api/billing', billingRoutes);
// reports & analytics
app.use('/api/reports', reportsRoutes);
// waiting room
app.use('/api/waiting-room', waitingRoomRoutes);
// medications
app.use('/api/medications', medicationsRoutes);
// inventory & pharmacy
app.use('/api/inventory', inventoryRoutes);
// printing
app.use('/api/printing', printingRoutes);
// global search
app.use('/api/search', searchRoutes);
// dashboard (role-based)
app.use('/api/dashboard', dashboardRoutes);

// protected test route
// Note: detailed health is now available at /api/health/detailed
app.get('/api/health/legacy', verifyToken, (req, res) => {
  res.json({ status: 'ok', user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DJORAA API listening on port ${PORT}`);
});
