class SignalementModel {
    constructor(db) {
        this.db = db;
    }

    async create(signalement) {
        // Insert signalement into database
        const { description, url_photo, statut, id_type, id_conteneur, id_citoyen } = signalement;
        const query = `
            INSERT INTO signalement (description, url_photo, statut, id_type, id_conteneur, id_citoyen)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await this.db.query(query, [description, url_photo, statut, id_type, id_conteneur, id_citoyen]);
        return result.rows[0];
    }

    async findById(id) {
        // Get signalement by id
        const result = await this.db.query('SELECT * FROM signalement WHERE id_signalement = $1', [id]);
        return result.rows[0];
    }

    async findAll() {
        // Get all signalements
        const result = await this.db.query('SELECT * FROM signalement ORDER BY date_creation DESC');
        return result.rows;
    }

    async update(id, signalement) {
        // Update signalement
        const { description, url_photo, statut, id_type, id_conteneur } = signalement;
        const query = `
            UPDATE signalement 
            SET description = COALESCE($1, description),
                url_photo = COALESCE($2, url_photo),
                statut = COALESCE($3, statut),
                id_type = COALESCE($4, id_type),
                id_conteneur = COALESCE($5, id_conteneur)
            WHERE id_signalement = $6
            RETURNING *
        `;
        const result = await this.db.query(query, [description, url_photo, statut, id_type, id_conteneur, id]);
        return result.rows[0];
    }

    async delete(id) {
        // Delete signalement
        const result = await this.db.query('DELETE FROM signalement WHERE id_signalement = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

module.exports = SignalementModel;