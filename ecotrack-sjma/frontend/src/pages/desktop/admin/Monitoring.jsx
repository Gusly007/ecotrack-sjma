import { useState, useEffect } from 'react';
import { StatCard, StatsGrid } from '../../../components/common';
import { monitoringService } from '../../../services/monitoringService';
import './Monitoring.css';

export default function MonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [metricsData, setMetricsData] = useState(null);
  const [sensorsData, setSensorsData] = useState(null);
  const [alertsData, setAlertsData] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  const [showServices, setShowServices] = useState(true);
  const [showSensors, setShowSensors] = useState(true);
  const [showAlertRules, setShowAlertRules] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [health, metrics, sensors, alerts] = await Promise.all([
        monitoringService.getHealthChecks().catch(() => null),
        monitoringService.getMetrics().catch(() => null),
        monitoringService.getSensorsStatus().catch(() => null),
        monitoringService.getAlerts({ limit: 50 }).catch(() => ({ data: [] }))
      ]);

      setHealthData(health);
      setMetricsData(metrics);
      setSensorsData(sensors?.data);
      setAlertsData(alerts?.data || []);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getServiceStatus = (serviceName) => {
    if (!healthData?.services) return { status: 'unknown', latency: 'N/A' };
    const service = healthData.services.find(s => s.name === serviceName);
    if (!service) return { status: 'unknown', latency: 'N/A' };

    const isUp = service.status === 'up' || service.status === 'ok' || service.status === 'OK';
    return {
      status: isUp ? 'healthy' : 'down',
      latency: isUp ? '~50ms' : 'Down'
    };
  };

  const getMetricValue = (serviceName, metricName) => {
    if (!metricsData?.services) return null;
    const service = metricsData.services.find(s => s.name === serviceName);
    return service ? service[metricName] : null;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const serviceList = [
    { name: 'api-gateway', displayName: 'API Gateway', category: 'microservice' },
    { name: 'service-users', displayName: 'Service Users', category: 'microservice' },
    { name: 'service-containers', displayName: 'Service Containers', category: 'microservice' },
    { name: 'service-iot', displayName: 'Service IoT', category: 'microservice' },
    { name: 'service-gamifications', displayName: 'Service Gamifications', category: 'microservice' },
    { name: 'service-analytics', displayName: 'Service Analytics', category: 'microservice' },
    { name: 'service-routes', displayName: 'Service Routes', category: 'microservice' },
    { name: 'postgresql', displayName: 'PostgreSQL', category: 'database' },
    { name: 'redis', displayName: 'Redis Cache', category: 'cache' },
    { name: 'kafka', displayName: 'Kafka', category: 'messaging' },
    { name: 'mqtt-broker', displayName: 'MQTT Broker', category: 'iot' },
    { name: 'prometheus', displayName: 'Prometheus', category: 'monitoring' },
    { name: 'grafana', displayName: 'Grafana', category: 'monitoring' }
  ];

  const allServicesList = [
    { name: 'api-gateway', displayName: 'API Gateway' },
    { name: 'service-users', displayName: 'Service Users' },
    { name: 'service-containers', displayName: 'Service Containers' },
    { name: 'service-iot', displayName: 'Service IoT' },
    { name: 'service-gamifications', displayName: 'Service Gamifications' },
    { name: 'service-analytics', displayName: 'Service Analytics' },
    { name: 'service-routes', displayName: 'Service Routes' }
  ];

  const totalRequests = metricsData?.services?.reduce((sum, s) => sum + (s.httpRequests || 0), 0) || 0;
  const totalMemory = metricsData?.services?.reduce((sum, s) => sum + (s.memoryBytes || 0), 0) || 0;
  const activeServices = healthData?.services?.filter(s => s.status === 'up' || s.status === 'ok' || s.status === 'OK' || s.status === 'healthy').length || 0;
  const totalServices = healthData?.services?.length || 13;
  const downServicesCount = totalServices - activeServices;

  const totalMemoryUsed = metricsData?.services?.reduce((sum, s) => sum + (s.memoryBytes || 0), 0) || 0;

  const alertRules = [
    { 
      icon: 'fa-trash-alt', 
      name: 'Débordement', 
      threshold: '> 90%', 
      current: alertsData.filter(a => a.type_alerte === 'DEBORDEMENT' && a.statut === 'ACTIVE').length > 0 
        ? `${alertsData.filter(a => a.type_alerte === 'DEBORDEMENT' && a.statut === 'ACTIVE').length} alerte(s) active(s)` 
        : '0 alerte — OK', 
      status: alertsData.filter(a => a.type_alerte === 'DEBORDEMENT' && a.statut === 'ACTIVE').length > 0 ? 'critical' : 'OK', 
      action: 'Notification + Intervention' 
    },
    { 
      icon: 'fa-battery-quarter', 
      name: 'Batterie faible', 
      threshold: '< 20%', 
      current: alertsData.filter(a => a.type_alerte === 'BATTERIE_FAIBLE' && a.statut === 'ACTIVE').length > 0 
        ? `${alertsData.filter(a => a.type_alerte === 'BATTERIE_FAIBLE' && a.statut === 'ACTIVE').length} alerte(s) active(s)` 
        : '0 alerte — OK', 
      status: alertsData.filter(a => a.type_alerte === 'BATTERIE_FAIBLE' && a.statut === 'ACTIVE').length > 0 ? 'critical' : 'OK', 
      action: 'Notification' 
    },
    { 
      icon: 'fa-thermometer-half', 
      name: 'Capteur défaillant', 
      threshold: '-10°C à 60°C', 
      current: alertsData.filter(a => a.type_alerte === 'CAPTEUR_DEFAILLANT' && a.statut === 'ACTIVE').length > 0 
        ? `${alertsData.filter(a => a.type_alerte === 'CAPTEUR_DEFAILLANT' && a.statut === 'ACTIVE').length} alerte(s) active(s)` 
        : '0 alerte — OK', 
      status: alertsData.filter(a => a.type_alerte === 'CAPTEUR_DEFAILLANT' && a.statut === 'ACTIVE').length > 0 ? 'critical' : 'OK', 
      action: 'Notification + Vérification' 
    },
    { 
      icon: 'fa-server', 
      name: 'Service down', 
      threshold: 'Immédiat', 
      current: downServicesCount > 0 ? `${downServicesCount} service(s) down` : '0 service down — OK', 
      status: downServicesCount > 0 ? 'critical' : 'OK', 
      action: 'Notification + Restart' 
    },
  ];

  return (
    <div className="monitoring-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Monitoring Infrastructure</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>
            Dernière MAJ: {lastRefresh.toLocaleTimeString('fr-FR')}
          </span>
          <button 
            onClick={fetchAllData} 
            className="dashboard-link" 
            style={{ cursor: 'pointer', border: 'none', background: loading ? '#f5f5f5' : '#fff' }}
            disabled={loading}
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i> Actualiser
          </button>
        </div>
      </div>

      <div className="dashboard-links" style={{ marginBottom: '20px' }}>
        <a href="http://localhost:3001/d/ecotrack-overview/ecotrack-overview?orgId=1&from=now-1h&to=now&timezone=browser&refresh=10s" target="_blank" rel="noopener noreferrer" className="dashboard-link">
          <i className="fas fa-chart-line"></i> Grafana
        </a>
        <a href="http://localhost:9090" target="_blank" rel="noopener noreferrer" className="dashboard-link">
          <i className="fas fa-chart-bar"></i> Prometheus
        </a>
        <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer" className="dashboard-link">
          <i className="fas fa-stream"></i> Kafka UI
        </a>
      </div>

      {error && <div className="error-message">{error}</div>}

      <StatsGrid>
        <StatCard 
          icon="fa-server" 
          iconColor="green" 
          label="Services actifs" 
          value={`${activeServices}/${totalServices}`} 
        />
        <StatCard 
          icon="fa-exchange-alt" 
          iconColor="blue" 
          label="Requêtes HTTP" 
          value={totalRequests.toLocaleString()} 
        />
        <StatCard 
          icon="fa-memory" 
          iconColor="purple" 
          label="Mémoire totale" 
          value={formatBytes(totalMemory)} 
        />
        <StatCard 
          icon="fa-satellite-dish" 
          iconColor="orange" 
          label="Capteurs actifs (1h)" 
          value={sensorsData ? `${sensorsData.active_count || sensorsData.active || 0}/${sensorsData.total || 0}` : 'N/A'} 
        />
      </StatsGrid>

      <div className="panel" style={{ marginBottom: '20px', maxHeight: showServices ? '400px' : 'auto', overflow: 'hidden' }}>
        <h3 
          onClick={() => setShowServices(!showServices)} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span><i className="fas fa-server" style={{ color: '#2196F3' }}></i> Services</span>
          <i className={`fas fa-chevron-${showServices ? 'up' : 'down'}`} style={{ color: '#666', fontSize: '0.9rem' }}></i>
        </h3>
        {showServices && (
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            <div className="service-status" style={{ fontWeight: 'bold', color: '#666', fontSize: '0.8rem' }}>
              <span></span>
              <span className="service-name">Service</span>
              <span className="service-status-col" style={{ textAlign: 'center' }}>Statut</span>
              <span className="service-status-col" style={{ textAlign: 'center' }}>Mémoire</span>
            </div>
            
            <div style={{ marginTop: '12px', marginBottom: '4px', fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Microservices
            </div>
            {serviceList.filter(s => s.category === 'microservice').map((service) => {
              const status = getServiceStatus(service.name);
              const metric = metricsData?.services?.find(s => s.name === service.name);
              return (
                <div key={service.name} className="service-status">
                  <span className={`status-indicator ${status.status}`}></span>
                  <span className="service-name">{service.displayName}</span>
                  <span className={`service-status-col ${status.status === 'healthy' ? 'up' : 'down'}`}>
                    {status.status === 'healthy' ? 'UP' : 'DOWN'}
                  </span>
                  <span className="service-status-col">
                    {metric?.memoryBytes ? formatBytes(metric.memoryBytes) : '—'}
                  </span>
                </div>
              );
            })}

            <div style={{ marginTop: '16px', marginBottom: '4px', fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Infrastructure
            </div>
            {serviceList.filter(s => s.category !== 'microservice').map((service) => {
              const status = getServiceStatus(service.name);
              return (
                <div key={service.name} className="service-status">
                  <span className={`status-indicator ${status.status}`}></span>
                  <span className="service-name">{service.displayName}</span>
                  <span className={`service-status-col ${status.status === 'healthy' ? 'up' : 'down'}`}>
                    {status.status === 'healthy' ? 'UP' : 'DOWN'}
                  </span>
                  <span className="service-status-col" style={{ fontSize: '0.75rem', color: '#888' }}>
                    {service.category}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="panel" style={{ marginBottom: '20px', maxHeight: showSensors ? '400px' : 'auto', overflow: 'hidden' }}>
        <h3 
          onClick={() => setShowSensors(!showSensors)} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span><i className="fas fa-satellite-dish" style={{ color: '#4CAF50' }}></i> Capteurs IoT</span>
          <i className={`fas fa-chevron-${showSensors ? 'up' : 'down'}`} style={{ color: '#666', fontSize: '0.9rem' }}></i>
        </h3>
        {showSensors && (
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {sensorsData ? (
              <>
                <div className="iot-stats">
                  <div className="iot-stat">
                    <span>Capteurs actifs (1h)</span>
                    <strong style={{ color: '#4CAF50' }}>
                      {sensorsData.active_count?.toLocaleString() || sensorsData.active?.toLocaleString() || 0} / {sensorsData.total?.toLocaleString() || 0}
                    </strong>
                  </div>
                  <div className="iot-stat">
                    <span>Sans signal (&gt;12h)</span>
                    <strong style={{ color: sensorsData.inactive_12h > 0 ? '#f44336' : '#4CAF50' }}>
                      {sensorsData.inactive_12h || 0}
                    </strong>
                  </div>
                  <div className="iot-stat">
                    <span>Batterie faible (&lt;20%)</span>
                    <strong style={{ color: sensorsData.low_battery > 0 ? '#FF9800' : '#4CAF50' }}>
                      {sensorsData.low_battery || 0}
                    </strong>
                  </div>
                  <div className="iot-stat">
                    <span>Messages / min</span>
                    <strong>{sensorsData.messages_per_min?.toLocaleString() || 0}</strong>
                  </div>
                  <div className="iot-stat">
                    <span>Dernière mesure</span>
                    <strong>
                      {sensorsData.last_measure_seconds_ago < 60
                        ? `Il y a ${sensorsData.last_measure_seconds_ago}s`
                        : sensorsData.last_measure_seconds_ago < 3600
                          ? `Il y a ${Math.floor(sensorsData.last_measure_seconds_ago / 60)}min`
                          : `Il y a ${Math.floor(sensorsData.last_measure_seconds_ago / 3600)}h`
                      }
                    </strong>
                  </div>
                </div>
                {sensorsData.inactive_12h > 0 && (
                  <div className="alert-item warning">
                    <i className="fas fa-exclamation-triangle" style={{ color: '#FF9800' }}></i>
                    {sensorsData.inactive_12h} capteur(s) inactif(s) depuis plus de 12h
                  </div>
                )}
              </>
            ) : (
              <div className="iot-stats">
                <div className="iot-stat">
                  <span>Chargement des données capteurs...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="alerts-table" style={{ marginTop: '20px', marginBottom: '20px' }}>
        <h3 
          onClick={() => setShowAlertRules(!showAlertRules)} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span>Alertes configurées</span>
          <i className={`fas fa-chevron-${showAlertRules ? 'up' : 'down'}`} style={{ color: '#666', fontSize: '0.9rem' }}></i>
        </h3>
        {showAlertRules && (
          <table className="bo-table">
            <thead>
              <tr>
                <th>Règle</th>
                <th>Seuil</th>
                <th>Statut actuel</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alertRules.map((rule, index) => (
                <tr key={index}>
                  <td><i className={`fas ${rule.icon}`}></i> {rule.name}</td>
                  <td>{rule.threshold}</td>
                  <td>
                    <span style={{
                      color: rule.status === 'OK' ? '#4CAF50' :
                             rule.status === 'warning' ? '#FF9800' : '#f44336',
                      fontWeight: 'bold'
                    }}>
                      {rule.current}
                    </span>
                  </td>
                  <td>{rule.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="alerts-table" style={{ marginTop: '20px' }}>
        <h3 
          onClick={() => setShowMetrics(!showMetrics)} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span>Métriques par service</span>
          <i className={`fas fa-chevron-${showMetrics ? 'up' : 'down'}`} style={{ color: '#666', fontSize: '0.9rem' }}></i>
        </h3>
        {showMetrics && (
          <table className="bo-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Requêtes HTTP</th>
                <th>Mémoire</th>
              </tr>
            </thead>
            <tbody>
              {allServicesList.map((service) => {
                const metric = metricsData?.services?.find(s => s.name === service.name);
                const healthService = healthData?.services?.find(s => s.name === service.name);
                const isUp = healthService?.status === 'up' || healthService?.status === 'ok' || healthService?.status === 'OK';
                return (
                  <tr key={service.name}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`status-indicator ${isUp ? 'healthy' : 'down'}`}></span>
                        {service.displayName}
                      </span>
                    </td>
                    <td>{metric?.httpRequests?.toLocaleString() || 0}</td>
                    <td>{metric?.memoryBytes ? formatBytes(metric.memoryBytes) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
