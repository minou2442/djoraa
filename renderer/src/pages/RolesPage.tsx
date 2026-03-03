import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CreateRole from '../components/CreateRole';
import RoleList from '../components/RoleList';

const RolesPage: React.FC = () => {
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRoleCreated = () => {
    setRefreshKey(refreshKey + 1);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>{t('roles.title')}</h1>
      <CreateRole onRoleCreated={handleRoleCreated} />
      <RoleList key={refreshKey} />
    </div>
  );
};

export default RolesPage;
