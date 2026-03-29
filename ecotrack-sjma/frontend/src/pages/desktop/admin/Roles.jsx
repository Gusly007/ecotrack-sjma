import './Roles.css';

const permissions = [
  { permission: 'signaler:create', citoyen: true, agent: true, gestionnaire: true, admin: true },
  { permission: 'signaler:read', citoyen: true, agent: true, gestionnaire: true, admin: true },
  { permission: 'tournee:create', citoyen: false, agent: false, gestionnaire: true, admin: true },
  { permission: 'tournee:read', citoyen: false, agent: true, gestionnaire: true, admin: true },
  { permission: 'tournee:update', citoyen: false, agent: true, gestionnaire: true, admin: true },
  { permission: 'containers:update', citoyen: false, agent: true, gestionnaire: true, admin: true },
  { permission: 'users:create', citoyen: false, agent: false, gestionnaire: false, admin: true },
  { permission: 'users:delete', citoyen: false, agent: false, gestionnaire: false, admin: true },
  { permission: 'config:update', citoyen: false, agent: false, gestionnaire: false, admin: true },
  { permission: 'logs:read', citoyen: false, agent: false, gestionnaire: false, admin: true },
  { permission: 'signaler:update', citoyen: false, agent: true, gestionnaire: true, admin: true },
  { permission: 'user:read', citoyen: false, agent: false, gestionnaire: false, admin: true },
  { permission: 'user:update', citoyen: false, agent: false, gestionnaire: false, admin: true },
  { permission: 'zone:read', citoyen: false, agent: false, gestionnaire: true, admin: true },
  { permission: 'zone:create', citoyen: false, agent: false, gestionnaire: true, admin: true },
  { permission: 'zone:update', citoyen: false, agent: false, gestionnaire: true, admin: true },
];

export default function RolesPage() {
  return (
    <div className="roles-page">
      <h2 className="page-title">Rôles & Permissions (RBAC)</h2>
      
      <div className="panel">
        <h3><i className="fas fa-shield-alt" style={{ color: '#2196F3' }}></i> Matrice des permissions</h3>
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Permission</th>
              <th><span className="role-badge citoyen">Citoyen</span></th>
              <th><span className="role-badge agent">Agent</span></th>
              <th><span className="role-badge gestionnaire">Gestionnaire</span></th>
              <th><span className="role-badge admin">Admin</span></th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((row, index) => (
              <tr key={index}>
                <td className="permission-name">{row.permission}</td>
                <td className="permission-cell">
                  <i className={`fas ${row.citoyen ? 'fa-check' : 'fa-times'}`} 
                     style={{ color: row.citoyen ? '#4CAF50' : '#ccc' }}></i>
                </td>
                <td className="permission-cell">
                  <i className={`fas ${row.agent ? 'fa-check' : 'fa-times'}`} 
                     style={{ color: row.agent ? '#4CAF50' : '#ccc' }}></i>
                </td>
                <td className="permission-cell">
                  <i className={`fas ${row.gestionnaire ? 'fa-check' : 'fa-times'}`} 
                     style={{ color: row.gestionnaire ? '#4CAF50' : '#ccc' }}></i>
                </td>
                <td className="permission-cell">
                  <i className={`fas ${row.admin ? 'fa-check' : 'fa-times'}`} 
                     style={{ color: row.admin ? '#4CAF50' : '#ccc' }}></i>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}