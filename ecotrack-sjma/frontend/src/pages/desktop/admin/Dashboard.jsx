import AdminLayout from '../../../components/desktop/admin/AdminLayout';
import StatCard from '../../../components/desktop/admin/StatCard';
import './Dashboard.css';

export default function AdminDashboard() {
  const notificationsCount = 5;

  return (
    <AdminLayout>
      <div className="stats-grid">
        <StatCard 
          icon="fa-check-circle" 
          iconColor="#4CAF50" 
          label="Statut services" 
          value="Opérationnels" 
          change="5/6 services OK"
          changeType="up"
        />
        <StatCard 
          icon="fa-users" 
          iconColor="#2196F3" 
          label="Utilisateurs actifs" 
          value="1,245" 
          change="+32 cette semaine"
          changeType="up"
        />
        <StatCard 
          icon="fa-database" 
          iconColor="#9C27B0" 
          label="Espace DB" 
          value="2.4 GB" 
          change="/ 50 GB (4.8%)"
        />
        <StatCard 
          icon="fa-tachometer-alt" 
          iconColor="#FF9800" 
          label="Requêtes / min" 
          value="450" 
          change="Uptime 99.98%"
          changeType="up"
        />
      </div>
      
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
          <h3>
            <i className="fas fa-exclamation-triangle" style={{ color: '#FF9800' }}></i>
            Alertes récentes
          </h3>
          <div className="alert-item warning">
            <i className="fas fa-tachometer-alt" style={{ color: '#FF9800' }}></i>
            Service Analytics : latence élevée (850ms)
          </div>
          <div className="alert-item warning">
            <i className="fas fa-user-lock" style={{ color: '#FF9800' }}></i>
            5 tentatives de connexion échouées (IP: 192.168.1.42)
          </div>
          <div className="alert-item info">
            <i className="fas fa-database" style={{ color: '#2196F3' }}></i>
            Backup automatique terminé — 02:00
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}