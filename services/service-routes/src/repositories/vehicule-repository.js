class VehiculeRepository {
  constructor(db) {
    this.db = db;
  }

  async create(data) {
    const { numero_immatriculation, modele, capacite_kg } = data;
    const result = await this.db.query(
      `INSERT INTO vehicule (numero_immatriculation, modele, capacite_kg)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [numero_immatriculation, modele, capacite_kg]
    );
    return result.rows[0];
  }

  async findById(id) {
    const result = await this.db.query(
      `SELECT v.*,
        COUNT(t.id_tournee) FILTER (WHERE t.statut IN ('PLANIFIEE','EN_COURS')) AS tournees_actives
       FROM vehicule v
       LEFT JOIN tournee t ON t.id_vehicule = v.id_vehicule
       WHERE v.id_vehicule = $1
       GROUP BY v.id_vehicule`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findAll(options = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const countResult = await this.db.query('SELECT COUNT(*) FROM vehicule');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await this.db.query(
      `SELECT v.*,
        COUNT(t.id_tournee) FILTER (WHERE t.statut IN ('PLANIFIEE','EN_COURS')) AS tournees_actives
       FROM vehicule v
       LEFT JOIN tournee t ON t.id_vehicule = v.id_vehicule
       GROUP BY v.id_vehicule
       ORDER BY v.id_vehicule
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return { rows: result.rows, total };
  }

  async update(id, data) {
    const { numero_immatriculation, modele, capacite_kg } = data;

    const updates = [];
    const values = [];
    let idx = 1;

    if (numero_immatriculation !== undefined) { updates.push(`numero_immatriculation = $${idx++}`); values.push(numero_immatriculation); }
    if (modele !== undefined) { updates.push(`modele = $${idx++}`); values.push(modele); }
    if (capacite_kg !== undefined) { updates.push(`capacite_kg = $${idx++}`); values.push(capacite_kg); }

    if (updates.length === 0) {
      const ApiError = require('../utils/api-error');
      throw ApiError.badRequest('Aucun champ à mettre à jour');
    }

    values.push(id);
    const result = await this.db.query(
      `UPDATE vehicule SET ${updates.join(', ')} WHERE id_vehicule = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await this.db.query(
      'DELETE FROM vehicule WHERE id_vehicule = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }

  async exists(id) {
    const result = await this.db.query(
      'SELECT 1 FROM vehicule WHERE id_vehicule = $1',
      [id]
    );
    return result.rowCount > 0;
  }
}

module.exports = VehiculeRepository;
