import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../../services/userService';
import { zoneService } from '../../../services/zoneService';
import { FormGroup, FormRow, Input, Select } from '../../../components/common';
import './CreateUser.css';

const roles = [
  { id: 'CITOYEN', icon: 'fa-user', color: '#4CAF50', label: 'Citoyen', desc: 'Utilisateur public, signalements et gamification' },
  { id: 'AGENT', icon: 'fa-truck', color: '#FF9800', label: 'Agent de collecte', desc: 'Tournées terrain, scan QR, anomalies' },
  { id: 'GESTIONNAIRE', icon: 'fa-chart-line', color: '#2196F3', label: 'Gestionnaire', desc: 'Pilotage opérationnel, KPIs, routes' },
  { id: 'ADMIN', icon: 'fa-shield-alt', color: '#f44336', label: 'Administrateur', desc: 'Configuration système, RBAC, monitoring' },
];

export default function CreateUserPage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    role: 'CITOYEN',
    zones: [],
    password: '',
    generatePassword: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activationLink, setActivationLink] = useState('');

  // Charger les zones depuis l'API
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setLoadingZones(true);
        const response = await zoneService.getAll(1, 100);
        let data = [];
        if (response.data) {
          data = response.data.data || response.data || [];
        } else if (Array.isArray(response)) {
          data = response;
        }
        setZones(data);
      } catch (err) {
        console.error('Erreur chargement zones:', err);
        setZones([]);
      } finally {
        setLoadingZones(false);
      }
    };
    fetchZones();
  }, []);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const special = '!@#$%^&*';
    let password = '';
    for (let i = 0; i < 10; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    password += special.charAt(Math.floor(Math.random() * special.length));
    setFormData({ ...formData, password, generatePassword: true });
  };

  const handleManualPassword = () => {
    setFormData({ ...formData, generatePassword: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.password && formData.generatePassword) {
      generatePassword();
    }

    try {
      const userData = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        zones: formData.zones
      };

      console.log('Creating user with data:', userData);
      
      await userService.register(userData);
      
      const currentUrl = window.location.origin;
      const link = `${currentUrl}/activate?email=${encodeURIComponent(formData.email)}&token=${encodeURIComponent(formData.password)}`;
      setActivationLink(link);
      setSuccess('Utilisateur créé avec succès !');
    } catch (err) {
      console.error('Error creating user:', err.response || err);
      if (err.response?.status === 409) {
        setError('Un utilisateur avec cet email existe déjà');
      } else {
        setError(err.response?.data?.error || err.message || 'Erreur lors de la création de l\'utilisateur');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-user-page">
      <div className="create-user-header">
        <button className="back-btn" onClick={() => navigate('/admin/users')}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 className="page-title">Créer un nouvel utilisateur</h2>
      </div>

      {error && <div className="error-alert">{error}</div>}
      {success && (
        <div className="success-alert">
          <p>{success}</p>
          {activationLink && (
            <div className="activation-link-box">
              <p className="link-label">Lien d'activation du compte:</p>
              <div className="link-container">
                <a 
                  href={activationLink} 
                  className="activation-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {activationLink}
                </a>
              </div>
              <div className="activation-actions">
                <button 
                  type="button" 
                  className="copy-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(activationLink);
                      alert('Lien copié !');
                    } catch (err) {
                      const textArea = document.createElement('textarea');
                      textArea.value = activationLink;
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      alert('Lien copié !');
                    }
                  }}
                >
                  <i className="fas fa-copy"></i> Copier le lien
                </button>
                <a 
                  href={`mailto:${formData.email}?subject=Activation de votre compte EcoTrack&body=Bonjour,%0D%0A%0D%0AVotre compte EcoTrack a été créé.%0D%0A%0D%0AVotre mot de passe temporaire: ${formData.password}%0D%0A%0D%0AClicker sur le lien suivant pour activer votre compte:%0D%0A${encodeURIComponent(activationLink)}%0D%0A%0D%0ACordialement,%0D%0AL'équipe EcoTrack`}
                  className="email-btn"
                >
                  <i className="fas fa-envelope"></i> Envoyer par email
                </a>
              </div>
            </div>
          )}
          <button 
            type="button" 
            className="btn-outline" 
            style={{ marginTop: '12px' }}
            onClick={() => navigate('/admin/users')}
          >
            <i className="fas fa-arrow-left"></i> Retour à la liste des utilisateurs
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="panel-grid">
          <div className="panel">
            <h3><i className="fas fa-user-plus" style={{ color: '#4CAF50' }}></i> Informations de base</h3>
            <FormRow>
              <FormGroup label="Prénom">
                <Input 
                  type="text" 
                  placeholder="Sophie"
                  value={formData.prenom}
                  onChange={(value) => setFormData({ ...formData, prenom: value })}
                  required
                />
              </FormGroup>
              <FormGroup label="Nom">
                <Input 
                  type="text" 
                  placeholder="Martin"
                  value={formData.nom}
                  onChange={(value) => setFormData({ ...formData, nom: value })}
                  required
                />
              </FormGroup>
            </FormRow>
            <FormGroup label="Email">
              <Input 
                type="email" 
                placeholder="sophie.martin@ecotrack.com"
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
                required
              />
            </FormGroup>
          </div>

          <div className="panel">
            <h3><i className="fas fa-user-tag" style={{ color: '#2196F3' }}></i> Rôle et assignation</h3>
            <div className="form-group">
              <label>Rôle</label>
              <div className="role-options">
                {roles.map(role => (
                  <label 
                    key={role.id}
                    className={`radio-card ${formData.role === role.id ? 'active' : ''}`}
                  >
                    <input 
                      type="radio" 
                      name="role" 
                      value={role.id}
                      checked={formData.role === role.id}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                    <i className={`fas ${role.icon}`} style={{ color: role.color }}></i>
                    <div>
                      <strong>{role.label}</strong>
                      <p>{role.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <FormGroup label="Zone(s) assignée(s)">
              {formData.role === 'CITOYEN' || formData.role === 'AGENT' ? (
                <p className="helper-text" style={{ color: '#999', fontSize: '0.85rem', marginTop: '5px' }}>
                  Non applicable pour ce rôle
                </p>
              ) : loadingZones ? (
                <p className="helper-text" style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px' }}>
                  <i className="fas fa-spinner fa-spin"></i> Chargement des zones...
                </p>
              ) : zones.length === 0 ? (
                <p className="helper-text" style={{ color: '#999', fontSize: '0.85rem', marginTop: '5px' }}>
                  Aucune zone disponible
                </p>
              ) : (
                <Select 
                  value={formData.zones[0] || ''}
                  onChange={(value) => setFormData({ ...formData, zones: value ? [value] : [] })}
                  options={[
                    { value: '', label: 'Sélectionner une zone' }, 
                    ...zones.map(zone => ({ 
                      value: zone.id_zone?.toString() || zone.id?.toString(), 
                      label: zone.nom 
                    }))
                  ]}
                />
              )}
            </FormGroup>
          </div>
        </div>

        <div className="panel-grid" style={{ marginTop: '16px' }}>
          <div className="panel">
            <h3><i className="fas fa-key" style={{ color: '#FF9800' }}></i> Mot de passe</h3>
            <div className="password-buttons">
              <button type="button" className="btn-primary" onClick={generatePassword}>
                <i className="fas fa-magic"></i> Générer automatiquement
              </button>
              <button type="button" className="btn-outline" onClick={handleManualPassword}>
                <i className="fas fa-keyboard"></i> Définir manuellement
              </button>
            </div>
            
            {!formData.generatePassword && (
              <FormGroup label="Mot de passe">
                <div className="password-field">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Minimum 6 caractères"
                    value={formData.password}
                    onChange={(value) => setFormData({ ...formData, password: value })}
                    required={!formData.generatePassword}
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </FormGroup>
            )}
            
            {formData.password && formData.generatePassword && (
              <div className="generated-password">
                <p>Mot de passe généré :</p>
                <code>{formData.password}</code>
                <p>L'utilisateur devra le changer à la première connexion</p>
              </div>
            )}
          </div>

          <div className="panel">
            <h3><i className="fas fa-envelope" style={{ color: '#9c27b0' }}></i> Invitation</h3>
            
            {formData.email ? (
              <div className="invitation-info">
                <p><i className="fas fa-paper-plane"></i> Un email d'invitation sera envoyé à :</p>
                <p className="email-preview">{formData.email}</p>
                <ul>
                  <li>Lien d'activation du compte</li>
                </ul>
                {formData.password && (
                  <div style={{ marginTop: '8px', padding: '8px', background: '#f5f5f5', borderRadius: '4px', fontSize: '11px' }}>
                    <strong>Lien d'activation:</strong><br/>
                    <code style={{ wordBreak: 'break-all' }}>
                      {`${window.location.origin}/activate?email=${encodeURIComponent(formData.email)}&token=...`}
                    </code>
                  </div>
                )}
              </div>
            ) : (
              <div className="invitation-info pending">
                <p><i className="fas fa-exclamation-circle"></i> Veuillez entrer un email pour voir les détails de l'invitation</p>
              </div>
            )}
            
            <button type="submit" className="btn-primary submit-btn" disabled={loading || !formData.email || !formData.password}>
              {loading ? (
                <><i className="fas fa-spinner fa-spin"></i> Création en cours...</>
              ) : (
                <><i className="fas fa-user-plus"></i> Créer l'utilisateur et envoyer l'activation</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}