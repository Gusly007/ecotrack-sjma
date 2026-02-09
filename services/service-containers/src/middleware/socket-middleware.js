/**
 * Middleware pour injecter le socketService dans la requête
 * Rend Socket.IO accessible à tous les contrôleurs
 * 
 * ✅ Optimisé: Réutilise l'instance Socket.IO globale au lieu de la recréer
 */

const socketMiddleware = (req, res, next) => {
  // Injecter le socketService global pour toutes les routes
  req.socketService = req.app.locals.socketService;
  
  // Log du branchement du socket (optionnel, peut être commenté en production)
  if (req.socketService) {
    req.socketReady = true;
  }
  
  next();
};

module.exports = socketMiddleware;
