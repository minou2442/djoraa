import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PatientList from './PatientList';
import CreatePatient from './CreatePatient';
import PatientDetail from './PatientDetail';
import EditPatient from './EditPatient';
import './PatientsPage.css';

/**
 * PatientsPage - Main patient management module container
 * Handles routing between Patient List, Create, Detail, and Edit views
 */
const PatientsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine page title based on current route
  const getPageTitle = () => {
    if (location.pathname.includes('/new')) {
      return t('create_new_patient');
    } else if (location.pathname.match(/\/patients\/[^/]+\/edit/)) {
      return t('edit_patient');
    } else if (location.pathname.match(/\/patients\/[^/]+(?!\/edit)/)) {
      return t('patient_details');
    } else {
      return t('patients');
    }
  };

  return (
    <div className="patients-page">
      <div className="patients-container">
        <Routes>
          {/* List View */}
          <Route path="/" element={<PatientList />} />

          {/* Create View */}
          <Route path="/new" element={<CreatePatient />} />

          {/* Detail View */}
          <Route path="/:patientId" element={<PatientDetail />} />

          {/* Edit View */}
          <Route path="/:patientId/edit" element={<EditPatient />} />
        </Routes>
      </div>
    </div>
  );
};

export default PatientsPage;
