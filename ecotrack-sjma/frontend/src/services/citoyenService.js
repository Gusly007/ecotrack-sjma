// Wrappers axios pour les endpoints citoyen via l'API Gateway. Utilise
// citoyenApi (instance dédiée au scope mobile) : retry transitoire, dédup
// du refresh JWT, redirection vers /citoyen/login sur expiration (et non
// /login upstream qui ne propose pas l'inscription citoyen).
import api from '../pages/mobile/citoyen/auth/citoyenApi';

// Aplatit { data: ... } quand le backend enveloppe la réponse.
const unwrap = (r) => (r.data && typeof r.data === 'object' && 'data' in r.data ? r.data.data : r.data);

export const citoyenService = {
  // Profil
  getProfile: () => api.get('/api/users/profile').then(unwrap),
  getProfileWithStats: () => api.get('/api/users/profile-with-stats').then(unwrap),
  updateProfile: (data) => api.put('/api/users/profile', data).then(unwrap),
  changePassword: (data) => api.post('/api/users/change-password', data).then(unwrap),

  // Avatar — multipart/form-data, champ "file" (JPG/PNG/WebP, 5 Mo max).
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/users/avatar/upload', form, {
      // Laisse le navigateur poser le boundary multipart.
      headers: { 'Content-Type': undefined },
      // Sharp peut prendre quelques secondes pour les 3 redimensionnements.
      timeout: 30000,
    }).then((r) => r.data?.data ?? r.data);
  },
  deleteAvatar: () => api.delete('/users/avatar').then((r) => r.data),
  getUserAvatar: (userId) => api.get(`/users/avatar/${userId}`).then((r) => r.data?.data ?? r.data),

  // Signalements — service-routes enveloppe en { success, data: { data: [...], pagination } }.
  getMySignalements: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.statut) params.append('statut', filters.statut);
    if (filters.limit) params.append('limit', filters.limit);
    const qs = params.toString();
    return api.get(`/api/routes/signalements${qs ? `?${qs}` : ''}`).then((r) => {
      const body = r.data;
      if (body?.data?.data) return body.data.data;
      if (body?.data) return body.data;
      return body;
    });
  },
  getSignalementById: (id) =>
    api.get(`/api/routes/signalements/${id}`).then((r) => r.data?.data?.data ?? r.data?.data ?? r.data),
  getSignalementHistory: (id) =>
    api.get(`/api/routes/signalements/${id}/historique`).then((r) => r.data?.data ?? r.data),
  getSignalementTypes: () => api.get('/api/routes/signalements/types').then((r) => r.data?.data ?? r.data),
  createSignalement: (data) => api.post('/api/routes/signalements', data).then((r) => r.data?.data ?? r.data),

  // Collectes (prochaines tournées planifiées / en cours).
  getProchainesCollectes: ({ limit = 5 } = {}) =>
    api.get(`/api/routes/prochaines-collectes?limit=${limit}`).then((r) => {
      const body = r.data;
      if (body?.data?.data) return body.data.data;
      if (body?.data) return body.data;
      return body;
    }),

  // Conteneurs
  getContainers: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    params.append('limit', filters.limit || '200');
    return api.get(`/api/containers?${params}`).then((r) => r.data?.data ?? r.data);
  },
  getContainerById: (id) => api.get(`/api/containers/id/${id}`).then((r) => r.data?.data ?? r.data),
  getContainerByUid: (uid) => api.get(`/api/containers/uid/${uid}`).then((r) => r.data?.data ?? r.data),

  // Gamification
  getMyStats: (userId) => api.get(`/api/gamification/stats/utilisateurs/${userId}/stats`).then((r) => r.data),

  // Quand userId est fourni, le backend joint gamification_participation_defi
  // et renvoie ma_progression + ma_statut par défi.
  getDefis: ({ userId } = {}) => {
    const qs = userId ? `?id_utilisateur=${encodeURIComponent(userId)}` : '';
    return api.get(`/api/gamification/defis${qs}`).then((r) => r.data);
  },

  getBadges: () => api.get('/api/gamification/badges').then((r) => r.data),
  getMyBadges: (userId) => api.get(`/api/gamification/badges/utilisateurs/${userId}`).then((r) => r.data),

  // Classement top N + bloc `utilisateur` quand idUtilisateur est fourni.
  getClassement: ({ limite = 10, idUtilisateur } = {}) => {
    const params = new URLSearchParams();
    if (limite) params.append('limite', limite);
    if (idUtilisateur != null) params.append('id_utilisateur', idUtilisateur);
    const qs = params.toString();
    return api.get(`/api/gamification/classement${qs ? `?${qs}` : ''}`).then((r) => r.data);
  },

  // Lignes brutes historique_points (une par transaction) — préféré aux
  // buckets parJour de getMyStats pour l'affichage chronologique.
  getMyHistorique: (userId, { limit = 100 } = {}) =>
    api
      .get(`/api/gamification/stats/utilisateurs/${userId}/historique?limit=${limit}`)
      .then((r) => r.data?.data ?? r.data),

  // Notifications — endpoint PUT (PATCH renverrait 404).
  getNotifications: () => api.get('/notifications').then((r) => r.data?.data ?? r.data),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`).then((r) => r.data),
  getUnreadCount: () => api.get('/notifications/unread-count').then((r) => r.data),
};
