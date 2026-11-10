import { Navigate } from 'react-router-dom';
import { useCitoyenAuth } from '../../../pages/mobile/citoyen/auth/CitoyenAuthContext';

// Garde de route pour le flow citoyen. Logique identique à ProtectedRoute
// upstream, mais redirige vers /citoyen/login (pas /login) — un visiteur
// non-auth de /citoyen/* reste dans l'univers citoyen et ne touche jamais
// la page de connexion admin/gestionnaire.

const ALLOWED_CITOYEN_ROLES = ['CITOYEN'];

export const CitoyenProtectedRoute = ({ children, requiredRole = ALLOWED_CITOYEN_ROLES }) => {
  const { isAuthenticated, user, loading } = useCitoyenAuth();

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

  const role = user?.role || user?.role_par_defaut;
  const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!allowed.includes(role)) {
    // Compte staff authentifié dans le périmètre citoyen : 403, pas de logout
    // silencieux ni de boucle de redirection vers /citoyen/login.
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
