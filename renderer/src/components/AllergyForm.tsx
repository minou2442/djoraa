import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './AllergyForm.css';

interface AllergyFormProps {
  patientId: string;
  allergyId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const AllergyForm: React.FC<AllergyFormProps> = ({ patientId, allergyId, onClose, onSaved }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    allergy_name: '',
    allergy_type: '',
    severity: 'mild' as 'mild' | 'moderate' | 'severe',
    reaction_description: ''
  });

  const [loading, setLoading] = useState(!!allergyId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const severityOptions: Array<'mild' | 'moderate' | 'severe'> = ['mild', 'moderate', 'severe'];
  const allergyTypes = ['food', 'drug', 'environmental', 'contact', 'other'];

  // Fetch allergy data if editing
  useEffect(() => {
    if (allergyId) {
      const fetchAllergy = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`/api/patients/${patientId}/allergies/${allergyId}`);
          setFormData(response.data.allergy);
          setError('');
        } catch (err: any) {
          setError(err.response?.data?.error || t('failed_to_load_allergy'));
        } finally {
          setLoading(false);
        }
      };

      fetchAllergy();
    }
  }, [allergyId, patientId, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.allergy_name.trim()) {
      setError(t('allergy_name_required'));
      return false;
    }
    if (!formData.allergy_type) {
      setError(t('allergy_type_required'));
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
      if (allergyId) {
        await axios.put(`/api/patients/${patientId}/allergies/${allergyId}`, formData);
      } else {
        await axios.post(`/api/patients/${patientId}/allergies`, formData);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || t('failed_to_save_allergy'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="allergy-form-modal">{t('loading')}</div>;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{allergyId ? t('edit_allergy') : t('add_allergy')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="allergy-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="allergy_name">{t('allergy_name')} *</label>
              <input
                type="text"
                id="allergy_name"
                name="allergy_name"
                value={formData.allergy_name}
                onChange={handleInputChange}
                placeholder={t('enter_allergy_name')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="allergy_type">{t('allergy_type')} *</label>
              <select
                id="allergy_type"
                name="allergy_type"
                value={formData.allergy_type}
                onChange={handleInputChange}
                required
              >
                <option value="">{t('select_allergy_type')}</option>
                {allergyTypes.map(type => (
                  <option key={type} value={type}>{t(type)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="severity">{t('severity')}</label>
              <select
                id="severity"
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
              >
                {severityOptions.map(severity => (
                  <option key={severity} value={severity}>{t(severity)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="reaction_description">{t('reaction_description')}</label>
              <textarea
                id="reaction_description"
                name="reaction_description"
                value={formData.reaction_description}
                onChange={handleInputChange}
                placeholder={t('enter_reaction_description')}
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

export default AllergyForm;
