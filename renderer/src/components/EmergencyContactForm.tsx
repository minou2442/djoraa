import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './EmergencyContactForm.css';

interface EmergencyContactFormProps {
  patientId: string;
  contactId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const EmergencyContactForm: React.FC<EmergencyContactFormProps> = ({ patientId, contactId, onClose, onSaved }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    contact_name: '',
    relationship: '',
    phone: '',
    priority: 1
  });

  const [loading, setLoading] = useState(!!contactId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const relationships = ['spouse', 'parent', 'child', 'sibling', 'friend', 'other'];

  // Fetch contact data if editing
  useEffect(() => {
    if (contactId) {
      const fetchContact = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`/api/patients/${patientId}/emergency-contacts/${contactId}`);
          setFormData(response.data.contact);
          setError('');
        } catch (err: any) {
          setError(err.response?.data?.error || t('failed_to_load_contact'));
        } finally {
          setLoading(false);
        }
      };

      fetchContact();
    }
  }, [contactId, patientId, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priority' ? parseInt(value) : value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.contact_name.trim()) {
      setError(t('contact_name_required'));
      return false;
    }
    if (!formData.relationship) {
      setError(t('relationship_required'));
      return false;
    }
    if (!formData.phone.trim()) {
      setError(t('phone_required'));
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
      if (contactId) {
        await axios.put(`/api/patients/${patientId}/emergency-contacts/${contactId}`, formData);
      } else {
        await axios.post(`/api/patients/${patientId}/emergency-contacts`, formData);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || t('failed_to_save_contact'));
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
          <h2>{contactId ? t('edit_contact') : t('add_contact')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contact_name">{t('contact_name')} *</label>
              <input
                type="text"
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleInputChange}
                placeholder={t('enter_contact_name')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="relationship">{t('relationship')} *</label>
              <select
                id="relationship"
                name="relationship"
                value={formData.relationship}
                onChange={handleInputChange}
                required
              >
                <option value="">{t('select_relationship')}</option>
                {relationships.map(rel => (
                  <option key={rel} value={rel}>{t(rel)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">{t('phone')} *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder={t('enter_phone')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="priority">{t('priority')}</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority.toString()}
                onChange={handleInputChange}
              >
                <option value="1">{t('primary')}</option>
                <option value="2">{t('secondary')}</option>
                <option value="3">{t('tertiary')}</option>
                <option value="4">{t('quaternary')}</option>
              </select>
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

export default EmergencyContactForm;
