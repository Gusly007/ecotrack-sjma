import { jest } from '@jest/globals';

const mockEnregistrerAction = jest.fn();

jest.unstable_mockModule('../../src/services/gamificationService.js', () => ({
  enregistrerAction: mockEnregistrerAction
}));

const { enregistrerAction } = await import('../../src/controllers/actionsController.js');

const mockRequest = (body = {}) => ({
  body
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('actionsController', () => {
  const next = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renvoie 201 avec les points et badges', async () => {
    const req = mockRequest({
      id_utilisateur: 1,
      type_action: 'signalement'
    });
    const res = mockResponse();
    mockEnregistrerAction.mockResolvedValue({
      pointsAjoutes: 10,
      totalPoints: 110,
      nouveauxBadges: [{ code: 'DEBUTANT' }]
    });

    await enregistrerAction(req, res, next);

    expect(mockEnregistrerAction).toHaveBeenCalledWith({
      idUtilisateur: 1,
      typeAction: 'signalement',
      pointsCustom: undefined
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        pointsAjoutes: 10,
        totalPoints: 110
      })
    );
  });

  it('passe l\'erreur Zod à next si payload invalide', async () => {
    const req = mockRequest({
      id_utilisateur: 1
    });
    const res = mockResponse();

    await enregistrerAction(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].name).toBe('ZodError');
  });

  it('passe l\'erreur métier à next si utilisateur introuvable', async () => {
    const req = mockRequest({
      id_utilisateur: 999,
      type_action: 'collecte'
    });
    const res = mockResponse();
    const error = new Error('Utilisateur introuvable');
    error.status = 400;
    mockEnregistrerAction.mockRejectedValue(error);

    await enregistrerAction(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
