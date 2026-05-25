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
    
    const response = await api.get(`/api/V1/containers?${params.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/V1/containers/id/${id}`);
    return response.data;
  },

  getByUid: async (uid) => {
    const response = await api.get(`/api/V1/containers/uid/${uid}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/api/V1/containers', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.patch(`/api/V1/containers/id/${id}`, data);
    return response.data;
  },

  updateStatus: async (id, statut) => {
    const response = await api.patch(`/api/V1/containers/${id}/status`, { statut });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/V1/containers/id/${id}`);
    return response.data;
  },

  count: async () => {
    const response = await api.get('/api/V1/containers/count');
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/api/V1/stats');
    return response.data;
  },

  getWithFillLevel: async () => {
    const response = await api.get('/api/V1/containers/fill-levels');
    return response.data;
  },

  // --- Mobile agent methods ---
  searchByRadius: async (latitude, longitude, rayon = 1000) => {
    const response = await api.post('/api/V1/containers/search/radius', { latitude, longitude, rayon });
    return response.data;
  },

  getByZone: async (zoneId) => {
    const response = await api.get(`/api/V1/containers/zone/${zoneId}`);
    return response.data;
  },
};
