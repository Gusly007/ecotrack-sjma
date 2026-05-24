import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileListItem from '../../../components/mobile/MobileListItem';
import EmptyState from '../../../components/mobile/EmptyState';
import { fetchMyTournee, fetchAnomalies } from '../../../services/tourneeService';
import './AnomaliePage.css';

const ANOMALIE_ICONS = {
  CONTENEUR_INACCESSIBLE: { icon: 'fa-car', color: '#f44336' },
  CONTENEUR_ENDOMMAGE: { icon: 'fa-tools', color: '#FF9800' },
  CAPTEUR_DEFAILLANT: { icon: 'fa-microchip', color: '#9c27b0' },
};

export default function AnomaliePage() {
  const navigate = useNavigate();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tourneeId, setTourneeId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const t = await fetchMyTournee();
        if (t?.id_tournee) {
          setTourneeId(t.id_tournee);
          const anomRes = await fetchAnomalies(t.id_tournee);
          setAnomalies(anomRes || []);
        }
      } catch {
        setAnomalies([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <MobileLayout title="Anomalies">
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Anomalies">
      <div className="anomalie-actions">
        <button className="anomalie-action-btn" onClick={() => navigate('/agent/scan')}>
          <i className="fas fa-qrcode"></i>
          <span>Scanner QR Code</span>
        </button>
        <button className="anomalie-action-btn" onClick={() => navigate('/agent/anomalie/form')}>
          <i className="fas fa-plus-circle"></i>
          <span>Nouvelle anomalie</span>
        </button>
      </div>

      {anomalies.length === 0 ? (
        <EmptyState
          icon="fa-check-circle"
          title="Aucune anomalie"
          message="Aucune anomalie signalee durant cette tournee."
        />
      ) : (
        <>
          <div className="section-title">Anomalies signalees ({anomalies.length})</div>
          {anomalies.map((a, i) => {
            const style = ANOMALIE_ICONS[a.type] || { icon: 'fa-exclamation-triangle', color: '#FF9800' };
            return (
              <MobileListItem
                key={a.id_signalement || i}
                icon={style.icon}
                iconColor={style.color}
                iconBg={`${style.color}15`}
                title={a.type || 'Anomalie'}
                subtitle={a.description || a.conteneur_uid || ''}
                right={<span style={{ fontSize: '0.75rem', color: '#888' }}>{a.date_creation ? new Date(a.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>}
              />
            );
          })}
        </>
      )}
    </MobileLayout>
  );
}
