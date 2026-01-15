class SignalementService {
    constructor(model) {
        this.model = model;
    }

    async createSignalement(data) {
        try {
            return await this.model.create(data);
        } catch (error) {
            throw new Error(`Erreur lors de la création du signalement: ${error.message}`);
        }
    }

    async getSignalementById(id) {
        try {
            const signalement = await this.model.findById(id);
            if (!signalement) {
                throw new Error('Signalement non trouvé');
            }
            return signalement;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du signalement: ${error.message}`);
        }
    }

    async getAllSignalements() {
        try {
            return await this.model.findAll();
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des signalements: ${error.message}`);
        }
    }

    async updateSignalement(id, data) {
        try {
            const signalement = await this.model.update(id, data);
            if (!signalement) {
                throw new Error('Signalement non trouvé');
            }
            return signalement;
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour du signalement: ${error.message}`);
        }
    }

    async deleteSignalement(id) {
        try {
            const signalement = await this.model.delete(id);
            if (!signalement) {
                throw new Error('Signalement non trouvé');
            }
            return signalement;
        } catch (error) {
            throw new Error(`Erreur lors de la suppression du signalement: ${error.message}`);
        }
    }
}

module.exports = SignalementService;