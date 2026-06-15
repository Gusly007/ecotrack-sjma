import {verifyToken} from '../utils/jwt.js';

/**
 * Routes publiques qui ne nécessitent pas de JWT
 */
const publicPaths = [
  '/auth/login',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/activate',
  '/auth/register',
  '/auth/citoyen/register',
  '/auth/citoyen/verify-code',
  '/auth/mfa/complete-setup',
  '/health',
  '/avatars'
];

/**
 * Verifier le JWT
 */
export const authenticateToken  = (req, res, next) => {
    // Vérifier si la route est publique
    const path = req.path || req.url;
    if (publicPaths.some(p => path.startsWith(p))) {
        return next();
    }
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    try {
        const decoded  = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

/** 
 * Verifier le role de l'utilisateur
 */
export const authorizeRole = (roles) => {
    return (req, res, next) => {
        if(!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const userRole = req.user.role;
        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    }
}