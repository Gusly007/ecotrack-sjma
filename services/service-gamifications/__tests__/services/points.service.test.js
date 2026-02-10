import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  default: { query: mockQuery, on: jest.fn(), end: jest.fn() },
  ensureGamificationTables: jest.fn(),
  initGamificationDb: jest.fn()
}));

const { calculerPoints, incrementerPoints } = await import(
  '../../src/services/points.service.js'
);

describe('points.service', () => {
  afterEach(() => jest.clearAllMocks());

  it('calculerPoints utilise les valeurs par défaut', () => {
    expect(calculerPoints('signalement')).toBe(10);
    expect(calculerPoints('defi_reussi')).toBe(50);
    expect(calculerPoints('action_inconnue')).toBe(1);
  });

  it('calculerPoints accepte un points custom positif', () => {
    expect(calculerPoints('signalement', 42)).toBe(42);
  });

  it('calculerPoints ignore les points custom invalides', () => {
    expect(calculerPoints('signalement', 0)).toBe(10);
    expect(calculerPoints('signalement', -2)).toBe(10);
    expect(calculerPoints('signalement', 2.5)).toBe(10);
  });

  it('incrementerPoints cumule les points', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [{ points: 15 }] })
    };

    const total = await incrementerPoints({
      client: mockClient,
      idUtilisateur: 1,
      points: 15
    });

    expect(total).toBe(15);
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE utilisateur SET points'),
      [15, 1]
    );
  });

  it('incrementerPoints rejette un utilisateur introuvable', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] })
    };

    await expect(
      incrementerPoints({ client: mockClient, idUtilisateur: 999, points: 10 })
    ).rejects.toThrow('Utilisateur introuvable');
  });
});
