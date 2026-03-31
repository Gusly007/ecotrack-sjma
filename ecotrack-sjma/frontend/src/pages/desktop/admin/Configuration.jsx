import { useState } from 'react';
import { FormGroup, Input, Alert, useAlert } from '../../../components/common';
import './Configuration.css';

const initialConfig = {
  security: {
    jwtExpiration: '24',
    refreshTokenExpiration: '7',
    sessionsMax: '3',
    bcryptRounds: '10',
    rateLimiting: '100'
  },
  performance: {
    collectionRateWeight: '0.4',
    completionRateWeight: '0.3',
    timeEfficiencyWeight: '0.15',
    distanceEfficiencyWeight: '0.15'
  },
  environment: {
    CO2_PER_KM: '0.85',
    FUEL_CONSUMPTION_PER_100KM: '35',
    FUEL_PRICE_PER_LITER: '1.65',
    LABOR_COST_PER_HOUR: '50',
    MAINTENANCE_COST_PER_KM: '0.15',
    CO2_PER_TREE_PER_YEAR: '20',
    CO2_PER_KM_CAR: '0.12'
  }
};

export default function ConfigurationPage() {
  const { alert, showSuccess } = useAlert();
  const [config, setConfig] = useState(initialConfig);
  const [savedSection, setSavedSection] = useState(null);

  const handleChange = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = (section) => {
    if (isSectionEmpty(section)) return;
    
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 3000);
    showSuccess(`Configuration ${section} enregistrée avec succès`);
  };

  const isSectionEmpty = (section) => {
    const sectionKey = {
      'Sécurité': 'security',
      'Performance': 'performance',
      'Environnement': 'environment'
    }[section];
    
    const sectionData = config[sectionKey];
    if (!sectionData) return true;
    const values = Object.values(sectionData);
    if (!values || values.length === 0) return true;
    return values.some(v => v === null || v === undefined || v === '');
  };

  const isSecurityEmpty = isSectionEmpty('Sécurité');
  const isPerformanceEmpty = isSectionEmpty('Performance');
  const isEnvironmentEmpty = isSectionEmpty('Environnement');

  return (
    <div className="configuration-page">
      {alert && <Alert type={alert.type} message={alert.message} />}
      
      <h2>Configuration système</h2>
      
      <div className="panel-grid">
        <div className="panel">
          <h3><i className="fas fa-lock" style={{ color: '#f44336' }}></i> Sécurité</h3>
          
          <FormGroup label="JWT Expiration (heures)">
            <Input 
              type="number"
              value={config.security.jwtExpiration}
              onChange={(v) => handleChange('security', 'jwtExpiration', v)}
            />
          </FormGroup>
          
          <FormGroup label="Refresh Token Expiration (jours)">
            <Input 
              type="number"
              value={config.security.refreshTokenExpiration}
              onChange={(v) => handleChange('security', 'refreshTokenExpiration', v)}
            />
          </FormGroup>
          
          <FormGroup label="Sessions max / utilisateur">
            <Input 
              type="number"
              value={config.security.sessionsMax}
              onChange={(v) => handleChange('security', 'sessionsMax', v)}
            />
          </FormGroup>
          
          <FormGroup label="Bcrypt rounds">
            <Input 
              type="number"
              value={config.security.bcryptRounds}
              onChange={(v) => handleChange('security', 'bcryptRounds', v)}
            />
          </FormGroup>
          
          <FormGroup label="Rate limiting (req/min)">
            <Input 
              type="number"
              value={config.security.rateLimiting}
              onChange={(v) => handleChange('security', 'rateLimiting', v)}
            />
          </FormGroup>
          
          <button 
            className={`btn-primary ${savedSection === 'Sécurité' ? 'saved' : ''}`}
            onClick={() => handleSave('Sécurité')}
            disabled={isSecurityEmpty}
          >
            <i className="fas fa-save"></i> 
            {savedSection === 'Sécurité' ? 'Sauvegardé!' : 'Sauvegarder'}
          </button>
        </div>

        <div className="panel">
          <h3><i className="fas fa-trophy" style={{ color: '#FF9800' }}></i> Performance Agents</h3>
          
          <div className="config-item">
            <label>COLLECTION RATE WEIGHT (%)</label>
            <Input 
              type="number"
              step="0.01"
              value={config.performance.collectionRateWeight}
              onChange={(v) => handleChange('performance', 'collectionRateWeight', v)}
              placeholder="0.4"
            />
          </div>
          
          <div className="config-item">
            <label>COMPLETION RATE WEIGHT (%)</label>
            <Input 
              type="number"
              step="0.01"
              value={config.performance.completionRateWeight}
              onChange={(v) => handleChange('performance', 'completionRateWeight', v)}
              placeholder="0.3"
            />
          </div>
          
          <div className="config-item">
            <label>TIME EFFICIENCY WEIGHT (%)</label>
            <Input 
              type="number"
              step="0.01"
              value={config.performance.timeEfficiencyWeight}
              onChange={(v) => handleChange('performance', 'timeEfficiencyWeight', v)}
              placeholder="0.15"
            />
          </div>
          
          <div className="config-item">
            <label>DISTANCE EFFICIENCY WEIGHT (%)</label>
            <Input 
              type="number"
              step="0.01"
              value={config.performance.distanceEfficiencyWeight}
              onChange={(v) => handleChange('performance', 'distanceEfficiencyWeight', v)}
              placeholder="0.15"
            />
          </div>
          
          <button 
            className={`btn-primary ${savedSection === 'Performance' ? 'saved' : ''}`}
            onClick={() => handleSave('Performance')}
            disabled={isPerformanceEmpty}
          >
            <i className="fas fa-save"></i> 
            {savedSection === 'Performance' ? 'Sauvegardé!' : 'Sauvegarder'}
          </button>
        </div>

        <div className="panel">
          <h3><i className="fas fa-leaf" style={{ color: '#4CAF50' }}></i> Impact CO2 & Environnement</h3>
          
          <FormGroup label="CO2 PER KM (kg/km)">
            <Input 
              type="number"
              step="0.01"
              value={config.environment.CO2_PER_KM}
              onChange={(v) => handleChange('environment', 'CO2_PER_KM', v)}
            />
          </FormGroup>
          
          <FormGroup label="FUEL CONSUMPTION PER 100KM (L/100km)">
            <Input 
              type="number"
              value={config.environment.FUEL_CONSUMPTION_PER_100KM}
              onChange={(v) => handleChange('environment', 'FUEL_CONSUMPTION_PER_100KM', v)}
            />
          </FormGroup>
          
          <FormGroup label="FUEL PRICE PER LITER (€/L)">
            <Input 
              type="number"
              step="0.01"
              value={config.environment.FUEL_PRICE_PER_LITER}
              onChange={(v) => handleChange('environment', 'FUEL_PRICE_PER_LITER', v)}
            />
          </FormGroup>
          
          <FormGroup label="LABOR COST PER HOUR (€/h)">
            <Input 
              type="number"
              value={config.environment.LABOR_COST_PER_HOUR}
              onChange={(v) => handleChange('environment', 'LABOR_COST_PER_HOUR', v)}
            />
          </FormGroup>
          
          <FormGroup label="MAINTENANCE COST PER KM (€/km)">
            <Input 
              type="number"
              step="0.01"
              value={config.environment.MAINTENANCE_COST_PER_KM}
              onChange={(v) => handleChange('environment', 'MAINTENANCE_COST_PER_KM', v)}
            />
          </FormGroup>
          
          <FormGroup label="CO2 PER TREE PER YEAR (kg/an)">
            <Input 
              type="number"
              value={config.environment.CO2_PER_TREE_PER_YEAR}
              onChange={(v) => handleChange('environment', 'CO2_PER_TREE_PER_YEAR', v)}
            />
          </FormGroup>
          
          <FormGroup label="CO2 PER KM CAR (kg/km)">
            <Input 
              type="number"
              step="0.01"
              value={config.environment.CO2_PER_KM_CAR}
              onChange={(v) => handleChange('environment', 'CO2_PER_KM_CAR', v)}
            />
          </FormGroup>
          
          <button 
            className={`btn-primary ${savedSection === 'Environnement' ? 'saved' : ''}`}
            onClick={() => handleSave('Environnement')}
            disabled={isEnvironmentEmpty}
          >
            <i className="fas fa-save"></i> 
            {savedSection === 'Environnement' ? 'Sauvegardé!' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}