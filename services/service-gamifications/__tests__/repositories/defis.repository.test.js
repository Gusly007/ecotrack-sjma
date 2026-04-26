import { jest } from '@jest/globals';

const mockQuery = jest.fn();
jest.unstable_mockModule('../../src/config/database.js', () => ({
  __esModule: true,
  default: { query: mockQuery }
}));

describe('DefisRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creerDefi should insert and return defi', async () => {
    jest.resetModules();
    const { DefisRepository } = await import('../../src/repositories/defis.repository.js');
    const defi = { titre: 'T', description: 'D', objectif: 1, recompensePoints: 10, dateDebut: '2026-01-01', dateFin: '2026-01-31', typeDefi: 'INDIVIDUEL' };
    const dbDefi = { ...defi, id_defi: 1 };
    mockQuery.mockResolvedValue({ rows: [dbDefi] });
    const result = await DefisRepository.creerDefi(defi);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO gamification_defi'), expect.any(Array));
    expect(result).toEqual(dbDefi);
  });

  it('listerDefis should select all defis', async () => {
    jest.resetModules();
    const { DefisRepository } = await import('../../src/repositories/defis.repository.js');
    const defi = { id_defi: 1, titre: 'T' };
    mockQuery.mockResolvedValue({ rows: [defi] });
    const result = await DefisRepository.listerDefis();
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM gamification_defi'));
    expect(result).toEqual([defi]);
  });

  it('creerParticipation should insert and return participation', async () => {
    jest.resetModules();
    const { DefisRepository } = await import('../../src/repositories/defis.repository.js');
    const participation = { idDefi: 1, idUtilisateur: 2 };
    const dbParticipation = { ...participation, id_participation: 1 };
    mockQuery.mockResolvedValue({ rows: [dbParticipation] });
    const result = await DefisRepository.creerParticipation(participation);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO gamification_participation_defi'), [1, 2]);
    expect(result).toEqual(dbParticipation);
  });

  it('mettreAJourProgression should update and return participation', async () => {
    jest.resetModules();
    const { DefisRepository } = await import('../../src/repositories/defis.repository.js');
    const update = { idDefi: 1, idUtilisateur: 2, progression: 50, statut: 'EN_COURS' };
    const dbParticipation = { ...update, id_participation: 1 };
    mockQuery.mockResolvedValue({ rows: [dbParticipation] });
    const result = await DefisRepository.mettreAJourProgression(update);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('UPDATE gamification_participation_defi'), [50, 'EN_COURS', 1, 2]);
    expect(result).toEqual(dbParticipation);
  });
});
