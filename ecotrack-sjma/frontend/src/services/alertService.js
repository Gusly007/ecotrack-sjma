import api from './api';

export const alertService = {
  async getAlerts(params = {}) {
    const { severity, type, limit = 50, offset = 0 } = params;
    
    const queryParams = new URLSearchParams();
    if (severity && severity !== 'all') queryParams.append('severity', severity);
    if (type && type !== 'all') queryParams.append('type', type);
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);
    
    const response = await api.get(`/api/alerts/unified?${queryParams.toString()}`);
    return response.data;
  },

  async getAlertStats() {
    const response = await api.get('/api/alerts/stats');
    return response.data;
  }
};
