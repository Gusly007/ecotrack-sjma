import api from './api';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { token, refreshToken, user } = response.data;
    
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return user;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    const { token, refreshToken, user } = response.data;
    
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return user;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  getCurrentUser() {
    const userData = localStorage.getItem(USER_KEY);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated() {
    const token = this.getToken();
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
    return user?.role || user?.role_par_defaut || null;
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
