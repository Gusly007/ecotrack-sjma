import api from './api';

export const zoneService = {
  // Récupérer toutes les zones avec pagination
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get('/api/zones', {
      params: { page, limit }
    });
    return response.data;
  },

  // Récupérer une zone par ID
  getById: async (id) => {
    const response = await api.get(`/api/zones/${id}`);
    return response.data;
  },

  // Récupérer une zone par code
  getByCode: async (code) => {
    const response = await api.get(`/api/zones/code/${code}`);
    return response.data;
  },

  // Créer une nouvelle zone
  create: async (zoneData) => {
    const response = await api.post('/api/zones', zoneData);
    return response.data;
  },

  // Mettre à jour une zone
  update: async (id, zoneData) => {
    const response = await api.patch(`/api/zones/${id}`, zoneData);
    return response.data;
  },

  // Supprimer une zone
  delete: async (id) => {
    const response = await api.delete(`/api/zones/${id}`);
    return response.data;
  },

  // Rechercher des zones par nom
  searchByName: async (nom) => {
    const response = await api.get('/api/zones/search', {
      params: { nom }
    });
    return response.data;
  },

  // Rechercher des zones dans un rayon
  getInRadius: async (latitude, longitude, rayon) => {
    const response = await api.get('/api/zones/radius', {
      params: { latitude, longitude, rayon }
    });
    return response.data;
  },

  // Récupérer les statistiques des zones
  getStatistics: async () => {
    const response = await api.get('/api/zones/stats/global');
    return response.data;
  },

  // Compter les zones
  count: async () => {
    const response = await api.get('/api/zones/count');
    return response.data;
  },

  // Vérifier si une zone existe
  exists: async (id) => {
    const response = await api.get(`/api/zones/check/exists/${id}`);
    return response.data;
  },

  // Vérifier si un code existe
  codeExists: async (code) => {
    const response = await api.get(`/api/zones/check/code/${code}`);
    return response.data;
  }
};