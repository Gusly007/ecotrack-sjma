import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { ROLE_PERMISSIONS, ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser && authService.isAuthenticated()) {
        setUser(currentUser);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);

    // MFA flow: keep user unauthenticated until MFA verification succeeds.
    if (result?.requiresMFA || result?.mfaSetup) {
      setUser(null);
      setIsAuthenticated(false);
      return result;
    }

    const currentUser = authService.getCurrentUser();
    const authenticated = Boolean(currentUser && authService.isAuthenticated());
    setUser(currentUser);
    setIsAuthenticated(authenticated);
    return result;
  };

  // Inscription désactivée - only ADMIN can create users via API.
  // See LoginPage / RegisterPage: there is no public /register entry point.

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout API failed, clearing locally');
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  const resetPassword = async (token, newPassword) => {
    return await authService.resetPassword(token, newPassword);
  };

  const hasPermission = (permission) => {
    if (!user || !user.role) return false;
    if (user.role === ROLES.ADMIN) return true;
    const perms = ROLE_PERMISSIONS[user.role] || [];
    if (perms.includes('*')) return true;
    return perms.includes(permission);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    forgotPassword,
    resetPassword,
    hasPermission,
    isMobileUser: user ? ['CITOYEN', 'AGENT'].includes(user.role || user.role_par_defaut) : false,
    isDesktopUser: user ? ['GESTIONNAIRE', 'ADMIN'].includes(user.role || user.role_par_defaut) : false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
