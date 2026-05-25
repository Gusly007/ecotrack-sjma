# Implementation Mobile Web Responsive - EcoTrack

## Vue d'ensemble
Ajout des interfaces mobile (Web Responsive) pour les roles **Citoyen** et **Agent** dans le frontend React existant.

**Approche :** Web Responsive (meme projet React, meme URL, detection du role)
**Contrainte :** Zero casse sur le code existant (admin, gestionnaire, backend)

---

## Architecture

```
src/
├── components/mobile/          # NOUVEAU - Composants layout mobile
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
│   │   └── NotificationSettings.jsx
│   ├── agent/                  # 10 pages agent
│      ├── AgentDashboard.jsx
│      ├── TourneePage.jsx
│      ├── EtapeDetail.jsx
│      ├── ScanPage.jsx
│      ├── ScanResult.jsx
│      ├── AnomaliePage.jsx
│      ├── AnomalieForm.jsx
│      ├── TerminerTournee.jsx
│      ├── HistoriquePage.jsx
│      └── StatsPage.jsx
│   
│
├── services/                   # NOUVEAU - Services API
│   ├── tourneeService.js       # /api/V1/routes/*
│   ├── containerService.js     # /api/V1/containers/*
│   ├── signalementService.js   # /api/V1/signalements/* (Phase 2)
│   ├── gamificationService.js  # /api/V1/gamification/* (Phase 2)
│   ├── notificationService.js  # /notifications/*
│   └── statsService.js         # /api/V1/routes/stats/*
│
└── hooks/                      # NOUVEAU - Hooks
    ├── useGeolocation.js
    └── useNotifications.js
```

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

