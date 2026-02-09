# 📚 Documentation EcoTrack Containers Service

Bienvenue dans la documentation technique complète du microservice de gestion des conteneurs.

---

## 🚀 Guides de démarrage

| Guide | Description | Audience |
|-------|-------------|----------|
| **[README.md](../README.md)** | Vue d'ensemble rapide du projet | Tous |
| **[GUIDE_COLLEGUES.md](../GUIDE_COLLEGUES.md)** | Instructions détaillées pour installer et démarrer | Développeurs |

---

## 📖 Documentation technique

### Architecture & Design

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture globale du service
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Structure des fichiers et organisation du code
- **[MIDDLEWARE_INDEX.md](./MIDDLEWARE_INDEX.md)** - 📊 Index complet des middleware (NEW!)

### Middleware (Optimisation Récente)

Pour répondre à la question **"Mes middleware sont-ils bien utilisés?"**:

| Document | Durée | Contenu |
|----------|-------|---------|
| **[MIDDLEWARE_FINAL_REPORT.md](./MIDDLEWARE_FINAL_REPORT.md)** ⭐ | 5 mins | Verdict: ✅ Oui (après optimisation) |
| **[MIDDLEWARE_AUDIT.md](./MIDDLEWARE_AUDIT.md)** | 10 mins | Problèmes initiaux identifiés |
| **[MIDDLEWARE_OPTIMIZATION.md](./MIDDLEWARE_OPTIMIZATION.md)** | 10 mins | Optimisations implémentées |
| **[MIDDLEWARE_FLOW.md](./MIDDLEWARE_FLOW.md)** | 15 mins | Diagrammes et flux détaillé |

### APIs & Intégrations

- **[SOCKET_IO.md](./SOCKET_IO.md)** - Documentation complète Socket.IO (événements, rooms, exemples)
- **[API REST]** - Voir Swagger UI : http://localhost:3011/api-docs

### Opérations & Monitoring

- **[HEALTH_CHECK.md](./HEALTH_CHECK.md)** - Guide du health check endpoint
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guide de déploiement en production

### Tests & QA

- **[TESTING.md](./TESTING.md)** - Guide complet des tests unitaires et d'intégration
- **[TESTING_SOCKET_IO.md](./TESTING_SOCKET_IO.md)** - Tests spécifiques Socket.IO

### Historique

- **[CHANGELOG.md](./CHANGELOG.md)** - Journal des modifications (v2.0.0 - Socket.IO)
- **[CLEANUP_SUMMARY.md](./CLEANUP_SUMMARY.md)** - Résumé du nettoyage du projet

---

## 🎯 Parcours par profil

### 👨‍💻 Je suis développeur
1. Lis [GUIDE_COLLEGUES.md](../GUIDE_COLLEGUES.md)
2. Configure ton environnement
3. Lance `npm run dev`
4. Consulte [TESTING.md](./TESTING.md) pour les tests
5. Explore [ARCHITECTURE.md](./ARCHITECTURE.md) pour comprendre le code

### 🧪 Je suis QA/Testeur
1. Lis [TESTING.md](./TESTING.md)
2. Lance `npm test` pour tous les tests
3. Consulte [TESTING_SOCKET_IO.md](./TESTING_SOCKET_IO.md) pour les tests temps réel
4. Vérifie [HEALTH_CHECK.md](./HEALTH_CHECK.md) pour le monitoring

### 🚀 Je déploie en production
1. Lis [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Configure les variables d'environnement
3. Vérifie [HEALTH_CHECK.md](./HEALTH_CHECK.md)
4. Monitore via `/health` endpoint

### 📱 J'intègre Socket.IO dans mon app
1. Lis [SOCKET_IO.md](./SOCKET_IO.md)
2. Voir les exemples de connexion
3. Tester avec `npm run test:socket:client`
4. Consulte [TESTING_SOCKET_IO.md](./TESTING_SOCKET_IO.md)

---

## 🔍 Index des sujets

### Conteneurs
- Création : [ARCHITECTURE.md](./ARCHITECTURE.md) → Section Models
- UID génération : [GUIDE_COLLEGUES.md](../GUIDE_COLLEGUES.md) → Section UID
- Statuts : [GUIDE_COLLEGUES.md](../GUIDE_COLLEGUES.md) → Section Statuts
- Historique : [ARCHITECTURE.md](./ARCHITECTURE.md) → Section Historique

### Socket.IO
- Configuration : [SOCKET_IO.md](./SOCKET_IO.md) → Configuration
- Événements : [SOCKET_IO.md](./SOCKET_IO.md) → Événements
- Rooms/Zones : [SOCKET_IO.md](./SOCKET_IO.md) → Rooms
- Tests : [TESTING_SOCKET_IO.md](./TESTING_SOCKET_IO.md)

### Base de données
- Connexion : [GUIDE_COLLEGUES.md](../GUIDE_COLLEGUES.md) → Configuration
- Schéma : `src/db/init-db-pg.sql`
- Migrations : [DEPLOYMENT.md](./DEPLOYMENT.md) → Base de données

### Tests
- Unitaires : [TESTING.md](./TESTING.md) → Tests unitaires
- Intégration : [TESTING.md](./TESTING.md) → Tests d'intégration
- E2E : [TESTING_SOCKET_IO.md](./TESTING_SOCKET_IO.md) → E2E
- Coverage : `npm test -- --coverage`

---

## 📞 Besoin d'aide ?

1. **Installation/Configuration** → [GUIDE_COLLEGUES.md](../GUIDE_COLLEGUES.md)
2. **Tests qui échouent** → [TESTING.md](./TESTING.md)
3. **Problèmes Socket.IO** → [SOCKET_IO.md](./SOCKET_IO.md)
4. **Déploiement** → [DEPLOYMENT.md](./DEPLOYMENT.md)
5. **Architecture** → [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🎉 Quick Links

- **API Documentation** : http://localhost:3011/api-docs
- **Health Check** : http://localhost:3011/health
- **Tests** : `npm test`
- **Dev Server** : `npm run dev`

---

**Version**: 2.0.0  
**Dernière mise à jour**: Janvier 2026  
**Status**: Production Ready ✅
