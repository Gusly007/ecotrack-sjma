const pool = require('../db/connexion').pool; // Import the actual pool
class crudcontainermodel {
  constructor() {
    this.db = pool;
  } 
  async createcontainer(capacity, location) {
    if (!capacity || !location) {
      throw new Error('Missing required fields: capacity and location');
    }
    // Generate a unique identifier for the user .delete when we develope the user crud
    const uid = (Math.random().toString(20).substr(2, 9)).toUpperCase();
    const result = await this.db.query(
      'INSERT INTO conteneur (capacite_l, statut, date_installation,  position, uid) VALUES ($1, $2,  NOW(), $3, $4) RETURNING *',
      [capacity, 'ACTIF', location, uid]
    );
    return result.rows[0];
  };
  async updatecontainer(id, location){
    if(!id){
        throw new Error("missing required field :id");
        
    }
    const result = await this.db.query(
        'UPDATE conteneur SET position=$1 WHERE id_conteneur=$2 RETURNING *',
        [location, id]
    );
    return result.rows[0];

  }
  async deletecontainer(id){
    if(!id){
        throw new Error("missing required field :id")
    }
    const result = await this.db.query(
        'DELETE FROM conteneur WHERE id_conteneur=$1 RETURNING *',
        [id]
    );
    return result.rows[0];       
  }
  async deleteallcontainers(){
    const result = await this.db.query(
        'DELETE FROM conteneur RETURNING *'
    );
    return result.rows;       
  }

   async countcontainers() {
        const result = await this.db.query(
            'SELECT COUNT(*) FROM conteneur'
        );
        return parseInt(result.rows[0].count, 10);
    };
    async existcontainer(id) {
        if (!id) {
            throw new Error('Missing required field: id');
        } 
        const result = await this.db.query(
            'SELECT 1 FROM conteneur WHERE id_conteneur = $1', [id]  
        );
        return result.rowCount > 0;
    };
    async getcontainerById(id) {
        if (!id) {
            throw new Error('Missing required field: id');
        }
        const result = await this.db.query(
            'SELECT * FROM conteneur WHERE id_conteneur = $1', [id]  
        );
        return result.rows[0];
    };
    async getallcontainers() {
        const result = await this.db.query(
            'SELECT * FROM conteneur'
        );
        return result.rows;
    };
}
module.exports = crudcontainermodel;