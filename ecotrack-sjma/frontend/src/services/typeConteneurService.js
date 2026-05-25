import api from './api';

export const typeConteneurService = {
  getAll: async (page = 1, limit = 100) => {
    const response = await api.get(`/api/V1/typecontainers?page=${page}&limit=${limit}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/V1/typecontainers/id/${id}`);
    return response.data;
  },

  getByCode: async (code) => {
    const response = await api.get(`/api/V1/typecontainers/code/${code}`);
    return response.data;
  },

  getByNom: async (nom) => {
    const response = await api.get(`/api/V1/typecontainers/nom/${nom}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/V1/typecontainers/stats/all');
    return response.data;
  }
};
