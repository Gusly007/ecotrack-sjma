/**
 * Configuration globale du service IoT
 */
module.exports = {
  // Ports et serveur
  PORT: process.env.APP_PORT || 3013,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Base de données
  DB: {
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'ecotrack',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },

  // MQTT Broker
  MQTT: {
    port: parseInt(process.env.MQTT_PORT, 10) || 1883,
    host: process.env.MQTT_HOST || '0.0.0.0',
    topics: {
      SENSOR_DATA: 'containers/+/data',
      SENSOR_STATUS: 'containers/+/status'
    }
  },

  // Seuils d'alerte
  ALERTS: {
    FILL_LEVEL_CRITICAL: parseInt(process.env.ALERT_FILL_LEVEL_CRITICAL, 10) || 90,
    FILL_LEVEL_WARNING: parseInt(process.env.ALERT_FILL_LEVEL_WARNING, 10) || 75,
    BATTERY_LOW: parseInt(process.env.ALERT_BATTERY_LOW, 10) || 20,
    TEMPERATURE_MIN: parseInt(process.env.ALERT_TEMPERATURE_MIN, 10) || -10,
    TEMPERATURE_MAX: parseInt(process.env.ALERT_TEMPERATURE_MAX, 10) || 60,
    SENSOR_TIMEOUT_HOURS: parseInt(process.env.ALERT_SENSOR_TIMEOUT_HOURS, 10) || 24
  },

  // Pagination par défaut
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 1000
  },

  // Types d'alerte
  ALERT_TYPES: {
    DEBORDEMENT: 'DEBORDEMENT',
    BATTERIE_FAIBLE: 'BATTERIE_FAIBLE',
    CAPTEUR_DEFAILLANT: 'CAPTEUR_DEFAILLANT'
  },

  // Statuts d'alerte
  ALERT_STATUTS: ['ACTIVE', 'RESOLUE', 'IGNOREE'],

  // Messages standardisés
  MESSAGES: {
    SUCCESS: 'Opération réussie',
    CREATED: 'Ressource créée avec succès',
    UPDATED: 'Ressource mise à jour',
    DELETED: 'Ressource supprimée',
    ERROR: 'Une erreur s\'est produite',
    NOT_FOUND: 'Ressource non trouvée',
    UNAUTHORIZED: 'Non autorisé',
    FORBIDDEN: 'Accès refusé',
    BAD_REQUEST: 'Requête invalide'
  }
};
