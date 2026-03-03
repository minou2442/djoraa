import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './CreatePatient.css';

/**
 * CreatePatient - Form to create a new patient with all required fields
 */
const CreatePatient: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    national_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    blood_group: '',
    marital_status: '',
    occupation: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const bloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const maritalStatuses = ['single', 'married', 'divorced', 'widowed'];

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.national_id.trim()) {
      setError(t('national_id_required'));
      return false;
    }
    if (!formData.first_name.trim()) {
      setError(t('first_name_required'));
      return false;
    }
    if (!formData.last_name.trim()) {
      setError(t('last_name_required'));
      return false;
    }
    if (!formData.date_of_birth) {
      setError(t('date_of_birth_required'));
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/patients', formData);
      setSuccess(t('patient_created_successfully'));

      // Redirect to patient detail page after 2 seconds
      setTimeout(() => {
        navigate(`/patients/${response.data.patient.id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || t('failed_to_create_patient'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-patient">
      <div className="create-patient-header">
        <h1>{t('create_new_patient')}</h1>
        <button className="btn-secondary" onClick={() => navigate('/patients')}>
          {t('back')}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="patient-form">
        {/* Personal Information */}
        <fieldset className="form-section">
          <legend>{t('personal_information')}</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="national_id">{t('national_id')} *</label>
              <input
                type="text"
                id="national_id"
                name="national_id"
                value={formData.national_id}
                onChange={handleInputChange}
                placeholder={t('enter_national_id')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="first_name">{t('first_name')} *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder={t('enter_first_name')}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="middle_name">{t('middle_name')}</label>
              <input
                type="text"
                id="middle_name"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleInputChange}
                placeholder={t('enter_middle_name')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">{t('last_name')} *</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder={t('enter_last_name')}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date_of_birth">{t('date_of_birth')} *</label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">{t('gender')}</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
                <option value="other">{t('other')}</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="blood_group">{t('blood_group')}</label>
              <select
                id="blood_group"
                name="blood_group"
                value={formData.blood_group}
                onChange={handleInputChange}
              >
                <option value="">{t('select_blood_group')}</option>
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="marital_status">{t('marital_status')}</label>
              <select
                id="marital_status"
                name="marital_status"
                value={formData.marital_status}
                onChange={handleInputChange}
              >
                <option value="">{t('select_marital_status')}</option>
                {maritalStatuses.map(status => (
                  <option key={status} value={status}>{t(status)}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* Contact Information */}
        <fieldset className="form-section">
          <legend>{t('contact_information')}</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">{t('phone')}</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder={t('enter_phone')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('enter_email')}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="address">{t('address')}</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder={t('enter_address')}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">{t('city')}</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder={t('enter_city')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="postal_code">{t('postal_code')}</label>
              <input
                type="text"
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleInputChange}
                placeholder={t('enter_postal_code')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">{t('country')}</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder={t('enter_country')}
              />
            </div>
          </div>
        </fieldset>

        {/* Professional Information */}
        <fieldset className="form-section">
          <legend>{t('professional_information')}</legend>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="occupation">{t('occupation')}</label>
              <input
                type="text"
                id="occupation"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                placeholder={t('enter_occupation')}
              />
            </div>
          </div>
        </fieldset>

        {/* Additional Information */}
        <fieldset className="form-section">
          <legend>{t('additional_information')}</legend>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="notes">{t('notes')}</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder={t('enter_notes')}
                rows={4}
              />
            </div>
          </div>
        </fieldset>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary btn-large"
            disabled={loading}
          >
            {loading ? t('creating') + '...' : t('create_patient')}
          </button>
          <button
            type="button"
            className="btn-secondary btn-large"
            onClick={() => navigate('/patients')}
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePatient;
