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

  async loginWithMfa(userId, code) {
    const response = await api.post('/auth/login/mfa', { userId, code });
    console.log('[authService] loginWithMfa response:', response.data);
    const token = response.data?.token || response.data?.accessToken;
    const refreshToken = response.data?.refreshToken;
    const user = response.data?.user;

    if (!token || !user) {
      throw new Error('Réponse MFA invalide: token ou utilisateur manquant');
    }

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.removeItem('mfa_user_id');
    
    // Retourner la réponse complète pour MfaPage
    return { ...response.data, user };
  },

  async generateMfaSetup(userId) {
    // Génère un nouveau setup MFA (sans auth complète - juste avec userId)
    const response = await api.post('/auth/mfa/regenerate', { userId: Number(userId) });
    return response.data;
  },
  
  async verifyMfaSetup(userId, code, secret) {
    // Setup initial: endpoint public qui active MFA et connecte l'utilisateur
    const response = await api.post('/auth/mfa/complete-setup', { userId, code, secret });
    return response.data;
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
