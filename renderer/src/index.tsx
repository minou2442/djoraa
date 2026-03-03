import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from './i18n/i18next';
import { applyDirectionToDocument } from './styles/theme';
import './styles/global.css';
import RolesPage from './pages/RolesPage';
import PermissionsPage from './pages/PermissionsPage';
import FilesPage from './pages/FilesPage';
import PatientsPage from './components/PatientsPage';
import LanguageSwitcher from './components/LanguageSwitcher';

const App: React.FC = () => {
  const { t, i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    applyDirectionToDocument((i18nInstance.language as any) || 'fr');
  }, [i18nInstance.language]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{ backgroundColor: '#f0f0f0', padding: '16px', marginBottom: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{t('app_name')}</h1>
            <LanguageSwitcher />
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/" style={{ textDecoration: 'none', color: '#0066cc' }}>{t('navigation.home')}</Link>
            <Link to="/roles" style={{ textDecoration: 'none', color: '#0066cc' }}>{t('navigation.roles')}</Link>
            <Link to="/permissions" style={{ textDecoration: 'none', color: '#0066cc' }}>{t('navigation.permissions')}</Link>
            <Link to="/files" style={{ textDecoration: 'none', color: '#0066cc' }}>{t('navigation.files')}</Link>
            <Link to="/patients" style={{ textDecoration: 'none', color: '#0066cc' }}>{t('navigation.patients')}</Link>
          </div>
        </div>
      </nav>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/permissions" element={<PermissionsPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/patients/*" element={<PatientsPage />} />
        </Routes>
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '20px' }}>
      <h1>{t('welcome')}</h1>
      <p>{t('app_name')}</p>
      <p>This is the main dashboard of DJORAA - the integrated medical ERP platform.</p>
    </div>
  );
};

const RootApp = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<RootApp />);
}