import { useState, useEffect } from 'react';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileCard from '../../../components/mobile/MobileCard';
import { fetchTourneesStats, fetchKpis } from '../../../services/tourneeService';
import './StatsPage.css';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('mois');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, kpisRes] = await Promise.all([
          fetchTourneesStats(),
          fetchKpis(),
        ]);
        setStats(statsRes);
        setKpis(kpisRes);
      } catch {
        setStats(null);
        setKpis(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

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
        <button className={`tab-inline ${activeTab === 'mois' ? 'active' : ''}`} onClick={() => setActiveTab('mois')}>Ce mois</button>
        <button className={`tab-inline ${activeTab === 'semaine' ? 'active' : ''}`} onClick={() => setActiveTab('semaine')}>Cette semaine</button>
        <button className={`tab-inline ${activeTab === 'jour' ? 'active' : ''}`} onClick={() => setActiveTab('jour')}>Aujourd'hui</button>
      </div>

      <MobileCard gradient>
        <div className="stats-summary-grid">
          <div className="stats-summary-item">
            <i className="fas fa-check-circle" style={{ fontSize: '1.5rem' }}></i>
            <strong>{stats?.total_collectes || kpis?.total_collectes || '—'}</strong>
            <span>Collectes</span>
          </div>
          <div className="stats-summary-item">
            <i className="fas fa-route" style={{ fontSize: '1.5rem' }}></i>
            <strong>{stats?.total_tournees || kpis?.total_tournees || '—'}</strong>
            <span>Tournees</span>
          </div>
          <div className="stats-summary-item">
            <i className="fas fa-weight-hanging" style={{ fontSize: '1.5rem' }}></i>
            <strong>{stats?.total_kg || kpis?.total_kg ? `${Math.round(stats?.total_kg || kpis?.total_kg)}` : '—'}</strong>
            <span>kg collectes</span>
          </div>
        </div>
      </MobileCard>

      <MobileCard>
        <h4 className="detail-section-title"><i className="fas fa-chart-bar" style={{ color: '#2196F3' }}></i> Performance</h4>
        <div className="detail-row">
          <span>Taux de reussite</span>
          <strong style={{ color: '#4CAF50' }}>{stats?.taux_reussite || kpis?.taux_completion || '—'}%</strong>
        </div>
        <div className="detail-row">
          <span>Distance totale</span>
          <strong>{stats?.distance_totale_km || kpis?.distance_totale_km || '—'} km</strong>
        </div>
        <div className="detail-row">
          <span>Anomalies signalees</span>
          <strong>{stats?.total_anomalies || kpis?.total_anomalies || '—'}</strong>
        </div>
      </MobileCard>

      {kpis?.co2_economise && (
        <MobileCard>
          <h4 className="detail-section-title"><i className="fas fa-leaf" style={{ color: '#4CAF50' }}></i> Impact environnemental</h4>
          <div className="eco-impact">
            <div className="eco-value">{kpis.co2_economise}</div>
            <div className="eco-label">kg CO2 economises</div>
          </div>
        </MobileCard>
      )}
    </MobileLayout>
  );
}
