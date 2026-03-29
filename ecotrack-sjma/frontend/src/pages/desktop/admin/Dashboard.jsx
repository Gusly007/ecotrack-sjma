import { Link } from 'react-router-dom';
import { StatCard, StatsGrid } from '../../../components/common';
import './Dashboard.css';

const mockAlerts = [
  { id: 1, type: 'critical', icon: 'fa-times-circle', iconColor: '#f44336', message: 'Service IoT en panne — investigation en cours', time: 'Il y a 32 min' },
  { id: 2, type: 'warning', icon: 'fa-tachometer-alt', iconColor: '#FF9800', message: 'Service Analytics : latence élevée (850ms)', time: 'Il y a 2h' },
  { id: 3, type: 'warning', icon: 'fa-user-lock', iconColor: '#FF9800', message: '5 tentatives de connexion échouées (IP: 192.168.1.42)', time: 'Il y a 3h' },
  { id: 4, type: 'info', icon: 'fa-database', iconColor: '#2196F3', message: 'Backup automatique terminé — 02:00', time: 'Il y a 8h' },
  { id: 5, type: 'info', icon: 'fa-microchip', iconColor: '#2196F3', message: 'Capteur CAPT-045 : batterie faible (15%)', time: 'Il y a 12h' },
];

export default function AdminDashboard() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Vue d'ensemble</h1>
        <div className="dashboard-links">
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
      </div>
      
      <StatsGrid>
        <StatCard 
          icon="fa-check-circle" 
          iconColor="green" 
          label="Statut services" 
          value="Opérationnels" 
          change="5/6 services OK"
          changeType="up"
        />
        <StatCard 
          icon="fa-users" 
          iconColor="blue" 
          label="Utilisateurs actifs" 
          value="1,245" 
          change="+32 cette semaine"
          changeType="up"
        />
        <StatCard 
          icon="fa-database" 
          iconColor="purple" 
          label="Espace DB" 
          value="2.4 GB" 
          change="/ 50 GB (4.8%)"
        />
        <StatCard 
          icon="fa-tachometer-alt" 
          iconColor="orange" 
          label="Requêtes / min" 
          value="450" 
          change="Uptime 99.98%"
          changeType="up"
        />
      </StatsGrid>
      
      <div className="panel-grid">
        <div className="panel">
          <h3>
            <i className="fas fa-heartbeat" style={{ color: '#f44336' }}></i> 
            Santé des services
          </h3>
          <div className="service-status">
            <span className="status-indicator healthy"></span>
            API Gateway
            <span className="latency">200ms</span>
          </div>
          <div className="service-status">
            <span className="status-indicator healthy"></span>
            Service Users
            <span className="latency">150ms</span>
          </div>
          <div className="service-status">
            <span className="status-indicator slow"></span>
            Service Analytics
            <span className="latency" style={{ color: '#FF9800' }}>850ms</span>
          </div>
          <div className="service-status">
            <span className="status-indicator healthy"></span>
            PostgreSQL
            <span className="latency">50ms</span>
          </div>
          <div className="service-status">
            <span className="status-indicator healthy"></span>
            Redis Cache
            <span className="latency">8ms</span>
          </div>
        </div>
        
        <div className="panel">
          <div className="panel-header">
            <h3>
              <i className="fas fa-exclamation-triangle" style={{ color: '#FF9800' }}></i>
              Alertes récentes
            </h3>
            <Link to="/admin/alerts" className="view-all-link">
              Voir tout <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          {mockAlerts.slice(0, 3).map(alert => (
            <div key={alert.id} className={`alert-item ${alert.type}`}>
              <i className={`fas ${alert.icon}`} style={{ color: alert.iconColor }}></i>
              <div className="alert-content">
                <span>{alert.message}</span>
                <small>{alert.time}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
