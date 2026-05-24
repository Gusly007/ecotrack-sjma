import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleExportData = async () => {
    setExporting(true);
    setExportError('');
    try {
      const data = await citoyenService.exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecotrack-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Erreur lors du téléchargement. Réessayez.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await citoyenService.deleteAccountRequest(deletePassword);
      setShowDeleteModal(false);
      await logout();
      navigate('/citoyen/login');
    } catch {
      setDeleteError('Mot de passe incorrect ou erreur serveur.');
    } finally {
      setDeleteLoading(false);
    }
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

        {/* RGPD — données personnelles */}
        <div className="profil-section">
          <div className="profil-section-header">
            <span className="profil-section-icon blue"><i className="fas fa-download"></i></span>
            <span className="profil-section-title">Vos données personnelles</span>
          </div>
          <div className="profil-section-body">
            <div className="profil-info-box">
              <i className="fas fa-info-circle"></i>
              <span>
                Conforme au RGPD (Article 15 – Droit d'accès). Ce fichier contient tous vos profils,
                signalements, tournées, badges, points et historique d'activité.
              </span>
            </div>
            <button className="profil-btn primary" onClick={handleExportData} disabled={exporting}>
              <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
              {exporting ? 'Téléchargement…' : 'Télécharger mes données'}
            </button>
            {exportError && <p className="profil-btn-err">{exportError}</p>}
          </div>
        </div>

        {/* RGPD — suppression de compte */}
        <div className="profil-section">
          <div className="profil-section-header">
            <span className="profil-section-icon red"><i className="fas fa-user-slash"></i></span>
            <span className="profil-section-title">Supprimer mon compte</span>
          </div>
          <div className="profil-section-body">
            <div className="profil-info-box warning">
              <i className="fas fa-exclamation-triangle"></i>
              <div>
                <div className="profil-warning-title">Attention : Action irréversible</div>
                <span>
                  La suppression est permanente. Vous avez 30 jours pour annuler avant la suppression
                  définitive. Après ce délai, vos données seront anonymisées.
                </span>
                <ul className="profil-warning-list">
                  <li>Vos signalements et tournées seront archivés</li>
                  <li>Vos points et badges seront supprimés</li>
                  <li>Votre compte ne sera plus accessible</li>
                  <li>Vous pourrez vous réinscrire avec le même email après 30 jours</li>
                </ul>
              </div>
            </div>
            <button className="profil-btn danger" onClick={() => setShowDeleteModal(true)}>
              <i className="fas fa-trash"></i>
              Demander la suppression du compte
            </button>
          </div>
        </div>

        {/* Footer légal */}
        <div className="profil-legal-footer">
          <div className="profil-legal-links">
            <Link to="/privacy" className="profil-legal-link">
              <i className="fas fa-shield-alt"></i> Politique de confidentialité
            </Link>
            <Link to="/terms" className="profil-legal-link">
              <i className="fas fa-file-contract"></i> CGU
            </Link>
            <Link to="/legal" className="profil-legal-link">
              <i className="fas fa-gavel"></i> Mentions légales
            </Link>
            <a href="mailto:dpo@ecotrack.fr" className="profil-legal-link">
              <i className="fas fa-envelope"></i> DPO
            </a>
          </div>
          <div className="profil-legal-copy">
            <p>© 2026 EcoTrack. Tous droits réservés.</p>
            <p><span className="profil-legal-rgpd"><i className="fas fa-check-circle"></i> Conforme RGPD</span></p>
          </div>
        </div>
      </div>

    {showDeleteModal && (
      <div
        className="profil-modal-overlay"
        onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}
      >
        <div className="profil-modal-sheet">
          <div className="profil-modal-header">
            <h3 className="profil-modal-title">Confirmer la suppression</h3>
            <button className="profil-modal-close" onClick={() => setShowDeleteModal(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="profil-modal-body">
            <p>Entrez votre mot de passe pour confirmer la demande de suppression de votre compte.</p>
            {deleteError && <p style={{ color: '#f44336', fontSize: '0.82rem', margin: '0 0 10px' }}>{deleteError}</p>}
            <div>
              <label
                htmlFor="del-pw"
                style={{ fontSize: '0.82rem', color: '#555', display: 'block', marginBottom: '6px' }}
              >
                Mot de passe
              </label>
              <input
                id="del-pw"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '11px 12px', border: '1px solid #ddd',
                  borderRadius: '8px', fontSize: '0.88rem', boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>
          <div className="profil-modal-footer">
            <button
              className="profil-modal-btn-cancel"
              onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
            >
              Annuler
            </button>
            <button
              className="profil-btn danger"
              onClick={handleDeleteAccount}
              disabled={deleteLoading || !deletePassword}
            >
              <i className={`fas ${deleteLoading ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
