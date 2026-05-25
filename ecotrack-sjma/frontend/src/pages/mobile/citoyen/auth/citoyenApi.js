import axios from 'axios';

// Client axios dédié au scope mobile citoyen. Réplique le pattern de
// services/api.js (JWT + auto-refresh sur 401) mais avec deux divergences :
// 1) Bus de retry sur erreurs transitoires (429 / 502 / 503 / 504) — un seul
//    retry après 600 ms pour absorber les pics de rate-limit.
// 2) En cas d'échec du refresh JWT, redirige vers /citoyen/login (pas /login
//    upstream qui n'expose pas l'inscription citoyen).
// localStorage est partagé avec le client upstream (token / refreshToken /
// user) pour rester compatible avec d'éventuels appels qui passent encore
// par services/api.js.

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const citoyenApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  },
});

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const isTransientError = (err) => {
  if (!err) return false;
  if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || err.message === 'Network Error') return true;
  const s = err.response?.status;
  return s === 429 || s === 502 || s === 503 || s === 504;
};

citoyenApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Dédup du refresh JWT : si plusieurs requêtes échouent en parallèle avec
// un 401, on ne tire qu'un seul POST /auth/refresh — les autres attendent
// le résultat de cette promesse.
let refreshPromise = null;

const runRefresh = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token');
  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  const newToken = response.data?.token || response.data?.accessToken;
  if (!newToken) throw new Error('Refresh response missing token');
  localStorage.setItem('token', newToken);
  if (response.data?.refreshToken) {
    localStorage.setItem('refreshToken', response.data.refreshToken);
  }
  return newToken;
};

const citoyenLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  // window.location.replace pour éviter une entrée dans l'historique
  // navigateur ; le citoyen revient sur sa propre page de login, pas sur
  // le /login partagé.
  window.location.replace('/citoyen/login');
};

citoyenApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = runRefresh().finally(() => { refreshPromise = null; });
        }
        const newToken = await refreshPromise;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return citoyenApi(originalRequest);
      } catch {
        citoyenLogout();
        return Promise.reject(error);
      }
    }

    if (isTransientError(error) && originalRequest && !originalRequest._transientRetry) {
      originalRequest._transientRetry = true;
      await sleep(600);
      return citoyenApi(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default citoyenApi;
