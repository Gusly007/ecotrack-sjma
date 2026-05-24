import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import ProgressBar from '../../../components/mobile/ProgressBar';
import MapView, { markerIcons } from '../../../components/mobile/MapView';
import MobileListItem from '../../../components/mobile/MobileListItem';
import EmptyState from '../../../components/mobile/EmptyState';
import { fetchMyTournee, fetchEtapes } from '../../../services/tourneeService';
import './TourneePage.css';

function getFillColor(pct) {
  if (pct >= 80) return 'high';
  if (pct >= 50) return 'medium';
  return 'low';
}

function getFillIcon(pct) {
  if (pct >= 80) return markerIcons.red;
  if (pct >= 50) return markerIcons.orange;
  return markerIcons.green;
}

export default function TourneePage() {
  const navigate = useNavigate();
  const [tournee, setTournee] = useState(null);
  const [etapes, setEtapes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const t = await fetchMyTournee();
        setTournee(t);
        if (t?.id_tournee) {
          const etapesRes = await fetchEtapes(t.id_tournee);
          setEtapes(etapesRes || []);
        }
      } catch {
        setTournee(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <MobileLayout title="Tournee en cours" showBack>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      </MobileLayout>
    );
  }

  if (!tournee) {
    return (
      <MobileLayout title="Tournee en cours" showBack>
        <EmptyState icon="fa-route" title="Pas de tournee" message="Aucune tournee active pour le moment." />
      </MobileLayout>
    );
  }

  const collected = etapes.filter(e => e.collectee).length;
  const total = etapes.length;
  const markers = etapes
    .filter(e => e.latitude && e.longitude)
    .map(e => ({
      id: e.id_etape,
      lat: parseFloat(e.latitude),
      lng: parseFloat(e.longitude),
      icon: e.collectee ? markerIcons.blue : getFillIcon(e.fill_level || e.niveau_remplissage || 0),
      popup: `${e.conteneur_uid || ''} - ${e.zone_nom || ''}`,
    }));

  const nextEtape = etapes.find(e => !e.collectee);
  const remaining = etapes.filter(e => !e.collectee).slice(1);

  return (
    <MobileLayout
      title="Tournee en cours"
      showBack
      rightAction={
        <button className="mobile-header-action" onClick={() => navigate('/agent/tournee/terminer')}>
          <i className="fas fa-flag-checkered"></i>
        </button>
      }
    >
      <ProgressBar value={collected} max={total} label={`${collected}/${total}`} color="#4CAF50" />

      {markers.length > 0 && (
        <MapView
          markers={markers}
          height="160px"
          fitBounds
          onMarkerClick={(m) => navigate(`/agent/tournee/etape/${m.id}`)}
        />
      )}

      {nextEtape && (
        <>
          <div className="section-title">Prochain conteneur</div>
          <MobileCard className="next-etape-card" onClick={() => navigate(`/agent/tournee/etape/${nextEtape.id_etape}`)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="etape-number highlight">{nextEtape.sequence}</div>
              <div style={{ flex: 1 }}>
                <strong>{nextEtape.uid || nextEtape.conteneur_uid || `Conteneur #${nextEtape.id_conteneur}`}</strong>
                <p style={{ fontSize: '0.8rem', color: '#888' }}>{nextEtape.adresse || ''}</p>
              </div>
              <div className="fill-indicator">
                <span className={`fill-pct ${getFillColor(nextEtape.fill_level || 0)}`}>
                  {nextEtape.fill_level != null ? `${nextEtape.fill_level}%` : '—'}
                </span>
              </div>
            </div>
          </MobileCard>
          <button className="btn-primary-mobile" onClick={() => navigate('/agent/scan')} style={{ marginBottom: 16 }}>
            <i className="fas fa-qrcode"></i> Scanner ce conteneur
          </button>
        </>
      )}

      {remaining.length > 0 && (
        <>
          <div className="section-title">File d'attente</div>
          {remaining.map((e) => (
            <MobileListItem
              key={e.id_etape}
              number={e.sequence}
              title={e.uid || e.conteneur_uid || `Conteneur #${e.id_conteneur}`}
              subtitle={e.adresse || ''}
              onClick={() => navigate(`/agent/tournee/etape/${e.id_etape}`)}
              right={
                <span className={`fill-pct ${getFillColor(e.fill_level || 0)}`}>
                  {e.fill_level != null ? `${e.fill_level}%` : '—'}
                </span>
              }
            />
          ))}
        </>
      )}
    </MobileLayout>
  );
}
