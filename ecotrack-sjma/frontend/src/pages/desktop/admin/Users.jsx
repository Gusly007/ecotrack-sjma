import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard, StatsGrid } from '../../../components/common';
import { Filters, SearchBox, SelectFilter, Pagination, Table, Alert, useAlert } from '../../../components/common';
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
  
  const userColumns = [
    { header: 'Utilisateur', render: (user) => (
      <div className="user-cell">
        <div className={`user-avatar ${user.role_par_defaut === 'ADMIN' ? 'admin-avatar' : ''}`}>
          {user.prenom?.[0]}{user.nom?.[0]}
        </div>
        <strong>{user.prenom} {user.nom}</strong>
      </div>
    )},
    { header: 'Email', accessor: 'email' },
    { header: 'Rôle', render: (user) => (
      <span className={`role-badge ${roleClasses[user.role_par_defaut]}`}>
        {roleLabels[user.role_par_defaut]}
      </span>
    )},
    { header: 'Dernière connexion', render: (user) => user.date_creation ? new Date(user.date_creation).toLocaleDateString('fr-FR') : '-' },
    { header: 'Statut', render: (user) => (
      <div className="status-cell">
        <span className={`status-dot ${user.est_active ? 'active' : 'disabled'}`}></span>
        {user.est_active ? 'Actif' : 'Désactivé'}
      </div>
    )},
    { header: 'Actions', render: (user) => (
      <button className="btn-primary btn-sm" onClick={() => navigate(`/admin/users/${user.id_utilisateur}`)}>Gérer</button>
    )},
  ];

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { alert, showError } = useAlert();

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
    } catch (err) {
      console.error('Failed to load users:', err);
      showError('Erreur de chargement des utilisateurs');
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

  return (
    <div className="users-page">
      <div className="users-header">
        <h2 className="page-title">Gestion des Utilisateurs</h2>
        <button className="btn-primary btn-sm" onClick={() => navigate('/admin/users/create')}>
          <i className="fas fa-plus"></i> Créer un utilisateur
        </button>
      </div>

      <StatsGrid>
        <StatCard 
          icon="fa-users" 
          iconColor="blue" 
          label="Total utilisateurs" 
          value={stats.total.toLocaleString()} 
        />
        <StatCard 
          icon="fa-user" 
          iconColor="green" 
          label="Citoyens" 
          value={stats.citoyens.toLocaleString()} 
        />
        <StatCard 
          icon="fa-truck" 
          iconColor="orange" 
          label="Agents" 
          value={stats.agents} 
        />
        <StatCard 
          icon="fa-user-shield" 
          iconColor="purple" 
          label="Gestionnaires / Admins" 
          value={`${stats.gestionnaires} / ${stats.admins}`} 
        />
      </StatsGrid>

      <div className="panel">
        {loading ? (
          <div className="loading-state"><i className="fas fa-spinner fa-spin"></i> Chargement...</div>
        ) : (
          <>
            {alert && <Alert type={alert.type} message={alert.message} />}
            <Filters>
              <SearchBox 
                value={search} 
                onChange={(value) => { setSearch(value); setCurrentPage(1); }} 
                placeholder="Rechercher un utilisateur..." 
              />
              <SelectFilter 
                value={roleFilter}
                onChange={(value) => { setRoleFilter(value); setCurrentPage(1); }}
                options={[
                  { value: 'all', label: 'Tous les rôles' },
                  { value: 'CITOYEN', label: 'Citoyen' },
                  { value: 'AGENT', label: 'Agent' },
                  { value: 'GESTIONNAIRE', label: 'Gestionnaire' },
                  { value: 'ADMIN', label: 'Admin' }
                ]}
              />
              <SelectFilter 
                value={statusFilter}
                onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}
                options={[
                  { value: 'all', label: 'Tous' },
                  { value: 'active', label: 'Actifs' },
                  { value: 'disabled', label: 'Désactivés' }
                ]}
              />
            </Filters>

        <Table columns={userColumns} data={paginatedUsers} />

        {totalPages > 1 && (
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            showingTo={startIndex + itemsPerPage} 
            totalItems={filteredUsers.length} 
            label="utilisateurs" 
            onPageChange={setCurrentPage} 
          />
        )}
          </>
        )}
      </div>
    </div>
  );
}