const TourneeController = require('../../../src/controllers/tournee-controller');

const mockService = {
  createTournee: jest.fn(),
  getAllTournees: jest.fn(),
  getActiveTournees: jest.fn(),
  getAgentTodayTournee: jest.fn(),
  getTourneeById: jest.fn(),
  updateTournee: jest.fn(),
  updateStatut: jest.fn(),
  deleteTournee: jest.fn(),
  getTourneeEtapes: jest.fn(),
  getTourneeProgress: jest.fn(),
  optimizeTournee: jest.fn(),
  previewOptimization: jest.fn()
};

const mockDb = {};
const controller = new TourneeController(mockService, mockDb);

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

describe('TourneeController.create', () => {
  it('devrait retourner 201 avec la tournée créée', async () => {
    const tournee = { id_tournee: 1 };
    mockService.createTournee.mockResolvedValue(tournee);
    req.body = { date_tournee: '2026-03-15', id_zone: 1 };

    await controller.create(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: tournee })
    );
  });

  it('devrait appeler next en cas d\'erreur', async () => {
    const err = new Error('erreur');
    mockService.createTournee.mockRejectedValue(err);

    await controller.create(req, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('TourneeController.getAll', () => {
  it('devrait retourner 200 avec liste paginée', async () => {
    mockService.getAllTournees.mockResolvedValue({
      tournees: [{ id_tournee: 1 }],
      total: 1,
      page: 1,
      limit: 20
    });
    req.query = { statut: 'PLANIFIEE' };

    await controller.getAll(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, pagination: expect.any(Object) })
    );
  });
});

describe('TourneeController.getActive', () => {
  it('devrait retourner 200 avec tournées actives', async () => {
    mockService.getActiveTournees.mockResolvedValue([{ id_tournee: 1 }]);

    await controller.getActive(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('TourneeController.getMyTournee', () => {
  it('devrait retourner 200 avec la tournée de l\'agent', async () => {
    req.headers['x-user-id'] = '5';
    mockService.getAgentTodayTournee.mockResolvedValue({ id_tournee: 1 });

    await controller.getMyTournee(req, res, next);

    expect(mockService.getAgentTodayTournee).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('devrait retourner 400 si x-user-id manquant', async () => {
    req.headers = {};

    await controller.getMyTournee(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockService.getAgentTodayTournee).not.toHaveBeenCalled();
  });
});

describe('TourneeController.getById', () => {
  it('devrait retourner 200 avec la tournée', async () => {
    mockService.getTourneeById.mockResolvedValue({ id_tournee: 1 });
    req.params = { id: '1' };

    await controller.getById(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('devrait appeler next en cas d\'erreur', async () => {
    mockService.getTourneeById.mockRejectedValue(new Error('404'));
    req.params = { id: '99' };

    await controller.getById(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('TourneeController.update', () => {
  it('devrait retourner 200 avec la tournée mise à jour', async () => {
    mockService.updateTournee.mockResolvedValue({ id_tournee: 1 });
    req.params = { id: '1' };
    req.body = { distance_prevue_km: 10 };

    await controller.update(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('TourneeController.updateStatut', () => {
  it('devrait retourner 200 avec le nouveau statut', async () => {
    mockService.updateStatut.mockResolvedValue({ id_tournee: 1, statut: 'EN_COURS' });
    req.params = { id: '1' };
    req.body = { statut: 'EN_COURS' };

    await controller.updateStatut(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('TourneeController.delete', () => {
  it('devrait retourner 200 avec message de suppression', async () => {
    mockService.deleteTournee.mockResolvedValue(true);
    req.params = { id: '1' };

    await controller.delete(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Tournée supprimée' })
    );
  });
});

describe('TourneeController.getEtapes', () => {
  it('devrait retourner 200 avec les étapes', async () => {
    mockService.getTourneeEtapes.mockResolvedValue([{ sequence: 1 }]);
    req.params = { id: '1' };

    await controller.getEtapes(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('TourneeController.getProgress', () => {
  it('devrait retourner 200 avec la progression', async () => {
    mockService.getTourneeProgress.mockResolvedValue({ progression_pct: 50 });
    req.params = { id: '1' };

    await controller.getProgress(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('TourneeController.optimize', () => {
  it('devrait retourner 201 avec la tournée optimisée', async () => {
    const result = { tournee: { id_tournee: 1 }, optimisation: {} };
    mockService.optimizeTournee.mockResolvedValue(result);
    req.body = { id_zone: 1, date_tournee: '2026-03-15' };

    await controller.optimize(req, res, next);

    expect(mockService.optimizeTournee).toHaveBeenCalledWith(req.body, mockDb);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('TourneeController.previewOptimization', () => {
  it('devrait retourner 200 avec la prévisualisation sans persistance', async () => {
    const preview = {
      optimisation: {
        distance_prevue_km: 12.5,
        duree_prevue_min: 90,
        gain_pct: 18.4,
        nb_conteneurs: 7,
        carburant_prevu_l: 2.1
      },
      etapes_preview: [
        { sequence: 1, id_conteneur: 1, uid: 'C-001', fill_level: 85 }
      ]
    };
    mockService.previewOptimization.mockResolvedValue(preview);
    req.body = {
      id_zone: 1,
      date_tournee: '2026-04-20',
      id_agent: 5,
      id_vehicule: 3,
      seuil_remplissage: 70,
      algorithme: '2opt'
    };

    await controller.previewOptimization(req, res, next);

    expect(mockService.previewOptimization).toHaveBeenCalledWith(req.body, mockDb);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: preview,
        message: 'Prévisualisation de la tournée optimisée'
      })
    );
  });

  it('ne devrait rien persister (pas d\'appel à optimizeTournee)', async () => {
    mockService.previewOptimization.mockResolvedValue({ optimisation: {}, etapes_preview: [] });
    req.body = { id_zone: 1, date_tournee: '2026-04-20', id_agent: 5 };

    await controller.previewOptimization(req, res, next);

    expect(mockService.optimizeTournee).not.toHaveBeenCalled();
    expect(mockService.createTournee).not.toHaveBeenCalled();
  });

  it('devrait appeler next en cas d\'erreur', async () => {
    const err = new Error('Aucun conteneur éligible');
    mockService.previewOptimization.mockRejectedValue(err);
    req.body = { id_zone: 1, date_tournee: '2026-04-20', id_agent: 5 };

    await controller.previewOptimization(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
