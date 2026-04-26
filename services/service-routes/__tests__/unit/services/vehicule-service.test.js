const VehiculeService = require('../../../src/services/vehicule-service');
const ApiError = require('../../../src/utils/api-error');

const mockVehiculeRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn()
};

const service = new VehiculeService(mockVehiculeRepo);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('VehiculeService.createVehicule', () => {
  it('devrait créer un véhicule avec des données valides', async () => {
    const data = { numero_immatriculation: 'AB-123-CD', modele: 'Renault Trucks D', capacite_kg: 2000 };
    const created = { id_vehicule: 1, ...data };
    mockVehiculeRepo.create.mockResolvedValue(created);

    const result = await service.createVehicule(data);
    expect(mockVehiculeRepo.create).toHaveBeenCalledWith(expect.objectContaining({ numero_immatriculation: 'AB-123-CD' }));
    expect(result).toEqual(created);
  });

  it('devrait rejeter des données invalides (immatriculation manquante)', async () => {
    await expect(service.createVehicule({ modele: 'Renault', capacite_kg: 2000 })).rejects.toThrow();
  });
});

describe('VehiculeService.getVehiculeById', () => {
  it('devrait retourner le véhicule si trouvé', async () => {
    const vehicule = { id_vehicule: 1, immatriculation: 'AB-123-CD' };
    mockVehiculeRepo.findById.mockResolvedValue(vehicule);

    const result = await service.getVehiculeById(1);
    expect(result).toEqual(vehicule);
  });

  it('devrait lever ApiError 404 si véhicule introuvable', async () => {
    mockVehiculeRepo.findById.mockResolvedValue(null);

    await expect(service.getVehiculeById(99)).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining('99')
    });
  });
});

describe('VehiculeService.getAllVehicules', () => {
  it('devrait retourner la liste paginée avec defaults', async () => {
    mockVehiculeRepo.findAll.mockResolvedValue({ rows: [{ id_vehicule: 1 }], total: 1 });

    const result = await service.getAllVehicules();
    expect(mockVehiculeRepo.findAll).toHaveBeenCalledWith({ page: 1, limit: 50 });
    expect(result.vehicules).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
  });

  it('devrait respecter les paramètres de pagination', async () => {
    mockVehiculeRepo.findAll.mockResolvedValue({ rows: [], total: 0 });

    await service.getAllVehicules({ page: '2', limit: '10' });
    expect(mockVehiculeRepo.findAll).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });
});

describe('VehiculeService.updateVehicule', () => {
  it('devrait mettre à jour si le véhicule existe', async () => {
    mockVehiculeRepo.exists.mockResolvedValue(true);
    const updated = { id_vehicule: 1, immatriculation: 'AB-123-CD', capacite_kg: 3000 };
    mockVehiculeRepo.update.mockResolvedValue(updated);

    const result = await service.updateVehicule(1, { capacite_kg: 3000 });
    expect(result).toEqual(updated);
  });

  it('devrait lever 404 si véhicule inexistant', async () => {
    mockVehiculeRepo.exists.mockResolvedValue(false);

    await expect(service.updateVehicule(99, { capacite_kg: 3000 })).rejects.toMatchObject({
      statusCode: 404
    });
    expect(mockVehiculeRepo.update).not.toHaveBeenCalled();
  });

  it('devrait lever 404 si update retourne null', async () => {
    mockVehiculeRepo.exists.mockResolvedValue(true);
    mockVehiculeRepo.update.mockResolvedValue(null);

    await expect(service.updateVehicule(1, { capacite_kg: 3000 })).rejects.toMatchObject({
      statusCode: 404
    });
  });
});

describe('VehiculeService.deleteVehicule', () => {
  it('devrait supprimer si le véhicule existe', async () => {
    mockVehiculeRepo.exists.mockResolvedValue(true);
    mockVehiculeRepo.delete.mockResolvedValue(true);

    await service.deleteVehicule(1);
    expect(mockVehiculeRepo.delete).toHaveBeenCalledWith(1);
  });

  it('devrait lever 404 si véhicule inexistant', async () => {
    mockVehiculeRepo.exists.mockResolvedValue(false);

    await expect(service.deleteVehicule(99)).rejects.toMatchObject({ statusCode: 404 });
    expect(mockVehiculeRepo.delete).not.toHaveBeenCalled();
  });
});
