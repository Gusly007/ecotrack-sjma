import { useState, useEffect } from 'react';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import { fetchAgentStats } from '../../../services/tourneeService';
import './StatsPage.css';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('semaine');

  const loadStats = async (period) => {
    setLoading(true);
    try {
      const res = await fetchAgentStats(period);
      setStats(res);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(activeTab); }, [activeTab]);

  if (loading) {
    return (
      <MobileLayout title="Mes Statistiques">
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Mes Statistiques">
      <div className="tabs-inline">
        {[
          { key: 'jour',    label: "Aujourd'hui" },
          { key: 'semaine', label: 'Cette semaine' },
          { key: 'mois',    label: 'Ce mois' },
        ].map(t => (
          <button
            key={t.key}
            className={`tab-inline ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <MobileCard gradient>
        <div className="stats-summary-grid">
          <div className="stats-summary-item">
            <i className="fas fa-check-circle" style={{ fontSize: '1.5rem' }}></i>
            <strong>{stats?.total_collectes ?? '—'}</strong>
            <span>Collectes</span>
          </div>
          <div className="stats-summary-item">
            <i className="fas fa-route" style={{ fontSize: '1.5rem' }}></i>
            <strong>{stats?.total_tournees ?? '—'}</strong>
            <span>Tournees</span>
          </div>
          <div className="stats-summary-item">
            <i className="fas fa-weight-hanging" style={{ fontSize: '1.5rem' }}></i>
            <strong>{stats?.total_kg != null ? `${Math.round(stats.total_kg)}` : '—'}</strong>
            <span>kg collectes</span>
          </div>
        </div>
      </MobileCard>

      <MobileCard>
        <h4 className="detail-section-title"><i className="fas fa-chart-bar" style={{ color: '#2196F3' }}></i> Performance</h4>
        <div className="detail-row">
          <span>Taux de reussite</span>
          <strong style={{ color: '#4CAF50' }}>
            {stats?.taux_reussite_pct != null ? `${stats.taux_reussite_pct}%` : '—'}
          </strong>
        </div>
        <div className="detail-row">
          <span>Distance totale</span>
          <strong>{stats?.distance_totale_km != null ? `${stats.distance_totale_km} km` : '—'}</strong>
        </div>
        <div className="detail-row">
          <span>Classement agents</span>
          <strong style={{ color: '#9c27b0' }}>
            {stats?.classement?.rang != null
              ? `#${stats.classement.rang} / ${stats.classement.total_agents}`
              : '—'}
          </strong>
        </div>
      </MobileCard>

      {stats?.co2_economise_kg > 0 && (
        <MobileCard>
          <h4 className="detail-section-title"><i className="fas fa-leaf" style={{ color: '#4CAF50' }}></i> Impact environnemental</h4>
          <div className="eco-impact">
            <div className="eco-value">{stats.co2_economise_kg}</div>
            <div className="eco-label">kg CO2 economises</div>
          </div>
        </MobileCard>
      )}
    </MobileLayout>
  );
}
