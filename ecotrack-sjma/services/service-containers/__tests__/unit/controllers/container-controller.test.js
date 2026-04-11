const ContainerController = require('../../../src/controllers/container-controller');

describe('ContainerController', () => {
  let controller;
  let service;
  let req;
  let res;
  let next;

  beforeEach(() => {
    service = {
      createContainer: jest.fn(),
      updateContainer: jest.fn(),
      updateStatus: jest.fn(),
      getContainerById: jest.fn(),
      getContainerByUid: jest.fn(),
      getAllContainers: jest.fn(),
      getContainersByStatus: jest.fn(),
      getContainersByZone: jest.fn(),
      getContainersInRadius: jest.fn(),
      deleteContainer: jest.fn(),
      deleteAllContainers: jest.fn(),
      countContainers: jest.fn(),
      existContainer: jest.fn(),
      existByUid: jest.fn(),
      getStatistics: jest.fn(),
      getHistoriqueStatut: jest.fn(),
      getContainersByFillLevel: jest.fn()
    };

    controller = new ContainerController(service);
    req = { params: {}, query: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  it('create returns 400 when required fields are missing', async () => {
    req.body = { capacite_l: 100 };
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(service.createContainer).not.toHaveBeenCalled();
  });

  it('create returns 201 on success', async () => {
    req.body = { capacite_l: 100, statut: 'VIDE', latitude: 1, longitude: 2 };
    service.createContainer.mockResolvedValue({ id: 1 });
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1 });
  });

  it('update validates id and not found cases', async () => {
    await controller.update(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.params.id = '10';
    service.updateContainer.mockResolvedValue(null);
    await controller.update(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updateStatus validates statut', async () => {
    req.params.id = '5';
    await controller.updateStatus(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('getById/getByUid return 404 when missing entity', async () => {
    req.params.id = '9';
    service.getContainerById.mockResolvedValue(null);
    await controller.getById(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);

    req.params.uid = 'U1';
    service.getContainerByUid.mockResolvedValue(null);
    await controller.getByUid(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('getAll parses pagination and filters', async () => {
    req.query = { page: '2', limit: '25', statut: 'PLEIN', id_zone: '4', id_type: '2' };
    service.getAllContainers.mockResolvedValue({ items: [] });
    await controller.getAll(req, res, next);
    expect(service.getAllContainers).toHaveBeenCalledWith({
      page: 2,
      limit: 25,
      statut: 'PLEIN',
      id_zone: '4',
      id_type: '2'
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getInRadius validates required query params', async () => {
    await controller.getInRadius(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.query = { latitude: '1.5', longitude: '2.5', radiusKm: '3' };
    service.getContainersInRadius.mockResolvedValue([]);
    await controller.getInRadius(req, res, next);
    expect(service.getContainersInRadius).toHaveBeenCalledWith(1.5, 2.5, 3);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('delete returns 404 when target does not exist', async () => {
    req.params.id = '1';
    service.deleteContainer.mockResolvedValue(false);
    await controller.delete(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deleteAll returns count message', async () => {
    service.deleteAllContainers.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    await controller.deleteAll(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ count: 2 }));
  });

  it('count builds filters and returns count', async () => {
    req.query = { statut: 'VIDE', id_zone: '8' };
    service.countContainers.mockResolvedValue(12);
    await controller.count(req, res, next);
    expect(service.countContainers).toHaveBeenCalledWith({ statut: 'VIDE', idZone: '8' });
    expect(res.json).toHaveBeenCalledWith({ count: 12 });
  });

  it('exists and existsByUid return boolean payload', async () => {
    req.params.id = '3';
    service.existContainer.mockResolvedValue(true);
    await controller.exists(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ exists: true });

    req.params.uid = 'ABC';
    service.existByUid.mockResolvedValue(false);
    await controller.existsByUid(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ exists: false });
  });

  it('getStatusHistory validates id and parses options', async () => {
    await controller.getStatusHistory(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.params.id = '4';
    req.query = { limit: '10', offset: '5' };
    service.getHistoriqueStatut.mockResolvedValue([]);
    await controller.getStatusHistory(req, res, next);
    expect(service.getHistoriqueStatut).toHaveBeenCalledWith('4', { limit: 10, offset: 5 });
  });

  it('getFillLevels parses numeric filters', async () => {
    req.query = { min_level: '25.5', max_level: '90.1', id_zone: '6' };
    service.getContainersByFillLevel.mockResolvedValue([]);
    await controller.getFillLevels(req, res, next);
    expect(service.getContainersByFillLevel).toHaveBeenCalledWith({ minLevel: 25.5, maxLevel: 90.1, id_zone: 6 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('forwards errors to next', async () => {
    const err = new Error('boom');
    req.body = { capacite_l: 100, statut: 'VIDE', latitude: 1, longitude: 2 };
    service.createContainer.mockRejectedValue(err);
    await controller.create(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
