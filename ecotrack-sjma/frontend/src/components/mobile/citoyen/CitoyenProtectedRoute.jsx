import { Navigate } from 'react-router-dom';
import { useCitoyenAuth } from '../../../pages/mobile/citoyen/auth/CitoyenAuthContext';

// Garde de route pour le flow citoyen. Logique identique à ProtectedRoute
// upstream, mais redirige vers /citoyen/login (pas /login) — un visiteur
// non-auth de /citoyen/* reste dans l'univers citoyen et ne touche jamais
// la page de connexion admin/gestionnaire.

export const CitoyenProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useCitoyenAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/citoyen/login" replace />;
  }

  return children;
};
