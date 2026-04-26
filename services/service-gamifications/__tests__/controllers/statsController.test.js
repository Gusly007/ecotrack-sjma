import { jest } from '@jest/globals';

const mockRecupererStatsUtilisateur = jest.fn();

jest.unstable_mockModule('../../src/services/stats.service.js', () => ({
  recupererStatsUtilisateur: mockRecupererStatsUtilisateur
}));

const { obtenirStatsUtilisateur } = await import('../../src/controllers/statsController.js');

const mockRequest = ({ params = {} } = {}) => ({
  params
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('statsController', () => {
  const next = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renvoie les statistiques utilisateur', async () => {
    const req = mockRequest({ params: { idUtilisateur: '3' } });
    const res = mockResponse();
    mockRecupererStatsUtilisateur.mockResolvedValue({ totalPoints: 30 });

    await obtenirStatsUtilisateur(req, res, next);

    expect(mockRecupererStatsUtilisateur).toHaveBeenCalledWith({ idUtilisateur: 3 });
    expect(res.json).toHaveBeenCalledWith({ totalPoints: 30 });
  });
});
