# 📚 Documentation EcoTrack Containers Service

Bienvenue dans la documentation technique complète du microservice de gestion des conteneurs.

---

##  Guides de démarrage

| Guide | Description | Audience |
|-------|-------------|----------|
| **[README.md](../README.md)** | Vue d'ensemble rapide du projet | Tous |
| **[GUIDE.md](../GUIDE.md)** | Instructions détaillées pour installer et démarrer | Développeurs |

---

##  Documentation technique

### Architecture & Design

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture globale du service

### APIs & Intégrations

- **[SOCKET_IO.md](./SOCKET_IO.md)** - Documentation complète Socket.IO (événements, rooms, exemples)
- **[API REST]** - Voir Swagger UI : http://localhost:3011/api-docs

### Opérations & Monitoring

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guide de déploiement en production

### Tests & QA

- **[TESTING.md](./TESTING.md)** - Guide complet des tests unitaires et d'intégration

### Historique

- **[CHANGELOG.md](./CHANGELOG.md)** - Journal des modifications (v2.0.0 - Socket.IO)

---

### 📱 J'intègre Socket.IO dans mon app
1. Lis [SOCKET_IO.md](./SOCKET_IO.md)
2. Voir les exemples de connexion
3. Tester avec `npm run test:socket:client`

---

## 🔍 Index des sujets

### Conteneurs
- Création : [ARCHITECTURE.md](./ARCHITECTURE.md) → Section Models
- UID génération : [GUIDE.md](../GUIDE.md) → Section UID
- Statuts : [GUIDE.md](../GUIDE.md) → Section Statuts
- Historique : [ARCHITECTURE.md](./ARCHITECTURE.md) → Section Historique

### Socket.IO
- Configuration : [SOCKET_IO.md](./SOCKET_IO.md) → Configuration
- Événements : [SOCKET_IO.md](./SOCKET_IO.md) → Événements
- Rooms/Zones : [SOCKET_IO.md](./SOCKET_IO.md) → Rooms

### Base de données
- Connexion : [GUIDE.md](../GUIDE.md) → Configuration
- Migrations : [DEPLOYMENT.md](./DEPLOYMENT.md) → Base de données

### Tests
- Unitaires : [TESTING.md](./TESTING.md) → Tests unitaires
- Intégration : [TESTING.md](./TESTING.md) → Tests d'intégration
- Coverage : `npm test -- --coverage`

---

## 📞 Besoin d'aide ?

1. **Installation/Configuration** → [GUIDE.md](../GUIDE.md)
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
**Status**: Production Ready 
