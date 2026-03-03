const {
  QueueEntryModel,
  RoomModel,
  SessionStatsModel
} = require('../models/waitingRoom');
const { logAction } = require('../utils/auditService');
const db = require('../utils/db');

// Queue Management (Reception)
const getActiveQueue = async (req, res) => {
  try {
    const queue = await QueueEntryModel.findActive(req.clinicId, req.query);
    res.json(queue);
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
};

const addToQueue = async (req, res) => {
  try {
    const entry = await QueueEntryModel.create({
      ...req.body,
      clinic_id: req.clinicId,
      added_by: req.userId
    });
    await logAction(req, 'CREATE', 'queue_entry', entry.id, entry);
    
    // Emit socket event for real-time update
    if (global.io) {
      global.io.to(`clinic_${req.clinicId}`).emit('queue_updated', { action: 'add', entry });
    }
    
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error adding to queue:', error);
    res.status(500).json({ error: 'Failed to add to queue' });
  }
};

const updateQueueStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const entry = await QueueEntryModel.updateStatus(req.params.id, status, { notes });
    await logAction(req, 'UPDATE', 'queue_entry', entry.id, { status });
    
    if (global.io) {
      global.io.to(`clinic_${req.clinicId}`).emit('queue_updated', { action: 'status_change', entry });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error updating queue status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

const reorderQueue = async (req, res) => {
  try {
    const { priority } = req.body;
    const entry = await QueueEntryModel.reorder(req.params.id, req.body.position, priority);
    await logAction(req, 'UPDATE', 'queue_entry', entry.id, { priority, action: 'reorder' });
    
    if (global.io) {
      global.io.to(`clinic_${req.clinicId}`).emit('queue_updated', { action: 'reorder' });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error reordering queue:', error);
    res.status(500).json({ error: 'Failed to reorder queue' });
  }
};

const removeFromQueue = async (req, res) => {
  try {
    const { reason } = req.body;
    const entry = await QueueEntryModel.updateStatus(req.params.id, 'cancelled', { notes: reason });
    await logAction(req, 'UPDATE', 'queue_entry', entry.id, { status: 'cancelled', reason });
    
    if (global.io) {
      global.io.to(`clinic_${req.clinicId}`).emit('queue_updated', { action: 'remove', entry });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error removing from queue:', error);
    res.status(500).json({ error: 'Failed to remove from queue' });
  }
};

const markAbsent = async (req, res) => {
  try {
    const entry = await QueueEntryModel.updateStatus(req.params.id, 'absent');
    await logAction(req, 'UPDATE', 'queue_entry', entry.id, { status: 'absent' });
    
    if (global.io) {
      global.io.to(`clinic_${req.clinicId}`).emit('queue_updated', { action: 'absent', entry });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error marking absent:', error);
    res.status(500).json({ error: 'Failed to mark absent' });
  }
};

const getQueueHistory = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const history = await QueueEntryModel.getHistory(req.clinicId, date_from, date_to);
    res.json(history);
  } catch (error) {
    console.error('Error fetching queue history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

const getQueueStats = async (req, res) => {
  try {
    const { date } = req.query;
    const stats = await QueueEntryModel.getStats(req.clinicId, date || new Date().toISOString().split('T')[0]);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// Doctor Panel
const getDoctorQueue = async (req, res) => {
  try {
    const queue = await QueueEntryModel.findActive(req.clinicId, { doctor_id: req.userId });
    res.json(queue);
  } catch (error) {
    console.error('Error fetching doctor queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
};

const getNextPatient = async (req, res) => {
  try {
    const next = await QueueEntryModel.getNextInQueue(req.clinicId, req.userId);
    res.json(next);
  } catch (error) {
    console.error('Error fetching next patient:', error);
    res.status(500).json({ error: 'Failed to fetch next patient' });
  }
};

const startConsultation = async (req, res) => {
  try {
    const entry = await QueueEntryModel.updateStatus(req.params.id, 'in_progress');
    await logAction(req, 'UPDATE', 'queue_entry', entry.id, { status: 'in_progress', action: 'start_consultation' });
    
    // Update room status
    if (entry.room_id) {
      await RoomModel.updateStatus(entry.room_id, 'occupied');
    }
    
    if (global.io) {
      global.io.to(`clinic_${req.clinicId}`).emit('consultation_started', { entry });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error starting consultation:', error);
    res.status(500).json({ error: 'Failed to start consultation' });
  }
};

const endConsultation = async (req, res) => {
  try {
    const { notes } = req.body;
    const entry = await QueueEntryModel.updateStatus(req.params.id, 'completed', { notes });
    await logAction(req, 'UPDATE', 'queue_entry', entry.id, { status: 'completed', action: 'end_consultation' });
    
    // Update room status
    if (entry.room_id) {
      await RoomModel.updateStatus(entry.room_id, 'available');
    }
    
    if (global.io) {
      global.io.to(`clinic_${req.clinicId}`).emit('consultation_ended', { entry });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error ending consultation:', error);
    res.status(500).json({ error: 'Failed to end consultation' });
  }
};

const skipPatient = async (req, res) => {
  try {
    const { reason } = req.body;
    const entry = await QueueEntryModel.updateStatus(req.params.id, 'skipped', { notes: reason });
    await logAction(req, 'UPDATE', 'queue_entry', entry.id, { status: 'skipped', reason });
    
    if (global.io) {
      global.io.to(`clinic_${req.clinicId}`).emit('patient_skipped', { entry });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error skipping patient:', error);
    res.status(500).json({ error: 'Failed to skip patient' });
  }
};

const recallPatient = async (req, res) => {
  try {
    const entry = await QueueEntryModel.updateStatus(req.params.id, 'in_progress');
    
    if (global.io) {
      global.io.to(`clinic_${req.clinicId}`).emit('patient_recalled', { entry });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error recalling patient:', error);
    res.status(500).json({ error: 'Failed to recall patient' });
  }
};

// Room Management
const getRooms = async (req, res) => {
  try {
    const rooms = await RoomModel.findAll(req.clinicId);
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

const createRoom = async (req, res) => {
  try {
    const room = await RoomModel.create({
      ...req.body,
      clinic_id: req.clinicId
    });
    await logAction(req, 'CREATE', 'room', room.id, room);
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

const updateRoomStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const room = await RoomModel.updateStatus(req.params.id, status);
    res.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
};

// Statistics
const getDoctorStats = async (req, res) => {
  try {
    const { date_from, date_to, doctor_id } = req.query;
    const stats = await SessionStatsModel.getDoctorStats(req.clinicId, doctor_id || req.userId, date_from, date_to);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

const getWaitingTimeStats = async (req, res) => {
  try {
    const { date } = req.query;
    const stats = await SessionStatsModel.getWaitingTimeStats(req.clinicId, date || new Date().toISOString().split('T')[0]);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching wait time stats:', error);
    res.status(500).json({ error: 'Failed to fetch wait time stats' });
  }
};

const getPeakHours = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const stats = await SessionStatsModel.getPeakHours(req.clinicId, date_from, date_to);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching peak hours:', error);
    res.status(500).json({ error: 'Failed to fetch peak hours' });
  }
};

// Display Screen
const getDisplayData = async (req, res) => {
  try {
    const { room_id } = req.query;
    const queue = await QueueEntryModel.findActive(req.clinicId, { room_id, service_type: 'consultation' });
    const stats = await QueueEntryModel.getStats(req.clinicId, new Date().toISOString().split('T')[0]);
    
    res.json({
      current_queue: queue.slice(0, 5),
      stats,
      clinic_name: req.clinicName,
      updated_at: new Date()
    });
  } catch (error) {
    console.error('Error fetching display data:', error);
    res.status(500).json({ error: 'Failed to fetch display data' });
  }
};

// Check pending payment before calling
const checkPaymentStatus = async (req, res) => {
  try {
    const { patient_id } = req.params;
    
    const result = await db.query(
      `SELECT COUNT(*) as pending_invoices, COALESCE(SUM(total - paid_amount), 0) as outstanding
       FROM invoices 
       WHERE patient_id = $1 AND status IN ('unpaid', 'partial')`,
      [patient_id]
    );
    
    const hasPending = parseInt(result.rows[0].pending_invoices) > 0;
    const outstanding = parseFloat(result.rows[0].outstanding);
    
    res.json({
      has_pending_payment: hasPending,
      outstanding_amount: outstanding,
      alert: hasPending && outstanding > 0
    });
  } catch (error) {
    console.error('Error checking payment:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
};

const db = require('../utils/db');

module.exports = {
  // Reception
  getActiveQueue,
  addToQueue,
  updateQueueStatus,
  reorderQueue,
  removeFromQueue,
  markAbsent,
  getQueueHistory,
  getQueueStats,
  // Doctor
  getDoctorQueue,
  getNextPatient,
  startConsultation,
  endConsultation,
  skipPatient,
  recallPatient,
  // Rooms
  getRooms,
  createRoom,
  updateRoomStatus,
  // Statistics
  getDoctorStats,
  getWaitingTimeStats,
  getPeakHours,
  // Display
  getDisplayData,
  // Payment Check
  checkPaymentStatus
};
