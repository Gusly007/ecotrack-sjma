import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCitoyenAuth as useAuth } from './auth/CitoyenAuthContext';
import { citoyenService } from '../../../services/citoyenService';
import PointsCard from '../../../components/mobile/citoyen/PointsCard';
import QuickActions from '../../../components/mobile/citoyen/QuickActions';
import CollecteCard from '../../../components/mobile/citoyen/CollecteCard';
import ImpactStats from '../../../components/mobile/citoyen/ImpactStats';
import SignalementItem from '../../../components/mobile/citoyen/SignalementItem';
import ClassementModal from '../../../components/mobile/citoyen/ClassementModal';
import { aggregateImpact, METHODOLOGY_NOTE } from '../../../utils/impactEstimation';
import { buildAvatarUrl } from '../../../utils/avatar';
import './CitoyenHome.css';

// `id` mappe vers QuickActions.actionRoutes (signaler / carte / tri / defis).
const quickActions = [
  { id: 'signaler', label: 'Signaler', icon: 'fa-flag', color: '#f44336' },
  { id: 'carte',    label: 'Carte',    icon: 'fa-map-marked-alt', color: '#1976D2' },
  { id: 'tri',      label: 'Guide tri', icon: 'fa-recycle', color: '#4CAF50' },
  { id: 'defis',    label: 'Défis',    icon: 'fa-trophy', color: '#FF9800' },
];

// "Aujourd'hui" / "Demain" / "Mardi 28 avr." / date complète au-delà.
const formatCollecteJour = (iso) => {
  if (!iso) return '';
  const day = new Date(iso);
  if (Number.isNaN(day.getTime())) return '';

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDay(day) - startOfDay(new Date())) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Demain';

  const longish = day.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
  return longish.charAt(0).toUpperCase() + longish.slice(1);
};

const formatCountdown = (iso, statut) => {
  if (statut === 'EN_COURS') return 'En cours';
  if (!iso) return '';
  const day = new Date(iso);
  if (Number.isNaN(day.getTime())) return '';
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDay(day) - startOfDay(new Date())) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Aujourd’hui';
  if (diffDays === 1) return 'Demain';
  if (diffDays > 1) return `Dans ${diffDays} jours`;
  return '';
};

const countdownColorFor = (iso, statut) => {
  if (statut === 'EN_COURS') return '#2196F3';
  if (!iso) return '#4CAF50';
  const day = new Date(iso);
  const diffDays = Math.round((day - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return '#f44336';
  if (diffDays <= 3) return '#FF9800';
  return '#4CAF50';
};

// Mapping statut DB → libellé/type/couleur UI. Cohérent avec
// SignalementItem.css, CitoyenMesSignalements et CitoyenSignalementDetail.
const mapStatusForUI = (s) => {
  if (!s) return { status: 'Nouveau', statusType: 'new', statusColor: 'blue' };
  const up = String(s).toUpperCase();
  if (up === 'RESOLU')   return { status: 'Résolu',  statusType: 'resolved', statusColor: 'green' };
  if (up === 'EN_COURS') return { status: 'En cours', statusType: 'progress', statusColor: 'yellow' };
  if (up === 'REJETE')   return { status: 'Rejeté',  statusType: 'rejected', statusColor: 'red' };
  if (up === 'FERME')    return { status: 'Fermé',   statusType: 'rejected', statusColor: 'red' };
  return { status: 'Nouveau', statusType: 'new', statusColor: 'blue' };
};

const computeLevel = (points) => {
  if (points >= 5000) return { niveau: 'Éco-Légende', niveauSuivant: 'Maître', pointsNiveauSuivant: 10000 };
  if (points >= 1000) return { niveau: 'Éco-Héros (Or)', niveauSuivant: 'Éco-Légende', pointsNiveauSuivant: 5000 };
  if (points >= 500)  return { niveau: 'Éco-Acteur (Argent)', niveauSuivant: 'Éco-Héros', pointsNiveauSuivant: 1000 };
  if (points >= 100)  return { niveau: 'Éco-Starter', niveauSuivant: 'Éco-Acteur', pointsNiveauSuivant: 500 };
  return { niveau: 'Nouveau', niveauSuivant: 'Éco-Starter', pointsNiveauSuivant: 100 };
};

export default function CitoyenHome() {
  const { user, refreshUser, avatarVersion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Self-heal : les sessions antérieures à l'enrichissement du payload login
  // ont un user object incomplet en localStorage (sans avatar). Un refresh
  // silencieux au montage récupère la shape complète sans forcer une
  // déconnexion. Conditionné à l'absence d'avatar pour ne pas brûler une
  // requête /api/users/profile à chaque mount (apiLimiter service-users).
  const heroSelfHealRef = useRef(false);
  const userHasAvatarShape = !!(user?.avatar_thumbnail || user?.avatar_url) || user?.avatar_thumbnail === null;
  useEffect(() => {
    if (heroSelfHealRef.current) return;
    if (userHasAvatarShape) return;
    heroSelfHealRef.current = true;
    refreshUser?.().catch(() => { /* non bloquant */ });
  }, [refreshUser, userHasAvatarShape]);

  const [points, setPoints] = useState(user?.points ?? 0);
  const [recentSignalements, setRecentSignalements] = useState([]);
  const [impactAgg, setImpactAgg] = useState({ kgTries: 0, kgCO2: 0, countValide: 0, countResolu: 0, count: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [collectes, setCollectes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classementOpen, setClassementOpen] = useState(false);
  // Bumped au focus fenêtre pour forcer un refetch sans démonter.
  const [refreshToken, setRefreshToken] = useState(0);

  const userId = user?.id || user?.id_utilisateur;
  const displayName = user?.prenom || user?.nom || 'Citoyen';
  const avatarPath = user?.avatar_thumbnail || user?.avatar_url || null;
  // brokenAvatarPath stocke le chemin qui a échoué à charger ; avatarBroken
  // est dérivé pendant le render pour éviter un setState dans un useEffect
  // (règle React 19 set-state-in-effect).
  const [brokenAvatarPath, setBrokenAvatarPath] = useState(null);
  const avatarBroken = avatarPath != null && brokenAvatarPath === avatarPath;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const results = await Promise.allSettled([
          citoyenService.getProfileWithStats(),
          userId ? citoyenService.getMyStats(userId) : Promise.resolve(null),
          citoyenService.getMySignalements({ limit: 100 }),
          citoyenService.getNotifications().catch(() => ({ data: [] })),
          citoyenService.getProchainesCollectes({ limit: 3 }).catch(() => []),
        ]);
        if (!alive) return;

        const [profileR, statsR, signalR, notifR, collecteR] = results;
        // Updates défensifs : on ne remplace l'état existant que si la
        // réponse est exploitable. Évite un "flash vide" lors d'un refetch
        // partiellement raté (réseau, rate-limit transitoire).
        if (profileR.status === 'fulfilled' && profileR.value && typeof profileR.value.points === 'number') {
          setPoints(profileR.value.points);
        }
        if (statsR.status === 'fulfilled' && statsR.value && typeof statsR.value.totalPoints === 'number') {
          setPoints(statsR.value.totalPoints);
        }
        if (signalR.status === 'fulfilled' && Array.isArray(signalR.value)) {
          // Le backend isole déjà CITOYEN à ses propres lignes (BOLA scope
          // dans signalement-controller.getAll). On ne refiltre pas côté
          // client ; on trie juste par date desc pour l'affichage.
          const sorted = [...signalR.value].sort((a, b) => {
            const da = new Date(a.date_creation || 0).getTime();
            const db = new Date(b.date_creation || 0).getTime();
            return db - da;
          });
          setRecentSignalements(sorted.slice(0, 3));
          // Agrégat impact calculé sur la liste complète, pas les 3 derniers.
          setImpactAgg(aggregateImpact(sorted));
        }
        if (notifR.status === 'fulfilled' && notifR.value != null) {
          const arr = Array.isArray(notifR.value) ? notifR.value : (notifR.value?.data || []);
          if (Array.isArray(arr)) setUnreadCount(arr.filter((n) => !n.est_lu).length);
        }
        if (collecteR.status === 'fulfilled' && collecteR.value != null) {
          const arr = Array.isArray(collecteR.value) ? collecteR.value : (collecteR.value?.data || []);
          if (Array.isArray(arr)) setCollectes(arr);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // location.key déclenche un refetch à chaque nav vers cette route.
  }, [userId, location.key, refreshToken]);

  // Refetch quand l'onglet reprend le focus.
  useEffect(() => {
    const onFocus = () => setRefreshToken(t => t + 1);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const level = computeLevel(points);
  const progression = Math.min(100, Math.round((points / level.pointsNiveauSuivant) * 100));

  // Cartes d'impact ADEME — préfixe `≈` car ce sont des estimations.
  const impactStats = [
    { id: 1, icon: 'fa-cloud',    color: '#4CAF50', value: `≈ ${impactAgg.kgCO2} kg`,  label: 'CO₂ évité' },
    { id: 2, icon: 'fa-dumpster', color: '#FF9800', value: `≈ ${impactAgg.kgTries} kg`, label: 'Déchets triés' },
    { id: 3, icon: 'fa-flag',     color: '#2196F3', value: String(impactAgg.countResolu), label: 'Signalements résolus' },
  ];

  const adaptedSignalements = recentSignalements.map((s) => {
    const ui = mapStatusForUI(s.statut);
    return {
      id: s.id_signalement,
      type: s.type_signalement || s.description?.slice(0, 30) || 'Signalement',
      adresse: s.zone_nom || `Conteneur ${s.conteneur_uid || ''}`,
      // Date + heure pour les signalements récents (l'heure était absente,
      // demande explicite du citoyen pour distinguer plusieurs signalements
      // créés le même jour).
      date: s.date_creation
        ? new Date(s.date_creation).toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '',
      ...ui,
    };
  });

  return (
    <div className="citoyen-home">
      <header className="citoyen-header">
        <div className="citoyen-greeting">
          <h1>Bonjour, {displayName}</h1>
          <p>{capitalizedDate}</p>
        </div>
        <div className="citoyen-header-actions">
          {/* Trophée — ouvre la modale Classement (top 10 + ma ligne si hors top). */}
          <button
            className="header-icon-btn"
            onClick={() => setClassementOpen(true)}
            aria-label="Voir le classement"
            title="Classement"
          >
            <i className="fas fa-trophy"></i>
          </button>
          <button className="header-icon-btn" onClick={() => navigate('/citoyen/notifications')}>
            <i className="fas fa-bell"></i>
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          <button
            className="header-icon-btn header-profile-btn"
            onClick={() => navigate('/citoyen/profil')}
            aria-label="Mon profil"
            title="Mon profil"
          >
            {avatarPath && !avatarBroken ? (
              <img
                src={buildAvatarUrl(avatarPath, { bust: avatarVersion })}
                alt="Avatar"
                className="header-profile-avatar"
                onError={() => setBrokenAvatarPath(avatarPath)}
              />
            ) : (
              <i className="fas fa-user-circle"></i>
            )}
          </button>
        </div>
      </header>

      <ClassementModal
        open={classementOpen}
        onClose={() => setClassementOpen(false)}
        currentUserId={userId}
      />

      <PointsCard
        points={points}
        niveau={level.niveau}
        progression={progression}
        pointsRestants={Math.max(0, level.pointsNiveauSuivant - points)}
        niveauSuivant={level.niveauSuivant}
      />

      <QuickActions actions={quickActions} />

      <section className="citoyen-section">
        <h3 className="section-heading">Prochaine collecte</h3>
        {loading && <p className="citoyen-empty">Chargement…</p>}
        {!loading && collectes.length === 0 && (
          <p className="citoyen-empty">Aucune collecte planifiée</p>
        )}
        {collectes.map((t) => {
          // Back-end renvoie : { id_tournee, date_tournee, duree_prevue_min,
          // statut, id_zone, zone_code, zone_nom }
          const jour = formatCollecteJour(t.date_tournee);
          const horaire = t.duree_prevue_min
            ? `~${Math.round(t.duree_prevue_min / 60)}h`
            : 'Horaire à confirmer';
          const countdown = formatCountdown(t.date_tournee, t.statut);
          const countdownColor = countdownColorFor(t.date_tournee, t.statut);
          return (
            <CollecteCard
              key={t.id_tournee}
              collecte={{
                type: t.zone_nom ? `Collecte — ${t.zone_nom}` : 'Collecte planifiée',
                jour,
                horaire,
                countdown,
                countdownColor,
                icon: 'fa-truck',
                iconBg: '#E8F5E9',
                iconColor: '#4CAF50',
              }}
            />
          );
        })}
      </section>

      <section className="citoyen-section">
        <h3 className="section-heading">Mon impact environnemental</h3>
        <ImpactStats stats={impactStats} />
        <p className="citoyen-impact-note">{METHODOLOGY_NOTE}</p>
      </section>

      <section className="citoyen-section">
        <h3 className="section-heading">Mes signalements récents</h3>
        {loading && <p className="citoyen-empty">Chargement…</p>}
        {!loading && adaptedSignalements.length === 0 && (
          <p className="citoyen-empty">Aucun signalement pour le moment</p>
        )}
        {adaptedSignalements.map((sig) => (
          <SignalementItem
            key={sig.id}
            signalement={sig}
            onClick={() => navigate('/citoyen/signalements/' + sig.id)}
          />
        ))}
      </section>
    </div>
  );
}
