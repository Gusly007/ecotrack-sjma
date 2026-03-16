# 🧪 Guide des Tests - Service Routes

## Lancer les tests

```bash
cd services/service-routes
npm test
```

**Résultat attendu :**
```
Test Suites: 12 passed, 12 total
Tests:       141 passed, 141 total
Time:        ~0.5s
```

---

## Structure des tests

```
test/unit/
├── utils/
│   ├── api-error.test.js           # 5 tests  — ApiError (statusCode, factories)
│   └── api-response.test.js        # 5 tests  — success(), error(), paginated()
│
├── middleware/
│   └── error-handler.test.js       # 5 tests  — ApiError, codes PG, erreur générique
│
├── services/
│   ├── optimization-service.test.js # 21 tests — haversine, NN, 2-opt, optimizeRoute
│   ├── tournee-service.test.js      # 20 tests — CRUD + progress + optimisation logique
│   ├── vehicule-service.test.js     # 12 tests — CRUD vehicule
│   ├── collecte-service.test.js     # 16 tests — recordCollecte, reportAnomalie
│   └── stats-service.test.js        # 9 tests  — dashboard, kpis, comparaison algo
│
└── controllers/
    ├── tournee-controller.test.js   # 18 tests — statuts HTTP, propagation erreurs
    ├── vehicule-controller.test.js  # 10 tests — statuts HTTP
    ├── collecte-controller.test.js  # 12 tests — x-user-id header, statuts HTTP
    └── stats-controller.test.js     # 8 tests  — délégation service + db
```

---

## Pattern de test

### Services (avec mocks des repositories)

```javascript
// Mock du repository
const mockTourneeRepo = {
  create:    jest.fn(),
  findById:  jest.fn(),
  findAll:   jest.fn(),
  // ...
};
const mockCollecteRepo = { getTourneeProgress: jest.fn() };

// Instanciation avec injection de dépendances
const service = new TourneeService(mockTourneeRepo, mockCollecteRepo);

beforeEach(() => {
  jest.clearAllMocks(); // Réinitialiser les mocks entre chaque test
});

// Test nominal
it('devrait retourner la tournée si trouvée', async () => {
  const tournee = { id_tournee: 1, statut: 'PLANIFIEE' };
  mockTourneeRepo.findById.mockResolvedValue(tournee);

  const result = await service.getTourneeById(1);

  expect(result).toEqual(tournee);
  expect(mockTourneeRepo.findById).toHaveBeenCalledWith(1);
});

// Test cas d'erreur
it('devrait lever ApiError 404 si introuvable', async () => {
  mockTourneeRepo.findById.mockResolvedValue(null);

  await expect(service.getTourneeById(99)).rejects.toMatchObject({
    statusCode: 404,
    message: expect.stringContaining('99')
  });
});
```

### Controllers (avec mocks des services)

```javascript
const mockService = {
  createTournee: jest.fn(),
  getTourneeById: jest.fn(),
};
const controller = new TourneeController(mockService, {});

let req, res, next;

beforeEach(() => {
  jest.clearAllMocks();
  req  = { body: {}, params: {}, query: {}, headers: {} };
  res  = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  next = jest.fn();
});

it('devrait retourner 201 avec la tournée créée', async () => {
  const tournee = { id_tournee: 1 };
  mockService.createTournee.mockResolvedValue(tournee);

  await controller.create(req, res, next);

  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ success: true, data: tournee })
  );
});

it('devrait appeler next en cas d\'erreur', async () => {
  const err = new Error('erreur');
  mockService.createTournee.mockRejectedValue(err);

  await controller.create(req, res, next);

  expect(next).toHaveBeenCalledWith(err);
});
```

### Optimization Service (fonctions pures, pas de mock)

```javascript
const { haversineDistance, optimizeRoute } = require('../../../src/services/optimization-service');

it('devrait être symétrique', () => {
  const d1 = haversineDistance(48.8566, 2.3522, 48.8606, 2.3376);
  const d2 = haversineDistance(48.8606, 2.3376, 48.8566, 2.3522);
  expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
});
```

---

## Ajouter un nouveau test

### 1. Pour un nouveau service

```bash
# Créer le fichier
touch test/unit/services/mon-service.test.js
```

```javascript
const MonService = require('../../../src/services/mon-service');

const mockRepo = { maMethode: jest.fn() };
const service  = new MonService(mockRepo);

beforeEach(() => jest.clearAllMocks());

describe('MonService.maMethode', () => {
  it('devrait ...', async () => {
    mockRepo.maMethode.mockResolvedValue({ id: 1 });
    const result = await service.maMethode(1);
    expect(result).toEqual({ id: 1 });
  });
});
```

### 2. Pour un nouveau controller

Même pattern que ci-dessus avec `req`, `res`, `next` mockés.

---

## Cas à toujours tester

Pour chaque méthode de service :
-  **Cas nominal** — données valides, retour attendu
-  **404 Not Found** — ressource inexistante
-  **400 Bad Request** — validation Joi invalide
-  **Vérifications métier** — ex. "impossible de supprimer EN_COURS"

Pour chaque méthode de controller :
-  **Statut HTTP correct** — 200, 201
-  **Propagation erreur** — `next(err)` appelé si service lève
-  **Header X-User-Id** — si utilisé par la méthode

---

## Configuration Jest

`package.json` :

```json
{
  "jest": {
    "testEnvironment": "node",
    "testMatch": ["**/test/unit/**/*.test.js"],
    "verbose": false
  }
}
```

Lancer en mode verbose :

```bash
npm test -- --verbose
```

Lancer un seul fichier :

```bash
npm test -- optimization-service
npm test -- tournee-service
```
