/**
 * Middleware pour injecter le socketService dans le service de conteneur
 * Crée une instance du service avec Socket.IO injecté
 */
const DI = require('../container-di');
const ContainerController = require('../controllers/container-controller');

const socketMiddleware = (req, res, next) => {
  const socketService = req.app.locals.socketService;
  const service = DI.createContainerService(socketService);
  req.containerController = new ContainerController(service);
  next();
};

module.exports = socketMiddleware;
