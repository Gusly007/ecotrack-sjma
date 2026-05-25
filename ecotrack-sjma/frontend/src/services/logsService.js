import api from './api';

export const logsService = {
  getLogs: async (params = {}) => {
    const response = await api.get('/api/V1/logs', { params });
    return response.data;
  },

  getFilters: async () => {
    const response = await api.get('/api/V1/logs/filters');
    return response.data;
  },

  getSummary: async (days = 7) => {
    const response = await api.get('/api/V1/logs/summary', { params: { days } });
    return response.data;
  },

  getStats: async (days = 7) => {
    const response = await api.get('/api/V1/logs/stats', { params: { days } });
    return response.data;
  },

  exportLogs: async (params = {}) => {
    const response = await api.get('/api/V1/logs/export', { 
      params,
      responseType: params.format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  },

  deleteLogs: async (params = {}) => {
    const response = await api.delete('/api/V1/logs/cleanup', { params });
    return response.data;
  }
};