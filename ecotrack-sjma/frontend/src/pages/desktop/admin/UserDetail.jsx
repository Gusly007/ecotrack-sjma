import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormGroup, FormRow, Input, Select, Modal, ModalConfirmation } from '../../../components/common';
import { userService } from '../../../services/userService';
import './UserDetail.css';

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

const mockActiviteRecente = [
  { date: '14/01 09:32', action: 'Connexion (iPhone, IP: 78.23.45.12)' },
  { date: '14/01 09:15', action: 'Signalement #SIG-001234 créé' },
  { date: '13/01 18:00', action: 'Défi "Signalement Express" complété (+50 pts)' },
  { date: '13/01 10:00', action: 'Signalement #SIG-001230 créé' },
  { date: '12/01 14:30', action: 'Signalement #SIG-001210 créé' },
  { date: '12/01 14:20', action: 'Échange: Bon de réduction 5EUR (-500 pts)' },
];

const mockStats = {
  ecoPoints: 1250,
  signalements: 23,
  badges: 3,
  defis: 5
};

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDesactivateModal, setShowDesactivateModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const response = await userService.getById(id);
      setUser(response.data || response);
    } catch (err) {
      console.error('Failed to load user:', err);
      setUser({
        prenom: 'Jean',
        nom: 'Dupont',
        email: 'jean.dupont@email.com',
        role_par_defaut: 'CITOYEN',
        est_active: true,
        telephone: '+33 6 12 34 56 78',
        adresse: '15 Rue Victor Hugo, Lyon',
        date_creation: '2025-09-01',
        derniere_connexion: '2026-01-14'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivate = async () => {
    try {
      await userService.update(id, { est_active: !user.est_active });
      setUser({ ...user, est_active: !user.est_active });
      setShowDesactivateModal(false);
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await userService.delete(id);
      navigate('/admin/users');
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const getInitials = (user) => {
    const first = user.prenom?.[0] || '';
    const last = user.nom?.[0] || '';
    return (first + last).toUpperCase();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-state"><i className="fas fa-spinner fa-spin"></i> Chargement...</div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="error-state">Utilisateur non trouvé</div>
      </AdminLayout>
    );
  }

  return (
    <div className="user-detail-page">
        <div className="detail-header">
          <button className="back-btn" onClick={() => navigate('/admin/users')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2>Détail Utilisateur</h2>
        </div>

        <div className="panel-grid">
          <div className="panel">
            <div className="user-detail-header">
              <div className={`user-detail-avatar ${user.role_par_defaut === 'ADMIN' ? 'admin-avatar' : ''}`}>
                {getInitials(user)}
              </div>
              <div className="user-detail-info">
                <h3>{user.prenom} {user.nom}</h3>
                <p>{user.email}</p>
                <span className={`role-badge ${roleClasses[user.role_par_defaut]}`}>
                  {roleLabels[user.role_par_defaut]}
                </span>
              </div>
            </div>

            <h3><i className="fas fa-info-circle"></i> Informations</h3>
            <div className="info-list">
              <div className="info-row">
                <span>Email</span>
                <strong>{user.email}</strong>
              </div>
              <div className="info-row">
                <span>Date inscription</span>
                <strong>{user.date_creation ? new Date(user.date_creation).toLocaleDateString('fr-FR') : '01/09/2025'}</strong>
              </div>
              <div className="info-row">
                <span>Dernière connexion</span>
                <strong>{user.derniere_connexion ? new Date(user.derniere_connexion).toLocaleString('fr-FR') : '14/01/2026 09:32'}</strong>
              </div>
              <div className="info-row">
                <span>Statut</span>
                <strong style={{ color: user.est_active ? '#4CAF50' : '#9e9e9e' }}>
                  <span className={`status-dot ${user.est_active ? 'green' : 'red'}`}></span>
                  {user.est_active ? 'Actif' : 'Désactivé'}
                </strong>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn-primary btn-sm" onClick={() => { setEditForm(user); setShowEditModal(true); }}>
                <i className="fas fa-edit"></i> Modifier
              </button>
              <button className="btn-outline" onClick={() => setShowDesactivateModal(true)}>
                <i className="fas fa-ban"></i> Désactiver
              </button>
              <button className="btn-outline btn-delete" onClick={() => setShowDeleteModal(true)}>
                <i className="fas fa-trash"></i> Supprimer
              </button>
            </div>
          </div>

          <div className="panel">
            <h3><i className="fas fa-history" style={{ color: '#FF9800' }}></i> Activité récente</h3>
            <div className="activite-list">
              {mockActiviteRecente.map((item, index) => (
                <div key={index} className="activite-row">
                  <span className="activite-date">{item.date}</span>
                  <span className="activite-action">{item.action}</span>
                </div>
              ))}
            </div>

            <h3><i className="fas fa-chart-bar" style={{ color: '#4CAF50' }}></i> Statistiques</h3>
            <div className="stats-grid-2">
              <div className="stat-box">
                <strong>{mockStats.ecoPoints.toLocaleString()}</strong>
                <span>EcoPoints</span>
              </div>
              <div className="stat-box">
                <strong>{mockStats.signalements}</strong>
                <span>Signalements</span>
              </div>
              <div className="stat-box">
                <strong>{mockStats.badges}</strong>
                <span>Badges</span>
              </div>
              <div className="stat-box">
                <strong>{mockStats.defis}</strong>
                <span>Défis complétés</span>
              </div>
            </div>
          </div>
        </div>

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3><i className="fas fa-user-edit" style={{ color: '#2196F3' }}></i> Modifier l'utilisateur</h3>
            <div className="modal-form">
              <FormRow>
                <FormGroup label="Prénom">
                  <Input 
                    type="text" 
                    value={editForm.prenom || ''}
                    onChange={(e) => setEditForm({...editForm, prenom: e.target.value})}
                  />
                </FormGroup>
                <FormGroup label="Nom">
                  <Input 
                    type="text" 
                    value={editForm.nom || ''}
                    onChange={(e) => setEditForm({...editForm, nom: e.target.value})}
                  />
                </FormGroup>
              </FormRow>
              <FormGroup label="Email">
                <Input 
                  type="email" 
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                />
              </FormGroup>
              <FormRow>
                <FormGroup label="Rôle">
                  <Select 
                    value={editForm.role_par_defaut || ''}
                    onChange={(e) => setEditForm({...editForm, role_par_defaut: e.target.value})}
                    options={[
                      { value: 'CITOYEN', label: 'Citoyen' },
                      { value: 'AGENT', label: 'Agent' },
                      { value: 'GESTIONNAIRE', label: 'Gestionnaire' },
                      { value: 'ADMIN', label: 'Admin' }
                    ]}
                  />
                </FormGroup>
                <FormGroup label="Statut">
                  <Select 
                    value={editForm.est_active ? 'Actif' : 'Désactivé'}
                    onChange={(e) => setEditForm({...editForm, est_active: e.target.value === 'Actif'})}
                    options={[
                      { value: 'Actif', label: 'Actif' },
                      { value: 'Désactivé', label: 'Désactivé' }
                    ]}
                  />
                </FormGroup>
              </FormRow>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Annuler</button>
              <button className="btn-confirm-success" onClick={async () => {
                setSaving(true);
                try {
                  await userService.update(id, editForm);
                  setUser(editForm);
                  setShowEditModal(false);
                } catch (err) {
                  console.error('Failed to update user:', err);
                } finally {
                  setSaving(false);
                }
              }} disabled={saving}>
                <i className="fas fa-save"></i> {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalConfirmation 
        isOpen={showDesactivateModal} 
        onClose={() => setShowDesactivateModal(false)} 
        title={user?.est_active ? 'Désactiver' : 'Activer'} 
        message={user?.est_active ? 'Êtes-vous sûr de vouloir désactiver cet utilisateur ?' : 'Êtes-vous sûr de vouloir activer cet utilisateur ?'}
        confirmText="Confirmer" 
        onConfirm={handleDesactivate} 
      />

      <ModalConfirmation 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        title="Supprimer l'utilisateur" 
        message="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible." 
        confirmText="Supprimer" 
        onConfirm={handleDelete} 
        danger 
      />
    </div>
  );
}
