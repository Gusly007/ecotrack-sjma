const ContainerServices = require('./services/containerservices');
const ContainerModel = require('./models/containermodel');
const ContainerController = require('./controllers/containercontroller');
const pool = require('./db/connexion').pool; // Import the actual pool
const service = new ContainerServices(new ContainerModel(pool));
const controller = new ContainerController(service);

const zoneService = require('./services/zoneservices');
const ZoneController = require('./controllers/zonecontroller');
const zoneModel = require('./models/zonemodel');
const zoneServiceInstance = new zoneService(new zoneModel(pool));
const zoneControllerInstance = new ZoneController(zoneServiceInstance);

const TypeConteneurService = require('./services/typeconteneurservices');
const TypeConteneurModel = require('./models/typeconteneurmodel');
const TypeConteneurController = require('./controllers/typeconteneurcontroller');
const typeConteneurModel = new TypeConteneurModel(pool);
const typeConteneurService = new TypeConteneurService(typeConteneurModel);
const typeConteneurController = new TypeConteneurController(typeConteneurService);

module.exports = controller;
module.exports.zoneController = zoneControllerInstance;
module.exports.typeConteneurController = typeConteneurController;
