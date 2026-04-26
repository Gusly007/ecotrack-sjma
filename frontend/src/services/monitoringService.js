import api from './api';

export const monitoringService = {
  getMetrics: async () => {
    const response = await api.get('/api/metrics/status');
    return response.data;
  },

  getAlerts: async (params = {}) => {
    const response = await api.get('/api/alerts', { params });
    return response.data;
  },

  getSensorsStatus: async () => {
    const response = await api.get('/api/iot/sensors/status');
    return response.data;
  },

  getHealthChecks: async () => {
    const response = await api.get('/api/health/all');
    return response.data;
  }
};