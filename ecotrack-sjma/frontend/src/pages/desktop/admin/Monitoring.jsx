import { StatCard, StatsGrid } from '../../../components/common';
import './Monitoring.css';

const services = [
  { name: 'API Gateway', status: 'healthy', latency: '200ms avg' },
  { name: 'Service Users', status: 'healthy', latency: '150ms avg' },
  { name: 'Service Analytics', status: 'slow', latency: '850ms avg' },
  { name: 'Service IoT', status: 'down', latency: 'Down' },
  { name: 'PostgreSQL', status: 'healthy', latency: '50ms avg' },
  { name: 'Redis Cache', status: 'healthy', latency: '8ms avg' },
  { name: 'MQTT Broker', status: 'healthy', latency: '12ms avg' },
];

const alertRules = [
  { icon: 'fa-microchip', name: 'CPU', threshold: '> 80% pendant 5 min', current: '45% — OK', status: 'OK', action: 'Notification + Scale' },
  { icon: 'fa-bug', name: 'Error rate', threshold: '> 5%', current: '0.3% — OK', status: 'OK', action: 'Notification' },
  { icon: 'fa-server', name: 'Service down', threshold: 'Immédiat', current: '1 service down', status: 'critical', action: 'Notification + Restart' },
  { icon: 'fa-clock', name: 'Latence', threshold: '> 500ms', current: 'Analytics: 850ms', status: 'warning', action: 'Notification' },
];

export default function MonitoringPage() {
  return (
    <div className="monitoring-page">
        <h1>Monitoring Infrastructure</h1>
        
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

        <StatsGrid>
          <StatCard icon="fa-microchip" iconColor="blue" label="CPU (8 cores)" value="45%" />
          <StatCard icon="fa-memory" iconColor="purple" label="RAM" value="12 / 32 GB" />
          <StatCard icon="fa-hdd" iconColor="orange" label="Disque" value="24 / 500 GB" />
          <StatCard icon="fa-network-wired" iconColor="green" label="Réseau" value="125 Mbps" change="80 out" />
        </StatsGrid>

        <div className="panel-grid">
          <div className="panel">
            <h3><i className="fas fa-server" style={{ color: '#2196F3' }}></i> Services</h3>
            {services.map((service, index) => (
              <div key={index} className="service-status">
                <span className={`status-indicator ${service.status}`}></span>
                {service.name}
                <span className="latency" style={{ 
                  color: service.status === 'down' ? '#f44336' : 
                         service.status === 'slow' ? '#FF9800' : '#888'
                }}>
                  {service.latency}
                </span>
              </div>
            ))}
          </div>
          
          <div className="panel">
            <h3><i className="fas fa-satellite-dish" style={{ color: '#4CAF50' }}></i> Capteurs IoT</h3>
            <div className="iot-stats">
              <div className="iot-stat">
                <span>Capteurs actifs</span>
                <strong style={{ color: '#4CAF50' }}>1,847 / 2,000</strong>
              </div>
              <div className="iot-stat">
                <span>Sans signal (&gt;12h)</span>
                <strong style={{ color: '#f44336' }}>23</strong>
              </div>
              <div className="iot-stat">
                  <span>Batterie faible (&lt;20%)</span>
                <strong style={{ color: '#FF9800' }}>8</strong>
              </div>
              <div className="iot-stat">
                <span>Messages / min</span>
                <strong>312</strong>
              </div>
              <div className="iot-stat">
                <span>Dernière mesure</span>
                <strong>Il y a 2s</strong>
              </div>
            </div>
            <div className="alert-item warning">
              <i className="fas fa-exclamation-triangle" style={{ color: '#FF9800' }}></i>
              23 capteurs inactifs depuis plus de 12h
            </div>
          </div>
        </div>

        <div className="alerts-table">
          <h3>Alertes configurées</h3>
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
                             rule.status === 'warning' ? '#FF9800' : '#f44336'
                    }}>
                      {rule.current}
                    </span>
                  </td>
                  <td>{rule.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
  );
}
