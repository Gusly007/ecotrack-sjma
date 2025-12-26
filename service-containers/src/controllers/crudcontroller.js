import connextion from '../db/connection-pg.js';
import model from '../models/crudcontainermodel.js';
import crudcontainer from '../models/crud.js';

export default
class crudcontainercontroller {
  // Méthode pour créer une nouvelle ressource
  constructor() {
    db = connextion.pool;
    this.model = new crudcontainer(db);
  }
async testController() {
    await model.createcontainer(100, 'Location A');
    return { message: 'CRUD Container Controller is working!' };    

  } 
}