const express = require('express');
const request = require('supertest');
const tourneeRoutes = require('../../src/routes/tournee.route');
const collecteRoutes = require('../../src/routes/collecte.route');
const statsRoutes = require('../../src/routes/stats.route');
const { anomalieSchema, validateSchema } = require('../../src/validators/tournee.validator');
const TourneeController = require('../../src/controllers/tournee-controller');
const CollecteController = require('../../src/controllers/collecte-controller');
const TourneeService = require('../../src/services/tournee-service');
const CollecteService = require('../../src/services/collecte-service');
const rateLimit = require('express-rate-limit');

jest.mock('../../src/services/cacheService', () => ({
  del: jest.fn(),
  invalidatePattern: jest.fn(),
}));

/**
 * Tests d'intégration des endpoints utilisés par le mobile agent.
 * Couvre :
 *   - GET  /api/V1/routes/my-tournee  (agent's today route)
 *   - POST /api/V1/routes/tournees/:id/anomalie  (payload mobile)
 *   - GET  /api/V1/routes/stats/agent  (filtré par x-user-id)
 */
describe('Mobile Agent endpoints — integration', () => {
  let app;
  let tourneeController;
  let collecteController;
  let statsController;

  beforeEach(() => {
    tourneeController = {
      getMyTournee: jest.fn((req, res) => {
        const agentId = parseInt(req.headers['x-user-id'], 10);
        if (!agentId) return res.status(400).json({ message: 'Identifiant agent manquant' });
        return res.status(200).json({
          data: { id_tournee: 12, statut: 'PLANIFIEE', id_agent: agentId, etapes: [] },
        });
      }),
      // Stubs pour les autres routes
      create: jest.fn((req, res) => res.status(201).json({})),
      getAll: jest.fn((req, res) => res.status(200).json({})),
      getActive: jest.fn((req, res) => res.status(200).json({})),
      getById: jest.fn((req, res) => res.status(200).json({})),
      update: jest.fn((req, res) => res.status(200).json({})),
      updateStatut: jest.fn((req, res) => res.status(200).json({})),
      delete: jest.fn((req, res) => res.status(200).json({})),
      getEtapes: jest.fn((req, res) => res.status(200).json({})),
      getProgress: jest.fn((req, res) => res.status(200).json({})),
      optimize: jest.fn((req, res) => res.status(200).json({})),
    };

    collecteController = {
      record: jest.fn((req, res) => res.status(201).json({ data: { id_collecte: 1 } })),
      reportAnomalie: jest.fn((req, res) => {
        const agentId = parseInt(req.headers['x-user-id'], 10);
        if (!agentId) return res.status(400).json({ message: 'Identifiant agent manquant' });
        try {
          const validated = validateSchema(anomalieSchema, req.body);
          return res.status(201).json({ data: { id_signalement: 99, ...validated, agentId } });
        } catch (err) {
          return res.status(err.statusCode || 400).json({ message: err.message });
        }
      }),
      getCollectesByTournee: jest.fn((req, res) => res.status(200).json({})),
      getAnomaliesByTournee: jest.fn((req, res) => res.status(200).json({ data: [] })),
    };

    statsController = {
      getDashboard: jest.fn((req, res) => res.status(200).json({})),
      getKpis: jest.fn((req, res) => res.status(200).json({})),
      getCollecteStats: jest.fn((req, res) => res.status(200).json({})),
      getAlgorithmComparison: jest.fn((req, res) => res.status(200).json({})),
      getAgentStats: jest.fn((req, res) => {
        const agentId = parseInt(req.headers['x-user-id'], 10);
        if (!agentId) return res.status(400).json({ message: 'Identifiant agent manquant' });
        const period = req.query.period || 'mois';
        return res.status(200).json({
          data: {
            period,
            total_tournees: 3,
            total_collectes: 12,
            total_kg: 145.5,
            distance_totale_km: 28.7,
            taux_reussite_pct: 91.66,
            total_anomalies: 1,
            co2_economise_kg: 7.75,
          },
        });
      }),
    };

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.controllers = {
        tournee: tourneeController,
        collecte: collecteController,
        stats: statsController,
      };
      next();
    });
    app.use('/api/V1/routes', tourneeRoutes);
    app.use('/api/V1/routes', collecteRoutes);
    app.use('/api/V1/routes', statsRoutes);
  });

  describe('GET /api/V1/routes/my-tournee', () => {
    it('renvoie 200 avec la tournée du jour pour un agent valide', async () => {
      const res = await request(app)
        .get('/api/V1/routes/my-tournee')
        .set('x-user-id', '5')
        .set('x-user-role', 'AGENT');

      expect(res.status).toBe(200);
      expect(res.body.data.id_agent).toBe(5);
    });

    it('renvoie 400 si x-user-id manquant', async () => {
      const res = await request(app)
        .get('/api/V1/routes/my-tournee')
        .set('x-user-role', 'AGENT');

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/V1/routes/tournees/:id/anomalie', () => {
    it('accepte le payload mobile avec type_anomalie + id_conteneur', async () => {
      const res = await request(app)
        .post('/api/V1/routes/tournees/12/anomalie')
        .set('x-user-id', '5')
        .set('x-user-role', 'AGENT')
        .send({
          id_conteneur: 3,
          type_anomalie: 'CONTENEUR_INACCESSIBLE',
          description: 'Voiture mal garee bloque l acces',
          gravite: 'Moyenne',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        id_conteneur: 3,
        type_anomalie: 'CONTENEUR_INACCESSIBLE',
      });
    });

    it('rejette le payload sans id_conteneur', async () => {
      const res = await request(app)
        .post('/api/V1/routes/tournees/12/anomalie')
        .set('x-user-id', '5')
        .set('x-user-role', 'AGENT')
        .send({
          type_anomalie: 'CONTENEUR_INACCESSIBLE',
          description: 'test',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/conteneur/i);
    });

    it('rejette un type_anomalie invalide', async () => {
      const res = await request(app)
        .post('/api/V1/routes/tournees/12/anomalie')
        .set('x-user-id', '5')
        .set('x-user-role', 'AGENT')
        .send({
          id_conteneur: 3,
          type_anomalie: 'AUTRE',
          description: 'test',
        });

      expect(res.status).toBe(400);
    });

    it('accepte les nouveaux types CONTENEUR_PLEIN et MAUVAISE_ODEUR', async () => {
      const res1 = await request(app)
        .post('/api/V1/routes/tournees/12/anomalie')
        .set('x-user-id', '5')
        .set('x-user-role', 'AGENT')
        .send({
          id_conteneur: 3,
          type_anomalie: 'CONTENEUR_PLEIN',
          description: 'depasse',
        });
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post('/api/V1/routes/tournees/12/anomalie')
        .set('x-user-id', '5')
        .set('x-user-role', 'AGENT')
        .send({
          id_conteneur: 3,
          type_anomalie: 'MAUVAISE_ODEUR',
          description: 'forte',
        });
      expect(res2.status).toBe(201);
    });
  });

  describe('GET /api/V1/routes/stats/agent', () => {
    it('renvoie les stats agent filtrées par x-user-id', async () => {
      const res = await request(app)
        .get('/api/V1/routes/stats/agent')
        .set('x-user-id', '5')
        .set('x-user-role', 'AGENT');

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        period: 'mois',
        total_tournees: 3,
        total_collectes: 12,
      });
    });

    it('accepte le query param period', async () => {
      const res = await request(app)
        .get('/api/V1/routes/stats/agent?period=semaine')
        .set('x-user-id', '5')
        .set('x-user-role', 'AGENT');

      expect(res.status).toBe(200);
      expect(res.body.data.period).toBe('semaine');
    });

    it('renvoie 400 sans x-user-id', async () => {
      const res = await request(app).get('/api/V1/routes/stats/agent').set('x-user-role', 'AGENT');
      expect(res.status).toBe(400);
    });
  });
});

describe('SCRUM-9 — autorisations des opérations Agent', () => {
  const endpoints = [
    ['post', '/tournees/1/collecte', ['AGENT', 'GESTIONNAIRE', 'ADMIN']],
    ['post', '/tournees/1/anomalie', ['AGENT', 'GESTIONNAIRE', 'ADMIN']],
    ['get', '/tournees/1/collectes', ['AGENT', 'GESTIONNAIRE', 'ADMIN']],
    ['get', '/tournees/1/anomalies', ['AGENT', 'GESTIONNAIRE', 'ADMIN']],
    ['get', '/stats/agent', ['AGENT', 'GESTIONNAIRE', 'ADMIN']],
    ['post', '/optimize', ['GESTIONNAIRE', 'ADMIN']],
  ];
  let app;
  let handler;

  beforeEach(() => {
    handler = jest.fn((req, res) => res.status(200).json({ ok: true }));
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.controllers = {
        collecte: { recordCollecte: handler, reportAnomalie: handler, getCollectesByTournee: handler, getAnomaliesByTournee: handler },
        stats: { getAgentStats: handler },
        tournee: { optimize: handler },
      };
      next();
    });
    app.use(collecteRoutes, statsRoutes, tourneeRoutes);
  });

  describe.each(endpoints)('%s %s', (method, url, allowed) => {
    it('refuse une requête sans identité transmise par le gateway', async () => {
      const response = await request(app)[method](url).send({});
      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    it.each(['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'])('contrôle le rôle %s', async (role) => {
      const response = await request(app)[method](url)
        .set('x-user-role', role).set('x-user-id', '10').send({});
      const authorized = allowed.includes(role);
      expect(response.status).toBe(authorized ? 200 : 403);
      expect(handler).toHaveBeenCalledTimes(authorized ? 1 : 0);
    });
  });

  it('expose une seule route GET /stats/agent', () => {
    const routes = statsRoutes.stack.filter(layer => layer.route?.path === '/stats/agent' && layer.route.methods.get);
    expect(routes).toHaveLength(1);
  });
});

describe('SCRUM-9 — accès aux tournées selon leur affectation', () => {
  let app;
  let tourneeRepo;
  let collecteRepo;
  let authenticatedUser;
  const endpoints = [
    ['patch', '/tournees/12', { distance_prevue_km: 10 }, 'update'],
    ['patch', '/tournees/12/statut', { statut: 'ANNULEE' }, 'updateStatut'],
    ['get', '/tournees/12/collectes', {}, 'findByTournee'],
    ['get', '/tournees/12/anomalies', {}, 'findAnomaliesByTournee'],
  ];

  beforeEach(() => {
    authenticatedUser = undefined;
    tourneeRepo = {
      findById: jest.fn().mockResolvedValue({ id_tournee: 12, id_agent: 5, statut: 'PLANIFIEE' }),
      exists: jest.fn().mockResolvedValue(true),
      update: jest.fn().mockResolvedValue({ id_tournee: 12, distance_prevue_km: 10 }),
      updateStatut: jest.fn().mockResolvedValue({ id_tournee: 12, statut: 'ANNULEE' }),
    };
    collecteRepo = {
      findByTournee: jest.fn().mockResolvedValue([{ id_collecte: 1 }]),
      findAnomaliesByTournee: jest.fn().mockResolvedValue([{ id_signalement: 1 }]),
    };
    const controllers = {
      tournee: new TourneeController(new TourneeService(tourneeRepo, collecteRepo)),
      collecte: new CollecteController(new CollecteService(collecteRepo, tourneeRepo)),
    };
    app = express();
    app.use(rateLimit({ windowMs: 60000, limit: 1000 }));
    app.use(express.json());
    app.use((req, res, next) => {
      req.user = authenticatedUser;
      req.controllers = controllers;
      next();
    });
    app.use(tourneeRoutes, collecteRoutes);
    app.use((err, req, res, next) => {
      if (res.headersSent) return next(err);
      res.status(err.statusCode || 500).json({ message: err.message });
    });
  });

  describe.each(endpoints)('%s %s', (method, url, body, repositoryMethod) => {
    it.each([
      ['AGENT', '5', 200],
      ['AGENT', '6', 403],
      ['AGENT', '', 403],
      ['AGENT', 'invalid', 403],
      ['AGENT', '0', 403],
      ['AGENT', '-1', 403],
      ['GESTIONNAIRE', '7', 200],
      ['ADMIN', '8', 200],
      ['CITOYEN', '9', 403],
    ])('contrôle le rôle %s et l’identité %s', async (role, id, expectedStatus) => {
      const response = await request(app)[method](url)
        .set('x-user-role', role).set('x-user-id', id).send(body);
      expect(response.status).toBe(expectedStatus);
      const operation = tourneeRepo[repositoryMethod] || collecteRepo[repositoryMethod];
      expect(operation).toHaveBeenCalledTimes(expectedStatus === 200 ? 1 : 0);
      if (expectedStatus === 403) {
        expect(tourneeRepo.update).not.toHaveBeenCalled();
        expect(tourneeRepo.updateStatut).not.toHaveBeenCalled();
        expect(collecteRepo.findByTournee).not.toHaveBeenCalled();
        expect(collecteRepo.findAnomaliesByTournee).not.toHaveBeenCalled();
      }
    });

    it('utilise req.user lorsqu’une identité authentifiée est déjà présente', async () => {
      authenticatedUser = { id: 6, role: 'AGENT' };
      const response = await request(app)[method](url)
        .set('x-user-role', 'ADMIN').set('x-user-id', '5').send(body);
      expect(response.status).toBe(403);
      expect(tourneeRepo[repositoryMethod] || collecteRepo[repositoryMethod]).not.toHaveBeenCalled();
    });

    it('renvoie 404 pour une tournée inexistante', async () => {
      tourneeRepo.findById.mockResolvedValue(null);
      tourneeRepo.exists.mockResolvedValue(false);
      const response = await request(app)[method](url)
        .set('x-user-role', 'AGENT').set('x-user-id', '5').send(body);
      expect(response.status).toBe(404);
      expect(tourneeRepo[repositoryMethod] || collecteRepo[repositoryMethod]).not.toHaveBeenCalled();
    });
  });

  it.each(['EN_COURS', 'TERMINEE'])('refuse le statut %s au gestionnaire', async (statut) => {
    const response = await request(app).patch('/tournees/12/statut')
      .set('x-user-role', 'GESTIONNAIRE').set('x-user-id', '7').send({ statut });
    expect(response.status).toBe(403);
    expect(tourneeRepo.updateStatut).not.toHaveBeenCalled();
  });

  it.each(['AGENT', 'ADMIN'])('autorise %s à terminer une tournée accessible', async (role) => {
    const response = await request(app).patch('/tournees/12/statut')
      .set('x-user-role', role).set('x-user-id', '5').send({ statut: 'TERMINEE' });
    expect(response.status).toBe(200);
    expect(tourneeRepo.updateStatut).toHaveBeenCalledWith('12', 'TERMINEE');
  });
});
