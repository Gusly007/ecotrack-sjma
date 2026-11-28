import api from './api';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const MFA_TOKEN_KEY = 'mfa_token';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    
    // Si MFA requis, conserver toutes les infos de setup (QR code, secret, etc.)
    if (response.data?.requiresMFA) {
      // Clear any stale session so NotificationContext/AuthContext deactivate while
      // the user is on the MFA page (prevents sounds from an old WS connection).
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(MFA_TOKEN_KEY);

      //  le backend n'expose plus de userId exploitable. `mfa_user_id`
      // est supprimé pour qu'aucun ancien identifiant ne subsiste.
      localStorage.removeItem('mfa_user_id');

      // Jeton pré-MFA : seule preuve acceptée par /auth/mfa/* et /auth/login/mfa.
      this.setMfaToken(response.data?.mfaToken);

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
        // userId n'est plus fourni par l'API (V2-002) : la preuve de mot de
        // passe est le jeton pré-MFA, déjà stocké ci-dessus.
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
      localStorage.removeItem(MFA_TOKEN_KEY);
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

  // V2-002 : les routes /auth/mfa/* n'acceptent plus un userId fourni par le
  // client. Elles exigent le jeton pré-MFA remis par /auth/login (stocké sous
  // 'mfa_token', valable 5 min), transmis dans l'en-tête X-MFA-Token.
  getMfaToken() {
    return localStorage.getItem(MFA_TOKEN_KEY);
  },

  setMfaToken(token) {
    if (token) localStorage.setItem(MFA_TOKEN_KEY, token);
    else localStorage.removeItem(MFA_TOKEN_KEY);
  },

  async generateMfaSetup() {
    const response = await api.post(
      '/auth/mfa/regenerate',
      {},
      { headers: { 'X-MFA-Token': this.getMfaToken() || '' } }
    );
    return response.data;
  },

  async verifyMfaSetup(code) {
    const response = await api.post(
      '/auth/mfa/complete-setup',
      { code },
      { headers: { 'X-MFA-Token': this.getMfaToken() || '' } }
    );
    return response.data;
  },

  async loginWithMfa(code) {
    const response = await api.post(
      '/auth/login/mfa',
      { code },
      { headers: { 'X-MFA-Token': this.getMfaToken() || '' } }
    );
    return response.data;
  },

  // Appareil perdu/supprimé : demande un code de récupération par email, puis
  // le valide. La validation réinitialise le MFA et renvoie un jeton de setup
  // (setMfaToken) pour afficher un nouveau QR code.
  async requestMfaRecovery() {
    const response = await api.post(
      '/auth/mfa/recover/request',
      {},
      { headers: { 'X-MFA-Token': this.getMfaToken() || '' } }
    );
    return response.data;
  },

  async verifyMfaRecovery(code) {
    const response = await api.post(
      '/auth/mfa/recover/verify',
      { code },
      { headers: { 'X-MFA-Token': this.getMfaToken() || '' } }
    );
    if (response.data?.mfaToken) this.setMfaToken(response.data.mfaToken);
    return response.data;
  },
};
