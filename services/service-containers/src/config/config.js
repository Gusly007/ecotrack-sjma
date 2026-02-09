/**
 * Configuration globale du projet
 */
module.exports = {
  // Ports et serveur
  PORT: process.env.APP_PORT || 3011,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Base de données
  DB: {
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'ecotrack',
    max: 20, // pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },

  // Pagination par défaut
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 1000
  },

  // Constantes métier
  CONTAINER_STATUTS: ['ACTIF', 'INACTIF', 'EN_MAINTENANCE', 'HORS_SERVICE'],
  TYPE_CONTENEUR_NOMS: ['ORDURE', 'RECYCLAGE', 'VERRE', 'COMPOST'],

  // Validation
  VALIDATION: {
    CAPACITE_MIN: 100,
    CAPACITE_MAX: 5000,
    GPS_LATITUDE_MIN: -90,
    GPS_LATITUDE_MAX: 90,
    GPS_LONGITUDE_MIN: -180,
    GPS_LONGITUDE_MAX: 180
  },

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
