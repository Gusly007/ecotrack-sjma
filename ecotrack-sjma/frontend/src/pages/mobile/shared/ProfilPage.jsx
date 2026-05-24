import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import MobileListItem from '../../../components/mobile/MobileListItem';
import api from '../../../services/api';
import './ProfilPage.css';

export default function ProfilPage({ basePath = '/agent' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      setProfile(res.data?.data || res.data);
    } catch {
      setProfile(user);
    }
  };

  useEffect(() => { fetchProfile(); }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.post('/avatars/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchProfile();
    } catch { /* silent */ }
    finally { setAvatarUploading(false); e.target.value = ''; }
  };

  const displayUser = profile || user || {};
  const avatarUrl = displayUser.avatar_url || displayUser.photo_url;

  return (
    <MobileLayout title="Mon Profil">
      {/* Avatar */}
      <div className="profil-header">
        <div className="profil-avatar" onClick={handleAvatarClick} style={{ cursor: 'pointer', position: 'relative' }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="profil-avatar-img" />
          ) : (
            <i className="fas fa-user-circle"></i>
          )}
          <div className="avatar-edit-badge">
            {avatarUploading
              ? <i className="fas fa-spinner fa-spin" style={{ fontSize: '0.7rem' }}></i>
              : <i className="fas fa-camera" style={{ fontSize: '0.7rem' }}></i>
            }
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
        <h2>{displayUser.prenom} {displayUser.nom}</h2>
        <p className="profil-role">{displayUser.role || displayUser.role_par_defaut}</p>
        <p className="profil-email">{displayUser.email}</p>
      </div>

      {displayUser.points !== undefined && (
        <MobileCard className="profil-stats-card">
          <div className="profil-stats-grid">
            <div className="profil-stat">
              <strong>{displayUser.points || 0}</strong>
              <span>Points</span>
            </div>
          </div>
        </MobileCard>
      )}

      <MobileListItem
        icon="fa-user-edit"
        iconColor="#2196F3"
        iconBg="#e3f2fd"
        title="Modifier le profil"
        onClick={() => navigate(`${basePath}/profil/edit`)}
      />
      <MobileListItem
        icon="fa-bell"
        iconColor="#FF9800"
        iconBg="#fff3e0"
        title="Notifications"
        onClick={() => navigate(`${basePath}/notifications`)}
      />
      <MobileListItem
        icon="fa-cog"
        iconColor="#9c27b0"
        iconBg="#f3e5f5"
        title="Parametres notifications"
        onClick={() => navigate(`${basePath}/notifications/settings`)}
      />

      <button className="profil-logout-btn" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt"></i> Se deconnecter
      </button>

      {/* Footer mobile */}
      <footer className="mobile-footer-legal">
        <div className="mobile-footer-links">
          <Link to="/privacy" className="mobile-footer-link">
            <i className="fas fa-shield-alt"></i> Confidentialité
          </Link>
          <Link to="/terms" className="mobile-footer-link">
            <i className="fas fa-file-contract"></i> CGU
          </Link>
          <Link to="/legal" className="mobile-footer-link">
            <i className="fas fa-gavel"></i> Mentions légales
          </Link>
          <a href="mailto:dpo@ecotrack.fr" className="mobile-footer-link">
            <i className="fas fa-envelope"></i> DPO
          </a>
        </div>
        <p className="mobile-footer-copy">© 2026 EcoTrack — <span className="mobile-footer-rgpd"><i className="fas fa-check-circle"></i> Conforme RGPD</span></p>
      </footer>
    </MobileLayout>
  );
}
