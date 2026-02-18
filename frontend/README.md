# EcoTrack Frontend

Application frontend pour EcoTrack - Système de gestion des déchets intelligents.

## Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Construire pour la production
npm run build

# Prévisualiser la production
npm run preview
```

## Structure du Projet

```
frontend/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── auth/           # Composants d'authentification
│   │   ├── common/         # Composants communs (Button, Input, etc.)
│   │   ├── containers/     # Composants liés aux conteneurs
│   │   ├── dashboard/      # Composants du dashboard
│   │   ├── layout/         # Composants de mise en page
│   │   ├── stats/          # Composants de statistiques
│   │   ├── users/         # Composants de gestion utilisateurs
│   │   └── zones/         # Composants liés aux zones
│   │
│   ├── constants/          # Constantes globales
│   │   └── roles.js        # Rôles et permissions
│   │
│   ├── context/            # React Context
│   │   └── AuthContext.jsx # Gestion de l'authentification
│   │
│   ├── hooks/              # Custom React Hooks
│   │
│   ├── pages/              # Pages de l'application
│   │   ├── auth/           # Pages d'authentification
│   │   │   └── LoginPage.jsx
│   │   ├── desktop/        # Pages Desktop (Gestionnaire, Admin)
│   │   │   └── Dashboard.jsx
│   │   └── mobile/         # Pages Mobile (Citoyen, Agent)
│   │       └── Dashboard.jsx
│   │
│   ├── services/          # Services API
│   │   ├── api.js          # Configuration Axios avec interceptors
│   │   └── authService.js  # Service d'authentification
│   │
│   ├── utils/              # Fonctions utilitaires
│   │
│   ├── App.jsx             # Composant principal avec routes
│   ├── index.css          # Styles globaux (Tailwind)
│   └── main.jsx           # Point d'entrée
│
├── public/                 # Fichiers statiques
│
├── Dockerfile              # Configuration Docker
├── docker-compose.yml      # Configuration Docker Compose
├── tailwind.config.js      # Configuration Tailwind CSS
├── postcss.config.js       # Configuration PostCSS
├── vite.config.js          # Configuration Vite
└── package.json            # Dépendances
```

## Rôles Utilisateurs

| Rôle | Interface | Description |
|------|-----------|-------------|
| `CITOYEN` | Mobile | Utilisateur standard |
| `AGENT` | Mobile | Agent de collecte |
| `GESTIONNAIRE` | Desktop | Gestionnaire de zone |
| `ADMIN` | Desktop | Administrateur |

## Permissions

### Mobile (CITOYEN, AGENT)
- `signaler:create`, `signaler:read`, `signaler:update`
- `containers:read`
- `tournee:read`, `tournee:update`
- `collecte:create`
- `profile:read`, `profile:update`

### Desktop (GESTIONNAIRE, ADMIN)
- Toutes les permissions mobile
- `containers:update`
- `tournee:create`
- `users:read`
- `analytics:read`

## Configuration

### Variables d'Environnement

Créez un fichier `.env` à la racine:

```env
VITE_API_URL=http://localhost:3000
```

## Fonctionnalités

- [x] Authentification JWT avec refresh token
- [x] Gestion des rôles (Mobile vs Desktop)
- [x] Protection des routes par permission
- [x] Interceptors Axios pour token refresh automatique
- [x] Intégration Tailwind CSS

## Docker

```bash
# Build de l'image
docker build -t ecotrack-frontend .

# Lancement avec Docker Compose
docker-compose up -d
```

## API Reference

Le frontend communique avec les services backend via l'API Gateway:

- `service-users` - Authentification et gestion utilisateurs
- `service-containers` - Gestion des conteneurs
- `service-gamifications` - Système de gamification

Voir la documentation API Gateway pour plus de détails.
