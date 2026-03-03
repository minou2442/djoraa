import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface Patient {
  id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface QueueEntry {
  id: number;
  queue_number: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  patient_number: string;
  phone: string;
  service_type: string;
  priority: string;
  doctor_id: number;
  doctor_name: string;
  room_id: number;
  room_name: string;
  reason: string;
  estimated_wait_minutes: number;
  status: string;
  started_at: string;
}

interface Room {
  id: number;
  name: string;
  name_ar: string;
  doctor_id: number;
  doctor_name: string;
  room_type: string;
  status: string;
}

interface QueueStats {
  total: number;
  waiting: number;
  in_progress: number;
  completed: number;
  urgent: number;
  vip: number;
}

const WaitingRoomPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<'reception' | 'doctor' | 'display'>('reception');
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('consultation');
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [priority, setPriority] = useState<string>('normal');
  const [reason, setReason] = useState<string>('');
  const [isDisplayMode, setIsDisplayMode] = useState(false);
  const [sessionTimer, setSessionTimer] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const statusColors: { [key: string]: string } = {
    waiting: '#f39c12',
    in_progress: '#3498db',
    completed: '#27ae60',
    skipped: '#95a5a6',
    absent: '#e74c3c',
    cancelled: '#7f8c8d'
  };

  const priorityColors: { [key: string]: string } = {
    urgent: '#e74c3c',
    vip: '#9b59b6',
    normal: '#3498db'
  };

  useEffect(() => {
    loadQueue();
    loadRooms();
    loadStats();
    
    const interval = setInterval(() => {
      loadQueue();
      loadStats();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (view === 'doctor' && sessionTimer > 0) {
      timerRef.current = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view]);

  const loadQueue = async () => {
    try {
      const params = new URLSearchParams();
      if (view === 'doctor') params.append('doctor_id', 'current');
      if (selectedRoom) params.append('room_id', selectedRoom.toString());
      const response = await api.get(`/waiting-room/queue?${params}`);
      setQueue(response.data);
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await api.get('/waiting-room/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error loading rooms:', error);
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

  const loadStats = async () => {
    try {
      const response = await api.get('/waiting-room/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const addToQueue = async () => {
    if (!selectedPatient) return;
    try {
      await api.post('/waiting-room/queue', {
        patient_id: selectedPatient,
        service_type: selectedService,
        doctor_id: selectedDoctor,
        room_id: selectedRoom,
        priority,
        reason
      });
      setSelectedPatient('');
      setReason('');
      loadQueue();
      loadStats();
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/waiting-room/queue/${id}/status`, { status });
      loadQueue();
      loadStats();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const markAbsent = async (id: number) => {
    try {
      await api.post(`/waiting-room/queue/${id}/absent`);
      loadQueue();
      loadStats();
    } catch (error) {
      console.error('Error marking absent:', error);
    }
  };

  const startConsultation = async (id: number) => {
    try {
      await api.post(`/waiting-room/doctor/start/${id}`);
      setSessionTimer(0);
      loadQueue();
      loadStats();
    } catch (error) {
      console.error('Error starting consultation:', error);
    }
  };

  const endConsultation = async (id: number) => {
    try {
      await api.post(`/waiting-room/doctor/end/${id}`);
      if (timerRef.current) clearInterval(timerRef.current);
      setSessionTimer(0);
      loadQueue();
      loadStats();
    } catch (error) {
      console.error('Error ending consultation:', error);
    }
  };

  const skipPatient = async (id: number) => {
    try {
      await api.post(`/waiting-room/doctor/skip/${id}`, { reason: 'Skipped by doctor' });
      loadQueue();
      loadStats();
    } catch (error) {
      console.error('Error skipping patient:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const minsStr = mins < 10 ? '0' + String(mins) : String(mins);
    const secsStr = secs < 10 ? '0' + String(secs) : String(secs);
    return minsStr + ':' + secsStr;
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  // Display Screen Mode
  if (isDisplayMode) {
    const currentPatient = queue.find(q => q.status === 'in_progress');
    const nextPatients = queue.filter(q => q.status === 'waiting').slice(0, 5);

    return (
      <div className="display-screen">
        <audio ref={audioRef} src="/notification.mp3" preload="auto" />
        
        <div className="display-header">
          <div className="clinic-logo">🏥 DJORAA</div>
          <div className="current-time">{new Date().toLocaleTimeString()}</div>
        </div>

        <div className="display-current">
          <div className="called-label">{t('waitingRoom.nowServing')}</div>
          <div className="called-number">{currentPatient?.queue_number || '---'}</div>
          <div className="called-name">
            {currentPatient ? `${currentPatient.first_name} ${currentPatient.last_name}` : t('waitingRoom.noPatient')}
          </div>
          {currentPatient && (
            <div className="called-info">
              <span className="room-badge">{currentPatient.room_name}</span>
              <span className="doctor-badge">{currentPatient.doctor_name}</span>
            </div>
          )}
        </div>

        <div className="display-queue">
          <h3>{t('waitingRoom.upNext')}</h3>
          {nextPatients.map((entry, idx) => (
            <div key={entry.id} className="queue-item">
              <span className="queue-position">{idx + 1}</span>
              <span className="queue-number">{entry.queue_number}</span>
              <span className="queue-name">{entry.first_name}</span>
              {entry.priority === 'urgent' && <span className="priority-badge urgent">{t('waitingRoom.urgent')}</span>}
              {entry.priority === 'vip' && <span className="priority-badge vip">VIP</span>}
            </div>
          ))}
        </div>

        <div className="display-footer">
          <button onClick={() => setIsDisplayMode(false)} className="exit-btn">
            {t('common.exit')}
          </button>
          <button onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr')} className="lang-btn">
            {i18n.language === 'fr' ? 'العربية' : 'Français'}
          </button>
        </div>

        <style>{`
          .display-screen {
            height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            padding: 20px;
            display: flex;
            flex-direction: column;
          }
          .display-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
          .clinic-logo { font-size: 36px; font-weight: bold; }
          .current-time { font-size: 28px; }
          .display-current {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 20px;
          }
          .called-label { font-size: 24px; opacity: 0.8; margin-bottom: 10px; }
          .called-number { font-size: 120px; font-weight: bold; color: #3498db; }
          .called-name { font-size: 48px; margin-bottom: 20px; }
          .called-info { display: flex; gap: 20px; }
          .room-badge, .doctor-badge { padding: 10px 20px; background: rgba(255,255,255,0.2); border-radius: 30px; font-size: 20px; }
          .display-queue { background: rgba(255,255,255,0.05); border-radius: 15px; padding: 20px; }
          .display-queue h3 { margin: 0 0 15px 0; opacity: 0.8; }
          .queue-item { display: flex; align-items: center; gap: 15px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 8px; }
          .queue-position { font-size: 20px; width: 30px; }
          .queue-number { font-size: 24px; font-weight: bold; color: #3498db; }
          .queue-name { flex: 1; font-size: 20px; }
          .priority-badge { padding: 5px 10px; border-radius: 5px; font-size: 14px; }
          .priority-badge.urgent { background: #e74c3c; }
          .priority-badge.vip { background: #9b59b6; }
          .display-footer { display: flex; justify-content: center; gap: 20px; margin-top: 20px; }
          .exit-btn, .lang-btn { padding: 15px 30px; border: none; border-radius: 8px; font-size: 18px; cursor: pointer; }
          .exit-btn { background: #e74c3c; color: white; }
          .lang-btn { background: #3498db; color: white; }
        `}</style>
      </div>
    );
  }

  // Reception View
  const renderReception = () => (
    <div className="reception-view">
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-value">{stats?.waiting || 0}</span>
          <span className="stat-label">{t('waitingRoom.waiting')}</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats?.in_progress || 0}</span>
          <span className="stat-label">{t('waitingRoom.inProgress')}</span>
        </div>
        <div className="stat-item urgent">
          <span className="stat-value">{stats?.urgent || 0}</span>
          <span className="stat-label">{t('waitingRoom.urgent')}</span>
        </div>
        <div className="stat-item vip">
          <span className="stat-value">{stats?.vip || 0}</span>
          <span className="stat-label">VIP</span>
        </div>
      </div>

      <div className="add-patient-form">
        <h3>{t('waitingRoom.addPatient')}</h3>
        <div className="form-row">
          <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} onClick={() => loadPatients()}>
            <option value="">{t('common.select')}...</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.patient_number} - {p.first_name} {p.last_name}</option>
            ))}
          </select>
          <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
            <option value="consultation">{t('waitingRoom.consultation')}</option>
            <option value="radiology">{t('waitingRoom.radiology')}</option>
            <option value="laboratory">{t('waitingRoom.laboratory')}</option>
          </select>
          <select value={selectedDoctor || ''} onChange={(e) => setSelectedDoctor(e.target.value ? Number(e.target.value) : null)}>
            <option value="">{t('waitingRoom.anyDoctor')}</option>
            {rooms.filter(r => r.doctor_id).map(r => (
              <option key={r.doctor_id} value={r.doctor_id}>{r.doctor_name}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="normal">{t('waitingRoom.normal')}</option>
            <option value="urgent">{t('waitingRoom.urgent')}</option>
            <option value="vip">VIP</option>
          </select>
          <input type="text" placeholder={t('waitingRoom.reason')} value={reason} onChange={(e) => setReason(e.target.value)} />
          <button className="btn-primary" onClick={addToQueue}>{t('waitingRoom.addToQueue')}</button>
        </div>
      </div>

      <div className="queue-list">
        <h3>{t('waitingRoom.queue')}</h3>
        {queue.map(entry => (
          <div key={entry.id} className="queue-card" style={{ borderLeftColor: priorityColors[entry.priority] }}>
            <div className="queue-header">
              <span className="queue-number">{entry.queue_number}</span>
              <span className="priority-tag" style={{ background: priorityColors[entry.priority] }}>
                {entry.priority === 'urgent' ? t('waitingRoom.urgent') : entry.priority === 'vip' ? 'VIP' : t('waitingRoom.normal')}
              </span>
              <span className="status-tag" style={{ background: statusColors[entry.status] }}>
                {t(`waitingRoom.statuses.${entry.status}`)}
              </span>
            </div>
            <div className="patient-info">
              <strong>{entry.first_name} {entry.last_name}</strong>
              <span>{entry.patient_number}</span>
            </div>
            <div className="queue-details">
              <span>{t(`waitingRoom.${entry.service_type}`)}</span>
              <span>{entry.doctor_name || t('waitingRoom.anyDoctor')}</span>
              <span>{t('waitingRoom.wait')} ~{entry.estimated_wait_minutes} min</span>
            </div>
            <div className="queue-actions">
              {entry.status === 'waiting' && (
                <>
                  <button className="btn-start" onClick={() => startConsultation(entry.id)}>{t('waitingRoom.call')}</button>
                  <button className="btn-absent" onClick={() => markAbsent(entry.id)}>{t('waitingRoom.absent')}</button>
                  <button className="btn-remove" onClick={() => updateStatus(entry.id, 'cancelled')}>×</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="display-toggle" onClick={() => setIsDisplayMode(true)}>
        📺 {t('waitingRoom.displayMode')}
      </button>
    </div>
  );

  // Doctor View
  const renderDoctor = () => {
    const currentPatient = queue.find(q => q.status === 'in_progress');
    const waitingPatients = queue.filter(q => q.status === 'waiting');

    return (
      <div className="doctor-view">
        <div className="doctor-header">
          <h2>{t('waitingRoom.myQueue')}</h2>
          {currentPatient && (
            <div className="session-timer">
              {t('waitingRoom.sessionTime')}: {formatTime(sessionTimer)}
            </div>
          )}
        </div>

        {currentPatient ? (
          <div className="current-patient-card">
            <div className="current-patient-header">
              <span className="queue-number large">{currentPatient.queue_number}</span>
              <span className="patient-name">{currentPatient.first_name} {currentPatient.last_name}</span>
            </div>
            <div className="patient-details">
              <p>{currentPatient.patient_number}</p>
              <p>{currentPatient.reason || t('waitingRoom.noReason')}</p>
            </div>
            <div className="session-controls">
              <button className="btn-end" onClick={() => endConsultation(currentPatient.id)}>
                {t('waitingRoom.endConsultation')}
              </button>
              <button className="btn-skip" onClick={() => skipPatient(currentPatient.id)}>
                {t('waitingRoom.skip')}
              </button>
            </div>
          </div>
        ) : (
          <div className="no-patient">
            <p>{t('waitingRoom.noPatientInSession')}</p>
          </div>
        )}

        <div className="waiting-list">
          <h3>{t('waitingRoom.waitingPatients')} ({waitingPatients.length})</h3>
          {waitingPatients.map(entry => (
            <div key={entry.id} className="waiting-card" style={{ borderLeftColor: priorityColors[entry.priority] }}>
              <span className="queue-number">{entry.queue_number}</span>
              <span className="patient-name">{entry.first_name} {entry.last_name}</span>
              <span className="wait-time">~{entry.estimated_wait_minutes} min</span>
              <button className="btn-call" onClick={() => startConsultation(entry.id)}>
                {t('waitingRoom.call')}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container waiting-room-page">
      <div className="page-header">
        <h1>{t('nav.waitingRoom')}</h1>
        <div className="view-toggle">
          <button className={view === 'reception' ? 'active' : ''} onClick={() => setView('reception')}>
            {t('waitingRoom.reception')}
          </button>
          <button className={view === 'doctor' ? 'active' : ''} onClick={() => setView('doctor')}>
            {t('waitingRoom.doctor')}
          </button>
        </div>
      </div>

      {view === 'reception' && renderReception()}
      {view === 'doctor' && renderDoctor()}

      <style>{`
        .waiting-room-page { padding: 20px; }
        .stats-bar { display: flex; gap: 15px; margin-bottom: 20px; }
        .stat-item { background: white; padding: 15px 25px; border-radius: 10px; text-align: center; flex: 1; border: 1px solid #ddd; }
        .stat-item.urgent { border-left: 4px solid #e74c3c; }
        .stat-item.vip { border-left: 4px solid #9b59b6; }
        .stat-value { font-size: 32px; font-weight: bold; display: block; }
        .stat-label { font-size: 14px; color: #7f8c8d; }
        .add-patient-form { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .add-patient-form h3 { margin-top: 0; }
        .form-row { display: flex; gap: 10px; margin-bottom: 10px; }
        .form-row select, .form-row input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
        .queue-list { display: grid; gap: 10px; }
        .queue-card { background: white; padding: 15px; border-radius: 10px; border-left: 4px solid #3498db; }
        .queue-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .queue-number { font-size: 24px; font-weight: bold; color: #3498db; }
        .queue-number.large { font-size: 48px; }
        .priority-tag, .status-tag { padding: 4px 10px; border-radius: 12px; font-size: 12px; color: white; }
        .patient-info { margin-bottom: 10px; }
        .patient-info strong { font-size: 18px; }
        .queue-details { display: flex; gap: 20px; color: #7f8c8d; font-size: 14px; margin-bottom: 10px; }
        .queue-actions { display: flex; gap: 10px; }
        .btn-start { background: #27ae60; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        .btn-absent { background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        .btn-remove { background: #95a5a6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        .display-toggle { position: fixed; bottom: 20px; right: 20px; padding: 15px 25px; background: #3498db; color: white; border: none; border-radius: 30px; cursor: pointer; font-size: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .doctor-view { max-width: 600px; margin: 0 auto; }
        .doctor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .session-timer { font-size: 24px; font-weight: bold; color: #3498db; }
        .current-patient-card { background: white; padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 20px; }
        .current-patient-header { margin-bottom: 20px; }
        .patient-name { font-size: 32px; font-weight: bold; display: block; }
        .patient-details { color: #7f8c8d; margin-bottom: 20px; }
        .session-controls { display: flex; gap: 15px; justify-content: center; }
        .btn-end { background: #27ae60; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 18px; cursor: pointer; }
        .btn-skip { background: #95a5a6; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 18px; cursor: pointer; }
        .waiting-card { background: white; padding: 15px; border-radius: 10px; display: flex; align-items: center; gap: 15px; border-left: 4px solid #3498db; }
        .wait-time { color: #7f8c8d; }
        .btn-call { background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
        .no-patient { background: white; padding: 40px; border-radius: 15px; text-align: center; color: #7f8c8d; }
      `}</style>
    </div>
  );
};

export default WaitingRoomPage;
