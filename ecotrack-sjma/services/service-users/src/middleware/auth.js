import {verifyToken} from '../utils/jwt.js';

/**
 * Verifier le JWT
 */
export const authenticateToken  = (req, res, next) => {
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