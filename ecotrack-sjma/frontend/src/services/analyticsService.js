import api from './api';

export const analyticsService = {
  // ============================================
  // PREDICTIONS ML (predictionService.js)
  // ============================================
  
  /**
   * Prédire le niveau de remplissage d'un conteneur spécifique
   * Utilise: PredictionService.predictFillLevel() ou predictWithWeather()
   * @param {number} containerId - ID du conteneur
   * @param {number} daysAhead - Nombre de jours pour la prédiction (défaut: 1)
   * @param {boolean} includeWeather - Inclure l'ajustement météo (défaut: false)
   */
  predictFillLevel: async (containerId, daysAhead = 1, includeWeather = false) => {
    const response = await api.post('/api/analytics/ml/predict', {
      containerId,
      daysAhead,
      includeWeather
    });
    return response.data;
  },

  /**
   * Prédire les conteneurs qui seront critiques
   * Utilise: PredictionService.predictCriticalContainers()
   * @param {number} daysAhead - Nombre de jours pour la prédiction
   * @param {number} threshold - Seuil de criticité (défaut: 90%)
   */
  predictCriticalContainers: async (daysAhead = 1, threshold = 90) => {
    const response = await api.get('/api/analytics/ml/predict-critical', {
      params: { daysAhead, threshold }
    });
    return response.data;
  },

  /**
   * Prédire avec ajustement météo (Open-Meteo API)
   * Utilise: PredictionService.predictWithWeather()
   * @param {number} containerId - ID du conteneur
   * @param {number} daysAhead - Nombre de jours pour la prédiction
   */
  predictWithWeather: async (containerId, daysAhead = 1) => {
    const response = await api.post('/api/analytics/ml/predict', {
      containerId,
      daysAhead,
      includeWeather: true
    });
    return response.data;
  },

  // Alias pour compatibilité
  getPredictions: async (containerId, daysAhead = 1, includeWeather = false) => {
    return analyticsService.predictFillLevel(containerId, daysAhead, includeWeather);
  },
  getCriticalPredictions: async (daysAhead = 1, threshold = 90) => {
    return analyticsService.predictCriticalContainers(daysAhead, threshold);
  },

  // ============================================
  // ANOMALIES (anomalyService.js)
  // ============================================

  /**
   * Détecter les anomalies pour un conteneur (z-score)
   * Utilise: AnomalyService.detectAnomalies()
   * @param {number} containerId - ID du conteneur
   * @param {number} threshold - Seuil z-score (défaut: 2)
   */
  detectAnomalies: async (containerId, threshold = 2) => {
    const response = await api.get(`/api/analytics/ml/anomalies/${containerId}`, {
      params: { threshold }
    });
    return response.data;
  },

  /**
   * Détecter les capteurs défaillants
   * Utilise: AnomalyService.detectDefectiveSensors()
   * Critères: pas de données 48h, batterie <10%, capteur bloqué, données insuffisantes
   */
  detectDefectiveSensors: async () => {
    const response = await api.get('/api/analytics/ml/defective-sensors');
    return response.data;
  },

  /**
   * Détecter anomalies ET créer des alertes automatiques
   * Utilise: AnomalyService.detectAnomalies() + createAlerts()
   * @param {number} containerId - ID du conteneur
   * @param {number} threshold - Seuil z-score
   * @param {boolean} autoCreate - Créer les alertes automatiquement
   */
  detectAnomaliesAndCreateAlerts: async (containerId, threshold = 2, autoCreate = true) => {
    const response = await api.post(`/api/analytics/ml/anomalies/${containerId}/alerts`, null, {
      params: { threshold, autoCreate }
    });
    return response.data;
  },

  /**
   * Détection globale d'anomalies pour TOUS les conteneurs (auto-scan)
   * Utilise: AnomalyService.detectGlobalAnomalies()
   * @param {number} threshold - Seuil z-score (défaut: 2)
   * @param {number} limit - Nombre max de conteneurs à retourner (défaut: 20)
   */
  detectGlobalAnomalies: async (threshold = 2, limit = 20) => {
    const response = await api.get('/api/analytics/ml/anomalies/global', {
      params: { threshold, limit }
    });
    return response.data;
  },

  // Alias pour compatibilité
  getAnomalies: async (containerId, threshold = 2) => {
    return analyticsService.detectAnomalies(containerId, threshold);
  },
  getDefectiveSensors: async () => {
    return analyticsService.detectDefectiveSensors();
  },

  // ============================================
  // DASHBOARD & ANALYTICS
  // ============================================

  getDashboardAnalytics: async () => {
    const response = await api.get('/api/analytics/dashboard');
    return response.data;
  },

  getCriticalContainers: async (threshold = 85, limit = 15) => {
    const response = await api.get('/api/analytics/critical-containers', {
      params: { threshold, limit }
    });
    return response.data;
  },

  /**
   * Récupérer tous les conteneurs pour le sélecteur d'anomalies
   * @param {number} limit - Nombre maximum de conteneurs (défaut: 100)
   */
  getAllContainersForSelector: async (limit = 100) => {
    const response = await api.get('/api/containers', {
      params: { limit, page: 1 }
    });
    return response.data;
  },

  // ============================================
  // PERFORMANCE & KPIs
  // ============================================

  getKPIs: async (period = '7d') => {
    const response = await api.get('/api/analytics/kpis', {
      params: { period }
    });
    return response.data;
  },

  getEnvironmentalMetrics: async () => {
    const response = await api.get('/api/analytics/performance/environmental?t=' + Date.now());
    return response.data;
  },

  // ============================================
  // AGGREGATIONS & TRENDS
  // ============================================

  getFillTrends: async (days = 7) => {
    const response = await api.get('/api/analytics/aggregation/fill-trends', {
      params: { days }
    });
    return response.data;
  },

  getZonePerformance: async () => {
    const response = await api.get('/api/analytics/aggregation/zone-performance');
    return response.data;
  },

  // ============================================
  // WEATHER
  // ============================================

  getWeatherImpact: async () => {
    const response = await api.get('/api/analytics/weather-impact');
    return response.data;
  },

  // ============================================
  // COLLECTE STATS
  // ============================================

  getCollecteStats: async (days = 30) => {
    const response = await api.get('/api/analytics/collecte-stats', {
      params: { days }
    });
    return response.data;
  },

  // ============================================
  // ML PREDICTIONS (route alternative)
  // ============================================

  getMLPredictions: async (daysAhead = 1, threshold = 50) => {
    const response = await api.get('/api/analytics/ml/predictions', {
      params: { daysAhead, threshold }
    });
    return response.data;
  },

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  refreshCache: async () => {
    const response = await api.post('/api/analytics/cache/refresh');
    return response.data;
  }
};
