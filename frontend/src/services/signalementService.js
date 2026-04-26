import api from './api';

const SIGNALEMENTS_API = '/api/routes/signalements';

export const signalementService = {
  getAll: async (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (filters.statut) params.append('statut', filters.statut);
    if (filters.urgence) params.append('urgence', filters.urgence);
    if (filters.search) params.append('search', filters.search);
    if (filters.id_type) params.append('id_type', filters.id_type);
    
    const response = await api.get(`${SIGNALEMENTS_API}?${params.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${SIGNALEMENTS_API}/${id}`);
    return response.data;
  },

  getHistory: async (id) => {
    const response = await api.get(`${SIGNALEMENTS_API}/${id}/historique`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`${SIGNALEMENTS_API}/${id}`, data);
    return response.data;
  },

  updateStatus: async (id, statut) => {
    const response = await api.put(`${SIGNALEMENTS_API}/${id}/status`, { statut });
    return response.data;
  },

  saveTreatment: async (id, data) => {
    const response = await api.put(`${SIGNALEMENTS_API}/${id}/traitement`, data);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get(`${SIGNALEMENTS_API}/stats`);
    return response.data;
  },

  getTypes: async () => {
    const response = await api.get(`${SIGNALEMENTS_API}/types`);
    return response.data;
  },

  getByZone: async (zoneId) => {
    const response = await api.get(`${SIGNALEMENTS_API}?id_zone=${zoneId}`);
    return response.data;
  },

  getByConteneur: async (conteneurId) => {
    const response = await api.get(`${SIGNALEMENTS_API}?id_conteneur=${conteneurId}`);
    return response.data;
  }
};
