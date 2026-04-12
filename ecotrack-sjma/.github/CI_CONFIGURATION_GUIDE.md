#  CI/CD Configuration Guide - EcoTrack

## Vue d'ensemble

Ce guide explique comment configurer **GitHub Actions (CI)** pour tester vos services avec la **pyramide de test** (Unit → Integration → E2E).

##  Ajouter un Service au CI

### Option 1: Configuration pour UN Service Spécifique

Exemple: Ajouter service-users avec tests complets

#### 1. Créer les Tests

```bash
cd services/service-users
npm init -y
npm install jest supertest --save-dev
```

#### 2. Structure des Tests

```
services/service-users/
├── __tests__/
│   ├── setup.js                 # Configuration globale
│   ├── unit/                    # ~20-30 tests (~60%)
│   │   ├── controllers/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/             # ~8-12 tests (~30%)
│   │   └── routes/
│   └── e2e/                     # ~2-4 tests (~10%)
│       └── workflows.e2e.test.js
├── jest.config.js
└── package.json
```

#### 3. Ajouter des Jobs au CI

Ajouter dans `.github/workflows/ci.yml`:

```yaml
  # =========================================================================
  # JOB 2X: UNIT TESTS - SERVICE-USERS
  # =========================================================================
  
  test-users-unit:
    name: ' Unit Tests (60%) - service-users'
    runs-on: ubuntu-latest
    needs: lint
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: ecotrack_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: 'Install dependencies'
        run: npm ci
        working-directory: services/service-users
      
      - name: 'Run Unit Tests'
        run: npm run test:unit
        working-directory: services/service-users
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/ecotrack_test

  # =========================================================================
  # JOB 2X1: INTEGRATION TESTS - SERVICE-USERS
  # =========================================================================
  
  test-users-integration:
    name: ' Integration Tests (30%) - service-users'
    runs-on: ubuntu-latest
    needs: test-users-unit
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: ecotrack_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: 'Install dependencies'
        run: npm ci
        working-directory: services/service-users
      
      - name: 'Run Integration Tests'
        run: npm run test:integration
        working-directory: services/service-users
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/ecotrack_test

  # =========================================================================
  # JOB 2X2: E2E TESTS - SERVICE-USERS
  # =========================================================================
  
  test-users-e2e:
    name: ' E2E Tests (10%) - service-users'
    runs-on: ubuntu-latest
    needs: test-users-integration
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: ecotrack_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: 'Install dependencies'
        run: npm ci
        working-directory: services/service-users
      
      - name: 'Run E2E Tests'
        run: npm run test:e2e
        working-directory: services/service-users
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/ecotrack_test
        continue-on-error: true
```

---

### Option 2: Configuration pour TOUS les Services (Matrice)

Si vous voulez tester plusieurs services avec le même pipeline:

```yaml
  # Configuration générique pour tous les services
  test-matrix:
    name: 'Tests - ${{ matrix.service }} (${{ matrix.test-type }})'
    runs-on: ubuntu-latest
    needs: lint
    
    strategy:
      matrix:
        include:
          # Service Users
          - service: service-users
            test-type: unit
            command: npm run test:unit
          - service: service-users
            test-type: integration
            command: npm run test:integration
          - service: service-users
            test-type: e2e
            command: npm run test:e2e
          
          # Service Containers
          - service: service-containers
            test-type: unit
            command: npm run test:unit
          - service: service-containers
            test-type: integration
            command: npm run test:integration
          
          # Service Gamifications
          - service: service-gamifications
            test-type: unit
            command: npm run test:unit
    
    services:
      postgres:
        image: postgis/postgis:16-3.4-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: ecotrack_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: 'Install dependencies'
        run: npm ci
        working-directory: services/${{ matrix.service }}
      
      - name: 'Run ${{ matrix.test-type }} tests'
        run: ${{ matrix.command }}
        working-directory: services/${{ matrix.service }}
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/ecotrack_test
        continue-on-error: true
```

---

##  Scripts de Rapports

### Disponibles dans `service-analytics`

```bash
# Tests + Rapports HTML individuels
npm run test:unit:html        # Génère unit-report.html
npm run test:integration:html # Génère integration-report.html
npm run test:e2e:html         # Génère e2e-report.html

# Tous les tests + Tous les rapports
npm run test:all:html         # Génère all-report.html

# Métriques de pyramide
npm run test:pyramid          # Génère metrics.json, report.html, metrics.csv

# Rapport complet (tous les tests + métriques)
npm run test:report           # Runall: tests + HTML reports + pyramid metrics
```

### Fichiers Générés

```
coverage/
├── html-reports/
│   ├── all-report.html           # Tous les tests
│   ├── unit-report.html          # 101 unit tests
│   ├── integration-report.html   # 32 integration tests
│   └── e2e-report.html           # 17 e2e tests
├── test-pyramid/
│   ├── metrics.json              # Données brutes (JSON)
│   ├── report.html               # Métriques visualisées
│   └── metrics.csv               # Export CSV pour tracking
└── junit/
    └── junit.xml                 # Format JUnit (compatible CI/CD)
```

---

##  Cibles de Couverture (Test Pyramid)

```
┌─────────────────────────────────────────────────┐
│         E2E Tests (10%)                       │  Coûteux
│         ~2-4 tests par service                │  Lent
├─────────────────────────────────────────────────┤
│    Integration Tests (30%)                    │  Moderate
│    ~8-12 tests par service                    │  Moyen
├─────────────────────────────────────────────────┤
│  Unit Tests (60%)                             │  Rapide
│  ~20-30 tests par service                     │  Bon marché
└─────────────────────────────────────────────────┘
```

##  Monitoring

### Board de Santé du CI

```
Badge dans le README:
![Unit Tests](https://YOUR_REPO.com/badge/unit-tests-green)
![E2E Tests](https://YOUR_REPO.com/badge/e2e-tests-yellow)
```

### Historique de Couverture

Codecov synthétise automatiquement les données de coverage:
- https://codecov.io/gh/YOUR_REPO

### Rapports HTML

Ouvrez les rapports HTML directement dans un navigateur:
- `coverage/html-reports/all-report.html`
- `coverage/test-pyramid/report.html`

---

## Troubleshooting

###  Les tests passent localement mais échouent en CI

**Cause**: Différences d'environnement

**Solution**:
```bash
# Simuler l'environnement CI
NODE_ENV=test npm test

# Vérifier les variables d'env
echo $DATABASE_URL
echo $NODE_ENV
```

###  E2E timeout

**Cause**: Services trop lents

**Solution**: Augmenter timeout dans jest.config.js
```javascript
testTimeout: 10000  // 10 secondes pour E2E
```

###  Permission denied pour scripts

**Solution**:
```bash
git update-index --chmod=+x scripts/*.js
```
