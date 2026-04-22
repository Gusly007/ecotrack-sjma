import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        setProfile(res.data?.data || res.data);
      } catch {
        setProfile(user);
      }
    };
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayUser = profile || user || {};

  return (
    <MobileLayout title="Mon Profil">
      <div className="profil-header">
        <div className="profil-avatar">
          <i className="fas fa-user-circle"></i>
        </div>
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
      <MobileListItem
        icon="fa-shield-alt"
        iconColor="#607d8b"
        iconBg="#eceff1"
        title="Conditions d'utilisation"
        onClick={() => navigate('/terms')}
      />

      <button className="profil-logout-btn" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt"></i> Se deconnecter
      </button>
    </MobileLayout>
  );
}
