# 🚀 EcoTrack Containers Service - Guide pour les collègues

Bienvenue ! Ce microservice gère les conteneurs de la plateforme EcoTrack avec notifications en temps réel.

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Démarrage](#démarrage)
5. [API REST](#api-rest)
6. [Socket.IO en temps réel](#socketio-en-temps-réel)
7. [Tests](#tests)
8. [Dépannage](#dépannage)

---

## ✅ Prérequis

- **Node.js** 18+ (vérifiez : `node --version`)
- **npm** 8+ (vérifiez : `npm --version`)
- **PostgreSQL** 12+ en cours d'exécution
- **Accès à la base de données** ecotrack_db (hôte, port, user, password)

---

## 📦 Installation

### 1️⃣ Cloner/Télécharger le code

```bash
cd service-containers
```

### 2️⃣ Installer les dépendances

```bash
npm install
```

Cela installe :
- Express (API REST)
- Socket.IO (notifications temps réel)
- PostgreSQL (client pg)
- Jest (tests)
- Nodemon (rechargement auto en dev)

---

## ⚙️ Configuration

### 1️⃣ Créer le fichier `.env`

```bash
cp .env.example .env
```

### 2️⃣ Éditer `.env` avec vos paramètres

```env
# Base de données PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/ecotrack_db
PGUSER=votre_utilisateur
PGPASSWORD=votre_mot_de_passe
PGHOST=localhost
PGPORT=5432
PGDATABASE=ecotrack_db

# Serveur
APP_PORT=3011
NODE_ENV=development

# Socket.IO CORS
ALLOWED_ORIGINS=http://localhost:3011,http://localhost:3011

# Logging
LOG_LEVEL=info
```

### ⚠️ Important

- **Ne commitez JAMAIS** `.env` dans Git (déjà dans `.gitignore`)
- Chaque développeur a son propre `.env` local
- En production, les variables d'environnement sont définies par le serveur

---

## ▶️ Démarrage

### Mode développement (avec rechargement auto)

```bash
npm run dev
```

Vous verrez :
```
✓ EcoTrack Containers API
✓ 📍 http://localhost:3011/api
✓ 📚 Documentation: http://localhost:3011/api-docs
✓ 🔌 Socket.IO: ws://localhost:3011
```

### Mode production

```bash
npm start
```

### Initialiser la base de données (première fois)

```bash
npm run init-db
```

Cela crée les tables (`conteneur`, `zone`, `historique_statut`, etc.)

---

## 🔌 API REST

### Base URL
```
http://localhost:3011/api
```

### Endpoints

#### 📌 Santé du service
```http
GET /health
```
Retourne le statut du service et des dépendances.

#### 📦 Conteneurs

**Lister tous les conteneurs**
```http
GET /api/containers?page=1&limit=50&statut=ACTIF&id_zone=1
```

**Créer un conteneur**
```http
POST /api/containers
Content-Type: application/json

{
  "capacite_l": 1500,
  "statut": "ACTIF",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "id_zone": 1,
  "id_type": 5
}
```

**Récupérer un conteneur**
```http
GET /api/containers/:id
```

**Mettre à jour un conteneur**
```http
PATCH /api/containers/:id
Content-Type: application/json

{
  "capacite_l": 2000,
  "latitude": 48.8600,
  "longitude": 2.3550
}
```

**Changer le statut d'un conteneur**
```http
PATCH /api/containers/:id/status
Content-Type: application/json

{
  "statut": "EN_MAINTENANCE"
}
```

**Voir l'historique de statut**
```http
GET /api/containers/:id/status/history
```

**Supprimer un conteneur**
```http
DELETE /api/containers/:id
```

#### 📍 Zones
```http
GET /api/zones
```

### Statuts valides
- `ACTIF` - Conteneur opérationnel
- `INACTIF` - Temporairement désactivé
- `EN_MAINTENANCE` - En cours de maintenance
- `HORS_SERVICE` - Définitivement hors service

### UID des conteneurs
Format : `CNT-{12 caractères alphanumériques}`  
Exemple : `CNT-A1B2C3D4E5F6`

Généré automatiquement via UUID v4 (cryptographiquement sécurisé).

---

## 🔌 Socket.IO en temps réel

### Vue d'ensemble

Le service émet des **notifications instantanées** quand un conteneur change de statut.

### Se connecter

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3011');

socket.on('connect', () => {
  console.log('Connecté au serveur !');
});
```

### S'abonner à une zone

```javascript
socket.emit('subscribe-zone', { id_zone: 1 });
```

### Recevoir les notifications

```javascript
socket.on('container:status-changed', (data) => {
  console.log('Conteneur:', data.uid);
  console.log('Nouveau statut:', data.statut);
  console.log('Ancien statut:', data.ancien_statut);
  console.log('Zone:', data.id_zone);
});
```

### Se désabonner d'une zone

```javascript
socket.emit('unsubscribe-zone', { id_zone: 1 });
```

### Exemple complet (React)

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function ContainerUpdates() {
  const [updates, setUpdates] = useState([]);
  
  useEffect(() => {
    const socket = io('http://localhost:3011');
    
    socket.on('connect', () => {
      socket.emit('subscribe-zone', { id_zone: 1 });
    });
    
    socket.on('container:status-changed', (data) => {
      setUpdates(prev => [...prev, data]);
    });
    
    return () => socket.disconnect();
  }, []);
  
  return (
    <div>
      <h2>Mises à jour en temps réel</h2>
      {updates.map(u => (
        <p key={u.uid}>{u.uid}: {u.statut}</p>
      ))}
    </div>
  );
}

export default ContainerUpdates;
```

---

## 🧪 Tests

### Tous les tests

```bash
npm test
```

**Résultat attendu :** 40/40 tests ✅

### Tests Socket.IO uniquement

```bash
npm run test:socket           # Tests unitaires
npm run test:socket:integration # Tests d'intégration
npm run test:socket:e2e       # Tests E2E (serveur requis)
```

### Client de test interactif

```bash
npm run test:socket:interactive
```

Cela ouvre un terminal interactif pour tester Socket.IO manuellement.

---

## 🐛 Dépannage

### ❌ "Impossible de se connecter à la base de données"

**Vérifiez :**
1. PostgreSQL est-il en cours d'exécution ?
2. `.env` contient-il les bons identifiants ?
3. La base `ecotrack_db` existe-t-elle ?

```bash
# Tester la connexion
npm run test-db
```

### ❌ "port 3011 déjà utilisé"

```bash
# Tuer le processus Node
taskkill /F /IM node.exe

# Ou changer le port dans .env
PORT=8081
```

### ❌ "Socket.IO connexion échouée"

1. Vérifiez que le serveur tourne : `npm run dev`
2. Vérifiez `ALLOWED_ORIGINS` dans `.env`
3. Vérifiez qu'il n'y a pas de proxy bloquant

### ❌ "Tests échouent"

```bash
# Vérifier que PostgreSQL tourne
# Vérifier les variables .env

# Relancer les tests
npm test -- --verbose
```

---

## 📁 Structure du projet

```
service-containers/
├── index.js                     # Point d'entrée
├── package.json                 # Dépendances
├── .env.example                 # Template config
├── README.md                    # Ce fichier
├── DEPLOYMENT.md                # Guide déploiement
├── TESTING.md                   # Guide tests
│
├── src/
│   ├── models/                  # Accès base de données
│   │   ├── containermodel.js
│   │   ├── zonemodel.js
│   │   └── typeconteneurmodel.js
│   │
│   ├── services/                # Logique métier
│   │   ├── containerservices.js
│   │   ├── zoneservices.js
│   │   └── typeconteneurservices.js
│   │
│   ├── controllers/             # Handlers HTTP
│   │   ├── containercontroller.js
│   │   ├── zonecontroller.js
│   │   └── typeconteneurcontroller.js
│   │
│   ├── socket/                  # Socket.IO
│   │   └── socket.service.js
│   │
│   ├── middleware/              # Express middleware
│   │   ├── errorHandler.js
│   │   ├── requestLogger.js
│   │   └── socketMiddleware.js
│   │
│   ├── config/                  # Configuration
│   │   └── config.js
│   │
│   └── db/                      # Base de données
│       ├── connexion.js
│       ├── init-db-pg.sql
│       └── test-db.js
│
├── routes/                      # Routes Express
│   ├── container.route.js
│   ├── zone.route.js
│   └── typecontainer.route.js
│
├── test/                        # Tests
│   ├── container.test.js
│   ├── zone.test.js
│   ├── socket.service.test.js
│   └── socket.integration.test.js
│
└── scripts/
    └── init-db.js              # Script initialisation BD
```

---

## 🔒 Sécurité

- ✅ CORS configuré par environnement
- ✅ Validation d'entrées sur tous les paramètres
- ✅ Contrainte UNIQUE sur uid en base
- ✅ Transactions atomiques pour statuts
- ✅ Pas de secrets en dur dans le code

---

## 📞 Support

Si vous avez des questions :
1. Vérifiez la section [Dépannage](#dépannage)
2. Consultez [TESTING.md](./TESTING.md) pour les tests
3. Consultez [DEPLOYMENT.md](./DEPLOYMENT.md) pour la prod

---

## ✨ Points clés à retenir

| Concept | Description |
|---------|-------------|
| **UUID** | Format `CNT-XXXXX`, généré automatiquement, unique en BD |
| **Statut** | ACTIF, INACTIF, EN_MAINTENANCE, HORS_SERVICE |
| **Socket.IO** | Notifications temps réel par zone |
| **Historique** | Tous les changements de statut sont enregistrés |
| **Port** | 8080 (API + Socket.IO + Swagger) |

---

## 🎉 Prêt ?

```bash
# 1. Clone le repo
# 2. Copie .env.example → .env
# 3. Édite .env avec tes identifiants
# 4. npm install
# 5. npm run init-db
# 6. npm run dev

# ✨ Le service tourne sur http://localhost:3011
```

Bonne chance ! 🚀
