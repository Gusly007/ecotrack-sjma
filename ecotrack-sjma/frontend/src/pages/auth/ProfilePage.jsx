import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import Footer from '../../components/layout/Footer';
import './ProfilePage.css';

// Keys must match the actual notification `type` values stored in the database.
// Gestionnaire receives type 'ALERTE' (IoT alerts + signalements via Kafka).
// Admin receives types from ADMIN_NOTIF_TYPES in adminNotificationService.
const NOTIFICATION_TYPES = {
  GESTIONNAIRE: ['ALERTE'],
  ADMIN: ['ADMIN_SERVICE', 'ADMIN_ALERTE', 'ADMIN_SECURITE', 'ADMIN_IOT', 'ADMIN_PERFORMANCE', 'ADMIN_SEUIL', 'ADMIN_ML']
};

const NOTIFICATION_LABELS = {
  ALERTE:            'Alertes conteneurs et signalements',
  ADMIN_SERVICE:     'Services hors ligne',
  ADMIN_ALERTE:      'Alertes critiques',
  ADMIN_SECURITE:    'Alertes de sécurité',
  ADMIN_IOT:         'Alertes capteurs IoT',
  ADMIN_PERFORMANCE: 'Alertes de performance',
  ADMIN_SEUIL:       'Seuils dépassés',
  ADMIN_ML:          'Anomalies détectées (ML)'
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: ''
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Notifications
  const [notifications, setNotifications] = useState({});

  // Delete account modal
  const [showDeleteModal, showDeleteModal_fn] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(null);

  // Data export
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getProfile();
      const profileData = response.data || response;
      setUser(profileData);
      setFormData({
        prenom: profileData.prenom || '',
        nom: profileData.nom || '',
        email: profileData.email || ''
      });

      // Initialize notifications based on role
      const role = profileData.role_par_defaut || 'CITOYEN';
      const notifTypes = NOTIFICATION_TYPES[role] || NOTIFICATION_TYPES.CITOYEN;
      const initNotif = {};
      notifTypes.forEach(type => {
        initNotif[type] = localStorage.getItem(`notif_${type}`) !== 'false';
      });
      setNotifications(initNotif);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement du profil');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setError(null);
      await userService.updateProfile({ prenom: formData.prenom, nom: formData.nom, email: formData.email });
      setUser(prev => ({ ...prev, prenom: formData.prenom, nom: formData.nom, email: formData.email }));
      setEditMode(false);
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      await userService.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setPasswordSuccess('Mot de passe changé avec succès');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message || 'Erreur lors du changement de mot de passe');
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    try {
      setError(null);
      await userService.uploadAvatar(avatarFile);
      setAvatarFile(null);
      setAvatarPreview(null);
      loadProfile();
    } catch (err) {
      setError(err.message || 'Erreur lors du téléchargement de l\'avatar');
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setError(null);
      await userService.deleteAvatar();
      loadProfile();
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression de l\'avatar');
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      setError(null);
      const response = await userService.exportMyData();
      const dataStr = JSON.stringify(response.data || response, null, 2);
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(dataStr));
      element.setAttribute('download', `ecotrack-data-${Date.now()}.json`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'export des données');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteError(null);
      await userService.deleteAccountRequest(deletePassword);
      showDeleteModal_fn(false);
      // Redirect to login after deletion request
      setTimeout(() => {
        navigate('/login?deleted=true');
      }, 2000);
    } catch (err) {
      setDeleteError(err.message || 'Erreur lors de la suppression du compte');
    }
  };

  const handleNotificationToggle = (type) => {
    const newValue = !notifications[type];
    setNotifications(prev => ({ ...prev, [type]: newValue }));
    localStorage.setItem(`notif_${type}`, newValue);
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-box loading-box">
            <div className="spinner"></div>
            <p>Chargement du profil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-box error-box">
            <i className="fas fa-exclamation-circle"></i>
            <p>Profil non trouvé</p>
          </div>
        </div>
      </div>
    );
  }

  const role = user.role_par_defaut || 'CITOYEN';
  const availableNotifications = NOTIFICATION_TYPES[role] || NOTIFICATION_TYPES.CITOYEN;

  return (
    <div className="profile-page-inner">
        <div className="profile-container">
          {/* Header */}
          <div className="profile-header">
            <div className="profile-avatar-section">
              <div className="avatar-display">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">
                    <i className="fas fa-user"></i>
                  </div>
                )}
              </div>
              <div className="avatar-info">
                <h1>{user.prenom} {user.nom || ''}</h1>
                <p className="role-badge">{role}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <i className="fas fa-user"></i> Profil
            </button>
            <button
              className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <i className="fas fa-lock"></i> Mot de passe
            </button>
            <button
              className={`tab-button ${activeTab === 'avatar' ? 'active' : ''}`}
              onClick={() => setActiveTab('avatar')}
            >
              <i className="fas fa-image"></i> Avatar
            </button>
            <button
              className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <i className="fas fa-bell"></i> Notifications
            </button>
            <button
              className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              <i className="fas fa-download"></i> Données
            </button>
            <button
              className={`tab-button danger ${activeTab === 'delete' ? 'active' : ''}`}
              onClick={() => setActiveTab('delete')}
            >
              <i className="fas fa-trash"></i> Supprimer
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && <div className="alert alert-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}
          {passwordSuccess && <div className="alert alert-success"><i className="fas fa-check-circle"></i> {passwordSuccess}</div>}

          {/* Content Sections */}
          <div className="profile-content">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="tab-content">
                <h2>Informations du profil</h2>
                {editMode ? (
                  <div className="profile-form">
                    <div className="form-group">
                      <label htmlFor="prenom">Prénom</label>
                      <input
                        id="prenom"
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleProfileChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="nom">Nom</label>
                      <input
                        id="nom"
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleProfileChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleProfileChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-actions">
                      <button onClick={handleSaveProfile} className="btn btn-primary">
                        <i className="fas fa-save"></i> Enregistrer
                      </button>
                      <button onClick={() => setEditMode(false)} className="btn btn-secondary">
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-info">
                    <div className="info-group">
                      <label>Prénom</label>
                      <p>{formData.prenom}</p>
                    </div>
                    <div className="info-group">
                      <label>Nom</label>
                      <p>{formData.nom}</p>
                    </div>
                    <div className="info-group">
                      <label>Email</label>
                      <p>{formData.email}</p>
                    </div>
                    <div className="info-group">
                      <label>Rôle</label>
                      <p>{role}</p>
                    </div>
                    <button onClick={() => setEditMode(true)} className="btn btn-primary">
                      <i className="fas fa-edit"></i> Modifier le profil
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="tab-content">
                <h2>Changer le mot de passe</h2>
                {passwordError && <div className="alert alert-error"><i className="fas fa-exclamation-circle"></i> {passwordError}</div>}
                <form onSubmit={handlePasswordChange} className="profile-form">
                  <div className="form-group">
                    <label htmlFor="oldPassword">Mot de passe actuel</label>
                    <input
                      id="oldPassword"
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPassword">Nouveau mot de passe</label>
                    <input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-lock"></i> Changer le mot de passe
                  </button>
                </form>
              </div>
            )}

            {/* Avatar Tab */}
            {activeTab === 'avatar' && (
              <div className="tab-content">
                <h2>Gérer votre avatar</h2>
                <div className="avatar-section">
                  <div className="avatar-preview-container">
                    <div className="avatar-preview">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Aperçu" className="avatar-image" />
                      ) : user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar actuel" className="avatar-image" />
                      ) : (
                        <div className="avatar-placeholder">
                          <i className="fas fa-user"></i>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="avatar-actions">
                    <div className="form-group">
                      <label htmlFor="avatarInput">Sélectionner une nouvelle image</label>
                      <input
                        id="avatarInput"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        className="form-input-file"
                      />
                    </div>
                    {avatarFile && (
                      <button onClick={handleUploadAvatar} className="btn btn-primary">
                        <i className="fas fa-upload"></i> Télécharger
                      </button>
                    )}
                    {user.avatar_url && (
                      <button onClick={handleDeleteAvatar} className="btn btn-danger">
                        <i className="fas fa-trash"></i> Supprimer l'avatar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="tab-content">
                <h2>Préférences de notifications</h2>
                <p className="section-description">Gérez les types de notifications que vous souhaitez recevoir</p>
                <div className="notifications-list">
                  {availableNotifications.map(type => (
                    <div key={type} className="notification-item">
                      <div className="notification-info">
                        <label htmlFor={`notif-${type}`}>{NOTIFICATION_LABELS[type]}</label>
                        <p className="notification-desc">Recevoir des notifications pour {NOTIFICATION_LABELS[type].toLowerCase()}</p>
                      </div>
                      <label className="toggle-switch">
                        <input
                          id={`notif-${type}`}
                          type="checkbox"
                          checked={notifications[type] || false}
                          onChange={() => handleNotificationToggle(type)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Export Tab */}
            {activeTab === 'data' && (
              <div className="tab-content">
                <h2>Vos données personnelles</h2>
                <p className="section-description">
                  Téléchargez l'intégralité de vos données personnelles dans un format standard (JSON).
                </p>
                <div className="data-export-box">
                  <div className="data-export-info">
                    <i className="fas fa-info-circle"></i>
                    <p>
                      Conforme au RGPD (Article 15 - Droit d'accès). Ce fichier contient tous vos profils, signalements,
                      tournées, badges, points, et historique d'activité.
                    </p>
                  </div>
                  <button
                    onClick={handleExportData}
                    disabled={exporting}
                    className="btn btn-primary btn-large"
                  >
                    <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
                    {exporting ? ' Exportation en cours...' : ' Télécharger mes données'}
                  </button>
                </div>
              </div>
            )}

            {/* Delete Account Tab */}
            {activeTab === 'delete' && (
              <div className="tab-content">
                <h2>Supprimer mon compte</h2>
                <div className="delete-warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  <div className="warning-text">
                    <h3>Attention : Action irréversible</h3>
                    <p>
                      La suppression de votre compte est permanente. Vous avez 30 jours pour annuler cette action avant
                      la suppression définitive. Après ce délai, vos données seront anonymisées.
                    </p>
                    <ul>
                      <li>Vos signalements et tournées seront archivés</li>
                      <li>Vos points et badges seront supprimés</li>
                      <li>Votre compte ne sera plus accessible</li>
                      <li>Vous pourrez vous réinscrire avec le même email après 30 jours</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={() => showDeleteModal_fn(true)}
                  className="btn btn-danger btn-large"
                >
                  <i className="fas fa-trash"></i> Demander la suppression du compte
                </button>
              </div>
            )}
          </div>
        </div>
        <Footer />

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h2>Supprimer mon compte</h2>
              <button className="modal-close" onClick={() => showDeleteModal_fn(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Veuillez entrer votre mot de passe pour confirmer la suppression de votre compte.</p>
              {deleteError && <div className="alert alert-error"><i className="fas fa-exclamation-circle"></i> {deleteError}</div>}
              <div className="form-group">
                <label htmlFor="deletePassword">Mot de passe</label>
                <input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="form-input"
                  placeholder="Entrez votre mot de passe"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => showDeleteModal_fn(false)}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                className="btn btn-danger"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
