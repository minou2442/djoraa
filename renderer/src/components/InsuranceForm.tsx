import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './InsuranceForm.css';

interface InsuranceFormProps {
  patientId: string;
  insuranceId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const InsuranceForm: React.FC<InsuranceFormProps> = ({ patientId, insuranceId, onClose, onSaved }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    insurance_provider: '',
    policy_number: '',
    group_number: '',
    coverage_type: '',
    copay: '',
    deductible: '',
    policy_start_date: '',
    policy_expiry_date: '',
    is_active: true
  });

  const [loading, setLoading] = useState(!!insuranceId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const coverageTypes = ['individual', 'family', 'group', 'employer', 'government'];

  // Fetch insurance data if editing
  useEffect(() => {
    if (insuranceId) {
      const fetchInsurance = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`/api/patients/${patientId}/insurance/${insuranceId}`);
          const insurance = response.data.insurance;
          setFormData({
            insurance_provider: insurance.insurance_provider,
            policy_number: insurance.policy_number,
            group_number: insurance.group_number || '',
            coverage_type: insurance.coverage_type,
            copay: insurance.copay ? insurance.copay.toString() : '',
            deductible: insurance.deductible ? insurance.deductible.toString() : '',
            policy_start_date: insurance.policy_start_date.split('T')[0],
            policy_expiry_date: insurance.policy_expiry_date ? insurance.policy_expiry_date.split('T')[0] : '',
            is_active: insurance.is_active
          });
          setError('');
        } catch (err: any) {
          setError(err.response?.data?.error || t('failed_to_load_insurance'));
        } finally {
          setLoading(false);
        }
      };

      fetchInsurance();
    }
  }, [insuranceId, patientId, t]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.insurance_provider.trim()) {
      setError(t('insurance_provider_required'));
      return false;
    }
    if (!formData.policy_number.trim()) {
      setError(t('policy_number_required'));
      return false;
    }
    if (!formData.coverage_type) {
      setError(t('coverage_type_required'));
      return false;
    }
    if (!formData.policy_start_date) {
      setError(t('policy_start_date_required'));
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
      const submitData = {
        ...formData,
        copay: formData.copay ? parseFloat(formData.copay) : null,
        deductible: formData.deductible ? parseFloat(formData.deductible) : null
      };

      if (insuranceId) {
        await axios.put(`/api/patients/${patientId}/insurance/${insuranceId}`, submitData);
      } else {
        await axios.post(`/api/patients/${patientId}/insurance`, submitData);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || t('failed_to_save_insurance'));
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
          <h2>{insuranceId ? t('edit_insurance') : t('add_insurance')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="insurance-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="insurance_provider">{t('insurance_provider')} *</label>
              <input
                type="text"
                id="insurance_provider"
                name="insurance_provider"
                value={formData.insurance_provider}
                onChange={handleInputChange}
                placeholder={t('enter_insurance_provider')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="policy_number">{t('policy_number')} *</label>
              <input
                type="text"
                id="policy_number"
                name="policy_number"
                value={formData.policy_number}
                onChange={handleInputChange}
                placeholder={t('enter_policy_number')}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="group_number">{t('group_number')}</label>
              <input
                type="text"
                id="group_number"
                name="group_number"
                value={formData.group_number}
                onChange={handleInputChange}
                placeholder={t('enter_group_number')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="coverage_type">{t('coverage_type')} *</label>
              <select
                id="coverage_type"
                name="coverage_type"
                value={formData.coverage_type}
                onChange={handleInputChange}
                required
              >
                <option value="">{t('select_coverage_type')}</option>
                {coverageTypes.map(type => (
                  <option key={type} value={type}>{t(type)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="copay">{t('copay')}</label>
              <input
                type="number"
                id="copay"
                name="copay"
                value={formData.copay}
                onChange={handleInputChange}
                placeholder={t('enter_copay')}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="deductible">{t('deductible')}</label>
              <input
                type="number"
                id="deductible"
                name="deductible"
                value={formData.deductible}
                onChange={handleInputChange}
                placeholder={t('enter_deductible')}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="policy_start_date">{t('policy_start_date')} *</label>
              <input
                type="date"
                id="policy_start_date"
                name="policy_start_date"
                value={formData.policy_start_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="policy_expiry_date">{t('policy_expiry_date')}</label>
              <input
                type="date"
                id="policy_expiry_date"
                name="policy_expiry_date"
                value={formData.policy_expiry_date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              <label htmlFor="is_active">{t('is_active')}</label>
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

export default InsuranceForm;
