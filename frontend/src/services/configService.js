import api from './api';

const ENDPOINTS = {
  config: '/admin/config',
  environmental: '/admin/environmental-constants',
  performance: '/admin/agent-performance'
};

export const configService = {
  getSecurity: async () => {
    try {
      const response = await api.get(ENDPOINTS.config);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch security config:', error.message);
      return {};
    }
  },

  getEnvironmental: async () => {
    try {
      const response = await api.get(ENDPOINTS.environmental);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch environmental config:', error.message);
      return {};
    }
  },

  getPerformance: async () => {
    try {
      const response = await api.get(ENDPOINTS.performance);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch performance config:', error.message);
      return {};
    }
  },

  getAll: async () => {
    const [security, environmental, performance] = await Promise.all([
      configService.getSecurity(),
      configService.getEnvironmental(),
      configService.getPerformance()
    ]);
    return { security, environmental, performance };
  },

  updateSecurity: async (key, value) => {
    const response = await api.put(`${ENDPOINTS.config}/${key}`, { value });
    return response.data;
  },

  updateEnvironmental: async (key, value) => {
    const response = await api.put(`${ENDPOINTS.environmental}/${key}`, { value });
    return response.data;
  },

  updatePerformance: async (key, value) => {
    const response = await api.put(`${ENDPOINTS.performance}/${key}`, { value });
    return response.data;
  }
};