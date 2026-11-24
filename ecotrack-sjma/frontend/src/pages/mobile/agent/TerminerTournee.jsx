import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import ProgressBar from '../../../components/mobile/ProgressBar';
import { fetchMyTournee, fetchProgress } from '../../../services/tourneeService';
import './TerminerTournee.css';

export default function TerminerTournee() {
  const navigate = useNavigate();
  const bilan = useLocation().state?.bilan;
  const [tournee, setTournee] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bilan) return;
    let active = true;
    const fetch = async () => {
      try {
        const t = await fetchMyTournee();
        if (!active) return;
        setTournee(t);
        if (t?.id_tournee) {
          const progRes = await fetchProgress(t.id_tournee);
          if (active) setProgress(progRes);
        }
      } catch {
        if (active) setTournee(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetch();
    return () => { active = false; };
  }, [bilan]);

  if (!bilan && loading) {
    return (
      <MobileLayout title="Bilan de la tournée" showBack>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      </MobileLayout>
    );
  }

  const recap = bilan?.tournee ?? tournee;
  const progression = bilan?.progress ?? progress;
  if (!recap) {
    return (
      <MobileLayout title="Bilan de la tournée" showBack>
        <p>Aucun bilan de tournée disponible.</p>
      </MobileLayout>
    );
  }

  const collected = progression?.etapes_collectees || progression?.collected || 0;
  const total = progression?.total_etapes || progression?.total || recap.nb_etapes || 0;
  const anomalies = progression?.anomalies ?? '—';

  return (
    <MobileLayout title="Bilan de la tournée" showBack>
      <MobileCard gradient>
        <h3 style={{ marginBottom: 16 }}><i className="fas fa-flag-checkered"></i> Résumé de la tournée</h3>
        <div className="terminer-stats-grid">
          <div className="terminer-stat">
            <strong>{collected}/{total}</strong>
            <span>Conteneurs collectés</span>
          </div>
          <div className="terminer-stat">
            <strong>{anomalies}</strong>
            <span>Anomalies</span>
          </div>
          <div className="terminer-stat">
            <strong>{recap.distance_reelle_km || '—'}</strong>
            <span>km parcourus</span>
          </div>
          <div className="terminer-stat">
            <strong>{recap.duree_reelle_min ? `${Math.floor(recap.duree_reelle_min / 60)}h${String(recap.duree_reelle_min % 60).padStart(2, '0')}` : '—'}</strong>
            <span>Durée</span>
          </div>
        </div>
      </MobileCard>

      <MobileCard>
        <h4 style={{ marginBottom: 12 }}>Progression</h4>
        <ProgressBar value={collected} max={total} label={`${total > 0 ? Math.round((collected / total) * 100) : 0}%`} color="#4CAF50" />
        {collected < total && (
          <p className="warning-text">
            <i className="fas fa-exclamation-triangle"></i> {total - collected} conteneur(s) non collecté(s)
          </p>
        )}
      </MobileCard>

      <MobileCard>
        <h4 style={{ marginBottom: 8 }}>Informations</h4>
        <div className="detail-row"><span>Code</span><strong>{recap.code || '—'}</strong></div>
        <div className="detail-row"><span>Zone</span><strong>{recap.zone_nom || '—'}</strong></div>
        <div className="detail-row"><span>Véhicule</span><strong>{recap.vehicule || '—'}</strong></div>
        <div className="detail-row"><span>Statut</span><strong>{recap.statut || '—'}</strong></div>
      </MobileCard>

      <div className="form-actions" style={{ marginTop: 16 }}>
        <button className="btn-outline-mobile" onClick={() => navigate('/agent/tournee')} style={{ flex: 1 }}>
          Retour
        </button>
      </div>
    </MobileLayout>
  );
}
