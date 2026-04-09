import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StatCard, StatsGrid } from '../../../components/common';
import { monitoringService } from '../../../services/monitoringService';
import { alertService } from '../../../services/alertService';
import { dashboardService } from '../../../services/dashboardService';
import { analyticsService } from '../../../services/analyticsService';
import api from '../../../services/api';
import { BarChart, CircularGauge, PredictionCard, AnomalyList } from '../../../components/desktop/admin/SimpleCharts';
import './Dashboard.css';

const severityConfig = {
  critical: { color: '#f44336', icon: 'fa-times-circle', label: 'Critique' },
  high: { color: '#FF9800', icon: 'fa-exclamation-triangle', label: 'Haute' },
  medium: { color: '#FFC107', icon: 'fa-exclamation-circle', label: 'Moyenne' },
  low: { color: '#2196F3', icon: 'fa-info-circle', label: 'Basse' }
};

const issueLabels = {
  no_data: 'Aucune donnee',
  no_recent_data: 'Pas de donnees recentes',
  critical_battery: 'Batterie critique',
  low_battery: 'Batterie faible',
  sensor_stuck: 'Capteur potentiellement bloque',
  insufficient_data: 'Donnees insuffisantes',
  sudden_fill: 'Variation brutale de remplissage',
  sudden_empty: 'Vidage anormal',
  temperature_extreme: 'Temperature extreme',
  statistical_outlier: 'Outlier statistique'
};

const CollapsibleSection = ({ title, icon, children, defaultExpanded = false, badge = null }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  return (
    <div className="collapsible-section">
      <div className="section-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="section-title-wrapper">
          <div className="section-title">
            <i className={`fas ${icon}`}></i>
            <span className="section-title-text">{title}</span>
            {badge && <span className="section-badge">{badge}</span>}
          </div>
        </div>
        <div className="section-toggle-wrapper">
          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} section-toggle`}></i>
        </div>
      </div>
      {isExpanded && <div className="section-content">{children}</div>}
    </div>
  );
};

export default function AdminDashboard() {
  const [healthData, setHealthData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    activeUsers: 0,
    dbSize: '...',
    dbPercentage: 0,
    requestsPerMin: 0,
    uptime: '...'
  });
  
  // Analytics data
  const [criticalContainers, setCriticalContainers] = useState([]);
  const [defectiveSensors, setDefectiveSensors] = useState([]);
  const [fillTrends, setFillTrends] = useState([]);
  const [zonePerformance, setZonePerformance] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [weatherImpact, setWeatherImpact] = useState(null);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [collecteStats, setCollecteStats] = useState(null);
  const [mlPredictions, setMlPredictions] = useState([]);
  const [criticalPage, setCriticalPage] = useState(1);
  const [mlPage, setMlPage] = useState(1);
  const [sensorPage, setSensorPage] = useState(1);
  const [weatherPage, setWeatherPage] = useState(1);
  const criticalPerPage = 6;
  const mlPerPage = 6;
  const sensorPerPage = 5;
  const weatherPerPage = 5;
  
  // Nouvelles fonctionnalités: Prédictions météo & Anomalies
  const [weatherPredictions, setWeatherPredictions] = useState([]);
  const [globalAnomalies, setGlobalAnomalies] = useState(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [allContainers, setAllContainers] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchAnalyticsData();
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchAnalyticsData();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [health, alertsData, dashboardStats] = await Promise.all([
        monitoringService.getHealthChecks().catch(() => null),
        alertService.getAlerts({ limit: 5 }).catch(() => ({ data: [] })),
        dashboardService.getStats().catch(() => ({ data: null }))
      ]);

      setHealthData(health);
      setAlerts(alertsData.data || []);

      if (dashboardStats.data) {
        setStats({
          activeUsers: dashboardStats.data.activeUsers ?? 0,
          dbSize: dashboardStats.data.dbSize ?? '...',
          dbPercentage: dashboardStats.data.dbPercentage ?? 0,
          requestsPerMin: dashboardStats.data.requestsPerMin ?? 0,
          uptime: dashboardStats.data.uptime ?? '...'
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const envResult = await analyticsService.getEnvironmentalMetrics().catch(err => {
        console.error('Environmental metrics error:', err);
        return null;
      });
      
      const [criticalData, sensorsData, trendsData, zonesData, kpisData, weatherData, collecteData, mlPredData, globalAnomaliesData] = await Promise.all([
        analyticsService.getCriticalContainers(85, 15).catch(() => ({ data: { containers: [] } })),
        analyticsService.getDefectiveSensors().catch(() => ({ data: { sensors: [] } })),
        analyticsService.getFillTrends(7).catch(() => ({ data: { trends: [] } })),
        analyticsService.getZonePerformance().catch(() => ({ data: { zones: [] } })),
        analyticsService.getKPIs('7d').catch(() => ({ data: null })),
        analyticsService.getWeatherImpact().catch(() => ({ data: null })),
        analyticsService.getCollecteStats().catch(() => ({ data: null })),
        analyticsService.getMLPredictions(1, 50).catch(() => ({ data: { predictions: [] } })),
        analyticsService.detectGlobalAnomalies(2, 15).catch(() => ({ data: null }))
      ]);

      setCriticalContainers(criticalData.data?.containers || []);
      setDefectiveSensors(sensorsData.data?.sensors || []);
      setFillTrends(trendsData.data?.trends || []);
      setZonePerformance(zonesData.data?.zones || []);
      setKpis(kpisData.data);
      setWeatherImpact(weatherData.data);
      setEnvironmentalData(envResult?.data?.environmental || null);
      setCollecteStats(collecteData.data || null);
      setMlPredictions(mlPredData.data?.predictions || []);
      setGlobalAnomalies(globalAnomaliesData.data || null);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await analyticsService.refreshCache();
      await fetchAnalyticsData();
      await fetchDashboardData();
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Prédire avec ajustement météo pour les conteneurs critiques
  const fetchWeatherPredictions = async () => {
    try {
      // Utilise predictCriticalContainers qui appelle predictFillLevel en interne
      // Pour les 5 premiers conteneurs critiques, on fait une prédiction avec météo
      const criticalIds = criticalContainers.slice(0, 5).map(c => c.id);
      const predictions = await Promise.all(
        criticalIds.map(async (id) => {
          try {
            const result = await analyticsService.predictWithWeather(id, 1);
            return result.data;
          } catch {
            return null;
          }
        })
      );
      setWeatherPredictions(predictions.filter(p => p !== null));
    } catch (err) {
      console.error('Error fetching weather predictions:', err);
    }
  };

  // Charger les prédictions météo quand les conteneurs critiques sont chargés
  useEffect(() => {
    if (criticalContainers.length > 0) {
      fetchWeatherPredictions();
    }
  }, [criticalContainers]);

  const sensorHealthSignals = useMemo(() => {
    const normalizeIssue = (issue) => issueLabels[issue] || issue;

    const detected = (defectiveSensors || []).map((sensor) => ({
      key: `detected-${sensor.containerId || sensor.containerUid}`,
      sensorId: sensor.sensorId,
      sensorUid: sensor.sensorUid,
      containerId: sensor.containerId,
      containerUid: sensor.containerUid,
      issues: (sensor.issues || []).map(normalizeIssue),
      source: 'detected',
      score: 100,
      lastMeasurement: sensor.lastMeasurement,
      measurementCount: sensor.measurementCount,
      avgBattery: sensor.avgBattery
    }));

    const predicted = (globalAnomalies?.containers || []).map((container) => {
      const anomalyTypes = (container.topAnomalies || [])
        .flatMap((a) => a.type || [])
        .map(normalizeIssue);

      return {
        key: `predicted-${container.containerId || container.containerUid}`,
        sensorId: container.sensorId,
        sensorUid: container.sensorUid,
        containerId: container.containerId,
        containerUid: container.containerUid,
        issues: anomalyTypes.length > 0 ? anomalyTypes : ['Anomalies repetitives detectees'],
        source: 'predicted',
        score: Number(container.anomaliesRate || 0),
        anomalyCount: container.anomaliesCount,
        lastMeasurement: container.topAnomalies?.[0]?.timestamp || null
      };
    });

    const mergedByContainer = new Map();

    [...predicted, ...detected].forEach((sensor) => {
      const key = sensor.containerId || sensor.containerUid;
      if (!key) return;

      const existing = mergedByContainer.get(key);
      if (!existing) {
        mergedByContainer.set(key, sensor);
        return;
      }

      const mergedIssues = Array.from(new Set([...(existing.issues || []), ...(sensor.issues || [])]));
      const mergedSource = existing.source === sensor.source ? existing.source : 'detected+predicted';

      mergedByContainer.set(key, {
        ...existing,
        ...sensor,
        issues: mergedIssues,
        source: mergedSource,
        score: Math.max(Number(existing.score || 0), Number(sensor.score || 0)),
        lastMeasurement: sensor.lastMeasurement || existing.lastMeasurement,
        measurementCount: sensor.measurementCount ?? existing.measurementCount,
        avgBattery: sensor.avgBattery ?? existing.avgBattery,
        anomalyCount: sensor.anomalyCount ?? existing.anomalyCount
      });
    });

    return Array.from(mergedByContainer.values()).sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
  }, [defectiveSensors, globalAnomalies]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(sensorHealthSignals.length / sensorPerPage));
    if (sensorPage > totalPages) {
      setSensorPage(totalPages);
    }
  }, [sensorHealthSignals.length, sensorPage, sensorPerPage]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(weatherPredictions.length / weatherPerPage));
    if (weatherPage > totalPages) {
      setWeatherPage(totalPages);
    }
  }, [weatherPredictions.length, weatherPage, weatherPerPage]);

  const getServiceStatus = (serviceName) => {
    if (!healthData?.services) return { status: 'unknown', latency: 'N/A' };
    const service = healthData.services.find(s => s.name === serviceName);
    if (!service) return { status: 'unknown', latency: 'N/A' };
    const isUp = service.status === 'up' || service.status === 'ok' || service.status === 'OK';
    return {
      status: isUp ? 'healthy' : 'down',
      latency: isUp ? '~50 ms' : 'Down'
    };
  };

  const activeServices = healthData?.services?.filter(s =>
    s.status === 'up' || s.status === 'ok' || s.status === 'OK'
  ).length || 0;
  const totalServices = healthData?.services?.length || 13;

  const microservices = [
    { name: 'api-gateway', displayName: 'API Gateway' },
    { name: 'service-users', displayName: 'Service Users' },
    { name: 'service-containers', displayName: 'Service Containers' },
    { name: 'service-routes', displayName: 'Service Routes' },
    { name: 'service-iot', displayName: 'Service IoT' },
    { name: 'service-gamifications', displayName: 'Service Gamifications' },
    { name: 'service-analytics', displayName: 'Service Analytics' }
  ];

  const infrastructure = [
    { name: 'postgresql', displayName: 'PostgreSQL' },
    { name: 'redis', displayName: 'Redis Cache' },
    { name: 'kafka', displayName: 'Kafka' },
    { name: 'mqtt-broker', displayName: 'MQTT Broker' },
    { name: 'prometheus', displayName: 'Prometheus' },
    { name: 'grafana', displayName: 'Grafana' }
  ];

  const recentAlerts = alerts.slice(0, 5).map(alert => {
    const config = severityConfig[alert.severity] || severityConfig.low;
    return {
      id: alert.id,
      type: alert.severity,
      icon: alert.icon || config.icon,
      iconColor: config.color,
      message: alert.title || alert.description,
      time: new Date(alert.time).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
    };
  });

  // Chart data
  const zonePerformanceData = zonePerformance.map(zone => ({
    label: zone.code || zone.name?.substring(0, 10) || `Z${zone.id}`,
    value: Math.round((zone.fillRate || 0) * 10) / 10,
    color: zone.fillRate > 80 ? '#f44336' : zone.fillRate > 60 ? '#FF9800' : '#4CAF50',
    containerCount: zone.containerCount || 0,
    avgBattery: zone.avgBattery || 0,
    measurementCount: zone.measurementCount || 0,
    extra: `${zone.name || zone.code} - ${zone.containerCount || 0} conteneurs`
  }));

  const fillTrendsData = fillTrends.map((trend) => {
    const date = new Date(trend.date);
    return {
      label: `${date.getDate()}/${date.getMonth() + 1}`,
      value: Math.round(trend.avgFillLevel || 0),
      color: '#2196F3',
      date: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
      measurementCount: trend.measurementCount || 0,
      avgBattery: trend.avgBattery || 0,
      extra: `${date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}`
    };
  });

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Vue d'ensemble</h1>
        <div className="dashboard-links">
          <button 
            onClick={handleRefreshData} 
            disabled={isRefreshing}
            className="dashboard-link refresh-btn"
            style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
          >
            <i className={`fas fa-sync-alt ${isRefreshing ? 'fa-spin' : ''}`}></i>
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </button>
          <a href="http://localhost:3001/d/ecotrack-overview/ecotrack-overview" target="_blank" rel="noopener noreferrer" className="dashboard-link">
            <i className="fas fa-chart-line"></i> Grafana
          </a>
          <a href="http://localhost:9090" target="_blank" rel="noopener noreferrer" className="dashboard-link">
            <i className="fas fa-chart-bar"></i> Prometheus
          </a>
        </div>
      </div>

      <StatsGrid>
        <StatCard icon="fa-check-circle" iconColor="green" label="Services"
          value={`${activeServices}/${totalServices}`}
          change={activeServices === totalServices ? 'Tous OK' : `${totalServices - activeServices} down`}
          changeType={activeServices === totalServices ? 'up' : 'down'} />
        <StatCard icon="fa-users" iconColor="blue" label="Utilisateurs actifs"
          value={stats.activeUsers.toLocaleString()} changeType="up" />
        <StatCard icon="fa-database" iconColor="purple" label="Espace DB"
          value={stats.dbSize} change={`${stats.dbPercentage}% utilisé`} />
        <StatCard icon="fa-tachometer-alt" iconColor="orange" label="Requêtes / min"
          value={stats.requestsPerMin} change={`Uptime ${stats.uptime}`} changeType="up" />
      </StatsGrid>

      {/* Section: Services & Alertes */}
      <CollapsibleSection title="Santé des Services & Alertes" icon="fa-heartbeat" defaultExpanded={true}
        badge={totalServices - activeServices > 0 ? `${totalServices - activeServices} down` : null}>
        <div className="panel-grid">
          <div className="panel">
            <h3><i className="fas fa-server" style={{ color: '#f44336' }}></i> État des services</h3>
            <div className="service-status-header">
              <span></span>
              <span className="service-name-header">Service</span>
              <span className="service-status-header-col">Statut</span>
              <span className="service-latency-header">Latence</span>
            </div>
            <div style={{ marginBottom: '12px', fontSize: '0.75rem', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Microservices</div>
            {microservices.map(service => {
              const status = getServiceStatus(service.name);
              return (
                <div key={service.name} className="service-status">
                  <span className={`status-indicator ${status.status}`}></span>
                  <span className="service-name">{service.displayName}</span>
                  <span className={`service-status-badge ${status.status}`}>{status.status === 'healthy' ? 'UP' : 'DOWN'}</span>
                  <span className={`service-latency ${status.status}`}>{status.latency}</span>
                </div>
              );
            })}
            <div style={{ marginTop: '16px', marginBottom: '12px', fontSize: '0.75rem', color: '#666', fontWeight: '600', textTransform: 'uppercase' }}>Infrastructure</div>
            {infrastructure.map(service => {
              const status = getServiceStatus(service.name);
              return (
                <div key={service.name} className="service-status">
                  <span className={`status-indicator ${status.status}`}></span>
                  <span className="service-name">{service.displayName}</span>
                  <span className={`service-status-badge ${status.status}`}>{status.status === 'healthy' ? 'UP' : 'DOWN'}</span>
                  <span className={`service-latency ${status.status}`}>{status.latency}</span>
                </div>
              );
            })}
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3><i className="fas fa-exclamation-triangle" style={{ color: '#FF9800' }}></i> Alertes récentes</h3>
              <Link to="/admin/alerts" className="view-all-link">Voir tout <i className="fas fa-arrow-right"></i></Link>
            </div>
            {recentAlerts.length === 0 ? (
              <div className="no-alerts"><i className="fas fa-check-circle" style={{ color: '#4CAF50', marginRight: '8px' }}></i>Aucune alerte active</div>
            ) : (
              recentAlerts.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.type}`}>
                  <i className={`fas ${alert.icon}`} style={{ color: alert.iconColor }}></i>
                  <div className="alert-content">
                    <span>{alert.message}</span>
                    <small>{alert.time}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Section: Prédictions ML */}
      <CollapsibleSection title="Analyse Prédictive & Détection" icon="fa-brain" defaultExpanded={false}>
        <div className="analytics-grid">
          <div className="panel analytics-panel critical-predictions">
            <div className="panel-header">
              <h3><i className="fas fa-brain" style={{ color: '#9C27B0' }}></i> Prédictions ML (J+1)</h3>
              <span className="badge">{mlPredictions.length}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '12px' }}>
              Régression linéaire prédit le niveau futur basé sur l'historique
            </p>
            {mlPredictions.length === 0 ? (
              <div className="no-data-message">
                <i className="fas fa-spinner fa-spin"></i>Chargement...
              </div>
            ) : (
              <>
                <div className="predictions-grid">
                  {mlPredictions.slice((mlPage - 1) * mlPerPage, mlPage * mlPerPage).map(pred => (
                    <div key={pred.containerId} className="prediction-card">
                      <div className="prediction-header">
                        <span className="prediction-title">{pred.uid}</span>
                        <span className="prediction-confidence" style={{ color: pred.confidence > 60 ? '#4CAF50' : '#FF9800' }}>
                          {pred.confidence}%
                        </span>
                      </div>
                      <div className="level-item">
                        <span className="level-label">Actuel:</span>
                        <div className="level-bar">
                          <div className="level-fill current" style={{ width: `${pred.currentFillLevel}%`, backgroundColor: '#2196F3' }} />
                        </div>
                      </div>
                      <div className="level-item">
                        <span className="level-label">J+1:</span>
                        <div className="level-bar">
                          <div className="level-fill predicted" style={{ width: `${pred.predictedFillLevel}%`, backgroundColor: pred.predictedFillLevel > 80 ? '#f44336' : '#4CAF50' }} />
                        </div>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#666' }}>
                        {pred.predictedFillLevel.toFixed(1)}% prédit
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pagination-controls">
                  <button className="pagination-btn" onClick={() => setMlPage(p => Math.max(1, p - 1))} disabled={mlPage === 1}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <span className="pagination-info">
                    {(mlPage - 1) * mlPerPage + 1} - {Math.min(mlPage * mlPerPage, mlPredictions.length)} / {mlPredictions.length}
                  </span>
                  <button className="pagination-btn" onClick={() => setMlPage(p => Math.min(Math.ceil(mlPredictions.length / mlPerPage), p + 1))} disabled={mlPage >= Math.ceil(mlPredictions.length / mlPerPage)}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="panel analytics-panel critical-predictions">
            <div className="panel-header">
              <h3><i className="fas fa-exclamation-triangle" style={{ color: '#f44336' }}></i> Conteneurs critiques (&gt;85%)</h3>
              <span className="badge critical">{criticalContainers.length}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '12px' }}>
              Mesure actuelle &gt; 85% - nécessite collecte soon
            </p>
            {criticalContainers.length === 0 ? (
              <div className="no-data-message">
                <i className="fas fa-check-circle" style={{ color: '#4CAF50' }}></i>Aucun conteneur critique
              </div>
            ) : (
              <>
                <div className="predictions-grid">
                  {criticalContainers.slice((criticalPage - 1) * criticalPerPage, criticalPage * criticalPerPage).map(container => (
                    <div key={container.id} className="prediction-card">
                      <div className="prediction-header">
                        <span className="prediction-title">{container.uid}</span>
                        <span className="prediction-confidence" style={{ color: container.fillLevel >= 95 ? '#f44336' : '#FF9800' }}>
                          {container.fillLevel}%
                        </span>
                      </div>
                      <div className="level-item">
                        <span className="level-label">Actuel:</span>
                        <div className="level-bar">
                          <div className="level-fill current" style={{ width: `${container.fillLevel}%`, backgroundColor: container.fillLevel >= 95 ? '#f44336' : '#FF9800' }} />
                        </div>
                      </div>
                      <div className="level-item">
                        <span className="level-label">Batterie:</span>
                        <div className="level-bar">
                          <div className="level-fill predicted" style={{ width: `${container.battery}%`, backgroundColor: container.battery < 20 ? '#f44336' : '#2196F3' }} />
                        </div>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#666' }}>
                        <span>{container.type}</span> • <span>{container.zone}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pagination-controls">
                  <button className="pagination-btn" onClick={() => setCriticalPage(p => Math.max(1, p - 1))} disabled={criticalPage === 1}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <span className="pagination-info">
                    {(criticalPage - 1) * criticalPerPage + 1} - {Math.min(criticalPage * criticalPerPage, criticalContainers.length)} / {criticalContainers.length}
                  </span>
                  <button className="pagination-btn" onClick={() => setCriticalPage(p => Math.min(Math.ceil(criticalContainers.length / criticalPerPage), p + 1))} disabled={criticalPage >= Math.ceil(criticalContainers.length / criticalPerPage)}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="panel analytics-panel">
            <div className="panel-header">
              <h3><i className="fas fa-tachometer-alt" style={{ color: '#9C27B0' }}></i> KPIs Performance</h3>
              <span className="info-badge" title={`📊 Taux collecte:\nCollectes réelles ÷ Tournées planifiées × 100\n\n📈 Efficacité:\nBasé sur niveau optimal 50-70%\nActuel: ${kpis?.avgFillLevel?.toFixed(1) ?? 0}%\n\n😊 Satisfaction:\n100 - (alertes actives × 1.5)\nActuel: ${kpis?.activeAlerts ?? 0} alertes`}>
                <i className="fas fa-info-circle"></i>
              </span>
            </div>
            <div className="kpi-grid">
              <div className="kpi-item">
                <CircularGauge value={kpis?.collectionRate ?? 0} max={100} label="Taux collecte" />
              </div>
              <div className="kpi-item">
                <CircularGauge value={kpis?.efficiency ?? 0} max={100} label="Efficacité" />
              </div>
              <div className="kpi-item">
                <CircularGauge value={kpis?.satisfaction ?? 100} max={100} label="Satisfaction" />
              </div>
            </div>
          </div>

          {/* Prédictions avec ajustement météo (Open-Meteo API) */}
          <div className="panel analytics-panel">
            <div className="panel-header">
              <h3><i className="fas fa-cloud-sun" style={{ color: '#03A9F4' }}></i> Prédictions Météo (J+1)</h3>
              <span className="badge">{weatherPredictions.length}</span>
              <span className="info-badge" title="#3955: identifiant du conteneur (si uid absent, fallback sur #containerId)
61.3%: niveau de remplissage prédit à J+1 pour ce conteneur
+5%: effet météo appliqué à la prédiction (météo augmente la production attendue)
Prévision Favorable: interprétation globale météo, pas forcément aucun risque pour chaque conteneur individuel
Conf: score de confiance de la prédiction ML pour ce conteneur">
                <i className="fas fa-info-circle"></i>
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '12px' }}>
              Régression linéaire + ajustement météo Open-Meteo (Paris)
            </p>
            {weatherPredictions.length === 0 ? (
              <div className="no-data-message">
                <i className="fas fa-cloud" style={{ color: '#9E9E9E' }}></i> Chargement des prédictions météo...
              </div>
            ) : (
              <>
                <div className="weather-predictions-list">
                  {weatherPredictions.slice((weatherPage - 1) * weatherPerPage, weatherPage * weatherPerPage).map((pred, idx) => (
                    <div key={idx} className="weather-prediction-item">
                      <div className="weather-pred-info">
                        <span className="weather-pred-id">{pred.uid || `#${pred.containerId}`}</span>
                        <span className="weather-pred-level" style={{ color: pred.predictedFillLevel > 80 ? '#f44336' : '#4CAF50' }}>
                          {pred.predictedFillLevel?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="weather-pred-details">
                        <span className="weather-impact" style={{ color: pred.weatherImpact > 0 ? '#FF9800' : '#4CAF50' }}>
                          <i className={`fas ${pred.weatherImpact > 0 ? 'fa-sun' : 'fa-cloud-rain'}`}></i>
                          {pred.weatherImpact > 0 ? '+' : ''}{pred.weatherImpact}% météo
                        </span>
                        <span className="weather-confidence" title={`Confiance: ${pred.confidence}% - ${pred.confidence < 30 ? 'Données très variables' : pred.confidence < 60 ? 'Données moyennement stables' : 'Données stables'}`}>
                          Conf: {pred.confidence}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pagination-controls">
                  <button className="pagination-btn" onClick={() => setWeatherPage(p => Math.max(1, p - 1))} disabled={weatherPage === 1}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <span className="pagination-info">
                    {(weatherPage - 1) * weatherPerPage + 1} - {Math.min(weatherPage * weatherPerPage, weatherPredictions.length)} / {weatherPredictions.length}
                  </span>
                  <button className="pagination-btn" onClick={() => setWeatherPage(p => Math.min(Math.ceil(weatherPredictions.length / weatherPerPage), p + 1))} disabled={weatherPage >= Math.ceil(weatherPredictions.length / weatherPerPage)}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Détection globale d'anomalies (auto-scan) */}
          <div className="panel analytics-panel">
            <div className="panel-header">
              <h3><i className="fas fa-search" style={{ color: '#FF5722' }}></i> Anomalies Globales (Z-Score &gt; 2)</h3>
              <span className="info-badge" title="Definition des chiffres:
Badge rouge (en haut a droite): nombre de conteneurs avec au moins une anomalie.
Scannes: nombre total de conteneurs analyses.
Anomalies: nombre total d'anomalies detectees sur tous les conteneurs analyses.
Taux global: (Anomalies / Total des mesures analysees) x 100.
La liste en dessous affiche seulement les conteneurs les plus anormaux (top), pas tous les conteneurs scannes.">
                <i className="fas fa-info-circle"></i>
              </span>
              {globalAnomalies?.summary && (
                <span className="badge danger">{globalAnomalies.summary.containersWithAnomalies}</span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '12px' }}>
              Scan automatique de tous les conteneurs - Conteneurs avec anomalies détectées
            </p>
            {!globalAnomalies ? (
              <div className="no-data-message">
                <i className="fas fa-spinner fa-spin"></i> Analyse en cours...
              </div>
            ) : globalAnomalies.summary?.containersWithAnomalies === 0 ? (
              <div className="no-data-message">
                <i className="fas fa-check-circle" style={{ color: '#4CAF50' }}></i> Aucune anomalie détectée
              </div>
            ) : (
              <>
                <div className="anomaly-summary" style={{ marginBottom: '12px' }}>
                  <div className="anomaly-stat">
                    <span className="anomaly-stat-value">{globalAnomalies.summary?.containersScanned || 0}</span>
                    <span className="anomaly-stat-label">Scannés</span>
                  </div>
                  <div className="anomaly-stat">
                    <span className="anomaly-stat-value">{globalAnomalies.summary?.totalAnomalies || 0}</span>
                    <span className="anomaly-stat-label">Anomalies</span>
                  </div>
                  <div className="anomaly-stat">
                    <span className="anomaly-stat-value">{globalAnomalies.summary?.globalAnomalyRate || 0}%</span>
                    <span className="anomaly-stat-label">Taux global</span>
                  </div>
                </div>
                <div className="anomaly-list">
                  {globalAnomalies.containers?.slice(0, 5).map((c, idx) => (
                    <div key={idx} className="anomaly-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="anomaly-type" style={{ fontWeight: 'bold' }}>{c.containerUid}</span>
                        <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: '8px' }}>
                          {c.anomaliesCount} anomalies ({c.anomaliesRate}%)
                        </span>
                      </div>
                      <span className="anomaly-value" style={{ fontSize: '0.75rem' }}>
                        {c.topAnomalies?.[0]?.type?.join(', ') || 'outlier'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Section: Tendances & Performance */}
      <CollapsibleSection title="Tendances & Performance" icon="fa-chart-line" defaultExpanded={false}>
        <div className="analytics-grid">
          <div className="panel analytics-panel">
            <div className="panel-header">
              <h3><i className="fas fa-chart-area" style={{ color: '#4CAF50' }}></i> Tendance remplissage (7 jours)</h3>
            </div>
            <BarChart data={fillTrendsData} title="Niveau moyen (%)" />
          </div>

          <div className="panel analytics-panel">
            <div className="panel-header">
              <h3><i className="fas fa-map-marked-alt" style={{ color: '#2196F3' }}></i> Performance par zone</h3>
            </div>
            <BarChart data={zonePerformanceData} title="Taux remplissage (%)" />
          </div>
        </div>
      </CollapsibleSection>

      {/* Section: Anomalies & Capteurs */}
      <CollapsibleSection title="Détection d'anomalies & Capteurs" icon="fa-search" defaultExpanded={false}
        badge={sensorHealthSignals.length > 0 ? `${sensorHealthSignals.length} capteurs` : null}>
        <div className="analytics-grid">
          <div className="panel analytics-panel">
            <div className="panel-header">
              <h3><i className="fas fa-microchip" style={{ color: '#f44336' }}></i> Capteurs defaillants (detectes + predits)</h3>
              <span className="badge danger">{sensorHealthSignals.length}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '12px' }}>
              Detection basee sur le backend analytics (AnomalyService): incidents reels + risque predit par anomalies.
            </p>
            {sensorHealthSignals.length === 0 ? (
              <div className="no-data-message">
                <i className="fas fa-check-circle" style={{ color: '#4CAF50' }}></i>Tous les capteurs fonctionnent
              </div>
            ) : (
              <>
                <div className="defective-sensors-list">
                  {sensorHealthSignals.slice((sensorPage - 1) * sensorPerPage, sensorPage * sensorPerPage).map((sensor, idx) => (
                    <div key={idx} className="sensor-item">
                      <div className="sensor-info">
                        <span className="sensor-id">
                          Capteur: {sensor.sensorUid || (sensor.sensorId ? `#${sensor.sensorId}` : 'inconnu')} {'->'} Conteneur #{sensor.containerId || 'N/A'}
                        </span>
                        <span className="sensor-issues">{sensor.issues?.join(', ') || 'Probleme capteur'}</span>
                      </div>
                      <span className="sensor-status error">
                        {sensor.source === 'detected+predicted' ? 'Detecte + predit' : sensor.source === 'detected' ? 'Detecte' : 'Predit'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pagination-controls">
                  <button className="pagination-btn" onClick={() => setSensorPage(p => Math.max(1, p - 1))} disabled={sensorPage === 1}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <span className="pagination-info">
                    {(sensorPage - 1) * sensorPerPage + 1} - {Math.min(sensorPage * sensorPerPage, sensorHealthSignals.length)} / {sensorHealthSignals.length}
                  </span>
                  <button className="pagination-btn" onClick={() => setSensorPage(p => Math.min(Math.ceil(sensorHealthSignals.length / sensorPerPage), p + 1))} disabled={sensorPage >= Math.ceil(sensorHealthSignals.length / sensorPerPage)}>
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="panel analytics-panel">
            <div className="panel-header">
              <h3><i className="fas fa-leaf" style={{ color: '#4CAF50' }}></i> Impact environnemental</h3>
            </div>
            <div className="environmental-stats">
              <div className="env-stat">
                <i className="fas fa-recycle" style={{ color: '#4CAF50' }}></i>
                <div className="env-stat-info">
                  <span className="env-value">{environmentalData?.co2?.reductionPct ? environmentalData.co2.reductionPct.toFixed(0) : 0}%</span>
                  <span className="env-label">Réduction CO2</span>
                </div>
              </div>
              <div className="env-stat">
                <i className="fas fa-car" style={{ color: '#FF9800' }}></i>
                <div className="env-stat-info">
                  <span className="env-value">{environmentalData?.co2?.saved ? (environmentalData.co2.saved / 1000).toFixed(2) : '0'}t</span>
                  <span className="env-label">CO2 évité</span>
                </div>
              </div>
              <div className="env-stat">
                <i className="fas fa-tree" style={{ color: '#4CAF50' }}></i>
                <div className="env-stat-info">
                  <span className="env-value">{environmentalData?.co2?.equivalents?.trees || 0}</span>
                  <span className="env-label">Arbres equivalents</span>
                </div>
              </div>
              <div className="env-stat">
                <i className="fas fa-route" style={{ color: '#2196F3' }}></i>
                <div className="env-stat-info">
                  <span className="env-value">
                    {environmentalData?.routes ? `${environmentalData.routes.completed}/${environmentalData.routes.total}` : '0/0'}
                  </span>
                  <span className="env-label">Routes complétées</span>
                </div>
              </div>
              <div className="env-stat">
                <i className="fas fa-gas-pump" style={{ color: '#9C27B0' }}></i>
                <div className="env-stat-info">
                  <span className="env-value">{environmentalData?.fuel?.saved != null ? `${environmentalData.fuel.saved.toFixed(1)}L` : '0L'}</span>
                  <span className="env-label">Carburant économisé</span>
                </div>
              </div>
              <div className="env-stat">
                <i className="fas fa-weight" style={{ color: '#607D8B' }}></i>
                <div className="env-stat-info">
                  <span className="env-value">{collecteStats?.summary?.totalKg ? collecteStats.summary.totalKg.toFixed(0) : 0}kg</span>
                  <span className="env-label">Déchets collectés</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section: Météo */}
      <CollapsibleSection title="Impact Météo & Conditions" icon="fa-cloud-sun" defaultExpanded={false}>
        <div className="analytics-grid">
          <div className="panel analytics-panel weather-panel">
            <div className="panel-header">
              <h3><i className="fas fa-cloud" style={{ color: '#2196F3' }}></i> Conditions météorologiques</h3>
              <span className="info-badge" title="+5%: effet météo appliqué à la prédiction (météo augmente la production attendue)
Prévision Favorable: interprétation globale météo, pas forcément aucun risque pour chaque conteneur individuel">
                <i className="fas fa-info-circle"></i>
              </span>
            </div>
            {weatherImpact ? (
              <div className="weather-info">
                <div className="weather-main">
                  <i className={`fas ${weatherImpact.weatherIcon || 'fa-sun'}`} style={{ fontSize: '48px', color: '#FFC107' }}></i>
                  <div className="weather-temp">
                    <span className="temperature">{weatherImpact.temperature}°C</span>
                    <span className="condition">{weatherImpact.condition}</span>
                  </div>
                </div>
                <div className="weather-impact-details">
                  <div className="impact-item">
                    <span className="impact-label">Impact collecte:</span>
                    <span className={`impact-value ${weatherImpact.impact > 0 ? 'positive' : 'negative'}`}>
                      {weatherImpact.impact > 0 ? '+' : ''}{weatherImpact.impact}%
                    </span>
                  </div>
                  <div className="impact-item">
                    <span className="impact-label">Prévision:</span>
                    <span className="impact-value">{weatherImpact.prediction}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-data-message"><i className="fas fa-spinner fa-spin"></i>Chargement...</div>
            )}
          </div>

          <div className="panel analytics-panel">
            <div className="panel-header">
              <h3><i className="fas fa-chart-pie" style={{ color: '#9C27B0' }}></i> Statistiques clés</h3>
            </div>
            <div className="environmental-stats">
              <div className="env-stat">
                <i className="fas fa-trash-alt" style={{ color: '#607D8B' }}></i>
                <div className="env-stat-info">
                  <span className="env-value">{kpis?.totalContainers ?? 0}</span>
                  <span className="env-label">Conteneurs actifs</span>
                </div>
              </div>
              <div className="env-stat">
                <i className="fas fa-bell" style={{ color: '#f44336' }}></i>
                <div className="env-stat-info">
                  <span className="env-value">{kpis?.activeAlerts || 0}</span>
                  <span className="env-label">Alertes actives</span>
                </div>
              </div>
              <div className="env-stat">
                <i className="fas fa-percentage" style={{ color: '#4CAF50' }}></i>
                <div className="env-stat-info">
                  <span className="env-value">{kpis?.avgFillLevel ?? 0}%</span>
                  <span className="env-label">Niveau moyen</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {loading && <div className="loading-overlay"><i className="fas fa-spinner fa-spin"></i>Chargement...</div>}
    </div>
  );
}
