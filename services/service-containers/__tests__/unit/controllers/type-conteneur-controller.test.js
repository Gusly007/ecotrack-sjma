const TypeConteneurController = require('../../../src/controllers/type-conteneur-controller');

describe('TypeConteneurController', () => {
  let controller;
  let service;
  let req;
  let res;
  let next;

  beforeEach(() => {
    service = {
      createTypeConteneur: jest.fn(),
      getAllTypes: jest.fn(),
      getAllTypesWithStats: jest.fn(),
      getTypeById: jest.fn(),
      getTypeByCode: jest.fn(),
      getTypeByNom: jest.fn(),
      updateTypeConteneur: jest.fn(),
      deleteTypeConteneur: jest.fn(),
      deleteAllTypes: jest.fn(),
      countTypes: jest.fn(),
      typeExists: jest.fn(),
      codeExists: jest.fn(),
      getTypeWithStats: jest.fn()
    };

    controller = new TypeConteneurController(service);
    req = { params: {}, query: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  it('create validates required fields then creates', async () => {
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.body = { code: 'OM', nom: 'Ordures' };
    service.createTypeConteneur.mockResolvedValue({ id: 1 });
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('getAll and getAllWithStats return 200', async () => {
    service.getAllTypes.mockResolvedValue([]);
    service.getAllTypesWithStats.mockResolvedValue([]);
    await controller.getAll(req, res, next);
    await controller.getAllWithStats(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getById/getByCode/getByNom validate params', async () => {
    await controller.getById(req, res, next);
    await controller.getByCode(req, res, next);
    await controller.getByNom(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.params.id = '1';
    req.params.code = 'OM';
    req.params.nom = 'Ordures';
    service.getTypeById.mockResolvedValue({ id: 1 });
    service.getTypeByCode.mockResolvedValue({ code: 'OM' });
    service.getTypeByNom.mockResolvedValue([{ nom: 'Ordures' }]);
    await controller.getById(req, res, next);
    await controller.getByCode(req, res, next);
    await controller.getByNom(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('update/delete validate id', async () => {
    await controller.update(req, res, next);
    await controller.delete(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.params.id = '2';
    service.updateTypeConteneur.mockResolvedValue({ id: 2 });
    service.deleteTypeConteneur.mockResolvedValue({ id: 2 });
    await controller.update(req, res, next);
    await controller.delete(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteAll/count return payloads', async () => {
    service.deleteAllTypes.mockResolvedValue([{ id: 1 }]);
    service.countTypes.mockResolvedValue(3);
    await controller.deleteAll(req, res, next);
    await controller.count(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ total: 3 });
  });

  it('exists/codeExists/getWithStats validate id or code', async () => {
    await controller.exists(req, res, next);
    await controller.codeExists(req, res, next);
    await controller.getWithStats(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);

    req.params.id = '7';
    req.params.code = 'TRI';
    service.typeExists.mockResolvedValue(true);
    service.codeExists.mockResolvedValue(false);
    service.getTypeWithStats.mockResolvedValue({ id: 7, total: 5 });

    await controller.exists(req, res, next);
    await controller.codeExists(req, res, next);
    await controller.getWithStats(req, res, next);

    expect(res.json).toHaveBeenCalledWith({ exists: true });
    expect(res.json).toHaveBeenCalledWith({ exists: false });
  });

  it('forwards service errors', async () => {
    const err = new Error('x');
    req.body = { code: 'OM', nom: 'Ordures' };
    service.createTypeConteneur.mockRejectedValue(err);
    await controller.create(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
