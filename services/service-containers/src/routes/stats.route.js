/**
 * Stats Routes — Phase 5 : Statistiques & Monitoring
 *
 * Endpoints de statistiques pour le service-containers.
 * Tous les endpoints sont en lecture seule (GET).
 *
 * Préfixe : /api/stats  (monté dans index.js)
 */
const express = require('express');
const { statsController } = require('../container-di');

const router = express.Router();

// ── Tableau de bord agrégé ──
router.get('/dashboard', statsController.getDashboard);

// ── Stats globales des conteneurs ──
router.get('/', statsController.getGlobalStats);

// ── Distribution des niveaux de remplissage ──
router.get('/fill-levels', statsController.getFillLevelDistribution);

// ── Stats par zone ──
router.get('/by-zone', statsController.getStatsByZone);

// ── Stats par type de conteneur ──
router.get('/by-type', statsController.getStatsByType);

// ── Alertes actives ──
router.get('/alerts', statsController.getAlertsSummary);

// ── Conteneurs critiques (remplissage >= seuil OU EN_MAINTENANCE) ──
router.get('/critical', statsController.getCriticalContainers);

// ── Historique de remplissage d'un conteneur (pour graphiques) ──
router.get('/containers/:id/history', statsController.getFillHistory);

// ── Stats de collecte ──
router.get('/collections', statsController.getCollectionStats);

// ── Stats de maintenance ──
router.get('/maintenance', statsController.getMaintenanceStats);

module.exports = router;

/**
 * @swagger
 * tags:
 *   - name: Statistiques
 *     description: Endpoints Phase 5 — Statistiques & Monitoring
 *
 * /stats/dashboard:
 *   get:
 *     summary: Tableau de bord agrégé
 *     description: Retourne un résumé global (conteneurs, remplissage, alertes) en un seul appel.
 *     tags: [Statistiques]
 *     responses:
 *       200:
 *         description: Tableau de bord
 *
 * /stats:
 *   get:
 *     summary: Stats globales des conteneurs
 *     tags: [Statistiques]
 *     responses:
 *       200:
 *         description: Total, actifs, inactifs, en_maintenance, capacité moyenne
 *
 * /stats/fill-levels:
 *   get:
 *     summary: Distribution des niveaux de remplissage
 *     description: Répartition en 4 tranches (0-25%, 25-50%, 50-75%, 75-100%) basée sur la dernière mesure par conteneur.
 *     tags: [Statistiques]
 *     responses:
 *       200:
 *         description: Distribution des niveaux
 *
 * /stats/by-zone:
 *   get:
 *     summary: Statistiques par zone
 *     tags: [Statistiques]
 *     responses:
 *       200:
 *         description: Nb conteneurs, actifs, capacité et remplissage moyen par zone
 *
 * /stats/by-type:
 *   get:
 *     summary: Statistiques par type de conteneur
 *     tags: [Statistiques]
 *     responses:
 *       200:
 *         description: Nb conteneurs et capacité moyenne par type
 *
 * /stats/alerts:
 *   get:
 *     summary: Résumé des alertes actives
 *     tags: [Statistiques]
 *     responses:
 *       200:
 *         description: Débordements, batteries faibles, capteurs défaillants
 *
 * /stats/critical:
 *   get:
 *     summary: Conteneurs critiques
 *     description: Conteneurs avec remplissage >= seuil OU en maintenance.
 *     tags: [Statistiques]
 *     parameters:
 *       - in: query
 *         name: seuil
 *         schema:
 *           type: integer
 *           default: 90
 *         description: Seuil de remplissage (%) à partir duquel un conteneur est critique
 *     responses:
 *       200:
 *         description: Liste des conteneurs critiques
 *
 * /stats/containers/{id}/history:
 *   get:
 *     summary: Historique de remplissage d'un conteneur
 *     description: Mesures de remplissage, batterie et température sur les N derniers jours.
 *     tags: [Statistiques]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du conteneur
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Nombre de jours d'historique (1-365)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 500
 *         description: Nombre max de mesures (1-5000)
 *     responses:
 *       200:
 *         description: Historique des mesures
 *
 * /stats/collections:
 *   get:
 *     summary: Statistiques de collecte
 *     description: Total kg, moyenne, détail par zone et par type sur les N derniers jours.
 *     tags: [Statistiques]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Période en jours (1-365)
 *     responses:
 *       200:
 *         description: Stats de collecte
 *
 * /stats/maintenance:
 *   get:
 *     summary: Statistiques de maintenance
 *     description: Conteneurs actuellement en maintenance et durée moyenne sur 90 jours.
 *     tags: [Statistiques]
 *     responses:
 *       200:
 *         description: Stats de maintenance
 */
