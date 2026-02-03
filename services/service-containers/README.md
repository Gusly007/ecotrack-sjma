# 🚀 EcoTrack Containers Service

Microservice moderne pour la gestion des conteneurs de la plateforme EcoTrack avec **notifications en temps réel** via Socket.IO.

[![Tests](https://img.shields.io/badge/tests-40%2F40%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)]()
[![Node](https://img.shields.io/badge/node-18%2B-blue)]()
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.3-black)]()

---

## ⚡ Quick Start

```bash
# 1. Clone et installe
npm install

# 2. Configure
cp .env.example .env
# Édite .env avec tes paramètres PostgreSQL

# 3. Initialise la BD
npm run init-db

# 4. Démarre
npm run dev

# ✨ Accède à http://localhost:8080/api
```

---

## 📖 Documentation

### 👨‍💻 Pour les développeurs
👉 **[GUIDE_COLLEGUES.md](./GUIDE_COLLEGUES.md)** - Instructions complètes étape par étape

### 📚 Documentation technique
👉 **[docs/INDEX.md](./docs/INDEX.md)** - Index complet de toute la documentation

### Guides rapides
- 🏗️ [Architecture](./docs/ARCHITECTURE.md) - Design et patterns
- 🔌 [Socket.IO](./docs/SOCKET_IO.md) - Notifications temps réel
- 🧪 [Tests](./docs/TESTING.md) - Guide des tests
- 🚀 [Déploiement](./docs/DEPLOYMENT.md) - Guide de prod
- 💚 [Health Check](./docs/HEALTH_CHECK.md) - Monitoring
- � **[Middleware Audit](./docs/MIDDLEWARE_FINAL_REPORT.md)** - Architecture des middleware ✨
- �📚 [API Swagger](http://localhost:8080/api-docs) - Documentation interactive

---

## ✨ Fonctionnalités

- ✅ **REST API** complète pour les conteneurs
- ✅ **Socket.IO** notifications en temps réel
- ✅ **UUID v4** pour les identifiants uniques (CNT-XXXXX)
- ✅ **Historique** de tous les changements
- ✅ **Health check** avec état des services
- ✅ **40/40 tests** ✓ Tous passants
- ✅ **Swagger UI** documentation auto

---

## 📊 Architecture

**Service en couches moderne :**
```
┌─────────────────────────────────────┐
│   API REST + Socket.IO (port 8080) │
├─────────────────────────────────────┤
│      Routes → Controllers           │
├─────────────────────────────────────┤
│     Services (logique métier)       │
├─────────────────────────────────────┤
│  Models (accès base de données)    │
├─────────────────────────────────────┤
│     PostgreSQL + PostGIS            │
└─────────────────────────────────────┘
```

**Fonctionnalités principales :**
- ✅ CRUD complet pour conteneurs et zones
- ✅ Génération UID sécurisée (UUID v4)
- ✅ Notifications temps réel (Socket.IO)
- ✅ Historique des changements
- ✅ Filtrage géospatial (PostGIS)
- ✅ Health check avec monitoring
- ✅ 40/40 tests unitaires ✓

---

## 🔌 Endpoints principaux

### REST API
```http
GET    /health                        # Santé du service
GET    /api                           # Info service
GET    /api/containers                # Liste paginée
POST   /api/containers                # Créer
GET    /api/containers/:id            # Détails
PATCH  /api/containers/:id            # Modifier
PATCH  /api/containers/:id/status     # Changer statut
GET    /api/containers/:id/status/history  # Historique
DELETE /api/containers/:id            # Supprimer
GET    /api/zones                     # Liste des zones
```

### Socket.IO (WebSocket)
```javascript
// S'abonner aux notifications d'une zone
socket.emit('subscribe-zone', { id_zone: 1 });

// Recevoir les changements de statut
socket.on('container:status-changed', (data) => {
  console.log(data.uid, data.statut);
});
```

---

## 🛠️ Commandes

```bash
# Développement
npm run dev                 # Démarre avec rechargement auto

# Production
npm start                   # Lance le serveur

# Tests
npm test                    # Tous les tests (40/40)
npm run test:socket         # Tests Socket.IO
npm run test:socket:integration  # Tests d'intégration
npm run test:socket:e2e     # Tests end-to-end

# Base de données
npm run init-db            # Initialise les tables
npm run test-db            # Teste la connexion

# Outils de test Socket.IO
npm run test:socket:client       # Client de test simple
npm run test:socket:interactive  # Client interactif
```

---

## 🔒 Sécurité & Bonnes pratiques

✅ **Validation stricte** des entrées  
✅ **CORS configuré** par environnement  
✅ **UUID v4 cryptographique** pour les identifiants  
✅ **Contraintes UNIQUE** en base de données  
✅ **Transactions atomiques** pour les statuts  
✅ **Pas de secrets** en dur dans le code  
✅ **Gestion d'erreurs** complète  

---

## 📝 Statuts des conteneurs

| Statut | Description | Couleur |
|--------|-------------|---------|
| `ACTIF` | Conteneur opérationnel | 🟢 Vert |
| `INACTIF` | Temporairement désactivé | 🟡 Jaune |
| `EN_MAINTENANCE` | En cours de maintenance | 🟠 Orange |
| `HORS_SERVICE` | Définitivement hors service | 🔴 Rouge |

---

## 🆔 Format UID

Les conteneurs ont un identifiant unique au format :
```
CNT-{12 caractères alphanumériques}
Exemple: CNT-A1B2C3D4E5F6
```

Généré automatiquement via **UUID v4** (cryptographiquement sécurisé) avec vérification d'unicité en base de données.

---

## 📞 Besoin d'aide ?

1. **Installation** → [GUIDE_COLLEGUES.md](./GUIDE_COLLEGUES.md)
2. **Tests** → [docs/TESTING.md](./docs/TESTING.md)
3. **Socket.IO** → [docs/SOCKET_IO.md](./docs/SOCKET_IO.md)
4. **Déploiement** → [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
5. **Index complet** → [docs/INDEX.md](./docs/INDEX.md)

---

## 🏆 Points clés

| Aspect | Détails |
|--------|---------|
| **Port** | 8080 (API + Socket.IO + Swagger) |
| **Base de données** | PostgreSQL 12+ avec PostGIS |
| **Node.js** | 18+ requis |
| **Tests** | 40/40 passants ✅ |
| **Documentation** | Swagger UI + Markdown |
| **Temps réel** | Socket.IO 4.8.3 |
| **Status** | Production Ready 🚀 |

---

## 🎉 Prêt à démarrer ?

```bash
# Installation rapide (5 minutes)
git clone <repo>
cd service-containers
cp .env.example .env
# Édite .env avec tes paramètres
npm install
npm run init-db
npm run dev

# ✨ Visite http://localhost:8080/api-docs
```

**Pour des instructions détaillées** : [GUIDE_COLLEGUES.md](./GUIDE_COLLEGUES.md)

---

**Version**: 2.0.0 | **License**: MIT | **Status**: Production Ready ✅

