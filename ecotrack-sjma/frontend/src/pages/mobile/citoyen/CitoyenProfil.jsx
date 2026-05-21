import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCitoyenAuth as useAuth } from './auth/CitoyenAuthContext';
import MobileScreenHeader from '../../../components/mobile/MobileScreenHeader';
import { citoyenService } from '../../../services/citoyenService';
import { buildAvatarUrl } from '../../../utils/avatar';
import './CitoyenProfil.css';

// Boutique de récompenses retirée le 2026-04-21 — la route /boutique
// redirige désormais vers /defis (cf. App.jsx).
const MENU_ITEMS = [
  { icon: 'fa-user-edit', label: 'Modifier mes informations', path: '/citoyen/profil/modifier' },
  { icon: 'fa-flag', label: 'Mes signalements', path: '/citoyen/signalements' },
  { icon: 'fa-history', label: 'Historique des points', path: '/citoyen/points-historique' },
  { icon: 'fa-trophy', label: 'Défis & badges', path: '/citoyen/defis' },
  { icon: 'fa-recycle', label: 'Guide du tri', path: '/citoyen/tri' },
];

export default function CitoyenProfil() {
  const navigate = useNavigate();
  const { user, logout, avatarVersion } = useAuth();
  const userId = user?.id || user?.id_utilisateur;

  const [profile, setProfile] = useState(user);
  const [stats, setStats] = useState({ points: user?.points ?? 0, badges: 0, signalements: 0 });
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    Promise.allSettled([
      citoyenService.getProfileWithStats(),
      citoyenService.getMySignalements({ limit: 200 }),
    ]).then(([profR, sigR]) => {
      if (!alive) return;
      if (profR.status === 'fulfilled' && profR.value && typeof profR.value === 'object') {
        // Merge (pas replace) pour conserver les champs absents de la réponse.
        setProfile(prev => ({ ...(prev || {}), ...profR.value }));
        setStats(s => ({
          ...s,
          points: typeof profR.value.points === 'number' ? profR.value.points : s.points,
          badges: parseInt(profR.value.badge_count, 10) || s.badges || 0,
        }));
      }
      if (sigR.status === 'fulfilled' && Array.isArray(sigR.value)) {
        setStats(s => ({ ...s, signalements: sigR.value.length }));
      }
    });
    return () => { alive = false; };
  }, [userId, refreshToken]);

  // Refetch au focus pour rafraîchir les compteurs après création d'un signalement.
  useEffect(() => {
    const onFocus = () => setRefreshToken(t => t + 1);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const displayName = profile ? `${profile.prenom || ''} ${profile.nom || ''}`.trim() : 'Citoyen';
  const email = profile?.email || '';
  const avatarPath = profile?.avatar_thumbnail || profile?.avatar_url || null;
  // Stocke le chemin cassé ; avatarBroken est dérivé pendant le render pour
  // éviter un useEffect synchrone (règle React 19 set-state-in-effect).
  const [brokenAvatarPath, setBrokenAvatarPath] = useState(null);
  const avatarBroken = avatarPath != null && brokenAvatarPath === avatarPath;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="profil-page">
      <MobileScreenHeader title="Mon profil" backTo="/citoyen" />

      <div className="profil-body">
        <div className="profil-hero">
          <div
            className="profil-avatar"
            style={avatarPath && !avatarBroken ? { overflow: 'hidden', padding: 0 } : undefined}
          >
            {avatarPath && !avatarBroken ? (
              // avatarVersion (depuis CitoyenAuthContext) est bumpé après
              // chaque upload / refresh d'avatar → force le navigateur à
              // refetch la nouvelle image au lieu de servir le cache HTTP.
              // Stable entre les navigations (pas de flash) car avatarVersion
              // ne change que quand les chemins avatar changent réellement.
              <img
                src={buildAvatarUrl(avatarPath, { bust: avatarVersion })}
                alt="Avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setBrokenAvatarPath(avatarPath)}
              />
            ) : (
              <i className="fas fa-user"></i>
            )}
          </div>
          <h2>{displayName || 'Citoyen'}</h2>
          <p>{email}</p>
          <div className="profil-stats-row">
            <div className="profil-stat"><strong>{(stats.points || 0).toLocaleString()}</strong><span>Points</span></div>
            <div className="profil-stat-divider" />
            <div className="profil-stat"><strong>{stats.signalements}</strong><span>Signalements</span></div>
            <div className="profil-stat-divider" />
            <div className="profil-stat"><strong>{stats.badges}</strong><span>Badges</span></div>
          </div>
        </div>

        <div className="profil-menu">
          {MENU_ITEMS.map(item => (
            <button key={item.path} className="profil-menu-item" onClick={() => navigate(item.path)}>
              <span className="menu-icon"><i className={`fas ${item.icon}`}></i></span>
              <span className="menu-label">{item.label}</span>
              <i className="fas fa-chevron-right menu-arrow"></i>
            </button>
          ))}

          <button className="profil-menu-item danger" onClick={handleLogout}>
            <span className="menu-icon danger"><i className="fas fa-sign-out-alt"></i></span>
            <span className="menu-label">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
