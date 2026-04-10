const ZoneController = require('../../../src/controllers/zone-controller');

describe('ZoneController', () => {
  let controller;
  let service;
  let req;
  let res;
  let next;

  beforeEach(() => {
    service = {
      createZone: jest.fn(),
      getAllZones: jest.fn(),
      getZoneById: jest.fn(),
      getZoneByCode: jest.fn(),
      updateZone: jest.fn(),
      deleteZone: jest.fn(),
      deleteAllZones: jest.fn(),
      searchZonesByName: jest.fn(),
      getZonesInRadius: jest.fn(),
      getZoneStatistics: jest.fn(),
      countZones: jest.fn(),
      zoneExists: jest.fn(),
      codeExists: jest.fn()
    };

    controller = new ZoneController(service);
    req = { params: {}, query: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  it('create validates required fields', async () => {
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.body = { nom: 'Centre', population: 1000, superficie_km2: 12.5 };
    service.createZone.mockResolvedValue({ id: 1 });
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('getAll validates positive page and limit', async () => {
    req.query = { page: '-1', limit: '-2' };
    await controller.getAll(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.query = { page: '2', limit: '5' };
    service.getAllZones.mockResolvedValue({ items: [] });
    await controller.getAll(req, res, next);
    expect(service.getAllZones).toHaveBeenCalledWith(2, 5);
  });

  it('getById/getByCode validate params', async () => {
    await controller.getById(req, res, next);
    await controller.getByCode(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.params.id = '1';
    req.params.code = 'ZN1';
    service.getZoneById.mockResolvedValue({ id: 1 });
    service.getZoneByCode.mockResolvedValue({ code: 'ZN1' });
    await controller.getById(req, res, next);
    await controller.getByCode(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('update/delete validate id', async () => {
    await controller.update(req, res, next);
    await controller.delete(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.params.id = '5';
    service.updateZone.mockResolvedValue({ id: 5 });
    service.deleteZone.mockResolvedValue({ id: 5 });
    await controller.update(req, res, next);
    await controller.delete(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('searchByName validates query', async () => {
    await controller.searchByName(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.query.nom = 'Paris';
    service.searchZonesByName.mockResolvedValue([{ id: 1 }]);
    await controller.searchByName(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getInRadius validates required and numeric params', async () => {
    await controller.getInRadius(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.query = { latitude: 'x', longitude: '2', rayon: '3' };
    await controller.getInRadius(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.query = { latitude: '48.8', longitude: '2.3', rayon: '10' };
    service.getZonesInRadius.mockResolvedValue([{ id: 1 }]);
    await controller.getInRadius(req, res, next);
    expect(service.getZonesInRadius).toHaveBeenCalledWith(48.8, 2.3, 10);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getStatistics/count return data wrappers', async () => {
    service.getZoneStatistics.mockResolvedValue({ total: 2 });
    service.countZones.mockResolvedValue({ total: 2 });
    await controller.getStatistics(req, res, next);
    await controller.count(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('exists/codeExists validate params then return results', async () => {
    await controller.exists(req, res, next);
    await controller.codeExists(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.params.id = '9';
    req.params.code = 'Z9';
    service.zoneExists.mockResolvedValue(true);
    service.codeExists.mockResolvedValue(false);
    await controller.exists(req, res, next);
    await controller.codeExists(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('forwards errors to next', async () => {
    const err = new Error('fail');
    req.body = { nom: 'Centre', population: 1, superficie_km2: 1 };
    service.createZone.mockRejectedValue(err);
    await controller.create(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
