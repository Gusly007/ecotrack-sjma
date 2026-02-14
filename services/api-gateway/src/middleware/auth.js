import jwt from 'jsonwebtoken';

/**
 * Middleware de validation JWT pour l'API Gateway
 * Vérifie le token sur les routes protégées
 */

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_a_changer_en_production';

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  { path: '/auth/login', methods: ['POST'] },
  { path: '/auth/register', methods: ['POST'] },
  { path: '/health', methods: ['GET'] },
  { path: '/api-docs', methods: ['GET'] },
  { path: '/docs/', methods: ['GET'] }, // Swagger docs
];

/**
 * Vérifie si une route est publique
 */
const isPublicRoute = (reqPath, reqMethod) => {
  return publicRoutes.some(route => {
    const pathMatch = reqPath === route.path || reqPath.startsWith(route.path);
    const methodMatch = route.methods.includes(reqMethod) || route.methods.includes('*');
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
