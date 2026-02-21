/**
 * Tests Intégration COMPLETS - Container Routes
 * Utilise la vraie base de données de test
 * Teste le flux complet: Route → Contrôleur → Service → Base de données
 */

const request = require('supertest');
const express = require('express');
const containerRoute = require('../../src/routes/container.route');
const { pool } = require('../../src/db/connexion');

describe('Container Routes - Full Integration Tests (Real Database)', () => {
  let app;
  let testZoneId1;
  let testZoneId2;
  let testTypeId;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Mock du middleware socket
    app.use((req, res, next) => {
      req.socketService = null;
      next();
    });
    
    // Utiliser les vraies routes
    app.use('/api', containerRoute);
    
    // Error handler
    app.use((err, req, res, next) => {
      console.error('Test error:', err);
      res.status(err.statusCode || 500).json({
        success: false,
        statusCode: err.statusCode || 500,
        message: err.message
      });
    });

    // Créer les données de test nécessaires (zones et types)
    // Créer un type de conteneur
    const typeResult = await pool.query(
      `INSERT INTO type_conteneur (code, nom)
       VALUES ('TEST', 'ORDURE')
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom
       RETURNING id_type`
    );
    testTypeId = typeResult.rows[0].id_type;

    // Créer deux zones de test
    const zone1Result = await pool.query(
      `INSERT INTO zone (code, nom, population, superficie_km2, geom)
       VALUES ('TEST1', 'Zone Test 1', 1000, 10.5, ST_GeomFromText('POLYGON((2.3 48.8, 2.4 48.8, 2.4 48.9, 2.3 48.9, 2.3 48.8))', 4326))
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom
       RETURNING id_zone`
    );
    testZoneId1 = zone1Result.rows[0].id_zone;

    const zone2Result = await pool.query(
      `INSERT INTO zone (code, nom, population, superficie_km2, geom)
       VALUES ('TEST2', 'Zone Test 2', 2000, 15.0, ST_GeomFromText('POLYGON((2.4 48.8, 2.5 48.8, 2.5 48.9, 2.4 48.9, 2.4 48.8))', 4326))
       ON CONFLICT (code) DO UPDATE SET nom = EXCLUDED.nom
       RETURNING id_zone`
    );
    testZoneId2 = zone2Result.rows[0].id_zone;
  });

  beforeEach(async () => {
    // Nettoyer les données de test avant chaque test
    // Supprimer les enregistrements d'historique d'abord (contrainte FK)
    await pool.query('DELETE FROM historique_statut WHERE type_entite = $1', ['CONTENEUR']);
    // Puis supprimer les conteneurs de test
    await pool.query('DELETE FROM conteneur WHERE uid LIKE $1', ['CNT-TEST%']);
  });

  afterAll(async () => {
    // Nettoyer après tous les tests
    await pool.query('DELETE FROM historique_statut WHERE type_entite = $1', ['CONTENEUR']);
    await pool.query('DELETE FROM conteneur WHERE uid LIKE $1', ['CNT-TEST%']);
    await pool.query('DELETE FROM zone WHERE code LIKE $1', ['TEST%']);
    await pool.query('DELETE FROM type_conteneur WHERE code = $1', ['TEST']);
    // Fermer la connexion
    await pool.end();
  });

  describe('POST /api/containers', () => {
    it('devrait créer un nouveau conteneur en base de données', async () => {
      const newContainer = {
        capacite_l: 1200,
        statut: 'ACTIF',
        latitude: 48.8566,
        longitude: 2.3522,
        id_zone: testZoneId1,
        id_type: testTypeId
      };

      const response = await request(app)
        .post('/api/containers')
        .send(newContainer)
        .expect(201);

      // Vérifier la réponse
      expect(response.body).toHaveProperty('id_conteneur');
      expect(response.body).toHaveProperty('uid');
      expect(response.body.capacite_l).toBe(1200);
      expect(response.body.statut).toBe('ACTIF');

      // Vérifier que c'est vraiment en BD
      const result = await pool.query(
        'SELECT * FROM conteneur WHERE id_conteneur = $1',
        [response.body.id_conteneur]
      );
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].capacite_l).toBe(1200);
      expect(result.rows[0].statut).toBe('ACTIF');
    });

    it('devrait rejeter un conteneur avec données invalides', async () => {
      const invalidContainer = {
        capacite_l: -100, // Capacité négative invalide
        statut: 'ACTIF'
        // latitude et longitude manquantes
      };

      await request(app)
        .post('/api/containers')
        .send(invalidContainer)
        .expect(400);

      // Vérifier qu'aucun conteneur n'a été créé
      const result = await pool.query('SELECT COUNT(*) FROM conteneur WHERE capacite_l = $1', [-100]);
      expect(parseInt(result.rows[0].count)).toBe(0);
    });

    it('devrait générer un UID unique pour chaque conteneur', async () => {
      const container1Data = {
        capacite_l: 1200,
        statut: 'ACTIF',
        latitude: 48.8566,
        longitude: 2.3522
      };

      const response1 = await request(app)
        .post('/api/containers')
        .send(container1Data)
        .expect(201);

      const response2 = await request(app)
        .post('/api/containers')
        .send(container1Data)
        .expect(201);

      // Les UIDs doivent être différents
      expect(response1.body.uid).not.toBe(response2.body.uid);
      expect(response1.body.uid).toMatch(/^CNT-[A-Z0-9]{11,12}$/);
      expect(response2.body.uid).toMatch(/^CNT-[A-Z0-9]{11,12}$/);
    });
  });

  describe('GET /api/containers/id/:id', () => {
    let containerId;

    beforeEach(async () => {
      // Créer un conteneur de test
      const result = await pool.query(
        `INSERT INTO conteneur (uid, capacite_l, statut, position, id_zone, id_type, date_installation)
         VALUES ($1, $2, $3, ST_GeomFromText('POINT(2.3522 48.8566)', 4326), $4, $5, CURRENT_DATE)
         RETURNING id_conteneur`,
        ['CNT-TEST123456', 1500, 'ACTIF', testZoneId1, testTypeId]
      );
      containerId = result.rows[0].id_conteneur;
    });

    it('devrait récupérer un conteneur par ID', async () => {
      const response = await request(app)
        .get(`/api/containers/id/${containerId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id_conteneur');
      expect(response.body.id_conteneur).toBe(containerId);
      expect(response.body.capacite_l).toBe(1500);
      expect(response.body.statut).toBe('ACTIF');
    });

    it('devrait retourner 404 si conteneur non trouvé', async () => {
      await request(app)
        .get('/api/containers/id/99999')
        .expect(404);
    });
  });

  describe('GET /api/containers/uid/:uid', () => {
    let containerUid;

    beforeEach(async () => {
      // Créer un conteneur de test
      containerUid = 'CNT-TEST2345678';
      await pool.query(
        `INSERT INTO conteneur (uid, capacite_l, statut, position, id_zone, id_type, date_installation)
         VALUES ($1, $2, $3, ST_GeomFromText('POINT(2.3550 48.8600)', 4326), $4, $5, CURRENT_DATE)`,
        [containerUid, 1200, 'INACTIF', testZoneId1, testTypeId]
      );
    });

    it('devrait récupérer un conteneur par UID', async () => {
      const response = await request(app)
        .get(`/api/containers/uid/${containerUid}`);
      
      if (response.status !== 200) {
        console.log('Error response:', response.status, response.body);
      }
      
      expect(response.status).toBe(200);
      expect(response.body.uid).toBe(containerUid);
      expect(response.body.capacite_l).toBe(1200);
    });

    it('devrait accepter UIDs avec 11 ou 12 caractères', async () => {
      // Créer un conteneur avec UID à 11 caractères
      const uid11 = 'CNT-TEST345678K'; // 11 caractères après CNT-
      await pool.query(
        `INSERT INTO conteneur (uid, capacite_l, statut, position, id_zone, id_type, date_installation)
         VALUES ($1, $2, $3, ST_GeomFromText('POINT(2.3522 48.8566)', 4326), $4, $5, CURRENT_DATE)`,
        [uid11, 1200, 'ACTIF', testZoneId1, testTypeId]
      );

      const response = await request(app)
        .get(`/api/containers/uid/${uid11}`)
        .expect(200);

      expect(response.body.uid).toBe(uid11);
    });
  });

  describe('PATCH /api/containers/:id/status', () => {
    let containerId;

    beforeEach(async () => {
      // Créer un conteneur de test
      const result = await pool.query(
        `INSERT INTO conteneur (uid, capacite_l, statut, position, id_zone, id_type, date_installation)
         VALUES ($1, $2, $3, ST_GeomFromText('POINT(2.3522 48.8566)', 4326), $4, $5, CURRENT_DATE)
         RETURNING id_conteneur`,
        ['CNT-TEST345678', 1200, 'ACTIF', testZoneId1, testTypeId]
      );
      containerId = result.rows[0].id_conteneur;
    });

    it('devrait mettre à jour le statut et enregistrer l\'historique', async () => {
      const response = await request(app)
        .patch(`/api/containers/${containerId}/status`)
        .send({ statut: 'EN_MAINTENANCE' })
        .expect(200);

      expect(response.body.changed).toBe(true);
      expect(response.body.statut).toBe('EN_MAINTENANCE');

      // Vérifier en BD
      const result = await pool.query(
        'SELECT statut FROM conteneur WHERE id_conteneur = $1',
        [containerId]
      );
      expect(result.rows[0].statut).toBe('EN_MAINTENANCE');

      // Vérifier l'historique
      const history = await pool.query(
        'SELECT * FROM historique_statut WHERE id_entite = $1 AND type_entite = $2',
        [containerId, 'CONTENEUR']
      );
      expect(history.rows.length).toBeGreaterThan(0);
      expect(history.rows[0].ancien_statut).toBe('ACTIF');
      expect(history.rows[0].nouveau_statut).toBe('EN_MAINTENANCE');
    });

    it('ne devrait pas changer le statut s\'il est déjà le même', async () => {
      const response = await request(app)
        .patch(`/api/containers/${containerId}/status`)
        .send({ statut: 'ACTIF' })
        .expect(200);

      expect(response.body.changed).toBe(false);

      // Vérifier qu'aucun nouvel enregistrement d'historique n'a été créé
      const history = await pool.query(
        'SELECT COUNT(*) FROM historique_statut WHERE id_entite = $1',
        [containerId]
      );
      expect(parseInt(history.rows[0].count)).toBe(0);
    });

    it('devrait valider les statuts acceptés', async () => {
      const validStatuts = ['ACTIF', 'INACTIF', 'EN_MAINTENANCE'];

      for (const statut of validStatuts) {
        const response = await request(app)
          .patch(`/api/containers/${containerId}/status`)
          .send({ statut })
          .expect(200);
        expect(response.body.statut).toBe(statut);
      }
    });
  });

  describe('GET /api/containers', () => {
    beforeEach(async () => {
      // Créer plusieurs conteneurs de test
      await pool.query(
        `INSERT INTO conteneur (uid, capacite_l, statut, position, id_zone, id_type, date_installation)
         VALUES 
         ($1, $2, $3, ST_GeomFromText('POINT(2.3522 48.8566)', 4326), $4, $5, CURRENT_DATE),
         ($6, $7, $8, ST_GeomFromText('POINT(2.3550 48.8600)', 4326), $9, $10, CURRENT_DATE),
         ($11, $12, $13, ST_GeomFromText('POINT(2.3600 48.8650)', 4326), $14, $15, CURRENT_DATE)`,
        [
          'CNT-TEST001', 1000, 'ACTIF', testZoneId1, testTypeId,
          'CNT-TEST002', 1500, 'INACTIF', testZoneId1, testTypeId,
          'CNT-TEST003', 2000, 'ACTIF', testZoneId2, testTypeId
        ]
      );
    });

    it('devrait récupérer tous les conteneurs avec pagination', async () => {
      const response = await request(app)
        .get('/api/containers')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it('devrait filtrer par statut', async () => {
      const response = await request(app)
        .get('/api/containers')
        .query({ statut: 'ACTIF' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(container => {
        expect(container.statut).toBe('ACTIF');
      });
    });

    it('devrait filtrer par zone', async () => {
      const response = await request(app)
        .get('/api/containers')
        .query({ id_zone: testZoneId1 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach(container => {
        expect(container.id_zone).toBe(testZoneId1);
      });
    });

    it('devrait supporter la pagination', async () => {
      const response1 = await request(app)
        .get('/api/containers')
        .query({ page: 1, limit: 2 })
        .expect(200);

      const response2 = await request(app)
        .get('/api/containers')
        .query({ page: 2, limit: 2 })
        .expect(200);

      expect(response1.body).not.toEqual(response2.body);
    });
  });

  describe('DELETE /api/containers/:id', () => {
    let containerId;

    beforeEach(async () => {
      // Créer un conteneur de test
      const result = await pool.query(
        `INSERT INTO conteneur (uid, capacite_l, statut, position, id_zone, id_type, date_installation)
         VALUES ($1, $2, $3, ST_GeomFromText('POINT(2.3522 48.8566)', 4326), $4, $5, CURRENT_DATE)
         RETURNING id_conteneur`,
        ['CNT-TEST567890', 1200, 'ACTIF', testZoneId1, testTypeId]
      );
      containerId = result.rows[0].id_conteneur;
    });

    it('devrait supprimer un conteneur', async () => {
      const response = await request(app)
        .delete(`/api/containers/${containerId}`)
        .expect(200);

      expect(response.body.message).toContain('supprimé');

      // Vérifier que c'est supprimé de la BD
      const result = await pool.query(
        'SELECT COUNT(*) FROM conteneur WHERE id_conteneur = $1',
        [containerId]
      );
      expect(parseInt(result.rows[0].count)).toBe(0);
    });

    it('devrait retourner 404 si conteneur non trouvé', async () => {
      await request(app)
        .delete('/api/containers/99999')
        .expect(404);
    });
  });

  describe('GET /api/containers/:id/status/history', () => {
    let containerId;

    beforeEach(async () => {
      // Créer un conteneur et modifier son statut plusieurs fois
      const result = await pool.query(
        `INSERT INTO conteneur (uid, capacite_l, statut, position, id_zone, id_type, date_installation)
         VALUES ($1, $2, $3, ST_GeomFromText('POINT(2.3522 48.8566)', 4326), $4, $5, CURRENT_DATE)
         RETURNING id_conteneur`,
        ['CNT-TEST678901', 1200, 'ACTIF', testZoneId1, testTypeId]
      );
      containerId = result.rows[0].id_conteneur;

      // Insérer des changements de statut dans l'historique
      await pool.query(
        `INSERT INTO historique_statut (id_entite, type_entite, ancien_statut, nouveau_statut)
         VALUES ($1, $2, $3, $4),
                ($1, $2, $5, $6)`,
        [containerId, 'CONTENEUR', 'ACTIF', 'EN_MAINTENANCE', 'EN_MAINTENANCE', 'INACTIF']
      );
    });

    it('devrait récupérer l\'historique des changements de statut', async () => {
      const response = await request(app)
        .get(`/api/containers/${containerId}/status/history`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      // Vérifier que l'historique contient les bonnes infos
      const firstChange = response.body[0];
      expect(firstChange).toHaveProperty('ancien_statut');
      expect(firstChange).toHaveProperty('nouveau_statut');
      expect(firstChange).toHaveProperty('date_changement');
    });

    it('devrait retourner un historique vide pour un conteneur sans changements', async () => {
      // Créer un conteneur sans historique
      const newResult = await pool.query(
        `INSERT INTO conteneur (uid, capacite_l, statut, position, id_zone, id_type, date_installation)
         VALUES ($1, $2, $3, ST_GeomFromText('POINT(2.3522 48.8566)', 4326), $4, $5, CURRENT_DATE)
         RETURNING id_conteneur`,
        ['CNT-TEST789012', 1200, 'ACTIF', testZoneId1, testTypeId]
      );
      const newContainerId = newResult.rows[0].id_conteneur;

      const response = await request(app)
        .get(`/api/containers/${newContainerId}/status/history`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('devrait utiliser la case CONTENEUR (majuscule) dans l\'historique', async () => {
      // Faire un changement de statut
      await request(app)
        .patch(`/api/containers/${containerId}/status`)
        .send({ statut: 'INACTIF' })
        .expect(200);

      // Vérifier que l'enregistrement utilise CONTENEUR en majuscule
      const result = await pool.query(
        'SELECT type_entite FROM historique_statut WHERE id_entite = $1 AND type_entite = $2',
        [containerId, 'CONTENEUR']
      );
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].type_entite).toBe('CONTENEUR');
    });
  });
});
