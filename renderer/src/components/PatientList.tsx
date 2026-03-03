import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './PatientList.css';

/**
 * PatientList - Displays list of patients with search and filtering
 */
const PatientList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);

  const itemsPerPage = 50;

  // Fetch patients
  const fetchPatients = async (page = 1, query = '', patientStatus = 'active') => {
    setLoading(true);
    setError('');

    try {
      const offset = (page - 1) * itemsPerPage;
      let url = `/api/patients?limit=${itemsPerPage}&offset=${offset}&status=${patientStatus}`;

      if (query) {
        url = `/api/patients/search?q=${encodeURIComponent(query)}&limit=${itemsPerPage}&offset=${offset}&status=${patientStatus}`;
      }

      const response = await axios.get(url);
      setPatients(response.data.patients);
      setTotalPatients(response.data.total);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.response?.data?.error || `${t('error')} loading patients`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(1, searchQuery, status);
  }, [status]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(1, searchQuery, status);
  };

  // Navigate to patient detail
  const goToPatient = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  // Navigate to create patient
  const goToCreatePatient = () => {
    navigate('/patients/new');
  };

  const totalPages = Math.ceil(totalPatients / itemsPerPage);

  return (
    <div className="patient-list">
      <div className="patient-list-header">
        <h1>{t('patients')}</h1>
        <button className="btn-primary" onClick={goToCreatePatient}>
          {t('add_patient')}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Search and Filter */}
      <div className="patient-list-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder={t('search_patients')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-secondary">
            {t('search')}
          </button>
          <button type="button" className="btn-secondary" onClick={() => {
            setSearchQuery('');
            fetchPatients(1, '', status);
          }}>
            {t('clear')}
          </button>
        </form>

        <div className="status-filter">
          <label>{t('status')}:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">{t('active')}</option>
            <option value="archived">{t('archived')}</option>
            <option value="all">{t('all')}</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      {loading ? (
        <div className="loading">{t('loading')}...</div>
      ) : (
        <>
          <div className="patients-table-container">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>{t('patient_number')}</th>
                  <th>{t('name')}</th>
                  <th>{t('national_id')}</th>
                  <th>{t('phone')}</th>
                  <th>{t('blood_group')}</th>
                  <th>{t('status')}</th>
                  <th>{t('created_at')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center">
                      {t('no_patients_found')}
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr key={patient.id} className="patient-row">
                      <td>
                        <strong>{patient.patient_number}</strong>
                      </td>
                      <td>
                        {patient.first_name} {patient.last_name}
                      </td>
                      <td>{patient.national_id}</td>
                      <td>{patient.phone || '-'}</td>
                      <td>
                        <span className="blood-group-badge">{patient.blood_group || '-'}</span>
                      </td>
                      <td>
                        <span className={`status-badge status-${patient.status}`}>
                          {t(patient.status)}
                        </span>
                      </td>
                      <td>{new Date(patient.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn-small btn-primary"
                          onClick={() => goToPatient(patient.id)}
                        >
                          {t('view')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => fetchPatients(1, searchQuery, status)}
                disabled={currentPage === 1}
                className="btn-small"
              >
                {t('first')}
              </button>
              <button
                onClick={() => fetchPatients(currentPage - 1, searchQuery, status)}
                disabled={currentPage === 1}
                className="btn-small"
              >
                {t('previous')}
              </button>
              <span className="page-info">
                {t('page')} {currentPage} {t('of')} {totalPages}
              </span>
              <button
                onClick={() => fetchPatients(currentPage + 1, searchQuery, status)}
                disabled={currentPage === totalPages}
                className="btn-small"
              >
                {t('next')}
              </button>
              <button
                onClick={() => fetchPatients(totalPages, searchQuery, status)}
                disabled={currentPage === totalPages}
                className="btn-small"
              >
                {t('last')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PatientList;
