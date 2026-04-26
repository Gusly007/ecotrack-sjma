import api from './api';

export const typeConteneurService = {
  getAll: async (page = 1, limit = 100) => {
    const response = await api.get(`/api/typecontainers?page=${page}&limit=${limit}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/typecontainers/id/${id}`);
    return response.data;
  },

  getByCode: async (code) => {
    const response = await api.get(`/api/typecontainers/code/${code}`);
    return response.data;
  },

  getByNom: async (nom) => {
    const response = await api.get(`/api/typecontainers/nom/${nom}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/typecontainers/stats/all');
    return response.data;
  }
};
