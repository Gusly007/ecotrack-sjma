# Service Gamification (port 3014)

Microservice de gamification pour EcoTrack : gestion des points, badges, défis, classement et notifications.

## ✅ Phases couvertes

### Phase 1 — Système de points
- Enregistrement d'actions utilisateur (`/actions`).
- Attribution automatique de points.
- Historique des points et mise à jour du total dans `utilisateur`.

### Phase 2 — Badges & Récompenses
- Catalogue de badges (`/badges`).
- Attribution automatique selon les seuils de points.
- Badges d'exemple : Débutant (100), Éco-Guerrier (500), Super-Héros (1000).

### Phase 3 — Défis & Classement
- Création et listing des défis (`/defis`).
- Participation et progression aux défis.
- Classement des utilisateurs (`/classement`).

### Phase 4 — Notifications & Statistiques
- Notifications de gamification (`/notifications`).
- Statistiques personnelles (`/utilisateurs/:idUtilisateur/stats`).

---

## Installation locale

```bash
cd services/service-gamifications
npm install
npm run dev
```

Variables d'environnement (exemple):

```
GAMIFICATIONS_PORT=3014
GAMIFICATIONS_DATABASE_URL=postgresql://user:password@localhost:5432/ecotrack
NODE_ENV=development
```

---

## Tests automatisés

### Lancer une base PostgreSQL de test

```bash
docker compose -f docker-compose.test.yml up -d
```

### Définir la variable de connexion

Linux/macOS :

```bash
export GAMIFICATIONS_DATABASE_URL=postgresql://ecotrack:ecotrack@localhost:5435/ecotrack_test
```

Windows PowerShell :

```powershell
$env:GAMIFICATIONS_DATABASE_URL = "postgresql://ecotrack:ecotrack@localhost:5435/ecotrack_test"
```

### Exécuter les tests

```bash
npm test
```

Autres commandes utiles :

```bash
npm run test:watch
npm run test:coverage
```

> Astuce : vous pouvez également utiliser `DATABASE_URL` au lieu de `GAMIFICATIONS_DATABASE_URL` en environnement de test.

Arrêter la base de test :

```bash
docker compose -f docker-compose.test.yml down -v
```

---

## Endpoints principaux

### Points
- `POST /actions`

Exemple payload:
```json
{
  "id_utilisateur": 1,
  "type_action": "signalement",
  "points": 10
}
```

### Badges
- `GET /badges`
- `GET /badges/utilisateurs/:idUtilisateur`

### Défis
- `GET /defis`
- `POST /defis`
- `POST /defis/:idDefi/participations`
- `PATCH /defis/:idDefi/participations/:idUtilisateur`

### Classement
- `GET /classement?limite=10`

### Notifications
- `GET /notifications?id_utilisateur=1`
- `POST /notifications`

Exemple payload:
```json
{
  "id_utilisateur": 1,
  "type": "BADGE",
  "titre": "Nouveau badge",
  "corps": "Bravo, vous avez obtenu un badge."
}
```

### Statistiques
- `GET /utilisateurs/:idUtilisateur/stats`

---

## Swagger

- Documentation interactive : `GET /api-docs`

---

## Base de données

Le script SQL se trouve dans `sql/gamification.sql`. Il crée uniquement les tables spécifiques aux défis et s'appuie sur le schéma global EcoTrack pour les points, badges et notifications.

Pour les tests automatisés, le service initialise un schéma minimal (tables utilisateur, badge, user_badge, historique_points, notification) afin d'isoler la base de test.
