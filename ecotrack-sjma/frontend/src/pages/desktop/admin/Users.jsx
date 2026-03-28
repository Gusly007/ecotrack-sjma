import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/desktop/admin/AdminLayout';
import { userService } from '../../../services/userService';
import './Users.css';

const roleLabels = {
  CITOYEN: 'Citoyen',
  AGENT: 'Agent',
  GESTIONNAIRE: 'Gestionnaire',
  ADMIN: 'Admin'
};

const roleClasses = {
  CITOYEN: 'citoyen',
  AGENT: 'agent',
  GESTIONNAIRE: 'gestionnaire',
  ADMIN: 'admin'
};

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userService.getAll();
      console.log('API Response:', response);
      const userData = Array.isArray(response) ? response : (response.data || []);
      console.log('Users loaded:', userData.length);
      setUsers(userData);
      setError(null);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Erreur de chargement des utilisateurs');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.prenom || ''} ${user.nom || ''}`.toLowerCase();
    const matchSearch = fullName.includes(search.toLowerCase()) || 
                        (user.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || user.role_par_defaut === roleFilter;
    const matchStatus = statusFilter === 'all' || 
                        (statusFilter === 'active' && user.est_active) ||
                        (statusFilter === 'disabled' && !user.est_active);
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: users.length,
    citoyens: users.filter(u => u.role_par_defaut === 'CITOYEN').length,
    agents: users.filter(u => u.role_par_defaut === 'AGENT').length,
    gestionnaires: users.filter(u => u.role_par_defaut === 'GESTIONNAIRE').length,
    admins: users.filter(u => u.role_par_defaut === 'ADMIN').length
  };

  const getInitials = (user) => {
    const first = user.prenom?.[0] || '';
    const last = user.nom?.[0] || '';
    return (first + last).toUpperCase();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`page-btn ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <AdminLayout>
      <div className="users-header">
        <h2 className="page-title">Gestion des Utilisateurs</h2>
        <button className="btn-primary btn-sm" onClick={() => navigate('/admin/users/create')}>
          <i className="fas fa-plus"></i> Créer un utilisateur
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total utilisateurs</div>
          <div className="stat-value">{stats.total.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Citoyens</div>
          <div className="stat-value" style={{ color: '#4CAF50' }}>{stats.citoyens.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Agents</div>
          <div className="stat-value" style={{ color: '#FF9800' }}>{stats.agents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gestionnaires / Admins</div>
          <div className="stat-value" style={{ color: '#2196F3' }}>{stats.gestionnaires} / {stats.admins}</div>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading-state"><i className="fas fa-spinner fa-spin"></i> Chargement...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : (
          <>
            <div className="filters-bar">
          <div className="search-input">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select 
            className="form-select" 
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Tous les rôles</option>
            <option value="CITOYEN">Citoyen</option>
            <option value="AGENT">Agent</option>
            <option value="GESTIONNAIRE">Gestionnaire</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select 
            className="form-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="disabled">Désactivés</option>
          </select>
        </div>

        <table className="users-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Dernière connexion</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map(user => (
              <tr key={user.id_utilisateur}>
                <td>
                  <div className="user-cell">
                    <div className={`user-avatar ${user.role_par_defaut === 'ADMIN' ? 'admin-avatar' : ''}`}>
                      {getInitials(user)}
                    </div>
                    <strong>{user.prenom} {user.nom}</strong>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${roleClasses[user.role_par_defaut]}`}>
                    {roleLabels[user.role_par_defaut]}
                  </span>
                </td>
                <td>{user.date_creation ? new Date(user.date_creation).toLocaleDateString('fr-FR') : '-'}</td>
                <td>
                  <div className="status-cell">
                    <span className={`status-dot ${user.est_active ? 'active' : 'disabled'}`}></span>
                    {user.est_active ? 'Actif' : 'Désactivé'}
                  </div>
                </td>
                <td>
                  <button className="btn-primary btn-sm">Gérer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i> Précédent
            </button>
            {renderPagination()}
            <button 
              className="page-btn" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}