import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import PDFViewer from '../components/PDFViewer';
import BackupManager from '../components/BackupManager';

interface User {
  id: number;
  clinic_id: number;
  role?: string;
}

interface FilesPageProps {
  user?: User;
}

const FilesPage: React.FC<FilesPageProps> = ({ user = { id: 1, clinic_id: 1, role: 'clinic_admin' } }) => {
  const { t } = useTranslation();
  const [refreshFiles, setRefreshFiles] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'files' | 'pdf' | 'backup'>('upload');

  const handleUploadSuccess = () => {
    setRefreshFiles(!refreshFiles);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>{t('navigation.files', 'Files')}</h1>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '2px solid #ddd', marginBottom: '20px' }}>
        {(['upload', 'files', 'pdf', 'backup'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === tab ? '#007bff' : '#f0f0f0',
              color: activeTab === tab ? 'white' : '#333',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 'bold' : 'normal'
            }}
          >
            {t(`common.${tab}`) || tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <FileUpload
          clinicId={user.clinic_id}
          userId={user.id}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Files Tab */}
      {activeTab === 'files' && (
        <FileList
          clinicId={user.clinic_id}
          refresh={refreshFiles}
          onRefreshComplete={() => setRefreshFiles(false)}
        />
      )}

      {/* PDF Generator Tab */}
      {activeTab === 'pdf' && (
        <div>
          <PDFViewer
            template="prescription"
            data={{
              clinicName: 'Clinic Name',
              clinicAddress: '123 Main St',
              patientName: 'John Doe',
              patientAge: 35,
              medications: [
                { name: 'Aspirin', dosage: '500mg', frequency: '2x daily' },
                { name: 'Lisinopril', dosage: '10mg', frequency: '1x daily' }
              ],
              date: new Date().toLocaleDateString(),
              doctorName: 'Dr. Smith'
            }}
            filename="prescription.pdf"
          />
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <BackupManager userRole={user.role} />
      )}
    </div>
  );
};

export default FilesPage;
