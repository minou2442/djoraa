import React from 'react';
import { useTranslation } from 'react-i18next';
import { applyDirectionToDocument } from '../styles/theme';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (lang: 'fr' | 'ar') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    applyDirectionToDocument(lang);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button
        onClick={() => handleLanguageChange('fr')}
        style={{
          backgroundColor: i18n.language === 'fr' ? 'var(--primary-color)' : 'transparent',
          color: i18n.language === 'fr' ? 'white' : 'var(--primary-color)',
          border: `2px solid var(--primary-color)`,
          padding: '6px 12px',
          fontWeight: i18n.language === 'fr' ? 'bold' : 'normal'
        }}
      >
        Français
      </button>
      <button
        onClick={() => handleLanguageChange('ar')}
        style={{
          backgroundColor: i18n.language === 'ar' ? 'var(--primary-color)' : 'transparent',
          color: i18n.language === 'ar' ? 'white' : 'var(--primary-color)',
          border: `2px solid var(--primary-color)`,
          padding: '6px 12px',
          fontWeight: i18n.language === 'ar' ? 'bold' : 'normal'
        }}
      >
        العربية
      </button>
    </div>
  );
};

export default LanguageSwitcher;
