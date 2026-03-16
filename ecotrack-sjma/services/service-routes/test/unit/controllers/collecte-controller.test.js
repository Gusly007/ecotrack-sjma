const CollecteController = require('../../../src/controllers/collecte-controller');

const mockService = {
  recordCollecte: jest.fn(),
  reportAnomalie: jest.fn(),
  getCollectesByTournee: jest.fn(),
  getAnomaliesByTournee: jest.fn()
};

const controller = new CollecteController(mockService);

let req, res, next;

beforeEach(() => {
  jest.clearAllMocks();
  req = { body: {}, params: {}, query: {}, headers: {} };
  res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
  next = jest.fn();
});

describe('CollecteController.recordCollecte', () => {
  it('devrait retourner 201 avec le résultat de la collecte', async () => {
    const result = { collecte: { id_collecte: 1 }, tournee_terminee: false };
    mockService.recordCollecte.mockResolvedValue(result);
    req.params = { id: '1' };
    req.headers['x-user-id'] = '10';
    req.body = { id_conteneur: 1, quantite_kg: 50 };

    await controller.recordCollecte(req, res, next);

    expect(mockService.recordCollecte).toHaveBeenCalledWith('1', req.body, 10);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: result })
    );
  });

  it('devrait passer agentId null si x-user-id absent', async () => {
    mockService.recordCollecte.mockResolvedValue({ collecte: {}, tournee_terminee: false });
    req.params = { id: '1' };
    req.headers = {};

    await controller.recordCollecte(req, res, next);
    expect(mockService.recordCollecte).toHaveBeenCalledWith('1', expect.anything(), null);
  });

  it('devrait appeler next en cas d\'erreur', async () => {
    const err = new Error('erreur');
    mockService.recordCollecte.mockRejectedValue(err);
    req.params = { id: '1' };

    await controller.recordCollecte(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('CollecteController.reportAnomalie', () => {
  it('devrait retourner 201 avec le signalement', async () => {
    mockService.reportAnomalie.mockResolvedValue({ id_signalement: 1 });
    req.params = { id: '1' };
    req.headers['x-user-id'] = '10';
    req.body = { id_conteneur: 1, type_anomalie: 'CONTENEUR_ENDOMMAGE' };

    await controller.reportAnomalie(req, res, next);

    expect(mockService.reportAnomalie).toHaveBeenCalledWith('1', req.body, 10);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('devrait retourner 400 si x-user-id absent', async () => {
    req.params = { id: '1' };
    req.headers = {};

    await controller.reportAnomalie(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockService.reportAnomalie).not.toHaveBeenCalled();
  });

  it('devrait appeler next en cas d\'erreur', async () => {
    const err = new Error('erreur');
    mockService.reportAnomalie.mockRejectedValue(err);
    req.params = { id: '1' };
    req.headers['x-user-id'] = '10';

    await controller.reportAnomalie(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('CollecteController.getCollectesByTournee', () => {
  it('devrait retourner 200 avec les collectes', async () => {
    mockService.getCollectesByTournee.mockResolvedValue([{ id_collecte: 1 }]);
    req.params = { id: '1' };

    await controller.getCollectesByTournee(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it('devrait appeler next en cas d\'erreur', async () => {
    mockService.getCollectesByTournee.mockRejectedValue(new Error('404'));
    req.params = { id: '99' };

    await controller.getCollectesByTournee(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('CollecteController.getAnomaliesByTournee', () => {
  it('devrait retourner 200 avec les anomalies', async () => {
    mockService.getAnomaliesByTournee.mockResolvedValue([{ id_signalement: 1 }]);
    req.params = { id: '1' };

    await controller.getAnomaliesByTournee(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('devrait appeler next en cas d\'erreur', async () => {
    mockService.getAnomaliesByTournee.mockRejectedValue(new Error('404'));
    req.params = { id: '99' };

    await controller.getAnomaliesByTournee(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
