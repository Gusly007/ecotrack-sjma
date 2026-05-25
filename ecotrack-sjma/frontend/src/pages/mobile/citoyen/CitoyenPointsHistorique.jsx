import { useEffect, useState } from 'react';
import { useCitoyenAuth as useAuth } from './auth/CitoyenAuthContext';
import MobileScreenHeader from '../../../components/mobile/MobileScreenHeader';
import { citoyenService } from '../../../services/citoyenService';
import './CitoyenPointsHistorique.css';

// Mapping code raison DB → libellé + icône.
const REASON_META = {
  SIGNALEMENT_VALIDE:   { label: 'Signalement validé',      icon: 'fa-flag' },
  SIGNALEMENT_RESOLU:   { label: 'Signalement résolu',      icon: 'fa-check-circle' },
  PARTICIPATION_DEFI:   { label: 'Participation à un défi', icon: 'fa-trophy' },
  DEFI_COMPLETE:        { label: 'Défi complété',           icon: 'fa-medal' },
  BADGE_GAGNE:          { label: 'Nouveau badge',           icon: 'fa-award' },
  AJUSTEMENT:           { label: 'Ajustement manuel',       icon: 'fa-sliders-h' },
  DEPENSE_BOUTIQUE:     { label: 'Dépense (archivée)',      icon: 'fa-shopping-bag' },
};

const prettifyReason = (raison) => {
  if (!raison) return { label: 'Points', icon: 'fa-plus-circle' };
  const meta = REASON_META[String(raison).toUpperCase()];
  if (meta) return meta;
  // Fallback : remplace les underscores, met en minuscules, capitalise.
  const cleaned = String(raison).replace(/_/g, ' ').toLowerCase();
  return { label: cleaned.charAt(0).toUpperCase() + cleaned.slice(1), icon: 'fa-plus-circle' };
};

export default function CitoyenPointsHistorique() {
  const { user } = useAuth();
  const userId = user?.id || user?.id_utilisateur;

  const [stats, setStats] = useState({ totalPoints: 0, parJour: [] });
  const [rawEvents, setRawEvents] = useState(null); // null = pas chargé, [] = chargé vide
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const [statsR, histR] = await Promise.allSettled([
        citoyenService.getMyStats(userId),
        citoyenService.getMyHistorique(userId, { limit: 100 }),
      ]);
      if (!alive) return;

      if (statsR.status === 'fulfilled' && statsR.value) {
        setStats(statsR.value);
      }
      if (histR.status === 'fulfilled') {
        const arr = Array.isArray(histR.value) ? histR.value : (histR.value?.data || []);
        setRawEvents(arr);
      } else {
        // Backend n'expose pas encore l'endpoint historique — on retombera sur parJour.
        setRawEvents(null);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [userId]);

  // Privilégie historique_points brut (une ligne par événement). Fallback
  // sur le groupement par jour si l'endpoint dédié n'est pas disponible.
  let history = [];
  if (Array.isArray(rawEvents) && rawEvents.length > 0) {
    history = rawEvents.map((ev) => {
      const points = Number(ev.delta_points) || 0;
      const meta = prettifyReason(ev.raison);
      const dateStr = ev.date_creation
        ? new Date(ev.date_creation).toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';
      return {
        id: ev.id_historique ?? `${ev.date_creation}-${points}`,
        type: points >= 0 ? 'gain' : 'spend',
        label: meta.label,
        value: points >= 0 ? `+${points}` : `${points}`,
        date: dateStr,
        icon: points >= 0 ? meta.icon : 'fa-shopping-bag',
        iconBg: points >= 0 ? '#e8f5e9' : '#ffebee',
        iconColor: points >= 0 ? '#4CAF50' : '#f44336',
      };
    });
  } else {
    history = (stats.parJour || []).map((entry, i) => {
      const points = Number(entry.points) || 0;
      const dateStr = entry.periode
        ? new Date(entry.periode).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
      return {
        id: `day-${i}`,
        type: points >= 0 ? 'gain' : 'spend',
        label: points >= 0 ? 'Points gagnés' : 'Points dépensés',
        value: points >= 0 ? `+${points}` : `${points}`,
        date: dateStr,
        icon: points >= 0 ? 'fa-plus-circle' : 'fa-shopping-bag',
        iconBg: points >= 0 ? '#e8f5e9' : '#ffebee',
        iconColor: points >= 0 ? '#4CAF50' : '#f44336',
      };
    });
  }

  return (
    <div className="points-histo-page">
      <MobileScreenHeader title="Historique des points" backTo="/citoyen/profil" />
      <div className="points-histo-body">
        <div className="points-summary-card">
          <div>
            <span>Total gagné</span>
            <strong>{(stats.totalPoints || 0).toLocaleString()} pts</strong>
          </div>
        </div>

        <div className="histo-list">
          {loading && <p className="histo-empty">Chargement…</p>}
          {!loading && history.map(h => (
            <div key={h.id} className="histo-item">
              <div className="histo-icon" style={{ background: h.iconBg, color: h.iconColor }}>
                <i className={`fas ${h.icon}`}></i>
              </div>
              <div className="histo-info">
                <strong>{h.label}</strong>
                <span>{h.date}</span>
              </div>
              <span className={`histo-value ${h.type === 'gain' ? 'gain' : 'spend'}`}>{h.value}</span>
            </div>
          ))}
          {!loading && history.length === 0 && <p className="histo-empty">Aucun historique</p>}
        </div>
      </div>
    </div>
  );
}
