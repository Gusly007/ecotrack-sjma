# WebSocket — Notifications temps réel

## Vue d'ensemble

Le service expose **deux serveurs Socket.IO** sur le même port HTTP (3016), chacun avec un chemin (`path`) distinct :

| Chemin WS | Service | Audience | Événements |
|-----------|---------|----------|------------|
| `/ws/notifications` | `WebSocketNotifService` | GESTIONNAIRE + ADMIN | `notification:new` |
| `/ws/admin` | `WebSocketAdminService` | ADMIN uniquement | `admin:notification`, `admin:urgent`, `admin:alert`, `admin:stats` |

Les deux services sont instanciés après `server.listen()` dans `index.js` et reçoivent le serveur HTTP brut. Socket.IO les attache au même port sans conflit grâce aux chemins différents.

---

## Proxy WebSocket — api-gateway

Le navigateur ne se connecte jamais directement au service-notification. Il passe toujours par l'**api-gateway** (port 3000) :

```
Navigateur
    │
    │ WS ws://localhost:3000/ws/notifications?EIO=4&transport=websocket
    ▼
api-gateway :3000
    │
    │ server.on('upgrade', wsNotifProxy.upgrade)
    │ pathRewrite : /ws/* → /ws/*  (pass-through)
    ▼
service-notification :3016
    │
    └─ Socket.IO server path='/ws/notifications'
```

**Configuration dans `api-gateway/src/index.js` :**

```js
// Créé AVANT les routes Express et le middleware JWT
const wsNotifProxy = createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3016',
  changeOrigin: true,
  ws: true,
  pathRewrite: (_path) => _path.startsWith('/ws') ? _path : `/ws${_path}`,
});

app.use('/ws', wsNotifProxy);                              // polling HTTP
app.locals._wsNotifProxy = wsNotifProxy;

// Après server.listen()
server.on('upgrade', wsNotifProxy.upgrade);               // upgrade WebSocket
```

**Points importants :**
- Le proxy est enregistré **avant** le middleware JWT du gateway — l'authentification WS est gérée par le service-notification lui-même
- Le transport polling passe par Express (`app.use('/ws', ...)`)
- L'upgrade WebSocket passe directement par `server.on('upgrade', ...)`, en dehors de la chaîne Express

---

## WebSocketNotifService — `/ws/notifications`

Fichier : `src/services/websocketNotifService.js`

### Authentification

Chaque connexion Socket.IO est validée par un middleware avant l'établissement :

```js
this.io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Token requis'));

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.userId = decoded.id || decoded.id_utilisateur;
  socket.userRole = decoded.role || decoded.role_par_defaut;
  next();
});
```

Le JWT Bearer utilisé pour les requêtes HTTP est réutilisé pour l'auth WS. Il est transmis dans `socket.handshake.auth.token` (pas dans un header HTTP standard).

### Rooms

À la connexion, chaque socket rejoint sa room personnelle :

```js
socket.join(`user:${socket.userId}`);
```

Cela permet d'envoyer une notification à un utilisateur précis, même s'il a plusieurs onglets ouverts — tous les onglets recevront l'événement.

### Émission

```js
emitToUser(userId, notification) {
  this.io.to(`user:${userId}`).emit('notification:new', notification);
}
```

Appelé depuis l'endpoint `/internal/emit-ws`.

### Événements reçus par le navigateur

| Événement | Contenu | Déclencheur |
|-----------|---------|-------------|
| `notification:new` | `{ type, titre, corps }` | Appel `/internal/emit-ws` |

---

## WebSocketAdminService — `/ws/admin`

Fichier : `src/services/websocketAdminService.js`

### Authentification (plus stricte)

```js
this.io.use((socket, next) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.role !== 'ADMIN' && decoded.role_par_defaut !== 'ADMIN') {
    return next(new Error('Accès admin requis'));
  }
  socket.user = decoded;
  next();
});
```

Seuls les tokens avec `role = 'ADMIN'` peuvent se connecter à `/ws/admin`.

### Rooms admin

| Room | Membres |
|------|---------|
| `admin:all` | Tous les admins connectés |
| `admin:user:{id}` | Un admin spécifique (multi-onglets) |
| `admin:priority:{N}` | Admins abonnés à une priorité (via event `subscribe:priority`) |
| `admin:category:{cat}` | Admins abonnés à une catégorie (via event `subscribe:category`) |

### Abonnements client → serveur

```js
// Côté navigateur (admin)
socket.emit('subscribe:priority', 1);        // priorité URGENT
socket.emit('subscribe:category', 'ALERTE'); // catégorie ALERTE
socket.emit('ping');                         // → pong
```

### Événements serveur → client

| Événement | Room cible | Condition |
|-----------|-----------|-----------|
| `admin:notification` | `admin:user:{id}` + `admin:all` si priorité ≤ HAUTE | toujours |
| `admin:urgent` | `admin:all` | priorité === URGENT |
| `admin:alert` | `admin:all` | via `emitAlert()` |
| `admin:stats` | `admin:all` | via `emitStatsUpdate()` |

---

## Endpoint interne `/internal/emit-ws`

Défini dans `index.js`. Permet aux autres microservices d'envoyer des événements WS **sans passer par le gateway** (communication interne Docker).

### Sécurité

```
x-internal-secret: {INTERNAL_SECRET}
```

`INTERNAL_SECRET` = `process.env.INTERNAL_SECRET || process.env.JWT_SECRET`. Partagé entre tous les services via les variables d'environnement Docker.

### Corps de la requête

```json
{
  "userIds": [33, 34],
  "notification": {
    "type": "ALERTE",
    "titre": "Anomalie signalée",
    "corps": "Conteneur #12 inaccessible"
  }
}
```

### Ce que fait l'endpoint

```js
for (const uid of userIds) {
  wsService.emitToUser(uid, notification);           // Socket.IO room emit
}
for (const uid of userIds) {
  notifService._invalidateUserCache(uid);            // Redis DEL
}
```

### Réponse

```json
{ "ok": true, "emitted": 2 }
```

> `emitted` = `userIds.length` — c'est le nombre d'utilisateurs ciblés, pas le nombre de sockets réellement connectés. Si aucun navigateur n'est ouvert, l'émission est silencieuse (la notification existe en DB et sera visible au prochain chargement).

### Appel depuis service-routes

Fichier : `services/service-routes/src/utils/notifyStaff.js`

```js
// Fire-and-forget — n'attend pas la réponse
axios.post(
  `${NOTIFICATION_SERVICE_URL}/internal/emit-ws`,
  { userIds, notification: { type, titre, corps } },
  { headers: { 'x-internal-secret': INTERNAL_SECRET }, timeout: 3000 }
).catch(() => { /* non-critical */ });
```

---

## Flux complet — agent signale une anomalie

```
1. AGENT
   POST /api/routes/tournees/18641/anomalie
   { type_anomalie: "CONTENEUR_INACCESSIBLE", gravite: "Haute", description: "..." }

2. service-routes :3012
   ├─ Vérifie tournée active (est_active=true, statut=EN_COURS)
   ├─ INSERT INTO anomalie (DB)
   └─ notifyAllStaff(db, { type:'ALERTE', titre:'Anomalie signalée', corps:'...', priorite:1 })
          │
          ├─ SELECT id_utilisateur WHERE role IN ('GESTIONNAIRE','ADMIN') AND est_active=true
          │  → [33 (admin), 34 (gestionnaire)]
          │
          ├─ INSERT INTO notification VALUES (33,...), (34,...)
          │
          └─ POST http://ecotrack-service-notification:3016/internal/emit-ws
             { userIds: [33, 34], notification: { type, titre, corps } }

3. service-notification :3016
   /internal/emit-ws
   ├─ WebSocketNotifService.emitToUser(33, notif)
   │     → io.to('user:33').emit('notification:new', notif)
   ├─ WebSocketNotifService.emitToUser(34, notif)
   │     → io.to('user:34').emit('notification:new', notif)
   ├─ _invalidateUserCache(33)  → DEL ecotrack:notifications:unread:33
   └─ _invalidateUserCache(34)  → DEL ecotrack:notifications:unread:34

4. NAVIGATEUR GESTIONNAIRE (id=34)
   Socket.IO reçoit 'notification:new'
   NotificationContext.jsx :
   ├─ setUnreadCount(prev => prev + 1)         → badge cloche +1 (temps réel)
   ├─ playChime()                               → son notification
   └─ dispatchEvent('notifications-refresh')   → DesktopLayout recharge la liste

   DesktopLayout.jsx :
   ├─ wsUnreadCount (depuis context) mis à jour → chiffre sur la cloche
   └─ loadNotifications() déclenché            → liste déroulante mise à jour

5. NAVIGATEUR ADMIN (id=33)
   Même flux
```

---

## Chemin de secours — polling HTTP

Si le navigateur ne parvient pas à établir la connexion WebSocket, `NotificationContext.jsx` bascule automatiquement sur du polling HTTP :

```
Toutes les 15 secondes :
    GET /api/notifications/unread/count
         │
         ├─ wsAlive = socketRef.current?.connected
         │
         ├─ Si wsAlive=true  → Math.max(prev, count)  — ne réduit pas le badge
         │                                              si le cache est périmé
         └─ Si wsAlive=false → setUnreadCount(count)
                               + playChime() si count > baseline
```

**Baseline** : valeur du compteur au dernier chargement de page, persistée en `localStorage` sous la clé `notif_baseline_{userId}`. Permet de détecter les nouvelles notifications même après un redémarrage du navigateur.

---

## Frontend — intégration complète

### `NotificationContext.jsx`

```
src/context/NotificationContext.jsx
```

| Responsabilité | Implémentation |
|---------------|----------------|
| Connexion WS | `io(WS_URL, { path: '/ws/notifications', auth: (cb) => cb({ token: localStorage.getItem('token') }), transports: ['polling', 'websocket'] })` |
| Auth fraîche sur reconnexion | `auth` en form fonction (token lu à chaque tentative) |
| Badge en temps réel | `socket.on('notification:new', () => setUnreadCount(prev => prev + 1))` |
| Son | `playChime()` — WAV inline généré programmatiquement, unlocked par geste utilisateur |
| Son différé | `_pendingChime = true` si autoplay bloqué → joue au prochain clic/toucher |
| Polling fallback | `setInterval(fetchCount, 15000)` |
| Anti-régression cache | `Math.max(prev, count)` quand WS vivant |
| Refresh liste | `dispatchEvent('notifications-refresh')` à chaque `notification:new` |

### `DesktopLayout.jsx`

```
src/components/desktop/DesktopLayout.jsx
```

| Responsabilité | Implémentation |
|---------------|----------------|
| Badge cloche temps réel | `const { unreadCount: wsUnreadCount } = useNotifications()` → context WS |
| Chiffre affiché | `{wsUnreadCount > 0 && <span className="badge-notif">{wsUnreadCount}</span>}` |
| Liste déroulante | `loadNotifications()` au montage + sur event `notifications-refresh` |
| Mise à jour liste | Recharge automatiquement quand WS livre `notification:new` |

### `hooks/index.js`

```js
export { useNotifications } from '../context/NotificationContext';
```

Re-exporte depuis le contexte WS (pas depuis l'ancien hook standalone `useNotifications.js`).

---

## Authentification WS — flux détaillé

```
1. Navigateur : const socket = io('http://localhost:3000', {
                  path: '/ws/notifications',
                  auth: (cb) => cb({ token: localStorage.getItem('token') }),
                  transports: ['polling', 'websocket']
                });

2. Socket.IO client → HTTP GET /ws/notifications/?EIO=4&transport=polling
   → api-gateway (Express) → app.use('/ws', proxy) → service-notification

3. Engine.IO handshake → retourne session ID

4. Socket.IO client → WS upgrade /ws/notifications/?EIO=4&transport=websocket&sid=xxx
   → api-gateway server.on('upgrade') → wsProxy.upgrade → service-notification

5. service-notification Socket.IO middleware :
   jwt.verify(socket.handshake.auth.token, JWT_SECRET)
   → OK  : socket.userId = 34 ; socket.join('user:34')
   → KO  : next(new Error('Token invalide')) → connexion refusée

6. Reconnexion automatique (token toujours frais) :
   Socket.IO reconnecte avec backoff 2s → 4s → 8s → ... → 15s max
   auth function appelée à chaque tentative → lit localStorage.getItem('token')
   → si le token HTTP a été rafraîchi entre-temps, la reconnexion WS réussit
```

---

## Debugging

### Logs côté service

```bash
# WS connexions / déconnexions
docker-compose logs service-notification-gestionnaire-admin | grep "WS-Notif"

# Voir les connexions en cours
docker-compose logs service-notification-gestionnaire-admin | grep "connecté\|déconnecté"

# Tester /internal/emit-ws manuellement
docker-compose exec service-routes sh -c "wget -q -O- \
  --post-data='{\"userIds\":[34],\"notification\":{\"type\":\"ALERTE\",\"titre\":\"Test\",\"corps\":\"Debug\"}}' \
  --header='Content-Type: application/json' \
  --header='x-internal-secret: votre_secret_jwt_super_securise_a_changer' \
  http://ecotrack-service-notification-gestionnaire-admin:3016/internal/emit-ws"
```

### Logs côté navigateur (DevTools Console)

```
[WS-Notif] connecté ✓                     ← WS établi
[WS-Notif] notification:new reçue {...}    ← événement reçu
[WS-Notif] connexion échouée: ...         ← WS KO → polling actif
[API] Base URL configurée: http://...     ← URL API au démarrage
```

### Tester le proxy WS du gateway

```bash
# Doit retourner HTTP 101 Switching Protocols
wget -q -O- --server-response \
  --header='Connection: Upgrade' \
  --header='Upgrade: websocket' \
  --header='Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
  --header='Sec-WebSocket-Version: 13' \
  'http://localhost:3000/ws/notifications/?EIO=4&transport=websocket'
```

### Vérifier le cache Redis après une notification

```bash
docker-compose exec redis redis-cli \
  KEYS "ecotrack:notifications:*" | head -20

docker-compose exec redis redis-cli \
  TTL "ecotrack:notifications:unread:34"
# → -2 si invalidé, sinon TTL restant (max 30)
```

---

## Variables d'environnement

| Variable | Usage |
|----------|-------|
| `JWT_SECRET` | Vérification du token dans les middlewares Socket.IO |
| `INTERNAL_SECRET` | Authentification des appels `/internal/emit-ws` (= `JWT_SECRET` si absent) |
| `FRONTEND_URL` | CORS WebSocketAdminService en production |
| `NOTIFICATION_SERVICE_URL` | URL interne dans service-routes pour appeler `/internal/emit-ws` |
| `VITE_NOTIFICATION_WS_URL` | URL WS côté frontend (fallback = `VITE_API_URL` = `http://localhost:3000`) |
