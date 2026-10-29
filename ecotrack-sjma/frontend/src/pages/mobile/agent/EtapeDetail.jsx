import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import MapView, { markerIcons } from '../../../components/mobile/MapView';
import { fetchEtapeById } from '../../../services/tourneeService';
import { useAuth } from '../../../context/AuthContext';
import { getIgnoredEtapes, setEtapeIgnored } from '../../../services/agentTourneeSession';
import './EtapeDetail.css';

export default function EtapeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const agentId = user?.id_utilisateur || user?.id;
  const [etape, setEtape] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [ignoredIds, setIgnoredIds] = useState([]);
  const [skipError, setSkipError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const found = await fetchEtapeById(id);
        if (!active) return;
        setEtape(found || null);
        setSkipError('');
        setIgnoredIds([]);
        if (found) {
          try {
            setIgnoredIds(getIgnoredEtapes(agentId, found.id_tournee));
          } catch {
            setSkipError('Impossible de retrouver les étapes ignorées dans cet onglet.');
          }
        }
      } catch {
        if (active) setEtape(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id, agentId]);

  if (loading) {
    return (
      <MobileLayout title="Détail de l'étape" showBack>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      </MobileLayout>
    );
  }

  if (!etape) {
    return (
      <MobileLayout title="Détail de l'étape" showBack>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: '#888' }}>Étape introuvable</p>
        </div>
      </MobileLayout>
    );
  }

  const hasCoords = etape.latitude && etape.longitude;
  const ignored = !etape.collectee && ignoredIds.includes(String(etape.id_etape));
  const handleSkip = () => {
    try {
      setEtapeIgnored(agentId, etape.id_tournee, etape.id_etape);
      navigate('/agent/tournee');
    } catch {
      setSkipError('Impossible de mémoriser ce choix. Réessayez ; aucune collecte n’a été enregistrée.');
    }
  };
  const mapMarkers = hasCoords ? [{
    id: etape.id_etape,
    lat: parseFloat(etape.latitude),
    lng: parseFloat(etape.longitude),
    icon: markerIcons.red,
    popup: etape.conteneur_uid || `Conteneur #${etape.id_conteneur}`,
  }] : [];

  return (
    <MobileLayout title="Détail de l'étape" showBack>
      <div className="etape-center">
        <div className="etape-number-lg">{etape.sequence}</div>
        <h3>{etape.uid || etape.conteneur_uid || `Conteneur #${etape.id_conteneur}`}</h3>
        <p style={{ color: '#888', fontSize: '0.85rem' }}>{etape.adresse || ''}</p>
      </div>

      <MobileCard>
        <h4 className="detail-section-title"><i className="fas fa-info-circle" style={{ color: '#2196F3' }}></i> Informations conteneur</h4>
        <div className="detail-row"><span>Type</span><strong>{etape.type_nom || '—'}</strong></div>
        <div className="detail-row"><span>Capacité</span><strong>{etape.capacite_l ? `${etape.capacite_l} L` : '—'}</strong></div>
        <div className="detail-row">
          <span>Remplissage</span>
          <strong style={{ color: (etape.fill_level || 0) >= 80 ? '#f44336' : '#333' }}>
            {etape.fill_level || '—'}%
          </strong>
        </div>
        <div className="detail-row"><span>Zone</span><strong>{etape.zone_nom || '—'}</strong></div>
      </MobileCard>

      <MobileCard>
        <h4 className="detail-section-title"><i className="fas fa-history" style={{ color: '#FF9800' }}></i> Horaire prévu</h4>
        <div className="detail-row"><span>Heure estimée</span><strong>{etape.heure_estimee || '—'}</strong></div>
        <div className="detail-row"><span>Statut</span><strong>{etape.collectee ? 'Collecte' : ignored ? 'Ignorée' : 'En attente'}</strong></div>
      </MobileCard>

      <button className="gps-nav-btn" onClick={() => hasCoords && setShowMap(v => !v)} style={!hasCoords ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
        <i className="fas fa-map-marker-alt"></i> {showMap ? 'Masquer la carte' : 'Naviguer vers ce conteneur'}
      </button>

      {showMap && hasCoords && (
        <div style={{ marginBottom: 16 }}>
          <MapView
            markers={mapMarkers}
            center={[parseFloat(etape.latitude), parseFloat(etape.longitude)]}
            zoom={16}
            height="240px"
            fitBounds={false}
          />
        </div>
      )}

      {skipError && <p role="alert">{skipError}</p>}

      <div className="action-buttons-row">
        <button className="action-btn collect" onClick={() => navigate('/agent/scan')}>
          <i className="fas fa-qrcode"></i> Scanner
        </button>
        <button className="action-btn anomaly" onClick={() => navigate('/agent/anomalie/form')}>
          <i className="fas fa-exclamation-triangle"></i> Anomalie
        </button>
        <button className="action-btn skip" onClick={handleSkip} disabled={etape.collectee || ignored || String(etape.id_etape) !== id}>
          <i className="fas fa-forward"></i> Passer
        </button>
      </div>
    </MobileLayout>
  );
}
