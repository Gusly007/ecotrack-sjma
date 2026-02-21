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
    const user = await authService.login(email, password);
    setUser(authService.getCurrentUser());
    setIsAuthenticated(true);
    return user;
  };

  // Inscription désactivée - only ADMIN can create users via API
  /*
  const register = async (userData) => {
    const user = await authService.register(userData);
    setUser(authService.getCurrentUser());
    setIsAuthenticated(true);
    return user;
  };
  */

  const logout = async () => {
    await authService.logout();
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
    //register, // Désactivé
    logout,
    forgotPassword,
    resetPassword,
    hasPermission,
    isMobileUser: authService.isMobileUser(),
    isDesktopUser: authService.isDesktopUser(),
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
