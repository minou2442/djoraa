import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface Patient {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface Doctor {
  id: number;
  username: string;
  role: string;
}

interface Appointment {
  id: number;
  patient_id: string;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  duration_minutes: number;
  reason: string;
  status: string;
  notes: string;
}

interface DoctorSchedule {
  id: number;
  doctor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

interface WaitingListEntry {
  id: number;
  patient_name: string;
  doctor_name: string;
  preferred_date: string;
  reason: string;
  priority: number;
  status: string;
}

const AppointmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<'calendar' | 'list' | 'waiting'>('calendar');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: '',
    duration_minutes: 30,
    reason: '',
    notes: ''
  });

  const appointmentTypes = [
    { value: 'consultation', label: t('appointments.types.consultation') },
    { value: 'followup', label: t('appointments.types.followup') },
    { value: 'radiology', label: t('appointments.types.radiology') },
    { value: 'laboratory', label: t('appointments.types.laboratory') },
    { value: 'procedure', label: t('appointments.types.procedure') },
    { value: 'emergency', label: t('appointments.types.emergency') }
  ];

  const statusColors: { [key: string]: string } = {
    scheduled: '#3498db',
    confirmed: '#27ae60',
    in_progress: '#f39c12',
    completed: '#16a085',
    cancelled: '#e74c3c',
    no_show: '#95a5a6'
  };

  useEffect(() => {
    loadDoctors();
    loadAppointments();
  }, [selectedDate, selectedDoctor]);

  const loadDoctors = async () => {
    try {
      const response = await api.get('/users/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const params = new URLSearchParams();
      params.append('date', selectedDate);
      if (selectedDoctor) {
        params.append('doctor_id', selectedDoctor.toString());
      }
      const response = await api.get(`/appointments?${params.toString()}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await api.get('/users/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadWaitingList = async () => {
    try {
      const response = await api.get('/appointments/waiting-list');
      setWaitingList(response.data);
    } catch (error) {
      console.error('Error loading waiting list:', error);
    }
  };

  const getAvailableSlots = async (doctorId: number, date: string) => {
    try {
      const response = await api.get(`/appointments/available-slots`, {
        params: { doctor_id: doctorId, date }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAppointment) {
        await api.put(`/appointments/${editingAppointment.id}`, formData);
      } else {
        await api.post('/appointments', formData);
      }
      setShowModal(false);
      setEditingAppointment(null);
      setFormData({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        appointment_type: '',
        duration_minutes: 30,
        reason: '',
        notes: ''
      });
      loadAppointments();
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id.toString(),
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      appointment_type: appointment.appointment_type,
      duration_minutes: appointment.duration_minutes,
      reason: appointment.reason,
      notes: appointment.notes
    });
    setShowModal(true);
  };

  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status: newStatus });
      loadAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (appointmentId: number) => {
    if (window.confirm(t('common.confirmDelete'))) {
      try {
        await api.delete(`/appointments/${appointmentId}`);
        loadAppointments();
      } catch (error) {
        console.error('Error deleting appointment:', error);
      }
    }
  };

  const navigateDate = (direction: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const getWeekDates = () => {
    const dates: string[] = [];
    const current = new Date(selectedDate);
    const day = current.getDay();
    const diff = current.getDate() - day;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(current);
      date.setDate(diff + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const getAppointmentsForDate = (date: string) => {
    return appointments.filter(apt => apt.appointment_date === date);
  };

  const renderCalendarView = () => {
    const weekDates = getWeekDates();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="appointments-calendar">
        <div className="calendar-header">
          <button onClick={() => navigateDate(-7)} className="btn-nav">←</button>
          <h3>{t('appointments.weekOf')} {new Date(weekDates[0]).toLocaleDateString()}</h3>
          <button onClick={() => navigateDate(7)} className="btn-nav">→</button>
        </div>
        
        <div className="calendar-grid">
          {weekDates.map((date, index) => {
            const dayAppointments = getAppointmentsForDate(date);
            const isToday = date === new Date().toISOString().split('T')[0];
            
            return (
              <div 
                key={date} 
                className={`calendar-day ${isToday ? 'today' : ''}`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="day-header">
                  <span className="day-name">{days[index]}</span>
                  <span className="day-number">{new Date(date).getDate()}</span>
                </div>
                <div className="day-appointments">
                  {dayAppointments.map(apt => (
                    <div 
                      key={apt.id} 
                      className="appointment-card"
                      style={{ borderLeftColor: statusColors[apt.status] }}
                      onClick={(e) => { e.stopPropagation(); handleEdit(apt); }}
                    >
                      <div className="appointment-time">
                        {new Date(`2000-01-01T${apt.appointment_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="appointment-patient">{apt.patient_name}</div>
                      <div className="appointment-type">{apt.appointment_type}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="appointments-list">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('appointments.time')}</th>
              <th>{t('appointments.patient')}</th>
              <th>{t('appointments.doctor')}</th>
              <th>{t('appointments.type')}</th>
              <th>{t('appointments.reason')}</th>
              <th>{t('appointments.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {appointments
              .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
              .map(apt => (
              <tr key={apt.id}>
                <td>
                  {new Date(`2000-01-01T${apt.appointment_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td>{apt.patient_name}</td>
                <td>{apt.doctor_name}</td>
                <td>{apt.appointment_type}</td>
                <td>{apt.reason}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: statusColors[apt.status] }}
                  >
                    {t(`appointments.statuses.${apt.status}`)}
                  </span>
                </td>
                <td>
                  <select
                    value={apt.status}
                    onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="scheduled">{t('appointments.statuses.scheduled')}</option>
                    <option value="confirmed">{t('appointments.statuses.confirmed')}</option>
                    <option value="in_progress">{t('appointments.statuses.in_progress')}</option>
                    <option value="completed">{t('appointments.statuses.completed')}</option>
                    <option value="cancelled">{t('appointments.statuses.cancelled')}</option>
                    <option value="no_show">{t('appointments.statuses.no_show')}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderWaitingList = () => {
    useEffect(() => {
      loadWaitingList();
    }, []);

    return (
      <div className="waiting-list">
        <h3>{t('appointments.waitingList')}</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('appointments.priority')}</th>
              <th>{t('appointments.patient')}</th>
              <th>{t('appointments.doctor')}</th>
              <th>{t('appointments.preferredDate')}</th>
              <th>{t('appointments.reason')}</th>
              <th>{t('appointments.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {waitingList.map(entry => (
              <tr key={entry.id}>
                <td>{entry.priority}</td>
                <td>{entry.patient_name}</td>
                <td>{entry.doctor_name}</td>
                <td>{entry.preferred_date}</td>
                <td>{entry.reason}</td>
                <td>{entry.status}</td>
                <td>
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        patient_id: entry.patient_name,
                        doctor_id: entry.doctor_name,
                        appointment_date: entry.preferred_date
                      });
                      setShowModal(true);
                    }}
                  >
                    {t('appointments.schedule')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="page-container appointments-page">
      <div className="page-header">
        <h1>{t('nav.appointments')}</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button 
              className={view === 'calendar' ? 'active' : ''} 
              onClick={() => setView('calendar')}
            >
              {t('appointments.calendarView')}
            </button>
            <button 
              className={view === 'list' ? 'active' : ''} 
              onClick={() => setView('list')}
            >
              {t('appointments.listView')}
            </button>
            <button 
              className={view === 'waiting' ? 'active' : ''} 
              onClick={() => setView('waiting')}
            >
              {t('appointments.waitingList')}
            </button>
          </div>
          <select
            value={selectedDoctor || ''}
            onChange={(e) => setSelectedDoctor(e.target.value ? Number(e.target.value) : null)}
            className="doctor-filter"
          >
            <option value="">{t('appointments.allDoctors')}</option>
            {doctors.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.username}</option>
            ))}
          </select>
          <button 
            className="btn-primary"
            onClick={() => {
              setEditingAppointment(null);
              setFormData({
                patient_id: '',
                doctor_id: '',
                appointment_date: selectedDate,
                appointment_time: '',
                appointment_type: '',
                duration_minutes: 30,
                reason: '',
                notes: ''
              });
              setShowModal(true);
              loadPatients();
            }}
          >
            + {t('appointments.newAppointment')}
          </button>
        </div>
      </div>

      {view === 'calendar' && renderCalendarView()}
      {view === 'list' && renderListView()}
      {view === 'waiting' && renderWaitingList()}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAppointment ? t('appointments.editAppointment') : t('appointments.newAppointment')}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>{t('appointments.patient')}</label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  required
                >
                  <option value="">{t('common.select')}...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.patient_number} - {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>{t('appointments.doctor')}</label>
                <select
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  required
                >
                  <option value="">{t('common.select')}...</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.username}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{t('appointments.date')}</label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('appointments.time')}</label>
                  <input
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>{t('appointments.type')}</label>
                  <select
                    value={formData.appointment_type}
                    onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
                    required
                  >
                    <option value="">{t('common.select')}...</option>
                    {appointmentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>{t('appointments.duration')} (min)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    min="15"
                    step="15"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>{t('appointments.reason')}</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="form-group">
                <label>{t('appointments.notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .appointments-page {
          padding: 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .header-actions {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .view-toggle {
          display: flex;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #ddd;
        }

        .view-toggle button {
          padding: 8px 16px;
          border: none;
          background: #fff;
          cursor: pointer;
          border-right: 1px solid #ddd;
        }

        .view-toggle button:last-child {
          border-right: none;
        }

        .view-toggle button.active {
          background: #0066cc;
          color: white;
        }

        .doctor-filter {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
        }

        .calendar-header {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .btn-nav {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 6px;
          cursor: pointer;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
        }

        .calendar-day {
          min-height: 150px;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .calendar-day:hover {
          background: #f8f9fa;
        }

        .calendar-day.today {
          background: #e3f2fd;
          border-color: #0066cc;
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: bold;
        }

        .day-name {
          color: #666;
          font-size: 12px;
        }

        .day-number {
          font-size: 18px;
        }

        .appointment-card {
          background: white;
          border-left: 4px solid #0066cc;
          padding: 8px;
          margin-bottom: 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .appointment-time {
          font-weight: bold;
          color: #0066cc;
        }

        .appointment-patient {
          margin: 4px 0;
        }

        .appointment-type {
          color: #666;
          font-size: 11px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 12px;
          color: white;
          font-size: 12px;
        }

        .status-select {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #ddd;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
        }

        .modal-form {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .btn-primary {
          padding: 10px 20px;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-secondary {
          padding: 10px 20px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .data-table th {
          background: #f8f9fa;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default AppointmentsPage;
