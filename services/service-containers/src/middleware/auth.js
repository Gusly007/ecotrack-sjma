/**
 * Authentication Middleware pour service-containers
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production_access_secret';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Token required',
      message: 'Aucun token d\'authentification fourni'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || decoded.role_par_defaut,
      role_par_defaut: decoded.role_par_defaut || decoded.role
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Le token a expiré'
      });
    }
    return res.status(401).json({ 
      error: 'Invalid token',
      message: 'Token invalide'
    });
  }
};

module.exports = { authenticateToken };
