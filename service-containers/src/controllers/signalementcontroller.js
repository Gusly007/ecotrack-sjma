class SignalementController {
    constructor(service) {
        this.service = service;

        // Bind methods for Express route handlers
        this.createSignalement = this.createSignalement.bind(this);
        this.getAllSignalements = this.getAllSignalements.bind(this);
        this.getSignalementById = this.getSignalementById.bind(this);
        this.updateSignalement = this.updateSignalement.bind(this);
        this.deleteSignalement = this.deleteSignalement.bind(this);
    }

    async createSignalement(req, res) {
        try {
            const created = await this.service.createSignalement(req.body);
            return res.status(201).json(created);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getAllSignalements(req, res) {
        try {
            const signalements = await this.service.getAllSignalements();
            return res.status(200).json(signalements);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getSignalementById(req, res) {
        try {
            const { id } = req.params;
            const signalement = await this.service.getSignalementById(id);
            return res.status(200).json(signalement);
        } catch (error) {
            if (error.message === 'Signalement non trouvé') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
    }

    async updateSignalement(req, res) {
        try {
            const { id } = req.params;
            const updated = await this.service.updateSignalement(id, req.body);
            return res.status(200).json(updated);
        } catch (error) {
            if (error.message === 'Signalement non trouvé') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
    }

    async deleteSignalement(req, res) {
        try {
            const { id } = req.params;
            const deleted = await this.service.deleteSignalement(id);
            return res.status(200).json(deleted);
        } catch (error) {
            if (error.message === 'Signalement non trouvé') {
                return res.status(404).json({ message: error.message });
            }
            return res.status(500).json({ message: error.message });
        }
    }
}

module.exports = SignalementController;