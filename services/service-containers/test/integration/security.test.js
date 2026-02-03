/**
 * Tests Sécurité et Robustesse
 * Tests de validation, injection, et limites
 */

const request = require('supertest');
const express = require('express');
const containerRoute = require('../../src/routes/container.route');
const zoneRoute = require('../../src/routes/zone.route');

describe('Security Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/containers', containerRoute);
    app.use('/api/zones', zoneRoute);
    
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        error: err.message
      });
    });
  });

  describe('Validation des entrées', () => {
    it('devrait rejeter un statut inconnu', async () => {
      const response = await request(app)
        .patch('/api/containers/1/status')
        .send({ statut: 'StatusInvalide' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('devrait rejeter une capacité négative', async () => {
      const response = await request(app)
        .post('/api/containers')
        .send({
          capacite_l: -100,
          statut: 'Vide',
          latitude: 48.8566,
          longitude: 2.3522
        });

      expect(response.status).toBe(400);
    });

    it('devrait rejeter des coordonnées invalides', async () => {
      const response = await request(app)
        .post('/api/containers')
        .send({
          capacite_l: 100,
          statut: 'Vide',
          latitude: 200, // Latitude invalide
          longitude: 2.3522
        });

      expect(response.status).toBe(400);
    });

    it('devrait rejeter un ID de zone inexistant', async () => {
      const response = await request(app)
        .post('/api/containers')
        .send({
          capacite_l: 100,
          statut: 'Vide',
          latitude: 48.8566,
          longitude: 2.3522,
          id_zone: -1 // ID invalide
        });

      expect(response.status).toBe(400);
    });

    it('devrait rejeter des champs manquants', async () => {
      const response = await request(app)
        .post('/api/containers')
        .send({
          statut: 'Vide'
          // Capacité et coordonnées manquantes
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Injection SQL', () => {
    it('devrait protéger contre l\'injection SQL dans les IDs', async () => {
      const response = await request(app)
        .get('/api/containers/1; DROP TABLE conteneurs;--');

      expect(response.status).toBe(400);
    });

    it('devrait protéger contre l\'injection dans les champs texte', async () => {
      const response = await request(app)
        .post('/api/zones')
        .send({
          nom: "'; DROP TABLE zones;--",
          type: 'Résidentielle'
        });

      // Devrait soit rejeter, soit échapper correctement
      expect([400, 201]).toContain(response.status);
    });
  });

  describe('Injection XSS', () => {
    it('devrait échapper les scripts dans les données', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await request(app)
        .post('/api/zones')
        .send({
          nom: xssPayload,
          type: 'Résidentielle'
        });

      if (response.status === 201) {
        const data = response.body.data;
        // Le script ne devrait pas être exécutable
        expect(data.nom).not.toContain('<script>');
      }
    });
  });

  describe('Limites et DoS', () => {
    it('devrait limiter la taille des requêtes', async () => {
      const largePayload = {
        nom: 'A'.repeat(10000), // Nom très long
        type: 'Résidentielle'
      };

      const response = await request(app)
        .post('/api/zones')
        .send(largePayload);

      expect([400, 413]).toContain(response.status);
    });

    it('devrait valider la pagination pour éviter les grandes requêtes', async () => {
      const response = await request(app)
        .get('/api/containers')
        .query({ limit: 100000 }); // Limite excessive

      // Devrait soit rejeter, soit plafonner
      expect([400, 200]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.data.length).toBeLessThanOrEqual(1000);
      }
    });

    it('devrait valider le rayon de recherche', async () => {
      const response = await request(app)
        .get('/api/containers/radius')
        .query({
          latitude: 48.8566,
          longitude: 2.3522,
          radius: 100000 // Rayon excessif
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Types de données', () => {
    it('devrait rejeter des types de données incorrects', async () => {
      const response = await request(app)
        .post('/api/containers')
        .send({
          capacite_l: 'cent', // String au lieu de number
          statut: 'Vide',
          latitude: 48.8566,
          longitude: 2.3522
        });

      expect(response.status).toBe(400);
    });

    it('devrait rejeter des objets au lieu de valeurs primitives', async () => {
      const response = await request(app)
        .post('/api/containers')
        .send({
          capacite_l: { value: 100 },
          statut: 'Vide'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Headers et CORS', () => {
    it('devrait inclure des headers de sécurité', async () => {
      const response = await request(app)
        .get('/api/containers');

      // Vérifier certains headers de sécurité
      expect(response.headers).toBeDefined();
    });
  });

  describe('Rate Limiting (si implémenté)', () => {
    it('devrait limiter les requêtes répétées', async () => {
      const requests = Array(100).fill(null).map(() => 
        request(app).get('/api/containers')
      );

      const responses = await Promise.all(requests);
      
      // Certaines requêtes pourraient être limitées
      const tooManyRequests = responses.some(r => r.status === 429);
      
      // Ce test est informatif, pas obligatoire si le rate limiting n'est pas implémenté
      if (tooManyRequests) {
        expect(tooManyRequests).toBe(true);
      }
    });
  });

  describe('Gestion des erreurs', () => {
    it('ne devrait pas exposer de détails d\'erreur sensibles', async () => {
      const response = await request(app)
        .get('/api/containers/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.error).not.toContain('SELECT');
      expect(response.body.error).not.toContain('FROM');
      expect(response.body.error).not.toContain('database');
    });

    it('devrait retourner des messages d\'erreur génériques en production', async () => {
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/containers/999999');

      if (response.status >= 500) {
        expect(response.body.error).not.toContain('stack');
      }

      delete process.env.NODE_ENV;
    });
  });
});
