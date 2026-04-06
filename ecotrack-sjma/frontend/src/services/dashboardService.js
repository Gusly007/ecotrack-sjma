import api from './api';

export const dashboardService = {
  async getStats() {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  }
};
