import { useState, useEffect } from 'react';
import { FormGroup, Input, Alert, useAlert } from '../../../components/common';
import { configService } from '../../../services/configService';
import './Configuration.css';

const KEY_MAP = {
  security: {
    jwtExpiration: 'jwt.access_token_expiration',
    refreshTokenExpiration: 'jwt.refresh_token_expiration',
    sessionsMax: 'session.max_concurrent_sessions',
    bcryptRounds: 'security.bcrypt_rounds',
    rateLimiting: 'rate_limit.max_requests'
  },
  performance: {
    collectionRateWeight: 'COLLECTION_RATE_WEIGHT',
    completionRateWeight: 'COMPLETION_RATE_WEIGHT',
    timeEfficiencyWeight: 'TIME_EFFICIENCY_WEIGHT',
    distanceEfficiencyWeight: 'DISTANCE_EFFICIENCY_WEIGHT'
  },
  environment: {
    CO2_PER_KM: 'CO2_PER_KM',
    FUEL_CONSUMPTION_PER_100KM: 'FUEL_CONSUMPTION_PER_100KM',
    FUEL_PRICE_PER_LITER: 'FUEL_PRICE_PER_LITER',
    LABOR_COST_PER_HOUR: 'LABOR_COST_PER_HOUR',
    MAINTENANCE_COST_PER_KM: 'MAINTENANCE_COST_PER_KM',
    CO2_PER_TREE_PER_YEAR: 'CO2_PER_TREE_PER_YEAR',
    CO2_PER_KM_CAR: 'CO2_PER_KM_CAR'
  }
};

const reverseKeyMap = {};
Object.entries(KEY_MAP).forEach(([section, mappings]) => {
  Object.entries(mappings).forEach(([frontendKey, backendKey]) => {
    reverseKeyMap[backendKey] = { section, frontendKey };
  });
});

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
  const { alert, showSuccess, showError } = useAlert();
  const [config, setConfig] = useState(initialConfig);
  const [savedSection, setSavedSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await configService.getAll();
      
      const newConfig = JSON.parse(JSON.stringify(initialConfig));
      
      if (data.security) {
        const sec = data.security;
        if (sec['jwt.access_token_expiration']?.value !== undefined) {
          const val = sec['jwt.access_token_expiration'].value;
          newConfig.security.jwtExpiration = val.replace ? val.replace('h', '') : String(val);
        }
        if (sec['jwt.refresh_token_expiration']?.value !== undefined) {
          const val = sec['jwt.refresh_token_expiration'].value;
          const hours = val.replace ? parseFloat(val.replace('h', '')) : parseFloat(val);
          newConfig.security.refreshTokenExpiration = String(Math.round(hours / 24));
        }
        if (sec['session.max_concurrent_sessions']?.value !== undefined) {
          newConfig.security.sessionsMax = String(sec['session.max_concurrent_sessions'].value);
        }
        if (sec['security.bcrypt_rounds']?.value !== undefined) {
          newConfig.security.bcryptRounds = String(sec['security.bcrypt_rounds'].value);
        }
        if (sec['rate_limit.max_requests']?.value !== undefined) {
          newConfig.security.rateLimiting = String(sec['rate_limit.max_requests'].value);
        }
      }
      
      if (data.performance) {
        const perf = data.performance;
        if (perf['COLLECTION_RATE_WEIGHT']?.value !== undefined) newConfig.performance.collectionRateWeight = String(perf['COLLECTION_RATE_WEIGHT'].value);
        if (perf['COMPLETION_RATE_WEIGHT']?.value !== undefined) newConfig.performance.completionRateWeight = String(perf['COMPLETION_RATE_WEIGHT'].value);
        if (perf['TIME_EFFICIENCY_WEIGHT']?.value !== undefined) newConfig.performance.timeEfficiencyWeight = String(perf['TIME_EFFICIENCY_WEIGHT'].value);
        if (perf['DISTANCE_EFFICIENCY_WEIGHT']?.value !== undefined) newConfig.performance.distanceEfficiencyWeight = String(perf['DISTANCE_EFFICIENCY_WEIGHT'].value);
      }
      
      if (data.environmental) {
        const env = data.environmental;
        if (env['CO2_PER_KM']?.value !== undefined) newConfig.environment.CO2_PER_KM = String(env['CO2_PER_KM'].value);
        if (env['FUEL_CONSUMPTION_PER_100KM']?.value !== undefined) newConfig.environment.FUEL_CONSUMPTION_PER_100KM = String(env['FUEL_CONSUMPTION_PER_100KM'].value);
        if (env['FUEL_PRICE_PER_LITER']?.value !== undefined) newConfig.environment.FUEL_PRICE_PER_LITER = String(env['FUEL_PRICE_PER_LITER'].value);
        if (env['LABOR_COST_PER_HOUR']?.value !== undefined) newConfig.environment.LABOR_COST_PER_HOUR = String(env['LABOR_COST_PER_HOUR'].value);
        if (env['MAINTENANCE_COST_PER_KM']?.value !== undefined) newConfig.environment.MAINTENANCE_COST_PER_KM = String(env['MAINTENANCE_COST_PER_KM'].value);
        if (env['CO2_PER_TREE_PER_YEAR']?.value !== undefined) newConfig.environment.CO2_PER_TREE_PER_YEAR = String(env['CO2_PER_TREE_PER_YEAR'].value);
        if (env['CO2_PER_KM_CAR']?.value !== undefined) newConfig.environment.CO2_PER_KM_CAR = String(env['CO2_PER_KM_CAR'].value);
      }
      
      setConfig(newConfig);
    } catch (err) {
      console.error('Failed to load config:', err);
      showError('Erreur de chargement des configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async (section) => {
    if (isSectionEmpty(section)) return;
    
    setSavingSection(section);
    
    try {
      if (section === 'Sécurité') {
        await configService.updateSecurity('jwt.access_token_expiration', `${config.security.jwtExpiration}h`);
        await configService.updateSecurity('jwt.refresh_token_expiration', `${parseInt(config.security.refreshTokenExpiration) * 24}h`);
        await configService.updateSecurity('session.max_concurrent_sessions', parseInt(config.security.sessionsMax));
        await configService.updateSecurity('security.bcrypt_rounds', parseInt(config.security.bcryptRounds));
        await configService.updateSecurity('rate_limit.max_requests', parseInt(config.security.rateLimiting));
      } else if (section === 'Performance') {
        await configService.updatePerformance('COLLECTION_RATE_WEIGHT', parseFloat(config.performance.collectionRateWeight));
        await configService.updatePerformance('COMPLETION_RATE_WEIGHT', parseFloat(config.performance.completionRateWeight));
        await configService.updatePerformance('TIME_EFFICIENCY_WEIGHT', parseFloat(config.performance.timeEfficiencyWeight));
        await configService.updatePerformance('DISTANCE_EFFICIENCY_WEIGHT', parseFloat(config.performance.distanceEfficiencyWeight));
      } else if (section === 'Environnement') {
        await configService.updateEnvironmental('CO2_PER_KM', parseFloat(config.environment.CO2_PER_KM));
        await configService.updateEnvironmental('FUEL_CONSUMPTION_PER_100KM', parseFloat(config.environment.FUEL_CONSUMPTION_PER_100KM));
        await configService.updateEnvironmental('FUEL_PRICE_PER_LITER', parseFloat(config.environment.FUEL_PRICE_PER_LITER));
        await configService.updateEnvironmental('LABOR_COST_PER_HOUR', parseFloat(config.environment.LABOR_COST_PER_HOUR));
        await configService.updateEnvironmental('MAINTENANCE_COST_PER_KM', parseFloat(config.environment.MAINTENANCE_COST_PER_KM));
        await configService.updateEnvironmental('CO2_PER_TREE_PER_YEAR', parseFloat(config.environment.CO2_PER_TREE_PER_YEAR));
        await configService.updateEnvironmental('CO2_PER_KM_CAR', parseFloat(config.environment.CO2_PER_KM_CAR));
      }
      
      setSavedSection(section);
      setTimeout(() => setSavedSection(null), 3000);
      showSuccess(`Configuration ${section} enregistrée avec succès`);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadConfig();
    } catch (err) {
      console.error('Save config error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Erreur inconnue';
      showError(`Erreur: ${errorMsg}`);
    } finally {
      setSavingSection(null);
    }
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

  const performanceSum = 
    parseFloat(config.performance.collectionRateWeight || 0) +
    parseFloat(config.performance.completionRateWeight || 0) +
    parseFloat(config.performance.timeEfficiencyWeight || 0) +
    parseFloat(config.performance.distanceEfficiencyWeight || 0);
  
  const performanceSumInvalid = performanceSum !== 1;

  return (
    <div className="configuration-page">
      {alert && <Alert type={alert.type} message={alert.message} />}
      
      <h2>Configuration système</h2>
      
      {loading && <div className="loading-state"><i className="fas fa-spinner fa-spin"></i> Chargement des configurations...</div>}
      
      {!loading && (
      
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
            disabled={isSecurityEmpty || savingSection === 'Sécurité'}
          >
            <i className="fas fa-save"></i> 
            {savingSection === 'Sécurité' ? 'Sauvegarde...' : (savedSection === 'Sécurité' ? 'Sauvegardé!' : 'Sauvegarder')}
          </button>
        </div>

        <div className="panel">
          <h3><i className="fas fa-trophy" style={{ color: '#FF9800' }}></i> Performance Agents</h3>
          
          <div className="config-item">
            <label>COLLECTION RATE WEIGHT</label>
            <Input 
              type="number"
              step="0.01"
              value={config.performance.collectionRateWeight}
              onChange={(v) => handleChange('performance', 'collectionRateWeight', v)}
              placeholder="0.4"
            />
          </div>
          
          <div className="config-item">
            <label>COMPLETION RATE WEIGHT</label>
            <Input 
              type="number"
              step="0.01"
              value={config.performance.completionRateWeight}
              onChange={(v) => handleChange('performance', 'completionRateWeight', v)}
              placeholder="0.3"
            />
          </div>
          
          <div className="config-item">
            <label>TIME EFFICIENCY WEIGHT</label>
            <Input 
              type="number"
              step="0.01"
              value={config.performance.timeEfficiencyWeight}
              onChange={(v) => handleChange('performance', 'timeEfficiencyWeight', v)}
              placeholder="0.15"
            />
          </div>
          
          <div className="config-item">
            <label>DISTANCE EFFICIENCY WEIGHT</label>
            <Input 
              type="number"
              step="0.01"
              value={config.performance.distanceEfficiencyWeight}
              onChange={(v) => handleChange('performance', 'distanceEfficiencyWeight', v)}
              placeholder="0.15"
            />
          </div>
          
          {performanceSumInvalid && (
            <div className="config-warning">
              <i className="fas fa-exclamation-triangle"></i>
              La somme doit être égale à 1 (actuellement: {performanceSum.toFixed(2)})
            </div>
          )}
          
          <button 
            className={`btn-primary ${savedSection === 'Performance' ? 'saved' : ''}`}
            onClick={() => handleSave('Performance')}
            disabled={isPerformanceEmpty || savingSection === 'Performance' || performanceSumInvalid}
          >
            <i className="fas fa-save"></i> 
            {savingSection === 'Performance' ? 'Sauvegarde...' : (savedSection === 'Performance' ? 'Sauvegardé!' : 'Sauvegarder')}
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
            disabled={isEnvironmentEmpty || savingSection === 'Environnement'}
          >
            <i className="fas fa-save"></i> 
            {savingSection === 'Environnement' ? 'Sauvegarde...' : (savedSection === 'Environnement' ? 'Sauvegardé!' : 'Sauvegarder')}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}