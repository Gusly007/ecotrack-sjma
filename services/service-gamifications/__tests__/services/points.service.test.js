import { jest } from '@jest/globals';

const mockPool = {
  query: jest.fn(),
  end: jest.fn(),
  on: jest.fn()
};

jest.unstable_mockModule('pg', () => ({
  default: {
    Pool: jest.fn(() => mockPool)
  },
  Pool: jest.fn(() => mockPool)
}));

const { calculerPoints, incrementerPoints } = await import('../../src/services/points.service.js');

describe('points.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
    mockPool.query.mockResolvedValueOnce({
      rows: [{ points: 15 }]
    });

    const total = await incrementerPoints({
      client: mockPool,
      idUtilisateur: 1,
      points: 15
    });

    expect(total).toBe(15);
  });

  it('incrementerPoints rejette un utilisateur introuvable', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: []
    });

    await expect(
      incrementerPoints({
        client: mockPool,
        idUtilisateur: 999,
        points: 10
      })
    ).rejects.toThrow('Utilisateur introuvable');
  });
});
