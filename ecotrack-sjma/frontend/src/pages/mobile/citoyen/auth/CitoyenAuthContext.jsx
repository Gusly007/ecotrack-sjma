import { createContext, useCallback, useContext, useEffect, useState } from 'react';
// citoyenApi : instance axios isolée du scope mobile (retry transitoire,
// redirection sur 401-refresh-fail vers /citoyen/login).
import { authService } from '../../../../services/authService';
import api from './citoyenApi';

// Contexte d'auth isolé pour l'app citoyen mobile.
// Vit entièrement dans pages/mobile/citoyen/auth — l'AuthContext upstream
// (utilisé par admin/gestionnaire) reste byte-identique.
//
// Partage les mêmes clés localStorage (token, refreshToken, user) que
// upstream parce que axios/api.js lit token côté unique. Maintient son
// propre state React pour ne pas polluer le state global d'upstream.
//
// Couvre : login (incl. délégation à /auth/mfa si MFA requis), register
// CITOYEN, logout, refreshUser, hydratation initiale, sync au focus +
// storage event.

const CitoyenAuthContext = createContext(null);

function readUserFromStorage() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function hasValidToken() {
  return !!localStorage.getItem('token');
}

export const CitoyenAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readUserFromStorage());
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasValidToken() && !!readUserFromStorage());
  const [loading, setLoading] = useState(false);
  // Cache-bust partagé pour les <img src> avatar. Bumpé chaque fois qu'un
  // chemin avatar arrive ou change (login, register/activation, refreshUser,
  // upload). Les consumers (Home, Profil, EditProfil) passent cette valeur
  // à buildAvatarUrl(path, { bust: avatarVersion }) pour forcer le navigateur
  // à refetch la nouvelle image au lieu de servir la version cachée.
  const [avatarVersion, setAvatarVersion] = useState(() => Date.now());

  const bumpAvatarVersion = useCallback(() => {
    setAvatarVersion(Date.now());
  }, []);

  // Bump avatarVersion si l'un des trois chemins avatar (url/thumbnail/mini)
  // change entre prevUser et nextUser, y compris null ↔ valeur.
  const maybeBumpAvatarVersion = useCallback((prevUser, nextUser) => {
    const keys = ['avatar_url', 'avatar_thumbnail', 'avatar_mini'];
    const changed = keys.some((k) => (prevUser?.[k] ?? null) !== (nextUser?.[k] ?? null));
    if (changed) setAvatarVersion(Date.now());
  }, []);

  const hydrateFromStorage = useCallback(() => {
    const u = readUserFromStorage();
    setUser((prev) => {
      maybeBumpAvatarVersion(prev, u);
      return u;
    });
    setIsAuthenticated(hasValidToken() && !!u);
  }, [maybeBumpAvatarVersion]);

  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key || ['token', 'refreshToken', 'user'].includes(e.key)) {
        hydrateFromStorage();
      }
    };
    const onFocus = () => hydrateFromStorage();
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [hydrateFromStorage]);

  // Login — réutilise authService upstream pour ne pas dupliquer la logique
  // MFA. Si MFA requis on sort sans rien faire (caller redirige vers
  // /auth/mfa). Sinon on hydrate state + localStorage.
  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    const result = response.data || response;
    if (result?.requiresMFA) {
      return result;
    }
    const current = authService.getCurrentUser?.() || null;
    setUser(current);
    setIsAuthenticated(!!current && hasValidToken());
    return result;
  }, []);

  // Inscription citoyen : POST /auth/citoyen/register — crée un compte
  // inactif et envoie un code 6 chiffres par email. Le caller doit ensuite
  // invoquer verifyActivation(email, code). Aucun token n'est délivré ici.
  const registerCitoyen = useCallback(async ({ email, nom, prenom, password }) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/citoyen/register', { email, nom, prenom, password });
      const body = res?.data ?? {};
      // Réponse attendue : { requiresActivation:true, email, user:{...} }
      return {
        requiresActivation: true,
        email: body.email || email,
        message: body.message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Vérification du code 6 chiffres. Sur succès, le backend renvoie tokens +
  // user → on connecte automatiquement le citoyen.
  const verifyActivation = useCallback(async (email, code) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/citoyen/verify-activation', { email, code });
      const body = res?.data ?? {};
      const accessToken = body.token || body.accessToken;
      const refreshToken = body.refreshToken;
      const u = body.user;
      if (!accessToken || !u) {
        throw new Error('Réponse activation inattendue');
      }
      localStorage.setItem('token', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      const normalised = {
        id: u.id_utilisateur ?? u.id,
        id_utilisateur: u.id_utilisateur ?? u.id,
        email: u.email,
        prenom: u.prenom,
        nom: u.nom,
        role: u.role_par_defaut ?? u.role ?? 'CITOYEN',
        points: u.points ?? 0,
        avatar_url: u.avatar_url ?? null,
        avatar_thumbnail: u.avatar_thumbnail ?? null,
        avatar_mini: u.avatar_mini ?? null,
      };
      localStorage.setItem('user', JSON.stringify(normalised));
      setUser(normalised);
      setIsAuthenticated(true);
      return normalised;
    } finally {
      setLoading(false);
    }
  }, []);

  // Demander un nouveau code (le précédent expire ou n'a pas été reçu).
  const resendActivation = useCallback(async (email) => {
    const res = await api.post('/auth/citoyen/resend-activation', { email });
    return res?.data ?? {};
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout?.();
    } catch {
      // logout serveur peut échouer — on purge le local quoi qu'il arrive
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Re-fetch du profil complet (avatar + nom + points). Merge dans
  // localStorage + state pour que la home et le header voient les
  // changements immédiatement. Bump avatarVersion si les chemins d'avatar
  // ont changé → tous les <img src> bustent leur cache navigateur.
  const refreshUser = useCallback(async () => {
    try {
      // profile-with-stats inclut avatar_url/thumbnail/mini + badge_count.
      // /profile (via authController.getUserById) ne renvoie pas l'avatar.
      const res = await api.get('/api/V1/users/profile-with-stats');
      const payload = res?.data?.data ?? res?.data ?? null;
      if (payload && typeof payload === 'object') {
        const existing = readUserFromStorage() || {};
        const merged = { ...existing, ...payload };
        localStorage.setItem('user', JSON.stringify(merged));
        setUser((prev) => {
          maybeBumpAvatarVersion(prev, merged);
          return merged;
        });
        return merged;
      }
      return null;
    } catch {
      return null;
    }
  }, [maybeBumpAvatarVersion]);

  const value = {
    user,
    isAuthenticated,
    loading,
    avatarVersion,
    bumpAvatarVersion,
    login,
    registerCitoyen,
    verifyActivation,
    resendActivation,
    logout,
    refreshUser,
  };

  return (
    <CitoyenAuthContext.Provider value={value}>
      {children}
    </CitoyenAuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCitoyenAuth = () => {
  const ctx = useContext(CitoyenAuthContext);
  if (!ctx) {
    throw new Error('useCitoyenAuth doit être utilisé dans un CitoyenAuthProvider');
  }
  return ctx;
};
