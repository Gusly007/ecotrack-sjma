# Service Gamification (port 3014)

Microservice de gamification pour EcoTrack : gestion des points, badges, défis, classement et notifications.

---

## Architecture du service

### Structure des dossiers principaux

```
service-gamifications/
├── README.md
├── package.json
├── src/
│   ├── controllers/         # Contrôleurs Express (API)
│   ├── services/            # Logique métier (orchestration, calculs)
│   ├── repositories/        # Accès aux données (SQL, Postgres)
│   ├── middleware/          # Middlewares Express (validation, etc.)
│   ├── config/              # Configurations (DB, rate limit, etc.)
│   └── ...
├── __tests__/               # Tests unitaires et d'intégration
│   ├── repositories/        # Tests unitaires des repositories
│   ├── services/            # Tests unitaires des services
│   └── controllers/         # Tests d'intégration des routes
├── sql/                     # Scripts SQL (création des tables, etc.)
└── ...
```

- `controllers/` : endpoints Express, validation des entrées, appels aux services
- `services/` : logique métier, orchestration, validation métier
- `repositories/` : accès aux données, requêtes SQL, mapping
- `middleware/` : middlewares Express (validation, rate limiting, etc.)
- `__tests__/repositories/` : tests unitaires des repositories (mock SQL)

---

## Phases couvertes

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

### Exécuter les tests

```bash
npm test
```

Autres commandes utiles :

```bash
npm run test:watch
npm run test:coverage
```

### Couverture des tests

- **Services** : chaque service métier possède des tests unitaires (logique d'attribution, calculs, orchestration, etc.).
- **Repositories** : chaque repository (`src/repositories/`) est couvert par des tests unitaires dédiés (mock SQL, vérification des requêtes et retours). Les tests vérifient l'intégrité des accès aux données et la robustesse des requêtes.
- **Contrôleurs** : les endpoints principaux sont testés via des tests d'intégration.

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
