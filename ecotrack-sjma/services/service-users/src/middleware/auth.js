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
  // Les routes /auth/mfa/* et /auth/login/mfa ne sont plus "publiques au sens
  // large" : elles exigent désormais un jeton pré-MFA (V2-002), mais ce n'est
  // pas un access token — elles le valident elles-mêmes via requireMfaToken.
  '/auth/mfa/complete-setup',
  '/auth/mfa/regenerate',
  '/auth/mfa/recover/request',
  '/auth/mfa/recover/verify',
  '/auth/login/mfa',
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

export const STAFF_SELF_DELETION_FORBIDDEN =
    "Seuls les comptes citoyens peuvent demander leur propre suppression. La suppression d'un compte du personnel (agent, gestionnaire, administrateur) est effectuée par un administrateur.";

export const forbidStaffSelfDeletion = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== 'CITOYEN') {
        return res.status(403).json({ error: STAFF_SELF_DELETION_FORBIDDEN });
    }
    next();
}