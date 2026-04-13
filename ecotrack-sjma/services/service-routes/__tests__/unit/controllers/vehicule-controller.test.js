const VehiculeController = require('../../../src/controllers/vehicule-controller');

const mockService = {
  createVehicule: jest.fn(),
  getAllVehicules: jest.fn(),
  getVehiculeById: jest.fn(),
  updateVehicule: jest.fn(),
  deleteVehicule: jest.fn()
};

const controller = new VehiculeController(mockService);

let req, res, next;

beforeEach(() => {
  jest.clearAllMocks();
  req = { body: {}, params: {}, query: {}, headers: {} };
  res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
  next = jest.fn();
});

describe('VehiculeController.create', () => {
  it('devrait retourner 201 avec le véhicule créé', async () => {
    const vehicule = { id_vehicule: 1, immatriculation: 'AB-123-CD' };
    mockService.createVehicule.mockResolvedValue(vehicule);

    await controller.create(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: vehicule })
    );
  });

  it('devrait appeler next en cas d\'erreur', async () => {
    const err = new Error('validation');
    mockService.createVehicule.mockRejectedValue(err);

    await controller.create(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('VehiculeController.getAll', () => {
  it('devrait retourner 200 avec liste paginée', async () => {
    mockService.getAllVehicules.mockResolvedValue({
      vehicules: [{ id_vehicule: 1 }],
      total: 1,
      page: 1,
      limit: 50
    });
    req.query = { page: '1', limit: '50' };

    await controller.getAll(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, pagination: expect.any(Object) })
    );
  });
});

describe('VehiculeController.getById', () => {
  it('devrait retourner 200 avec le véhicule', async () => {
    mockService.getVehiculeById.mockResolvedValue({ id_vehicule: 1 });
    req.params = { id: '1' };

    await controller.getById(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('devrait appeler next en cas d\'erreur', async () => {
    mockService.getVehiculeById.mockRejectedValue(new Error('404'));
    req.params = { id: '99' };

    await controller.getById(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('VehiculeController.update', () => {
  it('devrait retourner 200 avec le véhicule mis à jour', async () => {
    mockService.updateVehicule.mockResolvedValue({ id_vehicule: 1, capacite_kg: 3000 });
    req.params = { id: '1' };
    req.body = { capacite_kg: 3000 };

    await controller.update(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Véhicule mis à jour' })
    );
  });
});

describe('VehiculeController.delete', () => {
  it('devrait retourner 200 avec message de suppression', async () => {
    mockService.deleteVehicule.mockResolvedValue(true);
    req.params = { id: '1' };

    await controller.delete(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Véhicule supprimé' })
    );
  });

  it('devrait appeler next en cas d\'erreur', async () => {
    mockService.deleteVehicule.mockRejectedValue(new Error('404'));
    req.params = { id: '99' };

    await controller.delete(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
