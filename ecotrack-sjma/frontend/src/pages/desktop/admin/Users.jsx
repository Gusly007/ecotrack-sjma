import { useState, useEffect, useCallback } from 'react';
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
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userCounts, setUserCounts] = useState({ citoyens: 0, agents: 0, gestionnaires: 0, admins: 0 });
  const itemsPerPage = 5;
  const { alert, showError } = useAlert();

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchQuery, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setUsers([]);
      
      let estActiveValue = undefined;
      if (statusFilter === 'active') estActiveValue = 'true';
      else if (statusFilter === 'disabled') estActiveValue = 'false';
      
      const params = [];
      if (currentPage) params.push(`page=${currentPage}`);
      if (itemsPerPage) params.push(`limit=${itemsPerPage}`);
      if (roleFilter !== 'all') params.push(`role=${roleFilter}`);
      if (searchQuery) params.push(`search=${searchQuery}`);
      if (estActiveValue) params.push(`est_active=${estActiveValue}`);
      
      console.log('Request URL:', '/users?' + params.join('&'));
      
      const response = await userService.getAll({
        page: currentPage,
        limit: itemsPerPage,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        search: searchQuery || undefined,
        est_active: estActiveValue
      });
      
      const userData = response.data || response;
      const pagination = response.pagination;
      const total = pagination?.total || 0;

      const allUsersResponse = total > 0
        ? await userService.getAll({
            page: 1,
            limit: total,
            role: roleFilter !== 'all' ? roleFilter : undefined,
            search: searchQuery || undefined,
            est_active: estActiveValue
          }).catch(() => null)
        : null;

      const usersForCounts = allUsersResponse?.data || userData || [];
      
      setUsers(userData);
      if (pagination) {
        setTotalPages(pagination.pages);
        setTotalItems(pagination.total);
        setTotalUsers(pagination.total);
      }
      setUserCounts({
        citoyens: usersForCounts.filter(u => u.role_par_defaut === 'CITOYEN').length,
        agents: usersForCounts.filter(u => u.role_par_defaut === 'AGENT').length,
        gestionnaires: usersForCounts.filter(u => u.role_par_defaut === 'GESTIONNAIRE').length,
        admins: usersForCounts.filter(u => u.role_par_defaut === 'ADMIN').length
      });
    } catch (err) {
      console.error('Failed to load users:', err);
      showError('Erreur de chargement des utilisateurs');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const paginatedUsers = users;
  const filteredUsers = users;

  const stats = {
    total: totalUsers,
    citoyens: userCounts.citoyens,
    agents: userCounts.agents,
    gestionnaires: userCounts.gestionnaires,
    admins: userCounts.admins
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
                value={searchInput} 
                onChange={(value) => setSearchInput(value)}
                onSubmit={handleSearchSubmit}
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

        {users.length === 0 && !loading ? (
          <div className="empty-state">
            <i className="fas fa-user-slash"></i>
            <p>
              {statusFilter === 'disabled' 
                ? 'Aucun utilisateur désactivé' 
                : statusFilter === 'active' 
                  ? 'Aucun utilisateur actif' 
                  : 'Aucun utilisateur trouvé'}
            </p>
          </div>
        ) : (
          <>
            <Table columns={userColumns} data={paginatedUsers} />

            {totalPages > 1 && (
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                showingTo={Math.min(currentPage * itemsPerPage, totalItems)} 
                totalItems={totalItems} 
                label="utilisateurs" 
                onPageChange={setCurrentPage} 
              />
            )}
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
}