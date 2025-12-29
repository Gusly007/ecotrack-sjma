class ContainerController {
  constructor(service) {
    this.service = service;

    // 🔒 binding pour Express
    //what does this do ?
    // It ensures that the methods have the correct 'this' context when called as route handlers in Express.
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.getById = this.getById.bind(this);
    this.remove = this.remove.bind(this);
  }

  async create(req, res) {
    try {
      const { capacity, location } = req.body;

      if (capacity == null || location == null) {
        return res.status(400).json({ message: 'capacity et location sont requis' });
      }

      const container = await this.service.createcontainer(capacity, location);
      return res.status(201).json(container);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { location } = req.body;

      if (!location) {
        return res.status(400).json({ message: 'location est requis' });
      }

      const updated = await this.service.updatecontainer(id, location);
      if (!updated) {
        return res.status(404).json({ message: 'container introuvable' });
      }

      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;

      const container = await this.service.getcontainerById(id);
      if (!container) {
        return res.status(404).json({ message: 'container introuvable' });
      }

      return res.status(200).json(container);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async remove(req, res) {
    try {
      const { id } = req.params;

      const deleted = await this.service.deletecontainer(id);
      if (!deleted) {
        return res.status(404).json({ message: 'container introuvable' });
      }

      return res.status(204).send();
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = ContainerController;
