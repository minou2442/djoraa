import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CreatePermission from '../components/CreatePermission';
import PermissionList from '../components/PermissionList';

const PermissionsPage: React.FC = () => {
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePermissionCreated = () => {
    setRefreshKey(refreshKey + 1);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>{t('permissions.title')}</h1>
      <CreatePermission onPermissionCreated={handlePermissionCreated} />
      <PermissionList key={refreshKey} />
    </div>
  );
};

export default PermissionsPage;
