import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface LabRequest {
  id: number;
  lab_number: string;
  patient_id: string;
  status: string;
  priority: string;
  created_at: string;
}

interface LaboratoryPageProps {
  user: { id: number; clinic_id: number; role: string };
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', labelAr: 'قيد الانتظار' },
  { value: 'sample_collected', label: 'Sample Collected', labelAr: 'عينة مجمعة' },
  { value: 'in_progress', label: 'In Progress', labelAr: 'قيد التحليل' },
  { value: 'validated', label: 'Validated', labelAr: 'معتمد' },
  { value: 'rejected', label: 'Rejected', labelAr: 'مرفوض' }
];

const TEST_CATEGORIES = [
  { value: 'blood', label: 'Blood Analysis', labelAr: 'تحليل الدم' },
  { value: 'urine', label: 'Urine Test', labelAr: 'تحليل البول' },
  { value: 'hormone', label: 'Hormone Test', labelAr: 'اختبار الهرمونات' },
  { value: 'biochemistry', label: 'Biochemistry', labelAr: 'الكيمياء الحيوية' },
  { value: 'covid', label: 'COVID / PCR', labelAr: 'كovid / PCR' },
  { value: 'custom', label: 'Custom Test', labelAr: 'اختبار مخصص' }
];

const LaboratoryPage: React.FC<LaboratoryPageProps> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    test_category: 'blood',
    priority: 'normal',
    clinical_diagnosis: '',
    notes: ''
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await api.get('/lab/requests');
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/lab/requests', formData);
      setShowForm(false);
      setFormData({
        patient_id: '',
        test_category: 'blood',
        priority: 'normal',
        clinical_diagnosis: '',
        notes: ''
      });
      loadRequests();
    } catch (error) {
      console.error('Failed to create request:', error);
    }
  };

  const updateStatus = async (requestId: number, newStatus: string) => {
    try {
      await api.put(`/lab/requests/${requestId}/status`, { status: newStatus });
      loadRequests();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'sample_collected': return '#17a2b8';
      case 'in_progress': return '#0066cc';
      case 'validated': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = TEST_CATEGORIES.find(c => c.value === category);
    return cat ? (isArabic ? cat.labelAr : cat.label) : category;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{isArabic ? 'مختبر التحاليل الطبية' : 'Medical Laboratory'}</h1>
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
          {showForm ? (isArabic ? 'إلغاء' : 'Cancel') : (isArabic ? 'طلب جديد' : 'New Request')}
        </button>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>{isArabic ? 'طلب تحليل جديد' : 'New Lab Request'}</h2>
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
                  {isArabic ? 'نوع التحليل' : 'Test Category'}
                </label>
                <select
                  value={formData.test_category}
                  onChange={(e) => setFormData({ ...formData, test_category: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  {TEST_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {isArabic ? cat.labelAr : cat.label}
                    </option>
                  ))}
                </select>
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
                  {isArabic ? 'التشخيص السريري' : 'Clinical Diagnosis'}
                </label>
                <textarea
                  value={formData.clinical_diagnosis}
                  onChange={(e) => setFormData({ ...formData, clinical_diagnosis: e.target.value })}
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

      {/* Requests List */}
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : requests.length === 0 ? (
        <p>{isArabic ? 'لا توجد طلبات' : 'No requests found'}</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {requests.map((request) => (
            <div
              key={request.id}
              style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${getStatusColor(request.status)}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px' }}>
                    {request.lab_number}
                  </h3>
                  <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                    {isArabic ? 'المريض' : 'Patient'}: {request.patient_id} | 
                    {isArabic ? 'التاريخ' : 'Date'}: {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    backgroundColor: getStatusColor(request.status),
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {isArabic ? STATUS_OPTIONS.find(s => s.value === request.status)?.labelAr : STATUS_OPTIONS.find(s => s.value === request.status)?.label}
                  </span>
                  {request.priority === 'urgent' && (
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
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {request.status === 'pending' && (
                  <button
                    onClick={() => updateStatus(request.id, 'sample_collected')}
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
                    {isArabic ? 'تسجيل العينة' : 'Register Sample'}
                  </button>
                )}
                {request.status === 'sample_collected' && (
                  <button
                    onClick={() => updateStatus(request.id, 'in_progress')}
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
                    {isArabic ? 'بدء التحليل' : 'Start Analysis'}
                  </button>
                )}
                {request.status === 'in_progress' && (
                  <button
                    onClick={() => updateStatus(request.id, 'validated')}
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
                    {isArabic ? 'اعتماد النتائج' : 'Validate Results'}
                  </button>
                )}
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
                  {isArabic ? 'التفاصيل' : 'Details'}
                </button>
                {request.status === 'validated' && (
                  <button
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {isArabic ? 'طباعة PDF' : 'Print PDF'}
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

export default LaboratoryPage;
