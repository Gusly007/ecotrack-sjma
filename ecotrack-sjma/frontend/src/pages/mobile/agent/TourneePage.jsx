import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import ProgressBar from '../../../components/mobile/ProgressBar';
import MapView, { markerIcons } from '../../../components/mobile/MapView';
import MobileListItem from '../../../components/mobile/MobileListItem';
import EmptyState from '../../../components/mobile/EmptyState';
import { fetchMyTournee, fetchEtapes } from '../../../services/tourneeService';
import { useAuth } from '../../../context/AuthContext';
import { getIgnoredEtapes, setEtapeIgnored } from '../../../services/agentTourneeSession';
import { getAgentSkipMessages } from '../../../constants/agentSkipMessages';
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
  const { user } = useAuth();
  const agentId = user?.id_utilisateur || user?.id;
  const messages = getAgentSkipMessages();
  const [tournee, setTournee] = useState(null);
  const [etapes, setEtapes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ignoredIds, setIgnoredIds] = useState([]);
  const [skipError, setSkipError] = useState('');

  useEffect(() => {
    let active = true;
    const fetch = async () => {
      try {
        const t = await fetchMyTournee();
        if (!active) return;
        setTournee(t);
        if (t?.id_tournee) {
          const etapesRes = await fetchEtapes(t.id_tournee);
          if (!active) return;
          setEtapes(etapesRes || []);
          setIgnoredIds([]);
          setSkipError('');
          try {
            setIgnoredIds(getIgnoredEtapes(agentId, t.id_tournee));
          } catch {
            setSkipError(messages.readError);
          }
        }
      } catch {
        if (active) setTournee(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetch();
    return () => { active = false; };
  }, [agentId, messages]);

  if (loading) {
    return (
      <MobileLayout title="Tournée en cours" showBack>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      </MobileLayout>
    );
  }

  if (!tournee) {
    return (
      <MobileLayout title="Tournée en cours" showBack>
        <EmptyState icon="fa-route" title="Pas de tournée" message="Aucune tournée active pour le moment." />
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

  const pending = etapes.filter(e => !e.collectee && !ignoredIds.includes(String(e.id_etape)));
  const nextEtape = pending[0];
  const remaining = pending.slice(1);
  const ignoredEtapes = etapes.filter(e => !e.collectee && ignoredIds.includes(String(e.id_etape)));
  const handleResume = (etapeId) => {
    try {
      setIgnoredIds(setEtapeIgnored(agentId, tournee.id_tournee, etapeId, false));
      setSkipError('');
    } catch {
      setSkipError(messages.writeError);
    }
  };

  return (
    <MobileLayout
      title="Tournée en cours"
      showBack
      rightAction={
        <button className="mobile-header-action" onClick={() => navigate('/agent/tournee/terminer')}>
          <i className="fas fa-flag-checkered"></i>
        </button>
      }
    >
      <ProgressBar value={collected} max={total} label={`${collected}/${total}`} color="#4CAF50" />
      {skipError && <p className="tournee-skip-error" role="alert">{skipError}</p>}

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

      {!nextEtape && ignoredEtapes.length > 0 && (
        <div role="status">
          <EmptyState icon="fa-forward" title={messages.allIgnored} message={messages.allIgnoredHelp} />
        </div>
      )}

      {ignoredEtapes.length > 0 && (
        <section aria-labelledby="ignored-etapes-title">
          <h2 id="ignored-etapes-title" className="section-title">{messages.heading}</h2>
          <p className="ignored-etapes-note">{messages.sessionNote}</p>
          {ignoredEtapes.map(e => (
            <MobileListItem
              key={e.id_etape}
              number={e.sequence}
              title={e.uid || e.conteneur_uid || `Conteneur #${e.id_conteneur}`}
              subtitle={messages.ignored}
              right={
                <button
                  className="etape-resume-btn"
                  onClick={() => handleResume(e.id_etape)}
                  aria-label={`${messages.resume} : ${e.uid || e.conteneur_uid || e.id_conteneur}`}
                >
                  {messages.resume}
                </button>
              }
            />
          ))}
        </section>
      )}
    </MobileLayout>
  );
}
