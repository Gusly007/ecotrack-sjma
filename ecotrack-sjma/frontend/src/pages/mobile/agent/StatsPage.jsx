import { useState, useEffect } from 'react';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import { fetchAgentStats } from '../../../services/tourneeService';
import './StatsPage.css';

const TABS = [
  { key: 'mois', label: 'Ce mois' },
  { key: 'semaine', label: 'Cette semaine' },
  { key: 'jour', label: "Aujourd'hui" },
];

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('mois');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetchAgentStats(period);
        if (!cancelled) setStats(res);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [period]);

  if (loading) {
    return (
      <MobileLayout title="Mes Statistiques">
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      </MobileLayout>
    );
  }

  const fmt = (v, suffix = '') => (v || v === 0 ? `${v}${suffix}` : '—');

  return (
    <MobileLayout title="Mes Statistiques">
      <div className="tabs-inline">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-inline ${period === t.key ? 'active' : ''}`}
            onClick={() => setPeriod(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <MobileCard gradient>
        <div className="stats-summary-grid">
          <div className="stats-summary-item">
            <i className="fas fa-check-circle" style={{ fontSize: '1.5rem' }}></i>
            <strong>{fmt(stats?.total_collectes)}</strong>
            <span>Collectes</span>
          </div>
          <div className="stats-summary-item">
            <i className="fas fa-route" style={{ fontSize: '1.5rem' }}></i>
            <strong>{fmt(stats?.total_tournees)}</strong>
            <span>Tournees</span>
          </div>
          <div className="stats-summary-item">
            <i className="fas fa-weight-hanging" style={{ fontSize: '1.5rem' }}></i>
            <strong>{stats?.total_kg ? Math.round(stats.total_kg) : '—'}</strong>
            <span>kg collectes</span>
          </div>
        </div>
      </MobileCard>

      <MobileCard>
        <h4 className="detail-section-title"><i className="fas fa-chart-bar" style={{ color: '#2196F3' }}></i> Performance</h4>
        <div className="detail-row">
          <span>Taux de reussite</span>
          <strong style={{ color: '#4CAF50' }}>{fmt(stats?.taux_reussite_pct, '%')}</strong>
        </div>
        <div className="detail-row">
          <span>Distance totale</span>
          <strong>{fmt(stats?.distance_totale_km, ' km')}</strong>
        </div>
        <div className="detail-row">
          <span>Anomalies signalees</span>
          <strong>{fmt(stats?.total_anomalies)}</strong>
        </div>
        <div className="detail-row">
          <span>Tournees terminees</span>
          <strong>{fmt(stats?.tournees_terminees)} / {fmt(stats?.total_tournees)}</strong>
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
