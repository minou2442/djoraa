const DashboardModel = require('../models/dashboard');
const { logAction } = require('../utils/auditService');

// Get dashboard based on user role
const getDashboard = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { clinicId } = req;

    let dashboardData;

    switch (role) {
      case 'admin':
      case 'clinic_admin':
        dashboardData = await DashboardModel.getAdminDashboard(clinicId);
        break;
      case 'doctor':
        dashboardData = await DashboardModel.getDoctorDashboard(clinicId, userId);
        break;
      case 'receptionist':
        dashboardData = await DashboardModel.getReceptionDashboard(clinicId);
        break;
      case 'lab_technician':
        dashboardData = await DashboardModel.getLabDashboard(clinicId);
        break;
      case 'radiologist':
        dashboardData = await DashboardModel.getRadiologyDashboard(clinicId);
        break;
      case 'accountant':
        dashboardData = await DashboardModel.getAccountantDashboard(clinicId);
        break;
      default:
        dashboardData = await DashboardModel.getAdminDashboard(clinicId);
    }

    // Get quick actions for role
    const quickActions = DashboardModel.getQuickActions(role);

    // Get pinned shortcuts
    const pinnedShortcuts = await DashboardModel.getPinnedShortcuts(userId);

    res.json({
      role,
      quick_actions: quickActions,
      pinned_shortcuts: pinnedShortcuts,
      ...dashboardData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

// Get admin-specific dashboard
const getAdminDashboard = async (req, res) => {
  try {
    const dashboard = await DashboardModel.getAdminDashboard(req.clinicId);
    const quickActions = DashboardModel.getQuickActions('admin');
    
    res.json({
      quick_actions: quickActions,
      ...dashboard
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load admin dashboard' });
  }
};

// Get doctor-specific dashboard
const getDoctorDashboard = async (req, res) => {
  try {
    const dashboard = await DashboardModel.getDoctorDashboard(req.clinicId, req.userId);
    const quickActions = DashboardModel.getQuickActions('doctor');
    
    res.json({
      quick_actions: quickActions,
      ...dashboard
    });
  } catch (error) {
    console.error('Doctor dashboard error:', error);
    res.status(500).json({ error: 'Failed to load doctor dashboard' });
  }
};

// Get reception dashboard
const getReceptionDashboard = async (req, res) => {
  try {
    const dashboard = await DashboardModel.getReceptionDashboard(req.clinicId);
    const quickActions = DashboardModel.getQuickActions('receptionist');
    
    res.json({
      quick_actions: quickActions,
      ...dashboard
    });
  } catch (error) {
    console.error('Reception dashboard error:', error);
    res.status(500).json({ error: 'Failed to load reception dashboard' });
  }
};

// Get lab dashboard
const getLabDashboard = async (req, res) => {
  try {
    const dashboard = await DashboardModel.getLabDashboard(req.clinicId);
    const quickActions = DashboardModel.getQuickActions('lab_technician');
    
    res.json({
      quick_actions: quickActions,
      ...dashboard
    });
  } catch (error) {
    console.error('Lab dashboard error:', error);
    res.status(500).json({ error: 'Failed to load lab dashboard' });
  }
};

// Get radiology dashboard
const getRadiologyDashboard = async (req, res) => {
  try {
    const dashboard = await DashboardModel.getRadiologyDashboard(req.clinicId);
    const quickActions = DashboardModel.getQuickActions('radiologist');
    
    res.json({
      quick_actions: quickActions,
      ...dashboard
    });
  } catch (error) {
    console.error('Radiology dashboard error:', error);
    res.status(500).json({ error: 'Failed to load radiology dashboard' });
  }
};

// Get accountant dashboard
const getAccountantDashboard = async (req, res) => {
  try {
    const dashboard = await DashboardModel.getAccountantDashboard(req.clinicId);
    const quickActions = DashboardModel.getQuickActions('accountant');
    
    res.json({
      quick_actions: quickActions,
      ...dashboard
    });
  } catch (error) {
    console.error('Accountant dashboard error:', error);
    res.status(500).json({ error: 'Failed to load accountant dashboard' });
  }
};

// Save pinned shortcuts
const savePinnedShortcuts = async (req, res) => {
  try {
    const { pinnedItems } = req.body;
    
    await DashboardModel.savePinnedShortcuts(req.userId, pinnedItems);
    
    await logAction(req, 'UPDATE', 'user_preferences', req.userId, { action: 'update_pinned_shortcuts' });
    
    res.json({ success: true, pinned_items: pinnedItems });
  } catch (error) {
    console.error('Save pinned shortcuts error:', error);
    res.status(500).json({ error: 'Failed to save pinned shortcuts' });
  }
};

// Get quick actions
const getQuickActions = async (req, res) => {
  try {
    const actions = DashboardModel.getQuickActions(req.user.role);
    res.json(actions);
  } catch (error) {
    console.error('Quick actions error:', error);
    res.status(500).json({ error: 'Failed to load quick actions' });
  }
};

// Get real-time updates (for polling)
const getRealtimeUpdates = async (req, res) => {
  try {
    const { type } = req.query;
    const { clinicId, userId, role } = req;
    
    let updates = {};
    
    switch (type || 'all') {
      case 'queue':
        if (['admin', 'doctor', 'receptionist'].includes(role)) {
          const queue = await DashboardModel.getDoctorDashboard(clinicId, userId);
          updates.queue = queue.waiting_queue;
        }
        break;
      case 'appointments':
        const appointments = await DashboardModel.getReceptionDashboard(clinicId);
        updates.appointments = appointments.today_appointments;
        break;
      case 'billing':
        const billing = await DashboardModel.getAccountantDashboard(clinicId);
        updates.billing = {
          today_revenue: billing.today_revenue,
          pending_payments: billing.outstanding
        };
        break;
      default:
        // Get all updates
        if (role === 'doctor') {
          const doctorData = await DashboardModel.getDoctorDashboard(clinicId, userId);
          updates.queue = doctorData.waiting_queue;
          updates.current_session = doctorData.current_session;
        } else if (role === 'receptionist') {
          const receptionData = await DashboardModel.getReceptionDashboard(clinicId);
          updates.queue = receptionData.waiting_queue;
          updates.appointments = receptionData.today_appointments;
        }
    }
    
    res.json(updates);
  } catch (error) {
    console.error('Realtime updates error:', error);
    res.status(500).json({ error: 'Failed to get updates' });
  }
};

module.exports = {
  getDashboard,
  getAdminDashboard,
  getDoctorDashboard,
  getReceptionDashboard,
  getLabDashboard,
  getRadiologyDashboard,
  getAccountantDashboard,
  savePinnedShortcuts,
  getQuickActions,
  getRealtimeUpdates
};
