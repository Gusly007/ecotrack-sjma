import { jest } from '@jest/globals';

const mockRecupererClassement = jest.fn();

jest.unstable_mockModule('../../src/services/leaderboard.service.js', () => ({
  recupererClassement: mockRecupererClassement
}));

const { obtenirClassement } = await import('../../src/controllers/classementController.js');

const mockRequest = ({ query = {} } = {}) => ({
  query
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('classementController', () => {
  const next = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renvoie le classement avec la limite demandée', async () => {
    const req = mockRequest({ query: { limite: '5' } });
    const res = mockResponse();
    mockRecupererClassement.mockResolvedValue({ classement: [] });

    await obtenirClassement(req, res, next);

    expect(mockRecupererClassement).toHaveBeenCalledWith({
      limite: 5,
      idUtilisateur: undefined
    });
    expect(res.json).toHaveBeenCalledWith({ classement: [] });
  });
});
