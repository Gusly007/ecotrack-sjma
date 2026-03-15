const { pool } = require('./db/connexion');

// Repositories
const TourneeRepository = require('./repositories/tournee-repository');
const VehiculeRepository = require('./repositories/vehicule-repository');
const CollecteRepository = require('./repositories/collecte-repository');
const StatsRepository = require('./repositories/stats-repository');

// Services
const TourneeService = require('./services/tournee-service');
const VehiculeService = require('./services/vehicule-service');
const CollecteService = require('./services/collecte-service');
const StatsService = require('./services/stats-service');

// Controllers
const TourneeController = require('./controllers/tournee-controller');
const VehiculeController = require('./controllers/vehicule-controller');
const CollecteController = require('./controllers/collecte-controller');
const StatsController = require('./controllers/stats-controller');

// Instantiation
const tourneeRepo = new TourneeRepository(pool);
const vehiculeRepo = new VehiculeRepository(pool);
const collecteRepo = new CollecteRepository(pool);
const statsRepo = new StatsRepository(pool);

const tourneeService = new TourneeService(tourneeRepo, collecteRepo);
const vehiculeService = new VehiculeService(vehiculeRepo);
const collecteService = new CollecteService(collecteRepo, tourneeRepo);
const statsService = new StatsService(statsRepo);

const tourneeController = new TourneeController(tourneeService, pool);
const vehiculeController = new VehiculeController(vehiculeService);
const collecteController = new CollecteController(collecteService);
const statsController = new StatsController(statsService, pool);

// Middleware qui injecte les controllers dans req
function controllersMiddleware(req, res, next) {
  req.controllers = {
    tournee: tourneeController,
    vehicule: vehiculeController,
    collecte: collecteController,
    stats: statsController
  };
  next();
}

module.exports = { controllersMiddleware };
