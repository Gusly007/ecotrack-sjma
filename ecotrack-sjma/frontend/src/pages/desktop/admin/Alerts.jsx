import { useState } from 'react';
import { StatCard, StatsGrid } from '../../../components/common';
import { Filters, SelectFilter, Pagination } from '../../../components/common';
import './Alerts.css';

const allAlerts = [
  { id: 1, severity: 'critical', type: 'service', icon: 'fa-times-circle', title: 'Service IoT en panne', description: 'Connection perdue avec le broker MQTT (mqtt.ecotrack.io:1883). 1,847 capteurs non joignables.', time: 'Il y a 32 min' },
  { id: 2, severity: 'critical', type: 'conteneur', icon: 'fa-fill-drip', title: '3 conteneurs en débordement (>95%)', description: 'Zone Nord — CONT-00123, CONT-00456, CONT-00891 nécessitent une collecte urgente.', time: 'Il y a 1h' },
  { id: 3, severity: 'high', type: 'capteur', icon: 'fa-battery-quarter', title: '8 capteurs batterie faible (<20%)', description: 'CAPT-045 (5%), CAPT-078 (12%), CAPT-091 (15%), CAPT-103 (18%)...', time: 'Il y a 2h' },
  { id: 4, severity: 'high', type: 'service', icon: 'fa-tachometer-alt', title: 'Latence élevée — Service Analytics', description: 'Temps de réponse moyen: 850ms (seuil: 500ms). Performance dégradée.', time: 'Il y a 2h' },
  { id: 5, severity: 'medium', type: 'securite', icon: 'fa-user-lock', title: 'Tentatives de connexion suspectes', description: '5 tentatives échouées depuis l\'IP 192.168.1.42 (admin@ecotrack.com).', time: 'Il y a 3h' },
  { id: 6, severity: 'low', type: 'service', icon: 'fa-database', title: 'Backup automatique terminé', description: 'Sauvegarde quotidienne complétée avec succès (2.4 GB, 45s).', time: 'Il y a 8h' },
  { id: 7, severity: 'low', type: 'capteur', icon: 'fa-microchip', title: 'Capteur CAPT-045 : batterie faible', description: 'Batterie à 5% - remplacement recommandé.', time: 'Il y a 12h' },
  { id: 8, severity: 'medium', type: 'service', icon: 'fa-memory', title: 'Utilisation mémoire élevée', description: 'Service Users à 85% de mémoire vive.', time: 'Il y a 1j' },
];

const severityColors = {
  critical: '#f44336',
  high: '#FF9800',
  medium: '#FFC107',
  low: '#2196F3'
};

export default function AlertsPage() {
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredAlerts = allAlerts.filter(alert => {
    const matchSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchType = filterType === 'all' || alert.type === filterType;
    return matchSeverity && matchType;
  });

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentAlerts = filteredAlerts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);

  const counts = {
    critical: allAlerts.filter(a => a.severity === 'critical').length,
    high: allAlerts.filter(a => a.severity === 'high').length,
    medium: allAlerts.filter(a => a.severity === 'medium').length,
    low: allAlerts.filter(a => a.severity === 'low').length,
  };

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
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: 'all', label: 'Tous types' },
                { value: 'service', label: 'Services' },
                { value: 'capteur', label: 'Capteurs' },
                { value: 'conteneur', label: 'Conteneurs' },
                { value: 'securite', label: 'Sécurité' }
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
          {currentAlerts.map(alert => (
            <div key={alert.id} className={`alert-center-item severity-${alert.severity}`}>
              <div className="alert-center-icon" style={{ background: severityColors[alert.severity] }}>
                <i className={`fas ${alert.icon}`}></i>
              </div>
              <div className="alert-center-content">
                <strong>{alert.title}</strong>
                <p>{alert.description}</p>
              </div>
              <span className="alert-center-time">{alert.time}</span>
            </div>
          ))}
        </div>

        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          showingTo={indexOfLast} 
          totalItems={filteredAlerts.length} 
          label="alertes" 
          onPageChange={setCurrentPage} 
        />
      </div>
  );
}
