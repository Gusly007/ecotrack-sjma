const CrudServices = require('./services/crudservices');
const ContainerModelDB = require('./models/crudcontainermodel');
const ContainerController = require('./controllers/crudcontroller');

const service = new CrudServices(new ContainerModelDB());
const controller = new ContainerController(service);

module.exports = controller;
