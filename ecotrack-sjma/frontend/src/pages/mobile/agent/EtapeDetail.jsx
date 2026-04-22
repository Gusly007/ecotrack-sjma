import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import { fetchMyTournee, fetchEtapes } from '../../../services/tourneeService';
import './EtapeDetail.css';

export default function EtapeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [etape, setEtape] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const t = await fetchMyTournee();
        if (t?.id_tournee) {
          const etapesRes = await fetchEtapes(t.id_tournee);
          const etapes = etapesRes || [];
          const found = etapes.find(e => String(e.id_etape) === String(id));
          setEtape(found || null);
        }
      } catch {
        setEtape(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <MobileLayout title="Detail de l'etape" showBack>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      </MobileLayout>
    );
  }

  if (!etape) {
    return (
      <MobileLayout title="Detail de l'etape" showBack>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: '#888' }}>Etape introuvable</p>
        </div>
      </MobileLayout>
    );
  }

  const gpsNavigate = () => {
    if (etape.latitude && etape.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${etape.latitude},${etape.longitude}`, '_blank');
    }
  };

  return (
    <MobileLayout title="Detail de l'etape" showBack>
      <div className="etape-center">
        <div className="etape-number-lg">{etape.sequence}</div>
        <h3>{etape.uid || etape.conteneur_uid || `Conteneur #${etape.id_conteneur}`}</h3>
        <p style={{ color: '#888', fontSize: '0.85rem' }}>{etape.adresse || ''}</p>
      </div>

      <MobileCard>
        <h4 className="detail-section-title"><i className="fas fa-info-circle" style={{ color: '#2196F3' }}></i> Informations conteneur</h4>
        <div className="detail-row"><span>Type</span><strong>{etape.type_nom || '—'}</strong></div>
        <div className="detail-row"><span>Capacite</span><strong>{etape.capacite_l ? `${etape.capacite_l} L` : '—'}</strong></div>
        <div className="detail-row">
          <span>Remplissage</span>
          <strong style={{ color: (etape.fill_level || 0) >= 80 ? '#f44336' : '#333' }}>
            {etape.fill_level || '—'}%
          </strong>
        </div>
        <div className="detail-row"><span>Zone</span><strong>{etape.zone_nom || '—'}</strong></div>
      </MobileCard>

      <MobileCard>
        <h4 className="detail-section-title"><i className="fas fa-history" style={{ color: '#FF9800' }}></i> Horaire prevu</h4>
        <div className="detail-row"><span>Heure estimee</span><strong>{etape.heure_estimee || '—'}</strong></div>
        <div className="detail-row"><span>Statut</span><strong>{etape.collectee ? 'Collecte' : 'En attente'}</strong></div>
      </MobileCard>

      <button className="gps-nav-btn" onClick={gpsNavigate}>
        <i className="fas fa-directions"></i> Naviguer vers ce conteneur
      </button>

      <div className="action-buttons-row">
        <button className="action-btn collect" onClick={() => navigate('/agent/scan')}>
          <i className="fas fa-qrcode"></i> Scanner
        </button>
        <button className="action-btn anomaly" onClick={() => navigate('/agent/anomalie/form')}>
          <i className="fas fa-exclamation-triangle"></i> Anomalie
        </button>
        <button className="action-btn skip" onClick={() => navigate('/agent/tournee')}>
          <i className="fas fa-forward"></i> Passer
        </button>
      </div>
    </MobileLayout>
  );
}
