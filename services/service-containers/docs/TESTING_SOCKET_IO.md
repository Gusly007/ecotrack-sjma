# 🧪 Guide Complet de Test Socket.IO

## 📋 Table des matières
1. [Tests Unitaires](#tests-unitaires)
2. [Tests d'Intégration](#tests-dintégration)
3. [Tests E2E](#tests-e2e)
4. [Tests Manuels](#tests-manuels)
5. [Dépannage](#dépannage)

---

## Tests Unitaires

### Qu'est-ce que c'est?
Tests isolés du SocketService sans dépendances externes.

### Lancer les tests
```bash
npm run test:socket
```

### Qu'est-ce qui est testé?
- ✅ Initialisation de Socket.IO avec CORS
- ✅ Émission d'événements `container:status-changed`
- ✅ Émission vers une room spécifique
- ✅ Broadcast à tous les clients
- ✅ Récupération de l'instance Socket.IO

### Exemple de sortie
```
PASS  test/socket.service.test.js
  SocketService
    Initialization
      ✓ should initialize Socket.IO with CORS enabled
      ✓ should have CORS settings
    emitStatusChange
      ✓ should emit status change to the correct zone
      ✓ should emit correct event name
      ✓ should include timestamp in emitted data
    emit
      ✓ should broadcast to all clients
    emitToRoom
      ✓ should emit to a specific room
    getIO
      ✓ should return the io instance

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

---

## Tests d'Intégration

### Qu'est-ce que c'est?
Tests de l'intégration entre ContainerService et SocketService.

### Lancer les tests
```bash
npm run test:socket:integration
```

### Qu'est-ce qui est testé?
- ✅ Émission au changement de statut
- ✅ Non-émission si le statut ne change pas
- ✅ Gestion des erreurs Socket
- ✅ Fonctionnement sans SocketService
- ✅ Émission vers la bonne zone
- ✅ Gestion des conteneurs sans zone

### Exemple de test
```javascript
it('should emit status change when status is updated', async () => {
  const result = await containerService.updateStatus(1, 'EN_MAINTENANCE');
  
  expect(result.changed).toBe(true);
  expect(mockSocketService.emitStatusChange).toHaveBeenCalledWith(
    1, 
    expect.objectContaining({
      id_conteneur: 1,
      nouveau_statut: 'EN_MAINTENANCE'
    })
  );
});
```

---

## Tests E2E

### Qu'est-ce que c'est?
Tests complets client/serveur avec socket.io-client.

### ⚠️ Préalables
- Le serveur doit être lancé: `npm start` (dans un autre terminal)
- Attendre le message: `🚀 EcoTrack Containers API is running on port 3000`

### Lancer les tests
```bash
npm run test:socket:e2e
```

### Qu'est-ce qui est testé?
- ✅ Connexion au serveur
- ✅ Socket ID unique
- ✅ Déconnexion gracieuse
- ✅ S'abonner à une zone
- ✅ Se désabonner d'une zone
- ✅ Abonnements multiples
- ✅ Réception des événements
- ✅ Gestion des erreurs de connexion
- ✅ Reconnexion automatique

---

## Tests Manuels

### 🔧 Option 1: Client Test Simple

Lancer dans un terminal:
```bash
node test-socket-client.js
```

Puis dans un autre terminal, changer le statut:
```bash
curl -X PATCH http://localhost:3000/api/containers/1/status \
  -H "Content-Type: application/json" \
  -d '{"statut": "EN_MAINTENANCE"}'
```

**Résultat attendu:**
```
✅ Connecté au serveur Socket.IO
📍 Socket ID: abc123xyz
📢 Souscription à la zone 1...

🔔 ✨ NOTIFICATION DE CHANGEMENT DE STATUT ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ID Conteneur: 1
  UID: CNT-ABC123XYZ789
  Ancien Statut: ACTIF
  Nouveau Statut: EN_MAINTENANCE 🟢
  Date: 16/01/2025 à 14:30:45
  Zone: 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 🎮 Option 2: Testeur Interactif

Lancer:
```bash
npm run test:socket:interactive
```

Menu disponible:
```
📋 MENU:
  1. S'abonner à une zone
  2. Se désabonner d'une zone
  3. Afficher les zones actives
  4. Simuler un changement de statut
  5. Afficher l'aide
  6. Quitter
```

**Pas à pas:**

1. Sélectionner "1" pour s'abonner à la zone 1
2. Dans un autre terminal:
```bash
curl -X PATCH http://localhost:3000/api/containers/1/status \
  -H "Content-Type: application/json" \
  -d '{"statut": "EN_MAINTENANCE"}'
```
3. Voir la notification s'afficher

---

### 📡 Option 3: Postman/Insomnia

#### 1. S'abonner via WebSocket
- Ouvrir Postman → New → WebSocket
- URL: `ws://localhost:3000`
- Envoyer: 
```json
{
  "type": "subscribe-zone",
  "data": 1
}
```

#### 2. Écouter les événements
- Dans un autre onglet, faire une requête:
```
PATCH http://localhost:3000/api/containers/1/status
Content-Type: application/json

{
  "statut": "EN_MAINTENANCE"
}
```

#### 3. Voir la notification dans le WebSocket

---

### 🌐 Option 4: cURL + wscat

```bash
# Terminal 1: Installer wscat
npm install -g wscat

# Terminal 2: Connecter et écouter
wscat -c ws://localhost:3000

# Dans wscat, envoyer:
> {"type":"subscribe-zone","data":1}

# Terminal 3: Changer le statut
curl -X PATCH http://localhost:3000/api/containers/1/status \
  -H "Content-Type: application/json" \
  -d '{"statut": "EN_MAINTENANCE"}'

# Terminal 2: Voir la notification
< {"id_conteneur":1,"uid":"CNT-...","ancien_statut":"ACTIF",...}
```

---

## 🧪 Commandes de Test Rapide

```bash
# Tous les tests
npm test

# Seulement les tests Socket
npm run test:socket

# Tests d'intégration
npm run test:socket:integration

# Tests E2E (serveur doit être lancé)
npm run test:socket:e2e

# Testeur interactif
npm run test:socket:interactive

# Client test simple
npm run test:socket:client
```

---

## 📊 Matrice de Test

| Test | Type | Durée | Serveur | Résultat |
|------|------|-------|---------|----------|
| `test:socket` | Unitaire | <1s | ❌ Non | Rapide |
| `test:socket:integration` | Intégration | <2s | ❌ Non | Fiable |
| `test:socket:e2e` | E2E | 5-10s | ✅ Oui | Exhaustif |
| `test:socket:interactive` | Manuel | ∞ | ✅ Oui | Interactif |
| `test:socket:client` | Manuel | ∞ | ✅ Oui | Simplifié |

---

## 🐛 Dépannage

### ❌ Erreur: "Cannot find module 'socket.io-client'"

**Solution:** Installer les dépendances
```bash
npm install
```

### ❌ Erreur: "ECONNREFUSED: connection refused"

**Solution:** Lancer d'abord le serveur
```bash
npm start  # Dans un autre terminal
```

### ❌ Pas de notification reçue

**Vérifier:**
1. Êtes-vous abonné à la bonne zone?
```javascript
socket.emit('subscribe-zone', 1); // Zone 1
```

2. Le conteneur a-t-il une zone définie?
```bash
# Vérifier dans la DB
SELECT id_conteneur, id_zone FROM conteneur WHERE id_conteneur = 1;
```

3. Le statut change-t-il vraiment?
```bash
# Avant
curl http://localhost:3000/api/containers/id/1

# Changer
curl -X PATCH http://localhost:3000/api/containers/1/status \
  -H "Content-Type: application/json" \
  -d '{"statut": "EN_MAINTENANCE"}'

# Après
curl http://localhost:3000/api/containers/id/1
```

### ❌ Erreur: "Port 3000 already in use"

**Solution:** Tuer le processus
```bash
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>

# Ou utiliser un autre port
PORT=3001 npm start
```

### ⚠️ Warning: "Possible EventEmitter memory leak detected"

**Solution:** C'est normal lors du test. Pour éviter:
```bash
npm run test:socket:e2e -- --detectOpenHandles
```

---

## 📈 Cas de Test Détaillés

### Cas 1: Changement de Statut Simple
```bash
# Avant
curl http://localhost:3000/api/containers/id/1
# {"statut": "ACTIF", "id_zone": 1}

# Changer
curl -X PATCH http://localhost:3000/api/containers/1/status \
  -H "Content-Type: application/json" \
  -d '{"statut": "EN_MAINTENANCE"}'

# Notification reçue?
socket.on('container:status-changed', (data) => {
  console.log(data);
  // {
  //   id_conteneur: 1,
  //   uid: "CNT-...",
  //   ancien_statut: "ACTIF",
  //   nouveau_statut: "EN_MAINTENANCE",
  //   date_changement: "2025-01-16T10:30:45.123Z",
  //   id_zone: 1
  // }
});
```

### Cas 2: Plusieurs Zones
```bash
# S'abonner aux zones 1 et 2
socket.emit('subscribe-zone', 1);
socket.emit('subscribe-zone', 2);

# Changer un conteneur de la zone 1 → Reçu ✅
curl -X PATCH http://localhost:3000/api/containers/1/status \
  -H "Content-Type: application/json" \
  -d '{"statut": "INACTIF"}'

# Changer un conteneur de la zone 2 → Reçu ✅
curl -X PATCH http://localhost:3000/api/containers/2/status \
  -H "Content-Type: application/json" \
  -d '{"statut": "HORS_SERVICE"}'

# Changer un conteneur de la zone 3 → Non reçu ❌
curl -X PATCH http://localhost:3000/api/containers/3/status \
  -H "Content-Type: application/json" \
  -d '{"statut": "EN_MAINTENANCE"}'
```

### Cas 3: Clients Multiples
```bash
# Terminal 1: Client A
node test-socket-interactive.js
# → S'abonner à zone 1

# Terminal 2: Client B
node test-socket-interactive.js
# → S'abonner à zone 1

# Terminal 3: Changer le statut
curl -X PATCH http://localhost:3000/api/containers/1/status \
  -H "Content-Type: application/json" \
  -d '{"statut": "EN_MAINTENANCE"}'

# Les deux clients reçoivent la notification ✅✅
```

---

## 💡 Bonnes Pratiques

1. **Toujours vérifier l'id_zone**: Les notifications ne sont émises que si le conteneur a une zone
2. **Vérifier la souscription**: S'assurer d'être abonné à la zone avant d'attendre les notifications
3. **Nettoyer les abonnements**: Se désabonner quand on n'en a plus besoin
4. **Gérer les reconnexions**: Socket.IO reconnecte automatiquement
5. **Tester les cas limites**: Statut inchangé, zone null, etc.

---

## 📚 Ressources

- [Socket.IO Documentation](https://socket.io/docs/)
- [Socket.IO Testing Guide](https://socket.io/docs/v4/testing/)
- [Jest Documentation](https://jestjs.io/)
