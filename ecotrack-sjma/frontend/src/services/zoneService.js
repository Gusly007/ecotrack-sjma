import api from './api';

export const zoneService = {
  getAll: async () => {
    const response = await api.get('/api/zones');
    return response.data;
  },
};