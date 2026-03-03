const db = require('../utils/db');

// Notification Template Model
const NotificationTemplateModel = {
  async findAll(clinicId) {
    const result = await db.query(
      `SELECT * FROM notification_templates WHERE clinic_id = $1 OR clinic_id IS NULL ORDER BY category, name`,
      [clinicId]
    );
    return result.rows;
  },

  async findById(id) {
    const result = await db.query(`SELECT * FROM notification_templates WHERE id = $1`, [id]);
    return result.rows[0];
  },

  async findByCode(code) {
    const result = await db.query(
      `SELECT * FROM notification_templates WHERE code = $1`,
      [code]
    );
    return result.rows[0];
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO notification_templates (clinic_id, code, name, category, subject, body, body_ar, channels, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [data.clinic_id, data.code, data.name, data.category, data.subject, data.body, data.body_ar, JSON.stringify(data.channels), true]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await db.query(
      `UPDATE notification_templates SET name = $1, subject = $2, body = $3, body_ar = $4, channels = $5, active = $6
       WHERE id = $7 RETURNING *`,
      [data.name, data.subject, data.body, data.body_ar, JSON.stringify(data.channels), data.active, id]
    );
    return result.rows[0];
  }
};

// Notification Model
const NotificationModel = {
  async findAll(clinicId, filters = {}) {
    let query = `
      SELECT n.*, 
             u.username as created_by_name,
             p.first_name || ' ' || p.last_name as patient_name
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      LEFT JOIN patients p ON n.patient_id = p.id
      WHERE n.clinic_id = $1
    `;
    const params = [clinicId];
    
    if (filters.user_id) {
      query += ` AND n.user_id = $${params.length + 1}`;
      params.push(filters.user_id);
    }
    if (filters.type) {
      query += ` AND n.type = $${params.length + 1}`;
      params.push(filters.type);
    }
    if (filters.is_read !== undefined) {
      query += ` AND n.is_read = $${params.length + 1}`;
      params.push(filters.is_read);
    }
    if (filters.channel) {
      query += ` AND $${params.length + 1} = ANY(n.channels)`;
      params.push(filters.channel);
    }
    
    query += ` ORDER BY n.created_at DESC LIMIT 100`;
    
    const result = await db.query(query, params);
    return result.rows;
  },

  async findUnread(clinicId, userId) {
    const result = await db.query(
      `SELECT * FROM notifications 
       WHERE clinic_id = $1 AND user_id = $2 AND is_read = false
       ORDER BY created_at DESC`,
      [clinicId, userId]
    );
    return result.rows;
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO notifications (clinic_id, user_id, patient_id, type, title, title_ar, message, message_ar, channels, priority, related_id, related_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [data.clinic_id, data.user_id, data.patient_id, data.type, data.title, data.title_ar, data.message, data.message_ar, data.channels, data.priority || 'normal', data.related_id, data.related_type]
    );
    return result.rows[0];
  },

  async markAsRead(id) {
    const result = await db.query(
      `UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  async markAllAsRead(clinicId, userId) {
    await db.query(
      `UPDATE notifications SET is_read = true, read_at = NOW() 
       WHERE clinic_id = $1 AND user_id = $2 AND is_read = false`,
      [clinicId, userId]
    );
  },

  async getStats(clinicId, userId) {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
        COUNT(CASE WHEN priority = 'urgent' AND is_read = false THEN 1 END) as urgent
       FROM notifications
       WHERE clinic_id = $1 AND user_id = $2`,
      [clinicId, userId]
    );
    return result.rows[0];
  }
};

// Alert Rules Model
const AlertRuleModel = {
  async findAll(clinicId) {
    const result = await db.query(
      `SELECT * FROM alert_rules WHERE clinic_id = $1 ORDER BY category, name`,
      [clinicId]
    );
    return result.rows;
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO alert_rules (clinic_id, name, category, condition_type, condition_value, notification_type, channels, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data.clinic_id, data.name, data.category, data.condition_type, data.condition_value, data.notification_type, JSON.stringify(data.channels), true]
    );
    return result.rows[0];
  },

  async toggle(id, active) {
    const result = await db.query(
      `UPDATE alert_rules SET active = $1 WHERE id = $2 RETURNING *`,
      [active, id]
    );
    return result.rows[0];
  }
};

// Scheduled Notification Model
const ScheduledNotificationModel = {
  async findAll(clinicId) {
    const result = await db.query(
      `SELECT * FROM scheduled_notifications WHERE clinic_id = $1 ORDER BY scheduled_at`,
      [clinicId]
    );
    return result.rows;
  },

  async findPending() {
    const result = await db.query(
      `SELECT * FROM scheduled_notifications 
       WHERE status = 'pending' AND scheduled_at <= NOW()
       ORDER BY scheduled_at`
    );
    return result.rows;
  },

  async create(data) {
    const result = await db.query(
      `INSERT INTO scheduled_notifications (clinic_id, user_id, patient_id, type, title, message, scheduled_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
      [data.clinic_id, data.user_id, data.patient_id, data.type, data.title, data.message, data.scheduled_at]
    );
    return result.rows[0];
  },

  async markSent(id) {
    await db.query(
      `UPDATE scheduled_notifications SET status = 'sent', sent_at = NOW() WHERE id = $1`,
      [id]
    );
  }
};

// Notification Service (Alert Generation Logic)
const NotificationService = {
  // Check and create notifications based on system events
  async checkAppointments(clinicId) {
    // Reminder: appointments in next 24 hours
    const result = await db.query(
      `SELECT a.*, p.first_name, p.last_name, p.phone, u.username as doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users u ON a.doctor_id = u.id
       WHERE a.clinic_id = $1 
         AND a.status = 'scheduled'
         AND a.appointment_date <= CURRENT_DATE + 1
         AND a.appointment_date >= CURRENT_DATE`,
      [clinicId]
    );
    
    for (const apt of result.rows) {
      // Check if reminder already sent today
      const existing = await db.query(
        `SELECT COUNT(*) FROM notifications 
         WHERE clinic_id = $1 AND related_id = $2 AND type = 'appointment_reminder' 
         AND created_at >= CURRENT_DATE`,
        [clinicId, apt.id]
      );
      
      if (parseInt(existing.rows[0].count) === 0) {
        await NotificationModel.create({
          clinic_id: clinicId,
          user_id: apt.patient_id,
          patient_id: apt.patient_id,
          type: 'appointment_reminder',
          title: 'Rappel de rendez-vous',
          title_ar: 'تذكير بالموعد',
          message: `Votre rendez-vous avec Dr. ${apt.doctor_name} est prévu demain à ${apt.appointment_time}`,
          message_ar: `موعدك مع د. ${apt.doctor_name} غدًا في ${apt.appointment_time}`,
          channels: ['in_app', 'sms'],
          priority: 'normal'
        });
      }
    }
  },

  async checkLabResults(clinicId) {
    // Notify when lab results are ready
    const result = await db.query(
      `SELECT lr.*, p.first_name, p.last_name
       FROM lab_requests lr
       JOIN patients p ON lr.patient_id = p.id
       WHERE lr.clinic_id = $1 AND lr.status = 'completed'
         AND lr.updated_at >= NOW() - INTERVAL '1 hour'`,
      [clinicId]
    );
    
    for (const lab of result.rows) {
      const existing = await db.query(
        `SELECT COUNT(*) FROM notifications 
         WHERE clinic_id = $1 AND related_id = $2 AND type = 'lab_result_ready'`,
        [clinicId, lab.id]
      );
      
      if (parseInt(existing.rows[0].count) === 0) {
        await NotificationModel.create({
          clinic_id: clinicId,
          patient_id: lab.patient_id,
          type: 'lab_result_ready',
          title: 'Résultats de laboratoire prêts',
          title_ar: 'نتائج المختبر جاهزة',
          message: `Vos résultats de laboratoire (N° ${lab.lab_number}) sont prêts.`,
          message_ar: `نتائج مختبرك (رقم ${lab.lab_number}) جاهزة.`,
          channels: ['in_app', 'sms'],
          priority: 'normal'
        });
      }
    }
  },

  async checkRadiologyReports(clinicId) {
    // Notify when radiology reports are ready
    const result = await db.query(
      `SELECT re.*, p.first_name, p.last_name
       FROM radiology_exams re
       JOIN patients p ON re.patient_id = p.id
       WHERE re.clinic_id = $1 AND re.status = 'completed'
         AND re.updated_at >= NOW() - INTERVAL '1 hour'`,
      [clinicId]
    );
    
    for (const exam of result.rows) {
      const existing = await db.query(
        `SELECT COUNT(*) FROM notifications 
         WHERE clinic_id = $1 AND related_id = $2 AND type = 'radiology_ready'`,
        [clinicId, exam.id]
      );
      
      if (parseInt(existing.rows[0].count) === 0) {
        await NotificationModel.create({
          clinic_id: clinicId,
          patient_id: exam.patient_id,
          type: 'radiology_ready',
          title: 'Rapport d\'imagerie prêt',
          title_ar: 'تقرير الأشعة جاهز',
          message: `Votre rapport d'imagerie ${exam.exam_type} est prêt.`,
          message_ar: `تقرير الأشعة ${exam.exam_type} جاهز.`,
          channels: ['in_app', 'sms'],
          priority: 'normal'
        });
      }
    }
  },

  async checkInsuranceClaims(clinicId) {
    // Notify on claim rejection
    const result = await db.query(
      `SELECT ic.*, p.first_name, p.last_name
       FROM insurance_claims ic
       JOIN patients p ON ic.patient_id = p.id
       WHERE ic.clinic_id = $1 AND ic.status = 'rejected'
         AND ic.updated_at >= NOW() - INTERVAL '24 hours'`,
      [clinicId]
    );
    
    for (const claim of result.rows) {
      const existing = await db.query(
        `SELECT COUNT(*) FROM notifications 
         WHERE clinic_id = $1 AND related_id = $2 AND type = 'claim_rejected'`,
        [clinicId, claim.id]
      );
      
      if (parseInt(existing.rows[0].count) === 0) {
        await NotificationModel.create({
          clinic_id: clinicId,
          patient_id: claim.patient_id,
          type: 'claim_rejected',
          title: 'Réclamation d\'assurance refusée',
          title_ar: 'رفض طلب التأمين',
          message: `Votre réclamation d'assurance a été refusée. Motif: ${claim.notes || 'Non spécifié'}`,
          message_ar: `تم رفض طلب التأمين الخاص بك. السبب: ${claim.notes || 'غير محدد'}`,
          channels: ['in_app', 'sms'],
          priority: 'urgent'
        });
      }
    }
  },

  async checkOverduePayments(clinicId) {
    // Notify on overdue installments
    const result = await db.query(
      `SELECT i.*, p.first_name, p.last_name
       FROM invoices i
       JOIN patients p ON i.patient_id = p.id
       WHERE i.clinic_id = $1 AND i.status IN ('unpaid', 'partial')
         AND i.invoice_date < CURRENT_DATE - 30`,
      [clinicId]
    );
    
    for (const invoice of result.rows) {
      const existing = await db.query(
        `SELECT COUNT(*) FROM notifications 
         WHERE clinic_id = $1 AND related_id = $2 AND type = 'payment_overdue'`,
        [clinicId, invoice.id]
      );
      
      if (parseInt(existing.rows[0].count) === 0) {
        await NotificationModel.create({
          clinic_id: clinicId,
          patient_id: invoice.patient_id,
          type: 'payment_overdue',
          title: 'Paiement en retard',
          title_ar: 'دفع متأخر',
          message: `Votre paiement de ${invoice.total - invoice.paid_amount} DZD est en retard.`,
          message_ar: `دفع ${invoice.total - invoice.paid_amount} DZD متأخر.`,
          channels: ['in_app'],
          priority: 'high'
        });
      }
    }
  },

  async runAllChecks(clinicId) {
    await this.checkAppointments(clinicId);
    await this.checkLabResults(clinicId);
    await this.checkRadiologyReports(clinicId);
    await this.checkInsuranceClaims(clinicId);
    await this.checkOverduePayments(clinicId);
  }
};

module.exports = {
  NotificationTemplateModel,
  NotificationModel,
  AlertRuleModel,
  ScheduledNotificationModel,
  NotificationService
};
