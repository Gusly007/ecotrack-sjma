const CollecteService = require('../../../src/services/collecte-service');

const mockCollecteRepo = {
  recordCollecte: jest.fn(),
  reportAnomalie: jest.fn(),
  findByTournee: jest.fn(),
  findAnomaliesByTournee: jest.fn(),
  getTourneeProgress: jest.fn()
};

const mockTourneeRepo = {
  findById: jest.fn(),
  exists: jest.fn(),
  updateStatut: jest.fn()
};

const service = new CollecteService(mockCollecteRepo, mockTourneeRepo);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CollecteService.recordCollecte', () => {
  const validData = { id_conteneur: 1, quantite_kg: 50 };
  const tourneeEnCours = { id_tournee: 1, statut: 'EN_COURS', id_agent: 10 };

  it('devrait enregistrer une collecte pour une tournée EN_COURS', async () => {
    mockTourneeRepo.findById.mockResolvedValue(tourneeEnCours);
    mockCollecteRepo.recordCollecte.mockResolvedValue({ id_collecte: 1 });
    mockCollecteRepo.getTourneeProgress.mockResolvedValue({
      total_etapes: '5',
      etapes_collectees: '3'
    });

    const result = await service.recordCollecte(1, validData, 10);
    expect(mockCollecteRepo.recordCollecte).toHaveBeenCalledWith(1, 1, 50);
    expect(result.collecte).toEqual({ id_collecte: 1 });
    expect(result.tournee_terminee).toBe(false);
    expect(result.progression.total).toBe(5);
    expect(result.progression.collectees).toBe(3);
  });

  it('devrait lever 404 si tournée introuvable', async () => {
    mockTourneeRepo.findById.mockResolvedValue(null);

    await expect(service.recordCollecte(99, validData, 10)).rejects.toMatchObject({
      statusCode: 404
    });
  });

  it('devrait lever 400 si tournée pas EN_COURS', async () => {
    mockTourneeRepo.findById.mockResolvedValue({ ...tourneeEnCours, statut: 'PLANIFIEE' });

    await expect(service.recordCollecte(1, validData, 10)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('EN_COURS')
    });
  });

  it('devrait lever 400 si agent non assigné', async () => {
    mockTourneeRepo.findById.mockResolvedValue(tourneeEnCours);

    await expect(service.recordCollecte(1, validData, 99)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('assigné')
    });
  });

  it('devrait terminer la tournée si toutes les étapes sont collectées', async () => {
    mockTourneeRepo.findById.mockResolvedValue(tourneeEnCours);
    mockCollecteRepo.recordCollecte.mockResolvedValue({ id_collecte: 1 });
    mockCollecteRepo.getTourneeProgress.mockResolvedValue({
      total_etapes: '3',
      etapes_collectees: '3'
    });
    mockTourneeRepo.updateStatut.mockResolvedValue({});

    const result = await service.recordCollecte(1, validData, 10);
    expect(result.tournee_terminee).toBe(true);
    expect(mockTourneeRepo.updateStatut).toHaveBeenCalledWith(1, 'TERMINEE');
  });

  it('ne devrait pas terminer si total_etapes = 0', async () => {
    mockTourneeRepo.findById.mockResolvedValue(tourneeEnCours);
    mockCollecteRepo.recordCollecte.mockResolvedValue({ id_collecte: 1 });
    mockCollecteRepo.getTourneeProgress.mockResolvedValue({
      total_etapes: '0',
      etapes_collectees: '0'
    });

    const result = await service.recordCollecte(1, validData, 10);
    expect(result.tournee_terminee).toBe(false);
    expect(mockTourneeRepo.updateStatut).not.toHaveBeenCalled();
  });

  it('devrait autoriser si agentId est null (pas de vérification)', async () => {
    mockTourneeRepo.findById.mockResolvedValue(tourneeEnCours);
    mockCollecteRepo.recordCollecte.mockResolvedValue({ id_collecte: 1 });
    mockCollecteRepo.getTourneeProgress.mockResolvedValue({
      total_etapes: '5',
      etapes_collectees: '1'
    });

    const result = await service.recordCollecte(1, validData, null);
    expect(result.collecte).toEqual({ id_collecte: 1 });
  });
});

describe('CollecteService.reportAnomalie', () => {
  const validData = {
    id_conteneur: 1,
    type_anomalie: 'CONTENEUR_ENDOMMAGE',
    description: 'Couvercle cassé'
  };

  it('devrait signaler une anomalie pour une tournée EN_COURS', async () => {
    mockTourneeRepo.findById.mockResolvedValue({ id_tournee: 1, statut: 'EN_COURS' });
    mockCollecteRepo.reportAnomalie.mockResolvedValue({ id_signalement: 1 });

    const result = await service.reportAnomalie(1, validData, 10);
    expect(result).toEqual({ id_signalement: 1 });
    expect(mockCollecteRepo.reportAnomalie).toHaveBeenCalledWith(
      1, 1, 10, 'CONTENEUR_ENDOMMAGE', 'Couvercle cassé'
    );
  });

  it('devrait signaler pour une tournée PLANIFIEE', async () => {
    mockTourneeRepo.findById.mockResolvedValue({ id_tournee: 1, statut: 'PLANIFIEE' });
    mockCollecteRepo.reportAnomalie.mockResolvedValue({ id_signalement: 2 });

    const result = await service.reportAnomalie(1, validData, 10);
    expect(result).toEqual({ id_signalement: 2 });
  });

  it('devrait lever 404 si tournée introuvable', async () => {
    mockTourneeRepo.findById.mockResolvedValue(null);

    await expect(service.reportAnomalie(99, validData, 10)).rejects.toMatchObject({
      statusCode: 404
    });
  });

  it('devrait lever 400 si tournée TERMINEE', async () => {
    mockTourneeRepo.findById.mockResolvedValue({ id_tournee: 1, statut: 'TERMINEE' });

    await expect(service.reportAnomalie(1, validData, 10)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('EN_COURS')
    });
  });
});

describe('CollecteService.getCollectesByTournee', () => {
  it('devrait retourner les collectes si la tournée existe', async () => {
    mockTourneeRepo.exists.mockResolvedValue(true);
    mockCollecteRepo.findByTournee.mockResolvedValue([{ id_collecte: 1 }]);

    const result = await service.getCollectesByTournee(1);
    expect(result).toEqual([{ id_collecte: 1 }]);
  });

  it('devrait lever 404 si tournée inexistante', async () => {
    mockTourneeRepo.exists.mockResolvedValue(false);

    await expect(service.getCollectesByTournee(99)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('CollecteService.getAnomaliesByTournee', () => {
  it('devrait retourner les anomalies si la tournée existe', async () => {
    mockTourneeRepo.exists.mockResolvedValue(true);
    mockCollecteRepo.findAnomaliesByTournee.mockResolvedValue([{ id_signalement: 1 }]);

    const result = await service.getAnomaliesByTournee(1);
    expect(result).toEqual([{ id_signalement: 1 }]);
  });

  it('devrait lever 404 si tournée inexistante', async () => {
    mockTourneeRepo.exists.mockResolvedValue(false);

    await expect(service.getAnomaliesByTournee(99)).rejects.toMatchObject({ statusCode: 404 });
  });
});
