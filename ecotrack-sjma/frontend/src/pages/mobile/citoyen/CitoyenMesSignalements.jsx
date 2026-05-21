import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MobileScreenHeader from '../../../components/mobile/MobileScreenHeader';
import { citoyenService } from '../../../services/citoyenService';
import './CitoyenMesSignalements.css';

const TABS = [
  { key: 'tous', label: 'Tous' },
  { key: 'progress', label: 'En cours' },
  { key: 'resolved', label: 'Résolus' },
];

const statusColorMap = { blue: '#2196F3', yellow: '#FFC107', green: '#4CAF50', red: '#f44336' };
const badgeClassMap = { new: 'badge-new', progress: 'badge-progress', resolved: 'badge-resolved', rejected: 'badge-rejected' };

const STATUT_TO_UI = {
  OUVERT: { statusType: 'new', status: 'Nouveau', statusColor: 'blue' },
  EN_COURS: { statusType: 'progress', status: 'En cours', statusColor: 'yellow' },
  RESOLU: { statusType: 'resolved', status: 'Résolu', statusColor: 'green' },
  FERME: { statusType: 'rejected', status: 'Rejeté', statusColor: 'red' },
};

const TYPE_ICONS = {
  CONTENEUR_PLEIN: 'fa-dumpster-fire',
  CONTENEUR_ENDOMMAGE: 'fa-tools',
  DEPOT_SAUVAGE: 'fa-trash',
  MAUVAISE_ODEUR: 'fa-wind',
  CONTENEUR_INACCESSIBLE: 'fa-ban',
  CONTENEUR_SALE: 'fa-broom',
  CAPTEUR_DEFAILLANT: 'fa-microchip',
};

function buildTimeline(s) {
  return [
    { step: 'Signalement envoyé', done: true },
    { step: 'En cours de traitement', done: ['EN_COURS', 'RESOLU', 'FERME'].includes(s.statut) },
    { step: 'Résolu', done: s.statut === 'RESOLU' },
  ];
}

function formatDateHeure(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function adapt(s) {
  const ui = STATUT_TO_UI[s.statut] || STATUT_TO_UI.OUVERT;
  return {
    id: s.id_signalement,
    type: (s.type_signalement || '').replace(/_/g, ' ').toLowerCase() || 'Signalement',
    typeIcon: TYPE_ICONS[s.type_signalement] || 'fa-exclamation-triangle',
    adresse: s.zone_nom || `Conteneur ${s.conteneur_uid || ''}`,
    conteneur: s.conteneur_uid || `#${s.id_conteneur}`,
    date: formatDateHeure(s.date_creation),
    description: s.description || '',
    urgence: s.urgence === 'HAUTE' ? 'Haute' : s.urgence === 'BASSE' ? 'Basse' : 'Moyenne',
    timeline: buildTimeline(s),
    agentNote: null,
    ...ui,
  };
}

export default function CitoyenMesSignalements() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('tous');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  // Le backend isole CITOYEN à ses propres signalements (BOLA scope dans
  // signalement-controller.getAll). On ne refiltre pas côté client.
  // setLoading(true) n'est jamais appelé en début d'effet : l'état initial
  // est true et on garde la liste à l'écran pendant les refetch (règle
  // React 19 react-hooks/set-state-in-effect).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await citoyenService.getMySignalements({ limit: 100 });
        if (!alive) return;
        // Update défensif : on ne remplace que si la shape est exploitable.
        if (Array.isArray(list)) {
          const sorted = [...list].sort((a, b) => {
            const da = new Date(a.date_creation || 0).getTime();
            const db = new Date(b.date_creation || 0).getTime();
            return db - da;
          });
          setItems(sorted.map(adapt));
          setError('');
        }
      } catch (e) {
        // Erreur affichée uniquement si on n'a aucune donnée à montrer.
        if (alive) {
          setItems((prev) => {
            if (prev.length === 0) {
              setError(e?.response?.data?.message || e.message || 'Erreur de chargement');
            }
            return prev;
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [location.key, refreshToken]);

  useEffect(() => {
    const onFocus = () => setRefreshToken(t => t + 1);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const filtered = items.filter(s => activeTab === 'tous' || s.statusType === activeTab);
  const countOf = (key) => key === 'tous' ? items.length : items.filter(s => s.statusType === key).length;

  // Stats pour le bandeau en tête d'écran. Sépare visuellement le **nombre**
  // de signalements (par état) de la **liste** des signalements récents, pour
  // qu'on comprenne au premier coup d'œil "combien j'en ai" avant de scroller.
  const countTotal = items.length;
  const countEnCours = items.filter(s => s.statusType === 'progress').length;
  const countResolus = items.filter(s => s.statusType === 'resolved').length;
  const countNouveaux = items.filter(s => s.statusType === 'new').length;

  return (
    <div className="mes-signalements-page">
      <MobileScreenHeader title="Mes signalements" backTo="/citoyen" />

      {/* Bandeau récap — chiffres globaux, séparés de la liste en-dessous. */}
      <div className="mes-sig-summary">
        <div className="mes-sig-summary-card">
          <div className="mes-sig-summary-value">{countTotal}</div>
          <div className="mes-sig-summary-label">Total</div>
        </div>
        <div className="mes-sig-summary-card is-new">
          <div className="mes-sig-summary-value">{countNouveaux}</div>
          <div className="mes-sig-summary-label">Nouveaux</div>
        </div>
        <div className="mes-sig-summary-card is-progress">
          <div className="mes-sig-summary-value">{countEnCours}</div>
          <div className="mes-sig-summary-label">En cours</div>
        </div>
        <div className="mes-sig-summary-card is-resolved">
          <div className="mes-sig-summary-value">{countResolus}</div>
          <div className="mes-sig-summary-label">Résolus</div>
        </div>
      </div>

      <h3 className="mes-sig-list-title">
        <i className="fas fa-list" /> Liste des signalements
      </h3>

      <div className="mes-sig-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`mes-sig-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            <span className="tab-count">{countOf(t.key)}</span>
          </button>
        ))}
        <button
          className="mes-sig-tab mes-sig-refresh"
          onClick={() => setRefreshToken(t => t + 1)}
          title="Rafraîchir"
          aria-label="Rafraîchir"
        >
          <i className={`fas fa-rotate ${loading ? 'fa-spin' : ''}`}></i>
        </button>
      </div>

      <div className="mes-sig-list">
        {loading && <p style={{ textAlign: 'center', color: '#888', padding: 24 }}>Chargement…</p>}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <p style={{ color: '#f44336', marginBottom: 12 }}>
              <i className="fas fa-exclamation-circle" /> {error}
            </p>
            <button
              onClick={() => setRefreshToken(t => t + 1)}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: 8,
                background: '#4CAF50', color: '#fff', cursor: 'pointer', fontWeight: 600
              }}
            >
              <i className="fas fa-rotate" /> Réessayer
            </button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', padding: 24 }}>Aucun signalement</p>
        )}
        {filtered.map(sig => (
          <div
            key={sig.id}
            className="mes-sig-card"
            onClick={() => navigate(`/citoyen/signalements/${sig.id}`)}
          >
            <div className="mes-sig-card-header">
              <div className="mes-sig-id-row">
                <span className="mes-sig-icon" style={{ background: statusColorMap[sig.statusColor] + '22', color: statusColorMap[sig.statusColor] }}>
                  <i className={`fas ${sig.typeIcon}`}></i>
                </span>
                <div>
                  <strong>#{sig.id}</strong>
                  <span className="mes-sig-type">{sig.type}</span>
                </div>
              </div>
              <span className={`mes-sig-badge ${badgeClassMap[sig.statusType]}`}>{sig.status}</span>
            </div>
            <div className="mes-sig-meta">
              <span><i className="fas fa-map-marker-alt"></i> {sig.adresse}</span>
              <span><i className="fas fa-calendar"></i> {sig.date}</span>
            </div>
            <div className="mes-sig-timeline">
              {sig.timeline.map((step, i) => (
                <div key={i} className={`timeline-step ${step.done ? 'done' : ''}`}>
                  <div className="t-dot" />
                  {i < sig.timeline.length - 1 && <div className="t-line" />}
                  <span>{step.step}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
