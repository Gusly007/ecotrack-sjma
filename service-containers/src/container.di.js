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

const SignalementService = require('./services/signalementservices');
const SignalementModel = require('./models/signalementmodel');
const SignalementController = require('./controllers/signalementcontroller');
const signalementModel = new SignalementModel(pool);
const signalementService = new SignalementService(signalementModel);
const signalementController = new SignalementController(signalementService);

module.exports = controller;
module.exports.zoneController = zoneControllerInstance;
module.exports.typeConteneurController = typeConteneurController;
module.exports.signalementController = signalementController;