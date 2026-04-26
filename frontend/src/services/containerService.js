import api from './api';

export const containerService = {
  getAll: async (page = 1, limit = 100, filters = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (filters.statut) params.append('statut', filters.statut);
    if (filters.id_zone) params.append('id_zone', filters.id_zone);
    if (filters.id_type) params.append('id_type', filters.id_type);
    if (filters.search) params.append('search', filters.search);
    
    const response = await api.get(`/api/containers?${params.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/containers/id/${id}`);
    return response.data;
  },

  getByUid: async (uid) => {
    const response = await api.get(`/api/containers/uid/${uid}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/api/containers', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.patch(`/api/containers/id/${id}`, data);
    return response.data;
  },

  updateStatus: async (id, statut) => {
    const response = await api.patch(`/api/containers/${id}/status`, { statut });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/containers/id/${id}`);
    return response.data;
  },

  count: async () => {
    const response = await api.get('/api/containers/count');
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/api/stats');
    return response.data;
  },

  getWithFillLevel: async () => {
    const response = await api.get('/api/containers/fill-levels');
    return response.data;
  }
};
