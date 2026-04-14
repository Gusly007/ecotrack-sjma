const { pool } = require('./db/connexion');

// Repositories
const TourneeRepository = require('./repositories/tournee-repository');
const VehiculeRepository = require('./repositories/vehicule-repository');
const CollecteRepository = require('./repositories/collecte-repository');
const StatsRepository = require('./repositories/stats-repository');
const SignalementRepository = require('./repositories/signalement-repository');

// Services
const TourneeService = require('./services/tournee-service');
const VehiculeService = require('./services/vehicule-service');
const CollecteService = require('./services/collecte-service');
const StatsService = require('./services/stats-service');
const SignalementService = require('./services/signalement-service');

// Controllers
const TourneeController = require('./controllers/tournee-controller');
const VehiculeController = require('./controllers/vehicule-controller');
const CollecteController = require('./controllers/collecte-controller');
const StatsController = require('./controllers/stats-controller');
const SignalementController = require('./controllers/signalement-controller');
const ExportController = require('./controllers/export-controller');

// Instantiation
const tourneeRepo = new TourneeRepository(pool);
const vehiculeRepo = new VehiculeRepository(pool);
const collecteRepo = new CollecteRepository(pool);
const statsRepo = new StatsRepository(pool);
const signalementRepo = new SignalementRepository(pool);

const tourneeService = new TourneeService(tourneeRepo, collecteRepo);
const vehiculeService = new VehiculeService(vehiculeRepo);
const collecteService = new CollecteService(collecteRepo, tourneeRepo);
const statsService = new StatsService(statsRepo);
const signalementService = new SignalementService(pool);

const tourneeController = new TourneeController(tourneeService, pool);
const vehiculeController = new VehiculeController(vehiculeService);
const collecteController = new CollecteController(collecteService);
const statsController = new StatsController(statsService, pool);
const signalementController = new SignalementController(signalementService);
const exportController = ExportController;

// Middleware qui injecte les controllers dans req
function controllersMiddleware(req, res, next) {
  req.controllers = {
    tournee: tourneeController,
    vehicule: vehiculeController,
    collecte: collecteController,
    stats: statsController,
    signalement: signalementController,
    export: exportController
  };
  next();
}

module.exports = { controllersMiddleware };
