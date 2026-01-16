# 📁 Structure du Projet EcoTrack Containers

```
service-containers/
├── 📋 Configuration & Documentation
│   ├── package.json              # Scripts npm et dépendances
│   ├── README.md                 # Guide principal
│   ├── TESTING.md                # Guide des tests Socket.IO ⭐
│   ├── ARCHITECTURE.md           # Architecture générale
│   ├── .env.example              # Variables d'environnement (template)
│   └── .env                      # Variables d'environnement (secret - ignoré)
│
├── 📚 Documentation
│   └── docs/
│       ├── SOCKET_IO.md          # Documentation Socket.IO complète
│       ├── TESTING_SOCKET_IO.md  # Stratégies de test détaillées
│       └── README.md             # Index des docs
│
├── 🚀 Serveur
│   └── index.js                  # Point d'entrée principal
│
├── 🛣️ Routes API
│   └── routes/
│       ├── container.route.js    # CRUD Conteneurs + status changes
│       ├── typecontainer.route.js # Gestion des types
│       └── zone.route.js         # Gestion des zones
│
├── 💼 Logique Métier
│   └── src/
│       ├── config/
│       │   └── config.js         # Configuration centralisée (port, DB, etc.)
│       │
│       ├── controllers/
│       │   ├── containercontroller.js      # Contrôleurs HTTP
│       │   ├── typeconteneurcontroller.js
│       │   └── zonecontroller.js
│       │
│       ├── services/
│       │   ├── containerservices.js        # Logique métier + Socket.IO
│       │   ├── typeconteneurservices.js
│       │   └── zoneservices.js
│       │
│       ├── models/
│       │   ├── containermodel.js           # Accès base de données
│       │   ├── typeconteneurmodel.js
│       │   └── zonemodel.js
│       │
│       ├── socket/
│       │   └── socket.service.js           # ⭐ Service Socket.IO
│       │
│       ├── middleware/
│       │   ├── socketMiddleware.js         # ⭐ Injection Socket.IO
│       │   ├── errorHandler.js             # Gestion des erreurs
│       │   └── requestLogger.js            # Logging des requêtes
│       │
│       ├── utils/
│       │   ├── ApiError.js                 # Classe d'erreur
│       │   ├── ApiResponse.js              # Classe de réponse
│       │   └── Validators.js               # Validateurs
│       │
│       ├── db/
│       │   ├── connexion.js                # Connexion PostgreSQL
│       │   ├── init-db-pg.sql              # Schéma BD
│       │   └── test-db.js                  # Test de connexion
│       │
│       └── container.di.js                 # Injection de dépendances
│
├── 🧪 Tests
│   └── test/
│       ├── socket.service.test.js          # Tests unitaires Socket
│       ├── socket.integration.test.js      # Tests d'intégration
│       └── socket.e2e.test.js              # Tests E2E
│
├── 🛠️ Scripts de Test Manuels
│   ├── test-socket-client.js               # Client Socket.IO simple
│   └── test-socket-interactive.js          # CLI interactive
│
└── 📊 Scripts d'Initialisation
    └── scripts/
        └── init-db.js                      # Initialise la base de données
```

---

## 🎯 Points Clés de l'Architecture

### 1️⃣ Socket.IO (Port 8080)
- **Fichier principal:** `src/socket/socket.service.js`
- **Intégration API:** `src/middleware/socketMiddleware.js`
- **Events:**
  - `subscribe-zone` / `unsubscribe-zone` (Client → Serveur)
  - `container:status-changed` (Serveur → Client)

### 2️⃣ Changements de Statut
- Route: `PATCH /api/containers/:id/status`
- Flux:
  1. Controller reçoit la requête
  2. Service met à jour la BD
  3. Si changement détecté → Socket.IO émet à la zone
  4. Tous les clients abonnés reçoivent l'événement

### 3️⃣ Injection de Dépendances
- **DI Container:** `src/container.di.js`
- **Middleware:** `src/middleware/socketMiddleware.js` injecte le `SocketService` dans chaque requête
- **Bénéfice:** Découplage entre Socket.IO et la logique métier

### 4️⃣ Base de Données
- **Moteur:** PostgreSQL avec PostGIS
- **Schéma:** `src/db/init-db-pg.sql`
- **Connexion:** `src/db/connexion.js` (pool pg)
- **Modèles:** Accès bas niveau via SQL directement

---

## 📊 Flux Données

```
┌─────────────────────────────────┐
│  API REST Request               │
│  PATCH /api/containers/1/status │
│  Body: { statut: "INACTIF" }    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  socketMiddleware               │
│  → Crée ContainerService        │
│    avec SocketService injecté   │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  ContainerController            │
│  → Appelle containerService     │
│    .updateStatus(id, statut)    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  ContainerServices              │
│  → containerModel.updateStatus()│
│  → Si changement:               │
│     socketService.emit...()     │
└────────────┬────────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
  ┌────────┐   ┌──────────────────────┐
  │  BD    │   │  Socket.IO           │
  │ UPDATE │   │  → to('zone-{id}')   │
  │        │   │  → emit(...) to Room │
  └────────┘   └────────┬─────────────┘
                        │
                        ▼
              ┌──────────────────────┐
              │  WebSocket Clients   │
              │  (Browser/Mobile)    │
              │  Reçoivent event     │
              └──────────────────────┘
```

---

## 🚀 Commandes Essentielles

```bash
# Développement
npm run dev              # Avec auto-restart (nodemon)

# Production
npm start                # Démarrage simple

# Tests
npm run test                      # Tous les tests
npm run test:socket               # Tests Socket.IO unitaires
npm run test:socket:integration   # Tests d'intégration
npm run test:socket:e2e           # Tests E2E

# Base de données
npm run test-db          # Vérifie la connexion
npm run init-db          # Initialise le schéma

# Tests manuels
npm run test:socket:client        # Client Socket simple
npm run test:socket:interactive   # CLI interactive
```

---

## 📖 Guides

- **[README.md](./README.md)** - Guide d'installation et utilisation
- **[TESTING.md](./TESTING.md)** - Guide des tests Socket.IO ⭐
- **[docs/SOCKET_IO.md](./docs/SOCKET_IO.md)** - Implémentation client complète
- **[docs/TESTING_SOCKET_IO.md](./docs/TESTING_SOCKET_IO.md)** - Stratégies de test
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Détails architecture générale

---

## ✅ Statut Fonctionnalités

- ✅ API REST CRUD Conteneurs, Zones, Types
- ✅ Changements de statut ségrégués (updateStatus vs updateContainer)
- ✅ Historique des changements de statut
- ✅ Socket.IO avec rooms par zone
- ✅ Notifications temps réel
- ✅ Tests unitaires, intégration, E2E
- ✅ Tests manuels (clients de test)
- ✅ Documentation complète

---

**Dernière mise à jour:** 16 Janvier 2026
