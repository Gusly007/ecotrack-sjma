import { useState, useEffect } from 'react';
import { StatCard, StatsGrid } from '../../../components/common';
import { Filters, SelectFilter, Pagination } from '../../../components/common';
import { alertService } from '../../../services/alertService';
import './Alerts.css';

const severityConfig = {
  critical: { color: '#f44336', icon: 'fa-times-circle', label: 'Critique' },
  high: { color: '#FF9800', icon: 'fa-exclamation-triangle', label: 'Haute' },
  medium: { color: '#FFC107', icon: 'fa-exclamation-circle', label: 'Moyenne' },
  low: { color: '#2196F3', icon: 'fa-info-circle', label: 'Basse' }
};

const categoryConfig = {
  conteneur: { icon: 'fa-trash-alt', label: 'Conteneur' },
  capteur: { icon: 'fa-microchip', label: 'Capteur' },
  infrastructure: { icon: 'fa-server', label: 'Infrastructure' },
  service: { icon: 'fa-cogs', label: 'Service' },
  database: { icon: 'fa-database', label: 'Base de données' },
  iot: { icon: 'fa-satellite-dish', label: 'IoT' },
  autre: { icon: 'fa-bell', label: 'Autre' }
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAlerts();
  }, [filterSeverity, filterCategory, currentPage]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await alertService.getAlerts({
        severity: filterSeverity,
        type: filterCategory,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      });
      
      setAlerts(response.data || []);
      setTotalItems(response.total || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Erreur lors du chargement des alertes');
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchCategory = filterCategory === 'all' || alert.category === filterCategory;
    return matchSeverity && matchCategory;
  });

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLast = Math.min(currentPage * itemsPerPage, totalItems);
  const indexOfFirst = (currentPage - 1) * itemsPerPage + 1;

  const counts = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
  };

  if (loading) {
    return <div className="alerts-page"><div className="loading">Chargement des alertes...</div></div>;
  }

  if (error) {
    return <div className="alerts-page"><div className="error">{error}</div></div>;
  }

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <h1>Centre d'alertes système</h1>
        <Filters>
          <SelectFilter
            value={filterSeverity}
            onChange={setFilterSeverity}
            options={[
              { value: 'all', label: 'Toutes sévérités' },
              { value: 'critical', label: 'Critique' },
              { value: 'high', label: 'Haute' },
              { value: 'medium', label: 'Moyenne' },
              { value: 'low', label: 'Basse' }
            ]}
          />
          <SelectFilter
            value={filterCategory}
            onChange={setFilterCategory}
            options={[
              { value: 'all', label: 'Toutes catégories' },
              { value: 'conteneur', label: 'Conteneurs' },
              { value: 'capteur', label: 'Capteurs' },
              { value: 'infrastructure', label: 'Infrastructure' },
              { value: 'service', label: 'Services' },
              { value: 'database', label: 'Base de données' },
              { value: 'iot', label: 'IoT' }
            ]}
          />
        </Filters>
      </div>

      <StatsGrid>
        <StatCard icon="fa-times-circle" iconColor="red" label="Critiques" value={counts.critical} />
        <StatCard icon="fa-exclamation-triangle" iconColor="orange" label="Hautes" value={counts.high} />
        <StatCard icon="fa-exclamation-circle" iconColor="yellow" label="Moyennes" value={counts.medium} />
        <StatCard icon="fa-info-circle" iconColor="blue" label="Basses" value={counts.low} />
      </StatsGrid>

      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <i className="fas fa-check-circle" style={{ color: '#4CAF50', marginRight: '8px' }}></i>
            Aucune alerte active
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const severityInfo = severityConfig[alert.severity] || severityConfig.low;
            const categoryInfo = categoryConfig[alert.category] || categoryConfig.autre;
            
            return (
              <div key={alert.id} className={`alert-center-item severity-${alert.severity}`}>
                <div className="alert-center-icon" style={{ background: severityInfo.color }}>
                  <i className={`fas ${alert.icon || severityInfo.icon}`}></i>
                </div>
                <div className="alert-center-content">
                  <div className="alert-header">
                    <strong>{alert.title}</strong>
                    <span className="alert-category" style={{ background: severityInfo.color + '20', color: severityInfo.color }}>
                      <i className={`fas ${categoryInfo.icon}`}></i> {categoryInfo.label}
                    </span>
                  </div>
                  <p>{alert.description}</p>
                  <div className="alert-meta">
                    <span className="alert-severity" style={{ color: severityInfo.color }}>
                      {severityInfo.label}
                    </span>
                    {alert.valeur && (
                      <span className="alert-threshold">
                        Valeur: {alert.valeur} / Seuil: {alert.seuil}
                      </span>
                    )}
                  </div>
                </div>
                <span className="alert-center-time">{new Date(alert.time).toLocaleString('fr-FR')}</span>
              </div>
            );
          })
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        showingTo={indexOfLast}
        totalItems={totalItems}
        label="alertes"
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
