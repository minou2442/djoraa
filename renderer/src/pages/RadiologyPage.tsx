import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface RadiologyExam {
  id: number;
  patient_id: string;
  exam_type: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  priority: string;
  clinical_indication: string;
  findings?: string;
  impression?: string;
  created_at: string;
}

interface RadiologyPageProps {
  user: { id: number; clinic_id: number; role: string };
}

const EXAM_TYPES = [
  { value: 'xray', label: 'X-Ray', labelAr: 'أشعة بسيطة' },
  { value: 'echography', label: 'Echography', labelAr: 'موجات فوق صوتية' },
  { value: 'scanner', label: 'Scanner (CT)', labelAr: 'ماسح (CT)' },
  { value: 'irm', label: 'IRM (MRI)', labelAr: 'رنين مغناطيسي' }
];

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', labelAr: 'مجدول' },
  { value: 'in_progress', label: 'In Progress', labelAr: 'قيد التنفيذ' },
  { value: 'completed', label: 'Completed', labelAr: 'مكتمل' },
  { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغى' }
];

const RadiologyPage: React.FC<RadiologyPageProps> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [exams, setExams] = useState<RadiologyExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedExam, setSelectedExam] = useState<RadiologyExam | null>(null);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    exam_type: 'xray',
    scheduled_date: '',
    scheduled_time: '',
    priority: 'normal',
    clinical_indication: ''
  });

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const response = await api.get('/radiology/exams');
      setExams(response.data.exams || []);
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/radiology/exams', formData);
      setShowForm(false);
      setFormData({
        patient_id: '',
        exam_type: 'xray',
        scheduled_date: '',
        scheduled_time: '',
        priority: 'normal',
        clinical_indication: ''
      });
      loadExams();
    } catch (error) {
      console.error('Failed to create exam:', error);
    }
  };

  const updateStatus = async (examId: number, status: string) => {
    try {
      await api.put(`/radiology/exams/${examId}/status`, { status });
      loadExams();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#ffc107';
      case 'in_progress': return '#17a2b8';
      case 'completed': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getExamTypeLabel = (type: string) => {
    const exam = EXAM_TYPES.find(e => e.value === type);
    return exam ? (isArabic ? exam.labelAr : exam.label) : type;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{isArabic ? 'الأشعة والتصوير الطبي' : 'Radiology & Imaging'}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showForm ? (isArabic ? 'إلغاء' : 'Cancel') : (isArabic ? 'إضافة فحص' : 'New Exam')}
        </button>
      </div>

      {/* New Exam Form */}
      {showForm && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>{isArabic ? 'إضافة فحص أشعة جديد' : 'New Radiology Exam'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  {isArabic ? 'رقم المريض' : 'Patient ID'}
                </label>
                <input
                  type="text"
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  {isArabic ? 'نوع الفحص' : 'Exam Type'}
                </label>
                <select
                  value={formData.exam_type}
                  onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  {EXAM_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {isArabic ? type.labelAr : type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  {isArabic ? 'التاريخ' : 'Date'}
                </label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  {isArabic ? 'الوقت' : 'Time'}
                </label>
                <input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  {isArabic ? 'الأولوية' : 'Priority'}
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="low">{isArabic ? 'منخفضة' : 'Low'}</option>
                  <option value="normal">{isArabic ? 'عادية' : 'Normal'}</option>
                  <option value="high">{isArabic ? 'عالية' : 'High'}</option>
                  <option value="urgent">{isArabic ? 'عاجلة' : 'Urgent'}</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  {isArabic ? 'الدليل الإكلينيكي' : 'Clinical Indication'}
                </label>
                <textarea
                  value={formData.clinical_indication}
                  onChange={(e) => setFormData({ ...formData, clinical_indication: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <button
              type="submit"
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isArabic ? 'حفظ' : 'Save'}
            </button>
          </form>
        </div>
      )}

      {/* Exams List */}
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : exams.length === 0 ? (
        <p>{isArabic ? 'لا توجد فحوصات' : 'No exams found'}</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {exams.map((exam) => (
            <div
              key={exam.id}
              style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${getStatusColor(exam.status)}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px' }}>
                    {getExamTypeLabel(exam.exam_type)}
                  </h3>
                  <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                    {isArabic ? 'المريض' : 'Patient'}: {exam.patient_id} | 
                    {isArabic ? 'التاريخ' : 'Date'}: {exam.scheduled_date} {exam.scheduled_time}
                  </p>
                  {exam.clinical_indication && (
                    <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>
                      <strong>{isArabic ? 'الدليل' : 'Indication'}:</strong> {exam.clinical_indication}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor: getStatusColor(exam.status),
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {isArabic ? STATUS_OPTIONS.find(s => s.value === exam.status)?.labelAr : STATUS_OPTIONS.find(s => s.value === exam.status)?.label}
                  </span>
                  {exam.priority === 'urgent' && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      fontSize: '12px'
                    }}>
                      {isArabic ? 'عاجل' : 'URGENT'}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                {exam.status === 'scheduled' && (
                  <button
                    onClick={() => updateStatus(exam.id, 'in_progress')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {isArabic ? 'بدء' : 'Start'}
                  </button>
                )}
                {exam.status === 'in_progress' && (
                  <button
                    onClick={() => updateStatus(exam.id, 'completed')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {isArabic ? 'إكمال' : 'Complete'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedExam(exam)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {isArabic ? 'التفاصيل' : 'Details'}
                </button>
                {exam.status === 'completed' && (
                  <button
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {isArabic ? 'PDF' : 'PDF'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RadiologyPage;
