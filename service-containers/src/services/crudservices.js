class CrudServices {
  constructor(containerModel) {
    this.model = containerModel;
  }

  async createcontainer(capacity, location) {
    return this.model.createcontainer(capacity, location);
  }

  async updatecontainer(id, location) {
    return this.model.updatecontainer(id, location);
  }

  async getcontainerById(id) {
    return this.model.getcontainerById(id);
  }

  async deletecontainer(id) {
    return this.model.deletecontainer(id);
  }
}

module.exports = CrudServices;
