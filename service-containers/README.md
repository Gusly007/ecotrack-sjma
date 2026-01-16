# service-containers

🔧 Instructions pour configurer et tester la connexion PostgreSQL utilisée par ce dossier.

---

## ✅ Prérequis
- Node.js installé
- Un serveur PostgreSQL accessible (pgAdmin montre vos serveurs). Le nom affiché dans pgAdmin (ex. `PostgreSQL 18`) est une étiquette UI — ce qui compte : **hôte**, **port**, **utilisateur**, **mot de passe**, **nom de la base**.

## ⚙️ Fichiers importants
- `.env.example` → copier en `.env` et renseigner vos identifiants
- `dbconnexion.js` → connexion Postgres via `pg` (utilise `dotenv`)
- `test-db.js` → petit script pour tester la connexion
- `scripts/init-db.js` → script Node qui exécute `sql/init.sql`
- `sql/init.sql` → script SQL d'initialisation (création de la table `users`)

## 🔁 Installer les dépendances
Depuis ce dossier :

```powershell
npm install
```

## 📝 Configurer l'environnement
Copiez l'exemple et éditez :

```powershell
Copy-Item .env.example .env
# puis ouvrez .env et renseignez PGPASSWORD, PGUSER, etc.
```

Variables importantes dans `.env` :
- `PGHOST` (ex: `localhost`)
- `PGPORT` (ex: `5432`)
- `PGUSER` (ex: `postgres`)
- `PGPASSWORD` (mot de passe de l'utilisateur)
- `PGDATABASE` (ex: `ecotrack-db`)

> ⚠️ **Ne commitez jamais** votre `.env` contenant des secrets dans Git.

## ▶️ Commandes utiles
- Démarrer le serveur (développement) :

```powershell
npm run dev
```

- Démarrer le serveur (production) :

```powershell
npm start
```

- Tester la connexion à la base de données :

```powershell
npm run test-db
```

- Initialiser la base (exécute `sql/init.sql`) :

```powershell
npm run init-db
```

- Lancer les tests Socket.IO :

```powershell
npm run test:socket           # Tests unitaires
npm run test:socket:integration # Tests d'intégration
npm run test:socket:e2e       # Tests E2E (serveur requis)
```

---

## 🔌 Socket.IO - Notifications Temps Réel

Le serveur inclut **Socket.IO** pour envoyer des notifications en temps réel aux clients WebSocket.

### ✨ Fonctionnalités

- ✅ Notifications instantanées lors des changements de statut
- ✅ Rooms par zone pour broadcaster sélectif
- ✅ Même port que l'API (8080) - une seule connexion
- ✅ WebSocket + Polling fallback
- ✅ CORS configuré pour toutes les origines

### 🚀 Démarrage

**Terminal 1 - Serveur:**
```powershell
npm run dev
```

Vous verrez:
```
🔌 Socket.IO: ws://localhost:8080
```

**Terminal 2 - Client test:**
```powershell
npm run test:socket:client
```

### 📡 Événements

**Client → Serveur:**
```javascript
// S'abonner à une zone
socket.emit('subscribe-zone', { id_zone: 1 });

// Se désabonner d'une zone
socket.emit('unsubscribe-zone', { id_zone: 1 });
```

**Serveur → Client:**
```javascript
// Changement de statut
socket.on('container:status-changed', (data) => {
  console.log('Statut:', data.nouveau_statut);
  console.log('Zone:', data.id_zone);
});
```

### 🧪 Tests

Voir **[TESTING.md](./TESTING.md)** pour le guide complet des tests Socket.IO.

---

## Alternative : exécuter le SQL via `psql` ou pgAdmin
Si vous préférez, vous pouvez importer `sql/init.sql` depuis pgAdmin ou en CLI :

```powershell
psql -h $PGHOST -U $PGUSER -d "$PGDATABASE" -f sql/init.sql
```

## Notes & bonnes pratiques
- `scripts/init-db.js` est un utilitaire simple : il découpe le fichier SQL par `;`. Pour des migrations plus complexes utilisez `node-pg-migrate`, `knex`, Flyway ou autre.
- Utilisez toujours des requêtes paramétrées (`$1, $2`) pour éviter les injections SQL.

---

## 📊 Historique des changements de statut

Le système enregistre automatiquement tous les changements de statut des conteneurs dans la table `historique_statut`. Cette fonctionnalité permet de suivre l'évolution des statuts au fil du temps.

### Fonctionnement automatique

L'historique est enregistré automatiquement dans les cas suivants :

1. **Création d'un conteneur** : Le statut initial est enregistré avec `ancien_statut = NULL`
2. **Changement de statut via PATCH /containers/:id/status** : L'ancien et le nouveau statut sont enregistrés
3. **Mise à jour générale via PATCH /containers/:id** : Si le statut change, l'historique est mis à jour

### Structure de l'historique

Chaque entrée contient :
- `id_historique` : Identifiant unique
- `id_entite` : ID du conteneur
- `type_entite` : Type d'entité (toujours 'CONTENEUR' pour les conteneurs)
- `ancien_statut` : Statut avant le changement (NULL lors de la création)
- `nouveau_statut` : Nouveau statut appliqué
- `date_changement` : Date et heure du changement

### Route API

**GET /api/containers/:id/status/history**

Récupère l'historique complet des changements de statut d'un conteneur, trié du plus récent au plus ancien.

Exemple de réponse :
```json
[
  {
    "id_historique": 4,
    "ancien_statut": "ACTIF",
    "nouveau_statut": "EN_MAINTENANCE",
    "date_changement": "2026-01-13T14:30:00.000Z"
  },
  {
    "id_historique": 1,
    "ancien_statut": null,
    "nouveau_statut": "ACTIF",
    "date_changement": "2026-01-13T10:00:00.000Z"
  }
]
```

### Statuts valides

- `ACTIF` : Conteneur opérationnel
- `INACTIF` : Conteneur temporairement désactivé
- `EN_MAINTENANCE` : Conteneur en cours de maintenance
- `HORS_SERVICE` : Conteneur définitivement hors service

### Tests

Pour tester la fonctionnalité d'historique :

```powershell
npm test -- status-history.test.js
```

---

Si vous voulez, j'ajoute des exemples d'utilisation (route Express qui liste les `users`) ou un exemple de migration avec `node-pg-migrate`.
