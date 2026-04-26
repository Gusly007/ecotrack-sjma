import { jest } from '@jest/globals';

const mockListerBadges = jest.fn();
const mockListerBadgesUtilisateur = jest.fn();

jest.unstable_mockModule('../../src/services/badges.service.js', () => ({
  listerBadges: mockListerBadges,
  listerBadgesUtilisateur: mockListerBadgesUtilisateur
}));

const { obtenirBadges, obtenirBadgesUtilisateur } = await import('../../src/controllers/badgesController.js');

const mockRequest = ({ params = {}, query = {} } = {}) => ({
  params,
  query
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('badgesController', () => {
  const next = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renvoie le catalogue des badges', async () => {
    const req = mockRequest();
    const res = mockResponse();
    mockListerBadges.mockResolvedValue([{ code: 'DEBUTANT' }]);

    await obtenirBadges(req, res, next);

    expect(res.json).toHaveBeenCalledWith([{ code: 'DEBUTANT' }]);
  });

  it('renvoie les badges d\'un utilisateur', async () => {
    const req = mockRequest({ params: { idUtilisateur: '2' } });
    const res = mockResponse();
    mockListerBadgesUtilisateur.mockResolvedValue([{ code: 'DEBUTANT' }]);

    await obtenirBadgesUtilisateur(req, res, next);

    expect(mockListerBadgesUtilisateur).toHaveBeenCalledWith(2);
    expect(res.json).toHaveBeenCalledWith([{ code: 'DEBUTANT' }]);
  });
});
