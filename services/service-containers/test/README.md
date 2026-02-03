# 🧪 Guide de Tests - Service Containers

## 📋 Structure des Tests

```
test/
├── unit/                           # Tests unitaires (logique isolée)
│   ├── container-services.test.js  # Tests service conteneurs
│   ├── zone-services.test.js       # Tests service zones
│   ├── type-conteneur-services.test.js
│   ├── container.test.js           # Tests modèle conteneurs
│   ├── zone.test.js                # Tests modèle zones
│   ├── validators.test.js          # Tests validateurs
│   ├── api-error.test.js           # Tests classe ApiError
│   ├── api-response.test.js        # Tests classe ApiResponse
│   ├── error-handler.test.js       # Tests middleware erreurs
│   ├── request-logger.test.js      # Tests middleware logging
│   └── socket-middleware.test.js   # Tests middleware Socket.IO
│
├── integration/                    # Tests d'intégration (avec DB/services)
│   ├── container-routes.test.js    # Tests routes API conteneurs
│   ├── zone-routes.test.js         # Tests routes API zones
│   ├── type-conteneur-routes.test.js
│   ├── socket.service.test.js      # Tests service Socket.IO
│   ├── socket.integration.test.js  # Tests intégration Socket
│   └── security.test.js            # Tests sécurité et validation
│
├── e2e/                            # Tests end-to-end (scénarios complets)
│   ├── socket.e2e.test.js          # Tests E2E Socket.IO
│   ├── user-scenarios.test.js      # Scénarios utilisateur complets
│   └── performance.test.js         # Tests de charge et stabilité
│
└── manual/                         # Scripts de test manuels
    ├── socket-client-test.js       # Client Socket.IO simple
    └── socket-interactive-test.js  # CLI interactive pour tests
```

## 🚀 Commandes de Test

### Tests Complets
```bash
npm test                    # Tous les tests
npm run test:unit          # Tests unitaires uniquement
npm run test:integration   # Tests d'intégration uniquement
npm run test:e2e           # Tests E2E uniquement
```

### Tests Spécifiques
```bash
# Tests Socket.IO
npm run test:socket        # Tests Socket.IO de base
npm run test:socket:integration
npm run test:socket:e2e

# Tests Routes
npm run test:routes        # Tous les tests de routes

# Tests Sécurité & Performance
npm run test:security      # Tests de sécurité
npm run test:performance   # Tests de charge
npm run test:scenarios     # Scénarios utilisateur
```

### Tests Manuels
```bash
npm run test:socket:client      # Client Socket.IO simple
npm run test:socket:interactive # CLI interactive
```

## 📊 Couverture des Tests

### Phase 1 ✅ - Tests Unitaires
- **Services** : container-services, zone-services, type-conteneur-services
- **Models** : container-model, zone-model
- **Utils** : Validators, ApiError, ApiResponse
- **Middleware** : error-handler, request-logger, socket-middleware

### Phase 2 ✅ - Tests Intégration
- **Routes API** : containers, zones, types
- **Socket.IO** : émission/réception d'événements
- **Sécurité** : validation, injection SQL/XSS, limites

### Phase 3 ✅ - Tests E2E
- **Scénarios utilisateur** : abonnement → notification
- **Multi-client** : diffusion à plusieurs clients
- **Performance** : charge, stabilité, fuites mémoire

## 🎯 Exemples d'Utilisation

### Tester les Services Unitairement
```javascript
// container-services.test.js
const service = new ContainerServices(mockModel, mockSocket);
await service.updateStatus(1, 'Plein');
expect(mockSocket.emitStatusChange).toHaveBeenCalled();
```

### Tester les Routes avec Supertest
```javascript
const response = await request(app)
  .post('/api/containers')
  .send(containerData)
  .expect(201);
```

### Tester Socket.IO E2E
```javascript
socketClient.emit('subscribe-zone', 1);
socketClient.on('container:status-changed', (data) => {
  expect(data.changed).toBe(true);
});
```

## ⚙️ Configuration

### Variables d'Environnement pour Tests
```bash
NODE_ENV=test
TEST_SERVER_URL=http://localhost:8080
DB_TEST_HOST=localhost
DB_TEST_PORT=5432
DB_TEST_NAME=ecotrack_test
```

### Avant de Lancer les Tests
1. **Base de données de test**
   ```bash
   npm run init-db
   ```

2. **Serveur démarré** (pour tests E2E)
   ```bash
   npm start  # Dans un terminal séparé
   ```

## 📈 Métriques de Qualité

### Objectifs
- ✅ Couverture de code > 80%
- ✅ Tous les tests unitaires passent
- ✅ Tests d'intégration avec DB mock
- ✅ Scénarios E2E complets
- ✅ Tests de sécurité (injection, validation)
- ✅ Tests de performance (charge, stabilité)

### Prochaines Étapes (Optionnel)
- [ ] CI/CD avec GitHub Actions
- [ ] Code coverage reporting
- [ ] Tests de régression automatisés
- [ ] Load testing avec k6 ou Artillery

## 🐛 Debugging des Tests

### Tests qui échouent
```bash
# Exécuter un seul fichier de test
npx jest test/unit/container-services.test.js

# Mode watch
npx jest --watch

# Avec logs détaillés
npx jest --verbose
```

### Tests Socket.IO timeout
- Vérifier que le serveur est démarré
- Augmenter le timeout dans le test : `jest.setTimeout(10000)`
- Vérifier les ports (8080 par défaut)

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Socket.IO Testing](https://socket.io/docs/v4/testing/)
