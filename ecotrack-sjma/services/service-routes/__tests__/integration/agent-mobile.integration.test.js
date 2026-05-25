const express = require('express');
const request = require('supertest');
const tourneeRoutes = require('../../src/routes/tournee.route');
const collecteRoutes = require('../../src/routes/collecte.route');
const statsRoutes = require('../../src/routes/stats.route');
const { anomalieSchema, validateSchema } = require('../../src/validators/tournee.validator');

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
        .send({
          id_conteneur: 3,
          type_anomalie: 'CONTENEUR_PLEIN',
          description: 'depasse',
        });
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post('/api/V1/routes/tournees/12/anomalie')
        .set('x-user-id', '5')
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
        .set('x-user-id', '5');

      expect(res.status).toBe(200);
      expect(res.body.data.period).toBe('semaine');
    });

    it('renvoie 400 sans x-user-id', async () => {
      const res = await request(app).get('/api/V1/routes/stats/agent');
      expect(res.status).toBe(400);
    });
  });
});
