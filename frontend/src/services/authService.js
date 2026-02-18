import api from './api';
import { jwtDecode } from 'jwt-decode';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return user;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    const { accessToken, refreshToken, user } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return user;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  getCurrentUser() {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  },

  isMobileUser() {
    const role = this.getUserRole();
    return role === 'CITOYEN' || role === 'AGENT';
  },

  isDesktopUser() {
    const role = this.getUserRole();
    return role === 'GESTIONNAIRE' || role === 'ADMIN';
  },
};
