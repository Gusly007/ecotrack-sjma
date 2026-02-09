const ContainerServices = require('./services/container-services');
const ConteneurModel = require('./models/container-model');
const ContainerController = require('./controllers/container-controller');
const pool = require('./db/connexion').pool; // Import the actual pool

// Factory pour créer le service et le contrôleur avec socketService injecté
const createContainerService = (socketService = null) => {
  const model = new ConteneurModel(pool);
  return new ContainerServices(model, socketService);
};

// Instance par défaut sans Socket.IO (pour tests)
const defaultService = createContainerService();
const controller = new ContainerController(defaultService);

const zoneService = require('./services/zone-services');
const ZoneController = require('./controllers/zone-controller');
const zoneModel = require('./models/zone-model');
const zoneServiceInstance = new zoneService(new zoneModel(pool));
const zoneControllerInstance = new ZoneController(zoneServiceInstance);

const TypeConteneurService = require('./services/type-conteneur-services');
const TypeConteneurModel = require('./models/type-conteneur-model');
const TypeConteneurController = require('./controllers/type-conteneur-controller');
const typeConteneurModel = new TypeConteneurModel(pool);
const typeConteneurService = new TypeConteneurService(typeConteneurModel);
const typeConteneurController = new TypeConteneurController(typeConteneurService);

// Stats (Phase 5)
const StatsModel = require('./models/stats-model');
const StatsService = require('./services/stats-service');
const StatsController = require('./controllers/stats-controller');
const statsModel = new StatsModel(pool);
const statsService = new StatsService(statsModel);
const statsController = new StatsController(statsService);  


module.exports = controller;
module.exports.createContainerService = createContainerService;
module.exports.zoneController = zoneControllerInstance;
module.exports.typeConteneurController = typeConteneurController;
module.exports.statsController = statsController;
