import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './DiseaseForm.css';

interface DiseaseFormProps {
  patientId: string;
  diseaseId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const DiseaseForm: React.FC<DiseaseFormProps> = ({ patientId, diseaseId, onClose, onSaved }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    disease_name: '',
    icd10_code: '',
    diagnosis_date: '',
    status: 'active',
    current_medication: ''
  });

  const [loading, setLoading] = useState(!!diseaseId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = ['active', 'resolved', 'dormant'];

  // Fetch disease data if editing
  useEffect(() => {
    if (diseaseId) {
      const fetchDisease = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`/api/patients/${patientId}/diseases/${diseaseId}`);
          const disease = response.data.disease;
          setFormData({
            disease_name: disease.disease_name,
            icd10_code: disease.icd10_code,
            diagnosis_date: disease.diagnosis_date.split('T')[0],
            status: disease.status,
            current_medication: disease.current_medication || ''
          });
          setError('');
        } catch (err: any) {
          setError(err.response?.data?.error || t('failed_to_load_disease'));
        } finally {
          setLoading(false);
        }
      };

      fetchDisease();
    }
  }, [diseaseId, patientId, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.disease_name.trim()) {
      setError(t('disease_name_required'));
      return false;
    }
    if (!formData.icd10_code.trim()) {
      setError(t('icd10_code_required'));
      return false;
    }
    if (!formData.diagnosis_date) {
      setError(t('diagnosis_date_required'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (diseaseId) {
        await axios.put(`/api/patients/${patientId}/diseases/${diseaseId}`, formData);
      } else {
        await axios.post(`/api/patients/${patientId}/diseases`, formData);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || t('failed_to_save_disease'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="modal-overlay"><div className="modal">{t('loading')}</div></div>;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{diseaseId ? t('edit_disease') : t('add_disease')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="disease-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="disease_name">{t('disease_name')} *</label>
              <input
                type="text"
                id="disease_name"
                name="disease_name"
                value={formData.disease_name}
                onChange={handleInputChange}
                placeholder={t('enter_disease_name')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="icd10_code">{t('icd10_code')} *</label>
              <input
                type="text"
                id="icd10_code"
                name="icd10_code"
                value={formData.icd10_code}
                onChange={handleInputChange}
                placeholder="e.g., I10"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="diagnosis_date">{t('diagnosis_date')} *</label>
              <input
                type="date"
                id="diagnosis_date"
                name="diagnosis_date"
                value={formData.diagnosis_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">{t('status')}</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{t(status)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="current_medication">{t('current_medication')}</label>
              <textarea
                id="current_medication"
                name="current_medication"
                value={formData.current_medication}
                onChange={handleInputChange}
                placeholder={t('enter_current_medication')}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? t('saving') + '...' : t('save')}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiseaseForm;
