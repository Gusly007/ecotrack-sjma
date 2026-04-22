import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import { containerService } from '../../../services/containerService';
import { fetchMyTournee, recordCollecte } from '../../../services/tourneeService';
import './ScanResult.css';

export default function ScanResult() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantite, setQuantite] = useState('45');
  const [collecting, setCollecting] = useState(false);
  const [collected, setCollected] = useState(false);
  const [tourneeId, setTourneeId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await containerService.getByUid(decodeURIComponent(uid));
        setContainer(res);
        const t = await fetchMyTournee();
        if (t?.id_tournee) setTourneeId(t.id_tournee);
      } catch {
        setContainer(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [uid]);

  const handleCollecte = async () => {
    if (!tourneeId || !container) return;
    setCollecting(true);
    try {
      await recordCollecte(tourneeId, {
        id_conteneur: container.id_conteneur,
        quantite_kg: parseFloat(quantite) || 0,
      });
      setCollected(true);
    } catch (err) {
      console.error('Collecte error:', err);
    } finally {
      setCollecting(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Scanner QR Code" showBack>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      </MobileLayout>
    );
  }

  if (collected) {
    return (
      <MobileLayout title="Collecte validee" showBack>
        <div className="success-screen">
          <div className="success-icon"><i className="fas fa-check"></i></div>
          <h3>Collecte enregistree !</h3>
          <p style={{ color: '#4CAF50', fontWeight: 600 }}>+10 points</p>
        </div>
        <MobileCard>
          <h4 className="detail-section-title"><i className="fas fa-dumpster" style={{ color: '#4CAF50' }}></i> Conteneur collecte</h4>
          <div className="detail-row"><span>UID</span><strong>{container?.uid || uid}</strong></div>
          <div className="detail-row"><span>Poids</span><strong>{quantite} kg</strong></div>
          <div className="detail-row"><span>Heure</span><strong>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</strong></div>
        </MobileCard>
        <button className="btn-primary-mobile" onClick={() => navigate('/agent/tournee')}>
          <i className="fas fa-arrow-right"></i> Conteneur suivant
        </button>
        <button className="btn-outline-mobile" onClick={() => navigate('/agent/anomalie/form')} style={{ marginTop: 8 }}>
          <i className="fas fa-exclamation-triangle"></i> Signaler une anomalie
        </button>
      </MobileLayout>
    );
  }

  if (!container) {
    return (
      <MobileLayout title="Scanner QR Code" showBack>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <i className="fas fa-times-circle" style={{ fontSize: '2rem', color: '#f44336', marginBottom: 12 }}></i>
          <h3>Conteneur non trouve</h3>
          <p style={{ color: '#888', fontSize: '0.85rem' }}>UID: {decodeURIComponent(uid)}</p>
          <button className="btn-outline-mobile" onClick={() => navigate('/agent/scan')} style={{ marginTop: 16 }}>
            <i className="fas fa-redo"></i> Scanner a nouveau
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Scanner QR Code" showBack>
      <MobileCard className="scan-result-card">
        <div className="scan-result-header">
          <i className="fas fa-check-circle" style={{ color: '#4CAF50' }}></i>
          <h4>Conteneur identifie</h4>
        </div>
        <p className="scan-result-uid">{container.uid}</p>
        <p style={{ fontSize: '0.85rem', color: '#555' }}>{container.adresse || ''} — {container.type_conteneur || ''}</p>

        <div className="scan-result-stats">
          <div className="scan-stat">
            <strong style={{ color: (container.fill_level || 0) >= 80 ? '#f44336' : '#333' }}>
              {container.fill_level || '—'}%
            </strong>
            <span>Remplissage</span>
          </div>
          <div className="scan-stat">
            <strong>{container.capacite_l || '—'}L</strong>
            <span>Capacite</span>
          </div>
          <div className="scan-stat">
            <strong>{container.zone_nom || '—'}</strong>
            <span>Zone</span>
          </div>
        </div>
      </MobileCard>

      <div className="weight-input-group">
        <span><i className="fas fa-weight-hanging"></i> Poids estime</span>
        <div className="weight-input-row">
          <input
            type="number"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            className="form-input-mobile"
            placeholder="kg"
          />
          <span className="weight-unit">kg</span>
        </div>
      </div>

      <button className="btn-primary-mobile btn-success" onClick={handleCollecte} disabled={collecting}>
        {collecting
          ? <><i className="fas fa-spinner fa-spin"></i> Enregistrement...</>
          : <><i className="fas fa-check"></i> Valider la collecte (+10 pts)</>
        }
      </button>
      <button className="btn-outline-mobile" onClick={() => navigate('/agent/anomalie/form')} style={{ marginTop: 8 }}>
        <i className="fas fa-exclamation-triangle"></i> Signaler un probleme
      </button>
    </MobileLayout>
  );
}
