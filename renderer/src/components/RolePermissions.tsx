import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Permission {
  id: number;
  name: string;
  description: string;
}

interface RolePermissionsProps {
  roleId: number;
}

const RolePermissions: React.FC<RolePermissionsProps> = ({ roleId }) => {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [assignedPermissions, setAssignedPermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [roleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allRes, assignedRes] = await Promise.all([
        api.get('/permissions'),
        api.get(`/roles/${roleId}/permissions`)
      ]);
      setAllPermissions(allRes.data);
      setAssignedPermissions(assignedRes.data.map((p: Permission) => p.id));
      setError(null);
    } catch (err: any) {
      setError('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = async (permissionId: number, isAssigned: boolean) => {
    try {
      if (isAssigned) {
        await api.delete(`/roles/${roleId}/permissions/${permissionId}`);
        setAssignedPermissions(assignedPermissions.filter(p => p !== permissionId));
      } else {
        await api.post(`/roles/${roleId}/permissions/${permissionId}`);
        setAssignedPermissions([...assignedPermissions, permissionId]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update permission');
    }
  };

  if (loading) return <div>Loading permissions...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', marginTop: '16px' }}>
      <h4>Permissions for Role {roleId}</h4>
      {allPermissions.length === 0 ? (
        <p>No permissions available.</p>
      ) : (
        <div>
          {allPermissions.map((perm) => {
            const isAssigned = assignedPermissions.includes(perm.id);
            return (
              <div key={perm.id} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    onChange={() => handleTogglePermission(perm.id, isAssigned)}
                    style={{ marginRight: '8px' }}
                  />
                  <strong>{perm.name}</strong>
                  {perm.description && <span style={{ marginLeft: '8px' }}>({perm.description})</span>}
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RolePermissions;
