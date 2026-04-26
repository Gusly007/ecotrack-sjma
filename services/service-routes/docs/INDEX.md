#  Documentation Service Routes - EcoTrack

Bienvenue dans la documentation technique du microservice de gestion des tournées de collecte.

---

## Guides de démarrage

| Guide | Description | Audience |
|---|---|---|
| **[README.md](../README.md)** | Vue d'ensemble rapide | Tous |
| **[SETUP.md](./SETUP.md)** | Installation et configuration détaillées | Développeurs |

---

## Documentation technique

### Architecture & Design

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Patterns, injection de dépendances, flux des données

### APIs

- **[API.md](./API.md)** — Référence complète de tous les endpoints REST
- **Swagger UI** — http://localhost:3012/api-docs (interactif)

### Algorithmes

- **[ALGORITHMS.md](./ALGORITHMS.md)** — Nearest Neighbor, 2-opt, Haversine, estimation durée

### Tests & QA

- **[TESTING.md](./TESTING.md)** — Guide des 141 tests unitaires

### Opérations

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Docker, variables d'environnement, monitoring

---

## Liens rapides

| Ressource | URL |
|---|---|
| Swagger UI | http://localhost:3012/api-docs |
| Health Check | http://localhost:3012/health |
| Métriques Prometheus | http://localhost:3012/metrics |
| Via API Gateway | http://localhost:3000/api/routes |
| Tests | `npm test` |
| Dev Server | `npm run dev` |

---

## Index des sujets

### Tournées
- Création manuelle → [API.md](./API.md) → POST /tournees
- Création optimisée → [API.md](./API.md) → POST /optimize
- Changement de statut → [API.md](./API.md) → PATCH /tournees/:id/statut
- Progression agent → [API.md](./API.md) → GET /tournees/:id/progress

### Optimisation
- Algorithme Nearest Neighbor → [ALGORITHMS.md](./ALGORITHMS.md)
- Algorithme 2-opt → [ALGORITHMS.md](./ALGORITHMS.md)
- Distance Haversine → [ALGORITHMS.md](./ALGORITHMS.md)
- Paramètre seuil_remplissage → [API.md](./API.md)

### Collectes & Anomalies
- Valider une collecte → [API.md](./API.md) → POST /tournees/:id/collecte
- Signaler anomalie → [API.md](./API.md) → POST /tournees/:id/anomalie
- Auto-clôture tournée → [ARCHITECTURE.md](./ARCHITECTURE.md)

### Statistiques
- Dashboard → [API.md](./API.md) → GET /stats/dashboard
- KPIs → [API.md](./API.md) → GET /stats/kpis
- Comparaison algorithmes → [API.md](./API.md) → GET /stats/algorithm-comparison

### Base de données
- Connexion Pool → [ARCHITECTURE.md](./ARCHITECTURE.md) → Section DB
- Tables utilisées → [ARCHITECTURE.md](./ARCHITECTURE.md) → Section Schéma

### Tests
- Lancer les tests → [TESTING.md](./TESTING.md)
- Pattern de mock → [TESTING.md](./TESTING.md) → Pattern
- Ajouter un test → [TESTING.md](./TESTING.md) → Guide

---

