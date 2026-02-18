import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

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

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    
    const permissions = {
      CITOYEN: ['signaler:create', 'signaler:read', 'containers:read', 'profile:read', 'profile:update'],
      AGENT: ['signaler:read', 'signaler:update', 'containers:read', 'tournee:read', 'tournee:update', 'collecte:create'],
      GESTIONNAIRE: ['signaler:read', 'signaler:update', 'containers:read', 'containers:update', 'tournee:create', 'tournee:read', 'tournee:update', 'users:read', 'analytics:read'],
    };
    
    return permissions[user.role]?.includes(permission) || false;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
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
