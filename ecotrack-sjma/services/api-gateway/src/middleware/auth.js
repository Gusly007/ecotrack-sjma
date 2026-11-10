import jwt from 'jsonwebtoken';

/**
 * Middleware de validation JWT pour l'API Gateway
 * Vérifie le token sur les routes protégées
 */

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_a_changer_en_production';

// Routes publiques qui ne nécessitent pas d'authentification
//
// /api/V1/health/all, /api/V1/metrics/status, /api/V1/alerts,
// /api/V1/dashboard/stats, /api/V1/analytics et /api/V1/iot/sensors/status
// étaient listés ici, donc accessibles SANS AUCUN jeton — alors qu'ils
// alimentent l'écran d'ensemble /admin (services, espace DB, utilisateurs
// actifs). Ils sont retirés de cette liste : ils passent désormais par le
// contrôle JWT, qui renvoie 401 sans token. La restriction par rôle est
// appliquée côté service consommateur (requireRole), pas ici.
const publicRoutes = [
  { path: '/auth/login', methods: ['POST'] },
  { path: '/auth/login/mfa', methods: ['POST'] },
  { path: '/auth/mfa/complete-setup', methods: ['POST'] },
  { path: '/auth/mfa/regenerate', methods: ['POST'] },
  { path: '/auth/refresh', methods: ['POST'] },
  { path: '/auth/forgot-password', methods: ['POST'] },
  { path: '/auth/reset-password', methods: ['POST'] },
  { path: '/auth/activate', methods: ['POST'] },
  { path: '/auth/citoyen/register', methods: ['POST'] },
  { path: '/auth/register', methods: ['POST'] },
  { path: '/health', methods: ['GET'] },
  { path: '/health/detailed', methods: ['GET'] },
  { path: '/api-docs', methods: ['GET'] },
  { path: '/docs/', methods: ['GET'] }, // Swagger docs
  { path: '/metrics', methods: ['GET'] }, // Prometheus metrics
  { path: '/api/V1/consent', methods: ['POST'] }, // Consentement RGPD
  { path: '/api/V1/cookies/consent', methods: ['GET', 'POST', 'PATCH', 'DELETE'] }, // Consentement cookies RGPD
  { path: '/avatars', methods: ['GET'] }, // Avatars publiques
  // WebSocket notifications — auth gérée par le service lui-même (Socket.IO auth.token)
  { path: '/ws', methods: ['GET'] },
];

/**
 * Routes qui exigent une authentification ET un rôle d'administration.
 * Le gateway valide le JWT (jwtValidationMiddleware) puis applique requireRole,
 * de sorte qu'un AGENT ou CITOYEN connecté ne puisse pas lire les données
 * d'exploitation même avec un token valide.
 */
export const ADMIN_MONITORING_ROUTES = [
  '/api/V1/health/all',
  '/api/V1/metrics/status',
  '/api/V1/alerts',
  '/api/V1/dashboard/stats',
  '/api/V1/analytics',
  '/api/V1/iot/sensors/status',
];

// Rôles autorisés à consulter le monitoring d'exploitation (décision D2 :
// écrans partagés GESTIONNAIRE / ADMIN).
export const ADMIN_MONITORING_ROLES = ['ADMIN', 'GESTIONNAIRE'];

/**
 * Vérifie si une route est publique
 */
const normalizePath = (path = '') => {
  if (!path) return '/';
  const normalized = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  return normalized || '/';
};

/**
 * Vrai si la route fait partie des endpoints de monitoring du dashboard admin.
 * Exposé pour les tests et pour un éventuel montage ciblé de requireRole.
 */
export const isAdminMonitoringRoute = (reqPath) => {
  const path = normalizePath(reqPath);
  return ADMIN_MONITORING_ROUTES.some(
    (route) => path === normalizePath(route) || path.startsWith(`${normalizePath(route)}/`)
  );
};

const isPublicRoute = (reqPath, reqMethod) => {
  const path = normalizePath(reqPath);
  const method = String(reqMethod || '').toUpperCase();

  // Safety net for MFA pre-auth flows.
  if (method === 'POST' && (path === '/auth/mfa/complete-setup' || path === '/auth/login/mfa')) {
    return true;
  }

  return publicRoutes.some(route => {
    const routePath = normalizePath(route.path);
    const pathMatch = path === routePath || path.startsWith(`${routePath}/`);
    const methodMatch = route.methods.includes(method) || route.methods.includes('*');
    return pathMatch && methodMatch;
  });
};

/**
 * Middleware de validation JWT
 */
export const jwtValidationMiddleware = (req, res, next) => {
  // Skip validation for public routes
  if (isPublicRoute(req.path, req.method)) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token JWT manquant'
    });
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Format de token invalide. Utilisez: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ajouter les infos utilisateur à la requête
    req.user = {
      id: decoded.userId || decoded.id,
      role: decoded.role,
      email: decoded.email
    };
    
    // Ajouter un header pour forward l'info aux services
    req.headers['x-user-id'] = req.user.id;
    req.headers['x-user-role'] = req.user.role;

    // les endpoints de monitoring du dashboard admin exigent un rôle
    // d'exploitation. Un token CITOYEN ou AGENT valide ne doit pas suffire à
    // lire l'état des services, l'espace DB ou les statistiques d'ensemble.
    if (isAdminMonitoringRoute(req.path)) {
      const allowed = ADMIN_MONITORING_ROLES.includes(req.user.role);
      if (!allowed) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Accès refusé. Rôles requis: ${ADMIN_MONITORING_ROLES.join(', ')}`
        });
      }
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expiré'
      });
    }
    
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token invalide'
    });
  }
};

/**
 * Middleware de vérification des rôles
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentification requise'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Accès refusé. Rôles requis: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

export default jwtValidationMiddleware;
