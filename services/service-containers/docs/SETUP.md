# 🚀 Setup & Installation Guide

**Durée**: 15 minutes | **Difficulty**: Facile | **Audience**: Developers

---

## 📋 Prérequis

- **Node.js** 18+ ([Download](https://nodejs.org))
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download))
- **npm** 9+

Vérifie:
```bash
node --version      # v18+ ou v20+
npm --version       # v9+
psql --version      # psql 12+
```

---

## ⚡ Installation Rapide (5 min)

### 1️⃣ Clone et Installe
```bash
cd services/service-containers
npm install
```

### 2️⃣ Configure la Base de Données

**Option A: Locale (Développement)**
```bash
# Édite .env
cp .env.example .env

# Configure dans .env:
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecotrack_containers
PGUSER=postgres
PGPASSWORD=password
PGHOST=localhost
PGPORT=5432
PGDATABASE=ecotrack_containers
```

**Option B: Docker (Recommandé)**
```bash
# Lance PostgreSQL dans Docker
docker run --name postgres_ecotrack \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ecotrack_containers \
  -p 5432:5432 \
  -d postgres:15
```

### 3️⃣ Initialise la BD
```bash
npm run init-db
```

### 4️⃣ Démarre l'Application
```bash
npm run dev
```

**Succès! 🎉**
```
╔════════════════════════════════════════════════════╗
║  🚀 EcoTrack Containers API                        ║
║  📍 http://localhost:3011/api                      ║
║  📚 Documentation: http://localhost:3011/api-docs  ║
║  🔌 Socket.IO: ws://localhost:3011                 ║
╚════════════════════════════════════════════════════╝
```

---

## 🔧 Configuration

### Fichier `.env` - Exemple Complet

```ini
# ========== SERVER ==========
NODE_ENV=development
APP_PORT=3011

# ========== DATABASE ==========
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecotrack_containers
PGUSER=postgres
PGPASSWORD=password
PGHOST=localhost
PGPORT=5432
PGDATABASE=ecotrack_containers

# ========== SOCKET.IO ==========
SOCKET_IO_ENABLED=true
SOCKET_CORS_ORIGIN=http://localhost:3011

# ========== LOGGING ==========
LOG_LEVEL=debug
```

### Variables d'Environnement Clés

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | 8080 | Port du serveur |
| `NODE_ENV` | development | Environnement (dev/prod) |
| `DATABASE_URL` | - | URL PostgreSQL **REQUIS** |
| `PGUSER` | postgres | Utilisateur DB |
| `PGPASSWORD` | - | Password DB **REQUIS** |
| `PGHOST` | localhost | Host DB |
| `PGPORT` | 5432 | Port DB |
| `PGDATABASE` | ecotrack_containers | Nom de la DB |

---

## 🧪 Vérification Installation

### 1️⃣ Teste la Connexion DB
```bash
npm run test:db
# Affiche: ✅ Database connected successfully
```

### 2️⃣ Teste l'API
```bash
curl http://localhost:3011/api
# Affiche JSON avec endpoints disponibles
```

### 3️⃣ Teste la Santé
```bash
curl http://localhost:3011/health
# Affiche: { status: "OK", services: { ... } }
```

### 4️⃣ Teste les Tests
```bash
npm run test:unit
# Affiche: Tests: 111 passed, 111 total ✅
```

---

## 📁 Structure de Dossiers

```
service-containers/
├─ src/
│  ├─ controllers/       # Logique requête/réponse
│  ├─ services/         # Logique métier
│  ├─ models/           # Requêtes DB
│  ├─ routes/           # Endpoints API
│  ├─ middleware/       # Middleware Express
│  ├─ config/           # Configuration
│  ├─ db/               # Connexion & SQL
│  ├─ socket/           # Socket.IO setup
│  └─ utils/            # Utilitaires (validators, errors)
│
├─ test/
│  ├─ unit/             # Tests unitaires
│  ├─ integration/       # Tests intégration
│  ├─ e2e/              # Tests end-to-end
│  └─ manual/           # Tests manuels
│
├─ docs/                # Documentation
├─ .env.example         # Exemple .env
├─ package.json         # Dependencies
├─ index.js             # Entry point
└─ README.md            # Ce fichier
```

---

## 📝 Scripts Disponibles

```bash
# 🚀 Développement
npm run dev              # Lance l'app en mode watch
npm run dev:debug        # Avec debugger Node.js

# 🧪 Tests
npm run test:unit        # Tests unitaires
npm run test:integration # Tests d'intégration
npm run test:all         # Tous les tests
npm test                 # Alias test:all

# 🔨 Production
npm run build            # Build (si applicable)
npm start                # Lance en production

# 🛠️ Utilitaires
npm run init-db          # Initialise la BD
npm run lint             # ESLint check
npm run format           # Prettier format
```

---

## 🐛 Troubleshooting

### ❌ "Cannot find module 'express'"
```bash
# Solution: Réinstalle les dépendances
rm -rf node_modules package-lock.json
npm install
```

### ❌ "Connection refused" (PostgreSQL)
```bash
# Vérifie que PostgreSQL tourne
psql -U postgres -c "SELECT 1;"

# Ou via Docker:
docker ps | grep postgres
```

### ❌ "port 3011 already in use"
```bash
# Change le port dans .env
PORT=8081

# Ou tue le processus (Linux/Mac):
lsof -i :8080 | grep -v PID | awk '{print $2}' | xargs kill -9
```

### ❌ "Database does not exist"
```bash
# Réinitialise la BD
npm run init-db
```

### ❌ Tests échouent
```bash
# Vérifie l'env
echo $NODE_ENV  # Devrait être 'test' ou 'development'

# Réexécute
npm run test:unit
```

---

## ✅ Checklist Post-Installation

- [ ] `npm install` complété
- [ ] `.env` configuré
- [ ] PostgreSQL tourne
- [ ] `npm run init-db` réussi
- [ ] `npm run dev` lance sans erreurs
- [ ] http://localhost:3011/api répond
- [ ] `npm run test:unit` passe (111/111)
- [ ] http://localhost:3011/health répond OK

---

## 🎯 Prochaines Étapes

1. **Comprendre l'architecture** → [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Écrire du code** → Consulte les [routes](../src/routes/)
3. **Ajouter Socket.IO** → [SOCKET_IO.md](./SOCKET_IO.md)
4. **Tester ton code** → [TESTING.md](./TESTING.md)
5. **Déployer** → [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 💡 Tips

**Développement rapide:**
```bash
# Terminal 1: Watch mode
npm run dev

# Terminal 2: Tests
npm run test:unit -- --watch
```

**Debug Node:**
```bash
npm run dev:debug
# Puis ouvre chrome://inspect
```

**Voir les logs en temps réel:**
```bash
npm run dev 2>&1 | grep -i "error\|socket\|api"
```

---

## 📞 Besoin d'Aide?

| Question | Réponse |
|----------|---------|
| Où configurer? | `.env` + [SETUP.md](./SETUP.md) |
| Erreur de BD? | [SETUP.md](./SETUP.md#troubleshooting) |
| Comment coder? | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Comment tester? | [TESTING.md](./TESTING.md) |
| En production? | [DEPLOYMENT.md](./DEPLOYMENT.md) |

---

*Setup guide professionnel et rapide*  
*Prêt en 15 minutes* ✅
