# Implementation Mobile Web Responsive - EcoTrack

## Vue d'ensemble
Ajout des interfaces mobile (Web Responsive) pour les roles **Citoyen** et **Agent** dans le frontend React existant.

**Approche :** Web Responsive (meme projet React, meme URL, detection du role)
**Contrainte :** Zero casse sur le code existant (admin, gestionnaire, backend)

---

## Architecture

```
src/
├── components/mobile/          # NOUVEAU - Composants layout mobile (agent/shared)
│   ├── MobileLayout.jsx        # Wrapper (header + contenu + bottom nav)
│   ├── MobileHeader.jsx        # Barre haute sticky
│   ├── BottomNav.jsx           # Barre basse fixe 5 onglets + FAB
│   ├── MobileCard.jsx          # Carte avec ombre
│   ├── MobileListItem.jsx      # Ligne de liste
│   ├── EmptyState.jsx          # Etat vide
│   ├── ProgressBar.jsx         # Barre de progression
│   ├── MapView.jsx             # Wrapper Leaflet
│   ├── QRScanner.jsx           # Wrapper html5-qrcode
│   ├── citoyenNavData.js       # Config tabs citoyen
│   └── agentNavData.js         # Config tabs agent
│
├── pages/mobile/               # NOUVEAU - Pages mobile
│   ├── shared/                 # Pages partagees (profil, notifications)
│   │   ├── ProfilPage.jsx
│   │   ├── EditProfilPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   ├── NotificationSettings.jsx
│   │   ├── ScanPage.jsx
│   │   └── ScanResult.jsx
│   ├── citoyen/                # 18 pages citoyen + layout + auth context
│   │   ├── MobileLayout.jsx        # Layout citoyen (barre nav dédiée)
│   │   ├── auth/
│   │   │   └── CitoyenAuthContext.jsx  # Context auth citoyen isolé
│   │   ├── CitoyenLanding.jsx      # Page d'accueil visiteur (non connecté)
│   │   ├── CitoyenLogin.jsx        # Connexion citoyen (/citoyen/login)
│   │   ├── CitoyenRegister.jsx     # Inscription (/citoyen/inscription)
│   │   ├── CitoyenForgotPassword.jsx
│   │   ├── CitoyenResetPassword.jsx
│   │   ├── CitoyenHome.jsx         # Dashboard citoyen (accueil connecté)
│   │   ├── CitoyenMap.jsx          # Carte Leaflet des conteneurs (lazy)
│   │   ├── CitoyenScanner.jsx      # Scan QR conteneur (lazy)
│   │   ├── CitoyenSignaler.jsx     # Formulaire signalement
│   │   ├── CitoyenSignalerSuccess.jsx
│   │   ├── CitoyenMesSignalements.jsx  # Liste signalements du citoyen
│   │   ├── CitoyenSignalementDetail.jsx
│   │   ├── CitoyenDefis.jsx        # Défis communautaires + badges
│   │   ├── CitoyenPointsHistorique.jsx # Historique des points gagnés
│   │   ├── CitoyenTri.jsx          # Guide tri sélectif
│   │   ├── CitoyenNotifications.jsx
│   │   ├── CitoyenProfil.jsx
│   │   └── CitoyenEditProfil.jsx
│   └── agent/                  # 10 pages agent
│       ├── AgentDashboard.jsx
│       ├── TourneePage.jsx
│       ├── EtapeDetail.jsx
│       ├── ScanPage.jsx
│       ├── ScanResult.jsx
│       ├── AnomaliePage.jsx
│       ├── AnomalieForm.jsx
│       ├── TerminerTournee.jsx
│       ├── HistoriquePage.jsx
│       └── StatsPage.jsx
│
├── services/                   # NOUVEAU - Services API
│   ├── tourneeService.js       # /api/V1/routes/*
│   ├── containerService.js     # /api/V1/containers/*
│   ├── signalementService.js   # /api/V1/signalements/*
│   ├── gamificationService.js  # /api/V1/gamification/*
│   ├── notificationService.js  # /api/V1/notifications/*
│   └── statsService.js         # /api/V1/routes/stats/*
│
└── hooks/                      # NOUVEAU - Hooks
    ├── useGeolocation.js
    └── useNotifications.js
```

## Routes Citoyen (/citoyen/*)

| Route | Page | Auth requise |
|-------|------|:---:|
| `/citoyen/login` | CitoyenLogin | Non |
| `/citoyen/inscription` | CitoyenRegister | Non |
| `/citoyen/mot-de-passe-oublie` | CitoyenForgotPassword | Non |
| `/citoyen/reset-password` | CitoyenResetPassword | Non |
| `/citoyen` | CitoyenHome | Oui |
| `/citoyen/carte` | CitoyenMap (lazy) | Oui |
| `/citoyen/scanner` | CitoyenScanner (lazy) | Oui |
| `/citoyen/signaler` | CitoyenSignaler | Oui |
| `/citoyen/signaler/success` | CitoyenSignalerSuccess | Oui |
| `/citoyen/signalements` | CitoyenMesSignalements | Oui |
| `/citoyen/signalements/:id` | CitoyenSignalementDetail | Oui |
| `/citoyen/defis` | CitoyenDefis | Oui |
| `/citoyen/points-historique` | CitoyenPointsHistorique | Oui |
| `/citoyen/tri` | CitoyenTri | Oui |
| `/citoyen/notifications` | CitoyenNotifications | Oui |
| `/citoyen/profil` | CitoyenProfil | Oui |
| `/citoyen/profil/modifier` | CitoyenEditProfil | Oui |
| `/citoyen/boutique` | redirect vers `/citoyen/defis` | Oui |

Les routes protegees passent par `CitoyenProtectedRoute` qui utilise `CitoyenAuthContext` (isole du contexte gestionnaire/admin).

## API Backend utilisees (Citoyen)

| Endpoint | Usage |
|----------|-------|
| `POST /api/V1/auth/login` | Connexion citoyen |
| `POST /api/V1/auth/register` | Inscription |
| `GET /api/V1/containers` | Conteneurs pour la carte |
| `GET /api/V1/containers/uid/:uid` | Scan QR code |
| `POST /api/V1/routes/signalements` | Creer un signalement |
| `GET /api/V1/routes/signalements/my` | Mes signalements |
| `GET /api/V1/routes/signalements/:id` | Detail signalement |
| `GET /api/V1/gamification/defis` | Liste des defis |
| `POST /api/V1/gamification/defis/:id/participer` | Participer a un defi |
| `GET /api/V1/gamification/stats/:id` | Points et badges |
| `GET /api/V1/gamification/points/historique` | Historique des points |
| `GET /api/V1/notifications` | Notifications citoyen |
| `PATCH /api/V1/notifications/:id/read` | Marquer comme lu |

## Fichiers existants modifies (AJOUTS UNIQUEMENT)

| Fichier | Modification |
|---------|-------------|
| `App.jsx` | Ajout routes /citoyen/*, /agent/*, /register |
| `context/AuthContext.jsx` | Reactiver register, fixer isMobileUser |
| `styles/index.css` | Ajout variables CSS mobile |
| `hooks/index.js` | Ajout re-exports |

## Dependencies ajoutees
- `leaflet` + `react-leaflet` - Carte interactive
- `html5-qrcode` - Scanner QR code

## Routes Agent (/agent/*)

| Route | Page |
|-------|------|
| `/agent` | AgentDashboard |
| `/agent/tournee` | TourneePage |
| `/agent/tournee/etape/:id` | EtapeDetail |
| `/agent/scan` | ScanPage |
| `/agent/scan/result/:uid` | ScanResult |
| `/agent/anomalie` | AnomaliePage |
| `/agent/anomalie/form` | AnomalieForm |
| `/agent/tournee/terminer` | TerminerTournee |
| `/agent/historique` | HistoriquePage |
| `/agent/stats` | StatsPage |
| `/agent/profil` | ProfilPage (shared) |
| `/agent/profil/edit` | EditProfilPage (shared) |
| `/agent/notifications` | NotificationsPage (shared) |
| `/agent/notifications/settings` | NotificationSettings (shared) |

## API Backend utilisees (Agent)

| Endpoint | Usage |
|----------|-------|
| `GET /api/V1/routes/my-tournee` | Tournee du jour |
| `GET /api/V1/routes/tournees/:id/etapes` | Etapes de la tournee |
| `GET /api/V1/routes/tournees/:id/progress` | Progression |
| `PATCH /api/V1/routes/tournees/:id/statut` | Demarrer/Terminer |
| `POST /api/V1/routes/tournees/:id/collecte` | Enregistrer collecte |
| `POST /api/V1/routes/tournees/:id/anomalie` | Signaler anomalie |
| `GET /api/V1/routes/tournees/:id/anomalies` | Lister anomalies |
| `GET /api/V1/routes/tournees/:id/map` | GeoJSON carte |
| `GET /api/V1/containers/uid/:uid` | Scan QR code |
| `GET /api/V1/routes/stats/dashboard` | Stats |
| `GET /api/V1/routes/stats/kpis` | KPIs |

