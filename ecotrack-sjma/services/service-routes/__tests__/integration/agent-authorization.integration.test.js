const express = require('express');
const request = require('supertest');
const collecteRoutes = require('../../src/routes/collecte.route');
const statsRoutes = require('../../src/routes/stats.route');
const tourneeRoutes = require('../../src/routes/tournee.route');

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
