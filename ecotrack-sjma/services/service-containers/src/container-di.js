const ContainerServices = require('./services/container-services');
const ContainerRepository = require('./repositories/container-repository');
const ContainerController = require('./controllers/container-controller');
const pool = require('./db/connexion').pool; // Import the actual pool

// Factory pour créer le service et le contrôleur avec socketService injecté
const createContainerService = (socketService = null) => {
  const repository = new ContainerRepository(pool);
  return new ContainerServices(repository, socketService);
};

// Instance par défaut sans Socket.IO (pour tests)
const defaultService = createContainerService();
const controller = new ContainerController(defaultService);

const zoneService = require('./services/zone-services');
const ZoneController = require('./controllers/zone-controller');
const ZoneRepository = require('./repositories/zone-repository');
const zoneRepositoryyInstance = new ZoneRepository(pool);
const zoneServiceInstance = new zoneService(zoneRepositoryyInstance);
const zoneControllerInstance = new ZoneController(zoneServiceInstance);

const TypeConteneurService = require('./services/type-conteneur-services');
const TypeConteneurRepository = require('./repositories/type-conteneur-repository');
const TypeConteneurController = require('./controllers/type-conteneur-controller');
const typeConteneurRepository = new TypeConteneurRepository(pool);
const typeConteneurService = new TypeConteneurService(typeConteneurRepository);
const typeConteneurController = new TypeConteneurController(typeConteneurService);

// Stats (Phase 5)
const StatsRepository = require('./repositories/stats-repository');
const StatsService = require('./services/stats-service');
const StatsController = require('./controllers/stats-controller');
const statsRepository = new StatsRepository(pool);
const statsService = new StatsService(statsRepository);
const statsController = new StatsController(statsService);  


module.exports = controller;
module.exports.createContainerService = createContainerService;
module.exports.zoneController = zoneControllerInstance;
module.exports.typeConteneurController = typeConteneurController;
module.exports.statsController = statsController;
