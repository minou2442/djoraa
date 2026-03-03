import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface DashboardStats {
  users?: number;
  roles?: number;
  permissions?: number;
  files?: number;
}

interface SystemHealth {
  status: string;
  timestamp: string;
  checks: {
    database: { status: string; responseTime?: string };
    diskSpace: { status: string; free?: string; percentage?: string };
    memory: { status: string; percentage?: string };
  };
}

interface DashboardPageProps {
  user: {
    id: number;
    clinic_id: number;
    role: string;
    username: string;
  };
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats>({});
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get clinic stats
      const statsResponse = await api.get(`/clinics/${user.clinic_id}/stats`);
      setStats(statsResponse.data);

      // Get system health
      const healthResponse = await api.get('/health/detailed');
      setHealth(healthResponse.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#28a745';
      case 'warning': return '#ffc107';
      case 'unhealthy': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>{t('navigation.dashboard')}</h1>
      
      {/* Welcome Message */}
      <div style={{ marginBottom: '30px' }}>
        <p style={{ fontSize: '16px', color: '#666' }}>
          {t('welcome')}, <strong>{user.username}</strong>!
        </p>
        <p style={{ fontSize: '14px', color: '#999' }}>
          {t('common.clinic_id')}: {user.clinic_id} | {t('navigation.roles')}: {user.role}
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px', color: '#666', fontSize: '14px' }}>
            {t('navigation.users')}
          </h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#0066cc' }}>
            {loading ? '...' : stats.users || 0}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px', color: '#666', fontSize: '14px' }}>
            {t('navigation.roles')}
          </h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
            {loading ? '...' : stats.roles || 0}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px', color: '#666', fontSize: '14px' }}>
            {t('navigation.permissions')}
          </h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#ffc107' }}>
            {loading ? '...' : stats.permissions || 0}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px', color: '#666', fontSize: '14px' }}>
            {t('common.files')}
          </h3>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>
            {loading ? '...' : stats.files || 0}
          </p>
        </div>
      </div>

      {/* System Health */}
      <h2 style={{ marginBottom: '20px' }}>État du Système / System Status</h2>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : health ? (
          <div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '20px',
              padding: '10px',
              backgroundColor: getHealthColor(health.status) + '20',
              borderRadius: '4px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: getHealthColor(health.status),
                marginRight: '10px'
              }} />
              <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                {health.status}
              </span>
              <span style={{ marginLeft: 'auto', color: '#666', fontSize: '14px' }}>
                {new Date(health.timestamp).toLocaleString()}
              </span>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              {/* Database */}
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 10px', color: '#666' }}>Base de données</h4>
                <p style={{ margin: 0, color: getHealthColor(health.checks.database.status) }}>
                  {health.checks.database.status}
                  {health.checks.database.responseTime && ` (${health.checks.database.responseTime})`}
                </p>
              </div>

              {/* Disk Space */}
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 10px', color: '#666' }}>Espace Disque</h4>
                <p style={{ margin: 0, color: getHealthColor(health.checks.diskSpace.status) }}>
                  {health.checks.diskSpace.status}
                  {health.checks.diskSpace.free && ` - ${health.checks.diskSpace.free} libre`}
                </p>
              </div>

              {/* Memory */}
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 10px', color: '#666' }}>Mémoire</h4>
                <p style={{ margin: 0, color: getHealthColor(health.checks.memory.status) }}>
                  {health.checks.memory.status}
                  {health.checks.memory.percentage && ` (${health.checks.memory.percentage})`}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#dc3545' }}>Erreur de chargement / Failed to load</p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
