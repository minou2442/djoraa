import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './EditPatient.css';

interface PatientFormData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  blood_group?: string;
  marital_status?: string;
  occupation?: string;
  notes?: string;
  status: 'active' | 'archived' | 'deceased' | 'transferred';
}

const EditPatient: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<PatientFormData>({
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
    notes: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const bloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const maritalStatuses = ['single', 'married', 'divorced', 'widowed'];
  const statuses: Array<'active' | 'archived' | 'deceased' | 'transferred'> = ['active', 'archived', 'deceased', 'transferred'];

  // Fetch patient data
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/patients/${patientId}`);
        const patient = response.data.patient;

        setFormData({
          first_name: patient.first_name,
          middle_name: patient.middle_name || '',
          last_name: patient.last_name,
          date_of_birth: patient.date_of_birth.split('T')[0], // Extract date only
          gender: patient.gender,
          phone: patient.phone || '',
          email: patient.email || '',
          address: patient.address || '',
          city: patient.city || '',
          postal_code: patient.postal_code || '',
          country: patient.country || '',
          blood_group: patient.blood_group || '',
          marital_status: patient.marital_status || '',
          occupation: patient.occupation || '',
          notes: patient.notes || '',
          status: patient.status
        });

        setError('');
      } catch (err: any) {
        setError(err.response?.data?.error || t('failed_to_load_patient'));
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatient();
    }
  }, [patientId, t]);

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

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(`/api/patients/${patientId}`, formData);
      setSuccess(t('patient_updated_successfully'));

      // Redirect to patient detail page after 2 seconds
      setTimeout(() => {
        navigate(`/patients/${patientId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || t('failed_to_update_patient'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="edit-patient"><div className="loading">{t('loading')}</div></div>;
  }

  return (
    <div className="edit-patient">
      <div className="edit-patient-header">
        <h1>{t('edit_patient')}</h1>
        <button className="btn-secondary" onClick={() => navigate(`/patients/${patientId}`)}>
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
          </div>

          <div className="form-row">
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
          </div>

          <div className="form-row">
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
          </div>

          <div className="form-row">
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

            <div className="form-group">
              <label htmlFor="status">{t('status')}</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                {statuses.map(status => (
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
            disabled={updating}
          >
            {updating ? t('updating') + '...' : t('update_patient')}
          </button>
          <button
            type="button"
            className="btn-secondary btn-large"
            onClick={() => navigate(`/patients/${patientId}`)}
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPatient;
