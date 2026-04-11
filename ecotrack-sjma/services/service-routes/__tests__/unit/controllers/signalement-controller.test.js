const SignalementController = require('../../../src/controllers/signalement-controller');

describe('SignalementController', () => {
  let service;
  let controller;
  let req;
  let res;

  beforeEach(() => {
    service = {
      getAll: jest.fn(),
      getById: jest.fn(),
      getHistory: jest.fn(),
      updateStatus: jest.fn(),
      update: jest.fn(),
      saveTreatment: jest.fn(),
      getStats: jest.fn(),
      getTypes: jest.fn()
    };

    controller = new SignalementController(service);
    req = { params: {}, query: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('maps filters and returns paginated list', async () => {
    service.getAll.mockResolvedValue({ data: [{ id_signalement: 1 }], pagination: { page: 1, total: 1 } });
    req.query = { page: '2', limit: '5', statut: 'NOUVEAU', id_type: '3', search: 'abc' };

    await controller.getAll(req, res);

    expect(service.getAll).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      statut: 'NOUVEAU',
      urgence: undefined,
      id_type: 3,
      search: 'abc'
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 400 when statut is missing in updateStatus', async () => {
    req.params = { id: '10' };
    req.body = {};

    await controller.updateStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(service.updateStatus).not.toHaveBeenCalled();
  });

  it('returns success message when updateStatus succeeds', async () => {
    req.params = { id: '10' };
    req.body = { statut: 'RESOLU' };
    service.updateStatus.mockResolvedValue({ id_signalement: 10, statut: 'RESOLU' });

    await controller.updateStatus(req, res);

    expect(service.updateStatus).toHaveBeenCalledWith(10, 'RESOLU');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'Statut mis à jour' }));
  });

  it('uses statusCode from service errors', async () => {
    req.params = { id: '99' };
    const err = new Error('Signalement non trouvé');
    err.statusCode = 404;
    service.getById.mockRejectedValue(err);

    await controller.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, statusCode: 404 }));
  });

  it('returns treatment success payload', async () => {
    req.params = { id: '11' };
    req.body = { id_agent: 3, commentaire: 'done' };
    service.saveTreatment.mockResolvedValue({ id_traitement: 1 });

    await controller.saveTreatment(req, res);

    expect(service.saveTreatment).toHaveBeenCalledWith(11, req.body);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Traitement enregistré' }));
  });
});