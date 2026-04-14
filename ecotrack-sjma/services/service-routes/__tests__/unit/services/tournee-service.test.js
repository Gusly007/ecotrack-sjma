const TourneeService = require('../../../src/services/tournee-service');

const mockTourneeRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  findActive: jest.fn(),
  findAgentTodayTournee: jest.fn(),
  findEtapes: jest.fn(),
  update: jest.fn(),
  updateStatut: jest.fn(),
  delete: jest.fn(),
  exists: jest.fn(),
  addEtapes: jest.fn()
};

const mockCollecteRepo = {
  getTourneeProgress: jest.fn()
};

const service = new TourneeService(mockTourneeRepo, mockCollecteRepo);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('TourneeService.createTournee', () => {
  it('devrait créer une tournée avec données valides', async () => {
    const data = {
      date_tournee: '2026-03-15',
      id_zone: 1,
      id_agent: 5,
      duree_prevue_min: 90
    };
    const created = { id_tournee: 1, ...data };
    mockTourneeRepo.create.mockResolvedValue(created);

    const result = await service.createTournee(data);
    expect(mockTourneeRepo.create).toHaveBeenCalled();
    expect(result).toEqual(created);
  });

  it('devrait rejeter des données invalides (date manquante)', async () => {
    await expect(service.createTournee({ id_zone: 1 })).rejects.toThrow();
  });
});

describe('TourneeService.getTourneeById', () => {
  it('devrait retourner la tournée si trouvée', async () => {
    const tournee = { id_tournee: 1, statut: 'PLANIFIEE' };
    mockTourneeRepo.findById.mockResolvedValue(tournee);

    const result = await service.getTourneeById(1);
    expect(result).toEqual(tournee);
  });

  it('devrait lever ApiError 404 si introuvable', async () => {
    mockTourneeRepo.findById.mockResolvedValue(null);

    await expect(service.getTourneeById(99)).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining('99')
    });
  });
});

describe('TourneeService.getAllTournees', () => {
  it('devrait retourner la liste paginée avec les defaults', async () => {
    mockTourneeRepo.findAll.mockResolvedValue({ rows: [{ id_tournee: 1 }], total: 1 });

    const result = await service.getAllTournees();
    expect(mockTourneeRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 })
    );
    expect(result.tournees).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('devrait passer les filtres au repository', async () => {
    mockTourneeRepo.findAll.mockResolvedValue({ rows: [], total: 0 });

    await service.getAllTournees({ page: '2', limit: '5', statut: 'EN_COURS' });
    expect(mockTourneeRepo.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5, statut: 'EN_COURS' })
    );
  });
});

describe('TourneeService.getActiveTournees', () => {
  it('devrait déléguer au repository', async () => {
    const active = [{ id_tournee: 1 }];
    mockTourneeRepo.findActive.mockResolvedValue(active);

    const result = await service.getActiveTournees();
    expect(result).toEqual(active);
    expect(mockTourneeRepo.findActive).toHaveBeenCalled();
  });
});

describe('TourneeService.getAgentTodayTournee', () => {
  it('devrait retourner la tournée avec ses étapes', async () => {
    const tournee = { id_tournee: 1, id_agent: 5 };
    const etapes = [{ sequence: 1, id_conteneur: 10 }];
    mockTourneeRepo.findAgentTodayTournee.mockResolvedValue(tournee);
    mockTourneeRepo.findEtapes.mockResolvedValue(etapes);

    const result = await service.getAgentTodayTournee(5);
    expect(result).toMatchObject({ id_tournee: 1, id_agent: 5, etapes });
  });

  it('devrait lever 404 si aucune tournée aujourd\'hui', async () => {
    mockTourneeRepo.findAgentTodayTournee.mockResolvedValue(null);

    await expect(service.getAgentTodayTournee(5)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('TourneeService.updateTournee', () => {
  it('devrait mettre à jour si tournée existante', async () => {
    mockTourneeRepo.findById.mockResolvedValue({ id_tournee: 1 });
    const updated = { id_tournee: 1, distance_prevue_km: 10 };
    mockTourneeRepo.update.mockResolvedValue(updated);

    const result = await service.updateTournee(1, { distance_prevue_km: 10 });
    expect(result).toEqual(updated);
  });

  it('devrait lever 404 si tournée introuvable au premier findById', async () => {
    mockTourneeRepo.findById.mockResolvedValue(null);

    await expect(service.updateTournee(99, { distance_prevue_km: 10 })).rejects.toMatchObject({
      statusCode: 404
    });
  });

  it('devrait lever 404 si update retourne null', async () => {
    mockTourneeRepo.findById.mockResolvedValue({ id_tournee: 1 });
    mockTourneeRepo.update.mockResolvedValue(null);

    await expect(service.updateTournee(1, { distance_prevue_km: 10 })).rejects.toMatchObject({
      statusCode: 404
    });
  });
});

describe('TourneeService.updateStatut', () => {
  it('devrait mettre à jour le statut avec une valeur valide', async () => {
    const result = { id_tournee: 1, statut: 'EN_COURS' };
    mockTourneeRepo.updateStatut.mockResolvedValue(result);

    const returned = await service.updateStatut(1, { statut: 'EN_COURS' });
    expect(mockTourneeRepo.updateStatut).toHaveBeenCalledWith(1, 'EN_COURS');
    expect(returned).toEqual(result);
  });

  it('devrait rejeter un statut invalide', async () => {
    await expect(service.updateStatut(1, { statut: 'INVALID' })).rejects.toThrow();
  });
});

describe('TourneeService.deleteTournee', () => {
  it('devrait supprimer une tournée PLANIFIEE', async () => {
    mockTourneeRepo.findById.mockResolvedValue({ id_tournee: 1, statut: 'PLANIFIEE' });
    mockTourneeRepo.delete.mockResolvedValue(true);

    await service.deleteTournee(1);
    expect(mockTourneeRepo.delete).toHaveBeenCalledWith(1);
  });

  it('devrait lever 404 si introuvable', async () => {
    mockTourneeRepo.findById.mockResolvedValue(null);

    await expect(service.deleteTournee(99)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('devrait lever 400 si tournée EN_COURS', async () => {
    mockTourneeRepo.findById.mockResolvedValue({ id_tournee: 1, statut: 'EN_COURS' });

    await expect(service.deleteTournee(1)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('en cours')
    });
    expect(mockTourneeRepo.delete).not.toHaveBeenCalled();
  });
});

describe('TourneeService.getTourneeEtapes', () => {
  it('devrait retourner les étapes si tournée existe', async () => {
    mockTourneeRepo.exists.mockResolvedValue(true);
    const etapes = [{ sequence: 1 }];
    mockTourneeRepo.findEtapes.mockResolvedValue(etapes);

    const result = await service.getTourneeEtapes(1);
    expect(result).toEqual(etapes);
  });

  it('devrait lever 404 si tournée inexistante', async () => {
    mockTourneeRepo.exists.mockResolvedValue(false);

    await expect(service.getTourneeEtapes(99)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('TourneeService.getTourneeProgress', () => {
  it('devrait calculer la progression correctement', async () => {
    mockTourneeRepo.exists.mockResolvedValue(true);
    mockCollecteRepo.getTourneeProgress.mockResolvedValue({
      total_etapes: '10',
      etapes_collectees: '7',
      quantite_totale_kg: '350.5'
    });
    mockTourneeRepo.findEtapes.mockResolvedValue([]);

    const result = await service.getTourneeProgress(1);
    expect(result.total_etapes).toBe(10);
    expect(result.etapes_collectees).toBe(7);
    expect(result.etapes_restantes).toBe(3);
    expect(result.progression_pct).toBe(70);
    expect(result.quantite_totale_kg).toBe(350.5);
  });

  it('devrait retourner 0% si aucune étape', async () => {
    mockTourneeRepo.exists.mockResolvedValue(true);
    mockCollecteRepo.getTourneeProgress.mockResolvedValue({
      total_etapes: '0',
      etapes_collectees: '0',
      quantite_totale_kg: null
    });
    mockTourneeRepo.findEtapes.mockResolvedValue([]);

    const result = await service.getTourneeProgress(1);
    expect(result.progression_pct).toBe(0);
    expect(result.quantite_totale_kg).toBe(0);
  });

  it('devrait lever 404 si tournée inexistante', async () => {
    mockTourneeRepo.exists.mockResolvedValue(false);

    await expect(service.getTourneeProgress(99)).rejects.toMatchObject({ statusCode: 404 });
  });
});
