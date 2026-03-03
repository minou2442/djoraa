import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import AllergyForm from './AllergyForm';
import InsuranceForm from './InsuranceForm';
import DiseaseForm from './DiseaseForm';
import ContactForm from './ContactForm';
import DocumentUpload from './DocumentUpload';
import './PatientDetail.css';

interface PatData {
  id: string;
  clinic_id: string;
  patient_number: string;
  national_id: string;
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
  created_at: string;
  updated_at: string;
  archived_at?: string;
  created_by: string;
  updated_by?: string;
  photo_url?: string;
}

interface Insurance {
  id: string;
  patient_id: string;
  insurance_provider: string;
  policy_number: string;
  group_number?: string;
  coverage_type: string;
  copay?: number;
  deductible?: number;
  policy_start_date: string;
  policy_expiry_date?: string;
  is_active: boolean;
}

interface Allergy {
  id: string;
  patient_id: string;
  allergy_name: string;
  allergy_type: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction_description?: string;
}

interface Disease {
  id: string;
  patient_id: string;
  disease_name: string;
  icd10_code: string;
  diagnosis_date: string;
  status: string;
  current_medication?: string;
}

interface EmergencyContact {
  id: string;
  patient_id: string;
  contact_name: string;
  relationship: string;
  phone: string;
  priority: number;
}

interface Document {
  id: string;
  patient_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  uploaded_by: string;
  document_date: string;
}

interface Visit {
  id: string;
  patient_id: string;
  visit_date: string;
  visit_type: string;
  chief_complaint: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
}

const PatientDetail: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [patient, setPatient] = useState<PatData | null>(null);
  const [insurance, setInsurance] = useState<Insurance[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);

  // form modals
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [editingAllergyId, setEditingAllergyId] = useState<string | null>(null);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [editingInsuranceId, setEditingInsuranceId] = useState<string | null>(null);
  const [showDiseaseForm, setShowDiseaseForm] = useState(false);
  const [editingDiseaseId, setEditingDiseaseId] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  // refresh data after modifications
  const refreshPatient = async () => {
    if (!patientId) return;
    try {
      const res = await axios.get(`/api/patients/${patientId}`);
      const patData = res.data.patient;
      setPatient(patData);
      setInsurance(patData.insurance || []);
      setAllergies(patData.allergies || []);
      setDiseases(patData.chronic_diseases || []);
      setContacts(patData.emergency_contacts || []);
      setDocuments(patData.documents || []);
      setVisits(patData.visits || []);
    } catch (err) {
      // ignore
    }
  };

  // Fetch patient data
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/patients/${patientId}`);
        const patData = response.data.patient;

        setPatient(patData);
        setInsurance(patData.insurance || []);
        setAllergies(patData.allergies || []);
        setDiseases(patData.chronic_diseases || []);
        setContacts(patData.emergency_contacts || []);
        setDocuments(patData.documents || []);
        setVisits(patData.visits || []);

        setError('');
      } catch (err: any) {
        setError(err.response?.data?.error || t('failed_to_load_patient'));
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId, t]);

  // Handle delete patient
  const handleDelete = async () => {
    try {
      await axios.delete(`/api/patients/${patientId}`);
      navigate('/patients');
    } catch (err: any) {
      setError(err.response?.data?.error || t('failed_to_delete_patient'));
      setDeleteModal(false);
    }
  };

  if (loading) {
    return <div className="patient-detail"><div className="loading">{t('loading')}</div></div>;
  }

  if (!patient) {
    return <div className="patient-detail"><div className="alert alert-error">{error}</div></div>;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'severity-mild';
      case 'moderate': return 'severity-moderate';
      case 'severe': return 'severity-severe';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'archived': return 'status-archived';
      case 'deceased': return 'status-deceased';
      case 'transferred': return 'status-transferred';
      default: return '';
    }
  };

  return (
    <div className="patient-detail">
      <div className="patient-header">
        <div className="header-info">
          <h1>{patient.first_name} {patient.last_name}</h1>
          <p className="patient-number">{patient.patient_number}</p>
        </div>

        <div className="header-actions">
          <span className={`status-badge ${getStatusColor(patient.status)}`}>
            {t(patient.status)}
          </span>
          {patient.blood_group && (
            <span className="blood-group-badge">{patient.blood_group}</span>
          )}
          <button className="btn-secondary" onClick={() => navigate('/patients')}>
            {t('back')}
          </button>
          <button
            className="btn-danger"
            onClick={() => setDeleteModal(true)}
          >
            {t('delete_patient')}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          {t('profile')}
        </button>
        <button
          className={`tab ${activeTab === 'insurance' ? 'active' : ''}`}
          onClick={() => setActiveTab('insurance')}
        >
          {t('insurance')} ({insurance.length})
        </button>
        <button
          className={`tab ${activeTab === 'allergies' ? 'active' : ''}`}
          onClick={() => setActiveTab('allergies')}
        >
          {t('allergies')} ({allergies.length})
        </button>
        <button
          className={`tab ${activeTab === 'diseases' ? 'active' : ''}`}
          onClick={() => setActiveTab('diseases')}
        >
          {t('chronic_diseases')} ({diseases.length})
        </button>
        <button
          className={`tab ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          {t('emergency_contacts')} ({contacts.length})
        </button>
        <button
          className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          {t('documents')} ({documents.length})
        </button>
        <button
          className={`tab ${activeTab === 'visits' ? 'active' : ''}`}
          onClick={() => setActiveTab('visits')}
        >
          {t('visits')} ({visits.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="profile-tab">
            <div className="profile-section">
              <h2>{t('personal_information')}</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">{t('national_id')}</span>
                  <span className="value">{patient.national_id}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('first_name')}</span>
                  <span className="value">{patient.first_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('middle_name')}</span>
                  <span className="value">{patient.middle_name || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('last_name')}</span>
                  <span className="value">{patient.last_name}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('date_of_birth')}</span>
                  <span className="value">{new Date(patient.date_of_birth).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('gender')}</span>
                  <span className="value">{t(patient.gender)}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('blood_group')}</span>
                  <span className="value">{patient.blood_group || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('marital_status')}</span>
                  <span className="value">{patient.marital_status || '-'}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2>{t('contact_information')}</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">{t('phone')}</span>
                  <span className="value">{patient.phone || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('email')}</span>
                  <span className="value">{patient.email || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('address')}</span>
                  <span className="value">{patient.address || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('city')}</span>
                  <span className="value">{patient.city || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('postal_code')}</span>
                  <span className="value">{patient.postal_code || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">{t('country')}</span>
                  <span className="value">{patient.country || '-'}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2>{t('professional_information')}</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">{t('occupation')}</span>
                  <span className="value">{patient.occupation || '-'}</span>
                </div>
              </div>
            </div>

            {patient.notes && (
              <div className="profile-section">
                <h2>{t('notes')}</h2>
                <p>{patient.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Insurance Tab */}
        {activeTab === 'insurance' && (
          <div className="list-tab">
            <div className="section-actions">
            <button className="btn-primary btn-small" onClick={() => { setEditingInsuranceId(null); setShowInsuranceForm(true); }}>
              {t('add_insurance')}
            </button>
          </div>
        {insurance.length === 0 ? (
              <p className="empty-message">{t('no_insurance_records')}</p>
            ) : (
              <div className="records-list">
                {insurance.map(ins => (
                  <div key={ins.id} className="record-card">
                    <div className="record-header">
                      <h3>{ins.insurance_provider}</h3>
                      <span className={`active-badge ${ins.is_active ? 'active' : 'inactive'}`}>
                        {ins.is_active ? t('active') : t('inactive')}
                      </span>
                    </div>
                    <div className="record-content">
                      <p><strong>{t('policy_number')}:</strong> {ins.policy_number}</p>
                      {ins.group_number && (
                        <p><strong>{t('group_number')}:</strong> {ins.group_number}</p>
                      )}
                      <p><strong>{t('coverage_type')}:</strong> {ins.coverage_type}</p>
                      {ins.copay && <p><strong>{t('copay')}:</strong> ${ins.copay}</p>}
                      {ins.deductible && <p><strong>{t('deductible')}:</strong> ${ins.deductible}</p>}
                      <p><strong>{t('policy_period')}:</strong> {new Date(ins.policy_start_date).toLocaleDateString()} 
                        {ins.policy_expiry_date ? ` - ${new Date(ins.policy_expiry_date).toLocaleDateString()}` : ' - ' + t('lifetime')}</p>
                    </div>
                    <div className="card-actions">
                      <button className="btn-secondary btn-small" onClick={() => { setEditingInsuranceId(ins.id); setShowInsuranceForm(true); }}>
                        {t('edit')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          {showInsuranceForm && (
            <InsuranceForm
              patientId={patientId!}
              insuranceId={editingInsuranceId || undefined}
              onClose={() => { setShowInsuranceForm(false); setEditingInsuranceId(null); }}
              onSaved={refreshPatient}
            />
          )}
          </div>
        )}

        {/* Allergies Tab */}
        {activeTab === 'allergies' && (
          <div className="list-tab">
            <div className="section-actions">
            <button className="btn-primary btn-small" onClick={() => { setEditingAllergyId(null); setShowAllergyForm(true); }}>
              {t('add_allergy')}
            </button>
          </div>
        {allergies.length === 0 ? (
              <p className="empty-message">{t('no_allergies')}</p>
            ) : (
              <div className="records-list">
                {allergies.map(allergy => (
                  <div key={allergy.id} className="record-card">
                    <div className="record-header">
                      <h3>{allergy.allergy_name}</h3>
                      <span className={`severity-badge ${getSeverityColor(allergy.severity)}`}>
                        {t(allergy.severity)}
                      </span>
                    </div>
                    <div className="record-content">
                      <p><strong>{t('type')}:</strong> {allergy.allergy_type}</p>
                      {allergy.reaction_description && (
                        <p><strong>{t('reaction')}:</strong> {allergy.reaction_description}</p>
                      )}
                    </div>
                    <div className="card-actions">
                      <button className="btn-secondary btn-small" onClick={() => { setEditingAllergyId(allergy.id); setShowAllergyForm(true); }}>
                        {t('edit')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          {showAllergyForm && (
            <AllergyForm
              patientId={patientId!}
              allergyId={editingAllergyId || undefined}
              onClose={() => { setShowAllergyForm(false); setEditingAllergyId(null); }}
              onSaved={refreshPatient}
            />
          )}
          </div>
        )}

        {/* Diseases Tab */}
        {activeTab === 'diseases' && (
          <div className="list-tab">
            <div className="section-actions">
            <button className="btn-primary btn-small" onClick={() => { setEditingDiseaseId(null); setShowDiseaseForm(true); }}>
              {t('add_disease')}
            </button>
          </div>
        {diseases.length === 0 ? (
              <p className="empty-message">{t('no_chronic_diseases')}</p>
            ) : (
              <div className="records-list">
                {diseases.map(disease => (
                  <div key={disease.id} className="record-card">
                    <div className="record-header">
                      <h3>{disease.disease_name}</h3>
                      <span className="icd10-code">{disease.icd10_code}</span>
                    </div>
                    <div className="record-content">
                      <p><strong>{t('diagnosis_date')}:</strong> {new Date(disease.diagnosis_date).toLocaleDateString()}</p>
                      <p><strong>{t('status')}:</strong> {t(disease.status)}</p>
                      {disease.current_medication && (
                        <p><strong>{t('current_medication')}:</strong> {disease.current_medication}</p>
                      )}
                    </div>
                    <div className="card-actions">
                      <button className="btn-secondary btn-small" onClick={() => { setEditingDiseaseId(disease.id); setShowDiseaseForm(true); }}>
                        {t('edit')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          {showDiseaseForm && (
            <DiseaseForm
              patientId={patientId!}
              diseaseId={editingDiseaseId || undefined}
              onClose={() => { setShowDiseaseForm(false); setEditingDiseaseId(null); }}
              onSaved={refreshPatient}
            />
          )}
          </div>
        )}

        {/* Emergency Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="list-tab">
            <div className="section-actions">
            <button className="btn-primary btn-small" onClick={() => { setEditingContactId(null); setShowContactForm(true); }}>
              {t('add_contact')}
            </button>
          </div>
        {contacts.length === 0 ? (
              <p className="empty-message">{t('no_emergency_contacts')}</p>
            ) : (
              <div className="records-list">
                {contacts.map(contact => (
                  <div key={contact.id} className="record-card">
                    <div className="record-header">
                      <h3>{contact.contact_name}</h3>
                      {contact.priority === 1 && (
                        <span className="priority-badge">{t('primary')}</span>
                      )}
                    </div>
                    <div className="record-content">
                      <p><strong>{t('relationship')}:</strong> {contact.relationship}</p>
                      <p><strong>{t('phone')}:</strong> {contact.phone}</p>
                      {contact.priority > 1 && (
                        <p><strong>{t('priority')}:</strong> {contact.priority}</p>
                      )}
                    </div>
                    <div className="card-actions">
                      <button className="btn-secondary btn-small" onClick={() => { setEditingContactId(contact.id); setShowContactForm(true); }}>
                        {t('edit')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          {showContactForm && (
            <ContactForm
              patientId={patientId!}
              contactId={editingContactId || undefined}
              onClose={() => { setShowContactForm(false); setEditingContactId(null); }}
              onSaved={refreshPatient}
            />
          )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="list-tab">
            <div className="section-actions">
            <button className="btn-primary btn-small" onClick={() => setShowDocumentUpload(true)}>
              {t('upload_document')}
            </button>
          </div>
        {documents.length === 0 ? (
              <p className="empty-message">{t('no_documents')}</p>
            ) : (
              <div className="records-list">
                {documents.map(doc => (
                  <div key={doc.id} className="record-card">
                    <div className="record-header">
                      <h3>{doc.file_name}</h3>
                      <span className="doc-type">{doc.document_type}</span>
                    </div>
                    <div className="record-content">
                      <p><strong>{t('document_date')}:</strong> {new Date(doc.document_date).toLocaleDateString()}</p>
                      <p><strong>{t('uploaded_by')}:</strong> {doc.uploaded_by}</p>
                      <button
                        className="btn-primary btn-small"
                        onClick={() => window.open(doc.file_path, '_blank')}
                      >
                        {t('download')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          {showDocumentUpload && (
            <DocumentUpload
              patientId={patientId!}
              onClose={() => setShowDocumentUpload(false)}
              onUploaded={refreshPatient}
            />
          )}
          </div>
        )}

        {/* Visits Tab */}
        {activeTab === 'visits' && (
          <div className="list-tab">
            {visits.length === 0 ? (
              <p className="empty-message">{t('no_visits')}</p>
            ) : (
              <div className="records-list">
                {visits.map(visit => (
                  <div key={visit.id} className="record-card">
                    <div className="record-header">
                      <h3>{new Date(visit.visit_date).toLocaleDateString()} - {visit.visit_type}</h3>
                    </div>
                    <div className="record-content">
                      <p><strong>{t('chief_complaint')}:</strong> {visit.chief_complaint}</p>
                      {visit.diagnosis && <p><strong>{t('diagnosis')}:</strong> {visit.diagnosis}</p>}
                      {visit.treatment && <p><strong>{t('treatment')}:</strong> {visit.treatment}</p>}
                      {visit.prescription && <p><strong>{t('prescription')}:</strong> {visit.prescription}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{t('confirm_delete')}</h2>
            <p>{t('delete_patient_confirm', { name: `${patient.first_name} ${patient.last_name}` })}</p>
            <div className="modal-actions">
              <button
                className="btn-danger"
                onClick={handleDelete}
              >
                {t('delete')}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setDeleteModal(false)}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetail;
