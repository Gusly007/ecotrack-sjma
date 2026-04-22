import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import { useNotifications } from '../../../hooks';
import { fetchMyTournee } from '../../../services/tourneeService';
import './AgentDashboard.css';

export default function AgentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [tournee, setTournee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetchMyTournee();
        setTournee(res);
      } catch {
        setTournee(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const prenom = user?.prenom || 'Agent';

  const headerRight = (
    <div style={{ display: 'flex', gap: 4 }}>
      <button className="mobile-header-action" onClick={() => navigate('/agent/notifications')}>
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>
      <button className="mobile-header-action" onClick={() => navigate('/agent/profil')}>
        <i className="fas fa-user-circle"></i>
      </button>
    </div>
  );

  return (
    <MobileLayout
      title=""
      rightAction={headerRight}
    >
      <div className="agent-greeting">
        <p className="greeting-text">Bonjour, {prenom}</p>
        <p className="greeting-date">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      ) : tournee ? (
        <>
          <MobileCard gradient>
            <h3><i className="fas fa-route"></i> Tournee du jour</h3>
            <p style={{ fontSize: '0.85rem', marginTop: -4, marginBottom: 12 }}>
              <i className="fas fa-map-marker-alt"></i> Zone : {tournee.zone_nom || tournee.zone || '—'}
            </p>
            <div className="summary-grid">
              <div className="summary-item">
                <strong>{tournee.nb_etapes || tournee.total_etapes || '—'}</strong>
                <span>Conteneurs</span>
              </div>
              <div className="summary-item">
                <strong>{tournee.distance_prevue_km ? `${tournee.distance_prevue_km} km` : '—'}</strong>
                <span>Distance</span>
              </div>
              <div className="summary-item">
                <strong>{tournee.heure_debut || '—'}</strong>
                <span>Depart</span>
              </div>
              <div className="summary-item">
                <strong>{tournee.duree_prevue_min ? `~${Math.floor(tournee.duree_prevue_min / 60)}h${String(tournee.duree_prevue_min % 60).padStart(2, '0')}` : '—'}</strong>
                <span>Duree est.</span>
              </div>
            </div>
          </MobileCard>

          <MobileCard>
            <div className="route-header">
              <div>
                <strong>Tournee #{tournee.code || tournee.id_tournee}</strong>
                <p style={{ fontSize: '0.8rem', color: '#888' }}>{tournee.zone_nom || ''} — {tournee.type_conteneur || ''}</p>
              </div>
              <span className={`route-badge ${tournee.statut === 'EN_COURS' ? 'active' : ''}`}>
                {tournee.statut === 'EN_COURS' ? 'En cours' : tournee.statut === 'PLANIFIEE' ? 'Planifiee' : tournee.statut}
              </span>
            </div>
            <div className="route-stats">
              <div className="route-stat">
                <strong>{tournee.etapes_collectees || 0}/{tournee.nb_etapes || tournee.total_etapes || 0}</strong>
                <span>Collectes</span>
              </div>
              <div className="route-stat">
                <strong>{tournee.nb_etapes ? Math.round(((tournee.etapes_collectees || 0) / tournee.nb_etapes) * 100) : 0}%</strong>
                <span>Progression</span>
              </div>
              <div className="route-stat">
                <strong>{tournee.vehicule || '—'}</strong>
                <span>Vehicule</span>
              </div>
            </div>
          </MobileCard>

          <button className="btn-primary-mobile" onClick={() => navigate('/agent/tournee')} style={{ marginBottom: 16 }}>
            <i className="fas fa-play"></i> {tournee.statut === 'EN_COURS' ? 'Continuer la tournee' : 'Voir la tournee'}
          </button>
        </>
      ) : (
        <MobileCard>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <i className="fas fa-calendar-check" style={{ fontSize: '2rem', color: '#ccc', marginBottom: 12 }}></i>
            <h3 style={{ color: '#888' }}>Pas de tournee aujourd'hui</h3>
            <p style={{ fontSize: '0.85rem', color: '#aaa' }}>Aucune tournee ne vous est assignee pour le moment.</p>
          </div>
        </MobileCard>
      )}

      <div className="section-title">Cette semaine</div>
      <div className="impact-grid">
        <MobileCard className="impact-card">
          <i className="fas fa-check-circle" style={{ color: '#4CAF50', fontSize: '1.5rem' }}></i>
          <span className="impact-value">—</span>
          <span className="impact-label">Collectes</span>
        </MobileCard>
        <MobileCard className="impact-card">
          <i className="fas fa-star" style={{ color: '#FF9800', fontSize: '1.5rem' }}></i>
          <span className="impact-value">—</span>
          <span className="impact-label">Reussite</span>
        </MobileCard>
        <MobileCard className="impact-card">
          <i className="fas fa-trophy" style={{ color: '#9c27b0', fontSize: '1.5rem' }}></i>
          <span className="impact-value">—</span>
          <span className="impact-label">Classement</span>
        </MobileCard>
      </div>
    </MobileLayout>
  );
}
