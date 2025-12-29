const CrudServices = require('./services/crudservices');
const ContainerModelDB = require('./models/crudcontainermodel');
const ContainerController = require('./controllers/crudcontroller');
const pool = require('./db/connexion').pool; // Import the actual pool
const service = new CrudServices(new ContainerModelDB(pool));
const controller = new ContainerController(service);

module.exports = controller;
