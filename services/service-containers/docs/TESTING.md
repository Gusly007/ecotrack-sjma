# 🧪 Guide des Tests Socket.IO

## 📋 Fichiers de Test

### Tests Automatisés (Jest)
Situés dans `test/` et exécutés avec `npm run test:*`

| Fichier | Commande | Description |
|---------|----------|-------------|
| `test/socket.service.test.js` | `npm run test:socket` | Tests unitaires de Socket.IO avec mocks |
| `test/socket.integration.test.js` | `npm run test:socket:integration` | Tests d'intégration ContainerServices + Socket |
| `test/socket.e2e.test.js` | `npm run test:socket:e2e` | Tests E2E avec socket.io-client (serveur requis) |

### Tests Manuels (Node.js)
Exécutés directement pour développement/debugging

| Fichier | Commande | Description |
|---------|----------|-------------|
| `test-socket-client.js` | `npm run test:socket:client` | Client Socket.IO simple pour tester les notifications |
| `test-socket-interactive.js` | `npm run test:socket:interactive` | Interface CLI interactive pour tester |

---

## 🚀 Démarrage Rapide

### 1️⃣ Lancer les tests automatisés

```bash
# Tests unitaires (rapide, 0-1s)
npm run test:socket

# Tests d'intégration (rapide, 0-1s)
npm run test:socket:integration

# Tests E2E (nécessite serveur en marche)
npm run test:socket:e2e
```

### 2️⃣ Tester manuellement avec le serveur

**Terminal 1 - Démarrer le serveur:**
```bash
npm run dev
# ou
npm start
```

**Terminal 2 - Lancer le client test:**
```bash
npm run test:socket:client
```

Le client affichera:
```
✅ Connecté au serveur Socket.IO
ID du socket: abc123...
📢 S'abonnement à la zone 1...
```

### 3️⃣ Tester via l'API REST

Pendant que le serveur tourne:
```bash
# Changer le statut d'un conteneur
PATCH http://localhost:3011/api/containers/:id/status
Content-Type: application/json

{
  "statut": "INACTIF"
}

# Notification reçue dans Terminal 2:
# 🔔 Notification reçue:
#    Conteneur: CNT-123456789
#    Nouveau statut: INACTIF
#    Zone: 1
```

---

## 📊 Architecture Socket.IO

```
┌─────────────────┐
│  Client Browser │
│   (React/Vue)   │
└────────┬────────┘
         │ WebSocket
         ▼
┌─────────────────────────────────────┐
│  EcoTrack API (port 3011)           │
├─────────────────────────────────────┤
│  ✅ Express Routes                  │
│  ✅ Socket.IO Server                │
│  ✅ Zone-based rooms                │
│     (zone-1, zone-2, ...)           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  ContainerServices                  │
│  → updateStatus()                   │
│  → Emit: container:status-changed   │
│     to: room zone-{id_zone}         │
└─────────────────────────────────────┘
```

---

## 🔌 Événements Socket.IO

### Client → Serveur

```javascript
// S'abonner à une zone
socket.emit('subscribe-zone', { id_zone: 1 });

// Se désabonner d'une zone
socket.emit('unsubscribe-zone', { id_zone: 1 });
```

### Serveur → Client

```javascript
// Changement de statut d'un conteneur
socket.on('container:status-changed', (data) => {
  console.log(data);
  // {
  //   id_conteneur: 1,
  //   uid: "CNT-123456789",
  //   ancien_statut: "ACTIF",
  //   nouveau_statut: "INACTIF",
  //   date_changement: "2026-01-16T12:00:00.000Z",
  //   id_zone: 1
  // }
});
```

---

## ✅ Vérifications

- ✅ Socket.IO fonctionne sur le même port que l'API (8080)
- ✅ WebSocket activé (transports: ['websocket', 'polling'])
- ✅ CORS configuré pour accepter toutes les origines
- ✅ Rooms par zone pour broadcaster sélectif
- ✅ Graceful fallback si socketService unavailable
- ✅ Tests manuels et automatisés disponibles

---

## 🐛 Troubleshooting

### Erreur: "websocket error"
```
❌ [CLIENT] Erreur: websocket error
```

**Vérifications:**
1. Le serveur est lancé? → `npm run dev` ou `npm start`
2. Le port 3011 est libre? → `netstat -ano | findstr :8080`
3. Socket.IO s'initialise? → Logs du serveur doivent afficher `[Socket] Socket.IO initialisé`

### Tests Jest échouent
```
FAIL test/socket.e2e.test.js
```

**Solution:**
- E2E tests nécessitent le serveur en marche
- Démarrer le serveur avant: `npm run dev &`
- Puis lancer: `npm run test:socket:e2e`

### Client ne reçoit pas les notifications
1. ✅ Client s'abonne? Vérifier console: `[Socket] joined room: zone-1`
2. ✅ Status changé? Appeler l'API PATCH
3. ✅ Zone correcte? L'ID du conteneur doit avoir `id_zone: 1` en BD

---

## 📚 Documentation Complète

Voir `docs/SOCKET_IO.md` pour:
- Exemples React/Vue
- Implémentation client complète
- Gestion des reconnexions
- Erreurs et fallbacks

Voir `docs/TESTING_SOCKET_IO.md` pour:
- Stratégies de test détaillées
- Configuration Jest
- Mocking Socket.IO
