import api from './api';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    
    // Si MFA requis, conserver toutes les infos de setup (QR code, secret, etc.)
    if (response.data?.requiresMFA) {
      const userId = response.data?.userId || response.data?.user?.id;
      if (userId) {
        localStorage.setItem('mfa_user_id', String(userId));
      }

      // Stocker le setup avec un timestamp pour vérifier l'expiration
      if (response.data?.mfaSetup?.secret) {
        localStorage.setItem('mfa_setup', JSON.stringify({
          ...response.data.mfaSetup,
          timestamp: Date.now()
        }));
      }

      return {
        requiresMFA: true,
        requiresSetup: response.data?.requiresSetup || false,
        userId,
        email: response.data?.email,
        mfaSetup: response.data?.mfaSetup || null,
        // role expose par le backend (cf. authController) pour permettre aux
        // pages de login de filtrer le scope avant la redirection MFA partagee.
        role: response.data?.role || response.data?.user?.role_par_defaut || null,
      };
    }

    const token = response.data?.token || response.data?.accessToken;
    const refreshToken = response.data?.refreshToken;
    const user = response.data?.user;

    if (!token || !user) {
      throw new Error('Réponse de connexion invalide: token ou utilisateur manquant');
    }

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return user;
  },

  async logout() {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      await api.post('/auth/logout', { refreshToken });
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

  async activateAccount({ email, token, newPassword }) {
    const response = await api.post('/auth/activate', { email, token, newPassword });
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
