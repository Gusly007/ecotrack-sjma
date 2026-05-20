
import api from './api';

export const userService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.role) params.append('role', filters.role);
    if (filters.search) params.append('search', filters.search);
    if (filters.est_active !== undefined && filters.est_active !== null) {
      params.append('est_active', String(filters.est_active));
    }
    
    const response = await api.get(`/users?${params.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getStats: async (id) => {
    const response = await api.get(`/users/${id}/stats`);
    return response.data;
  },

  getAgents: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const response = await api.get(`/users/agents?${query.toString()}`);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  /**
   * Appelle l'API de suppression de compte
   * @param {string} password 
   */
  deleteAccountRequest: async (password) => {
    const response = await api.delete('/users/me', { data: { password } });
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/users/change-password', { oldPassword, newPassword });
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/users/avatar/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteAvatar: async () => {
    const response = await api.delete('/users/avatar');
    return response.data;
  },

  exportMyData: async () => {
    const response = await api.get('/users/me/export');
    return response.data;
  },
};
