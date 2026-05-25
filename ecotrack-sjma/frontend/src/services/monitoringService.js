import api from './api';

export const monitoringService = {
  getMetrics: async () => {
    const response = await api.get('/api/V1/metrics/status');
    return response.data;
  },

  getAlerts: async (params = {}) => {
    const response = await api.get('/api/V1/alerts', { params });
    return response.data;
  },

  getSensorsStatus: async () => {
    const response = await api.get('/api/V1/iot/sensors/status');
    return response.data;
  },

  getHealthChecks: async () => {
    const response = await api.get('/api/V1/health/all');
    return response.data;
  }
};