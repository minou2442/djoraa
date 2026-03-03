import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './ContactForm.css';

interface ContactFormProps {
  patientId: string;
  contactId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ patientId, contactId, onClose, onSaved }) => {
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

  // Fetch contact if editing
  useEffect(() => {
    if (contactId) {
      const fetchContact = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`/api/patients/${patientId}/emergency-contacts/${contactId}`);
          setFormData(res.data.contact);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const validate = (): boolean => {
    if (!formData.contact_name.trim()) {
      setError(t('contact_name_required'));
      return false;
    }
    if (!formData.relationship.trim()) {
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
    if (!validate()) return;

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
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="relationship">{t('relationship')} *</label>
              <input
                type="text"
                id="relationship"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                required
              />
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
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="priority">{t('priority')}</label>
              <input
                type="number"
                id="priority"
                name="priority"
                value={formData.priority}
                min={1}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? t('saving') + '...' : t('save')}
            </button>
            <button className="btn-secondary" type="button" onClick={onClose}>{t('cancel')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
