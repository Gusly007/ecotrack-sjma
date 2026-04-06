import api from './api';

export const logsService = {
  getLogs: async (params = {}) => {
    const response = await api.get('/api/logs', { params });
    return response.data;
  },

  getFilters: async () => {
    const response = await api.get('/api/logs/filters');
    return response.data;
  },

  getSummary: async (days = 7) => {
    const response = await api.get('/api/logs/summary', { params: { days } });
    return response.data;
  },

  getStats: async (days = 7) => {
    const response = await api.get('/api/logs/stats', { params: { days } });
    return response.data;
  },

  exportLogs: async (params = {}) => {
    const response = await api.get('/api/logs/export', { 
      params,
      responseType: params.format === 'csv' ? 'blob' : 'json'
    });
    return response.data;
  },

  deleteLogs: async (params = {}) => {
    const response = await api.delete('/api/logs/cleanup', { params });
    return response.data;
  }
};