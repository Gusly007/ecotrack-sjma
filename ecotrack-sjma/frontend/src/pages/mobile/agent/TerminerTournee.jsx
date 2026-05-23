import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import ProgressBar from '../../../components/mobile/ProgressBar';
import { useAlert } from '../../../hooks';
import { fetchMyTournee, fetchProgress, changeStatut } from '../../../services/tourneeService';
import './TerminerTournee.css';

export default function TerminerTournee() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useAlert();
  const [tournee, setTournee] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const t = await fetchMyTournee();
        setTournee(t);
        if (t?.id_tournee) {
          const progRes = await fetchProgress(t.id_tournee);
          setProgress(progRes);
        }
      } catch {
        setTournee(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleTerminer = async () => {
    if (!tournee?.id_tournee) return;
    setFinishing(true);
    try {
      await changeStatut(tournee.id_tournee, 'TERMINEE');
      setFinished(true);
      showSuccess('Tournee terminee avec succes !');
    } catch (err) {
      showError(err.response?.data?.message || 'Erreur lors de la finalisation');
    } finally {
      setFinishing(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Terminer la tournee" showBack>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      </MobileLayout>
    );
  }

  if (finished) {
    return (
      <MobileLayout title="Tournee terminee" showBack>
        <div className="success-screen">
          <div className="success-icon"><i className="fas fa-flag-checkered"></i></div>
          <h3>Tournee terminee !</h3>
          <p style={{ color: '#888', fontSize: '0.85rem' }}>Excellent travail. Vos donnees ont ete enregistrees.</p>
        </div>
        <button className="btn-primary-mobile" onClick={() => navigate('/agent')}>
          <i className="fas fa-home"></i> Retour a l'accueil
        </button>
      </MobileLayout>
    );
  }

  const collected = progress?.etapes_collectees || progress?.collected || 0;
  const total = progress?.total_etapes || progress?.total || tournee?.nb_etapes || 0;
  const anomalies = progress?.anomalies || 0;

  return (
    <MobileLayout title="Terminer la tournee" showBack>
      <MobileCard gradient>
        <h3 style={{ marginBottom: 16 }}><i className="fas fa-flag-checkered"></i> Resume de la tournee</h3>
        <div className="terminer-stats-grid">
          <div className="terminer-stat">
            <strong>{collected}/{total}</strong>
            <span>Conteneurs collectes</span>
          </div>
          <div className="terminer-stat">
            <strong>{anomalies}</strong>
            <span>Anomalies</span>
          </div>
          <div className="terminer-stat">
            <strong>{tournee?.distance_reelle_km || '—'}</strong>
            <span>km parcourus</span>
          </div>
          <div className="terminer-stat">
            <strong>{tournee?.duree_reelle_min ? `${Math.floor(tournee.duree_reelle_min / 60)}h${String(tournee.duree_reelle_min % 60).padStart(2, '0')}` : '—'}</strong>
            <span>Duree</span>
          </div>
        </div>
      </MobileCard>

      <MobileCard>
        <h4 style={{ marginBottom: 12 }}>Progression</h4>
        <ProgressBar value={collected} max={total} label={`${total > 0 ? Math.round((collected / total) * 100) : 0}%`} color="#4CAF50" />
        {collected < total && (
          <p className="warning-text">
            <i className="fas fa-exclamation-triangle"></i> {total - collected} conteneur(s) non collecte(s)
          </p>
        )}
      </MobileCard>

      <MobileCard>
        <h4 style={{ marginBottom: 8 }}>Informations</h4>
        <div className="detail-row"><span>Code</span><strong>{tournee?.code || '—'}</strong></div>
        <div className="detail-row"><span>Zone</span><strong>{tournee?.zone_nom || '—'}</strong></div>
        <div className="detail-row"><span>Vehicule</span><strong>{tournee?.vehicule || '—'}</strong></div>
        <div className="detail-row"><span>Statut</span><strong>{tournee?.statut || '—'}</strong></div>
      </MobileCard>

      <div className="form-actions" style={{ marginTop: 16 }}>
        <button className="btn-outline-mobile" onClick={() => navigate('/agent/tournee')} style={{ flex: 1 }}>
          Retour
        </button>
        <button className="btn-primary-mobile" onClick={handleTerminer} disabled={finishing} style={{ flex: 1 }}>
          {finishing
            ? <><i className="fas fa-spinner fa-spin"></i> Finalisation...</>
            : <><i className="fas fa-flag-checkered"></i> Terminer</>
          }
        </button>
      </div>
    </MobileLayout>
  );
}
