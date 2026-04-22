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
│   │   ├── AgentDashboard.jsx
│   │   ├── TourneePage.jsx
│   │   ├── EtapeDetail.jsx
│   │   ├── ScanPage.jsx
│   │   ├── ScanResult.jsx
│   │   ├── AnomaliePage.jsx
│   │   ├── AnomalieForm.jsx
│   │   ├── TerminerTournee.jsx
│   │   ├── HistoriquePage.jsx
│   │   └── StatsPage.jsx
│   └── citoyen/                # 14 pages citoyen (Phase 2)
│
├── services/                   # NOUVEAU - Services API
│   ├── tourneeService.js       # /api/routes/*
│   ├── containerService.js     # /api/containers/*
│   ├── signalementService.js   # /api/signalements/* (Phase 2)
│   ├── gamificationService.js  # /api/gamification/* (Phase 2)
│   ├── notificationService.js  # /notifications/*
│   └── statsService.js         # /api/routes/stats/*
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

## Routes Citoyen (/citoyen/*) - Phase 2

| Route | Page |
|-------|------|
| `/citoyen` | CitoyenDashboard |
| `/citoyen/carte` | CartePage |
| `/citoyen/signalement` | SignalementForm |
| `/citoyen/signalement/success` | SignalementSuccess |
| `/citoyen/signalements` | MesSignalements |
| `/citoyen/signalements/:id` | SignalementDetail |
| `/citoyen/conteneurs/:id` | ConteneurDetail |
| `/citoyen/defis` | DefisPage |
| `/citoyen/defis/:id` | DefiDetail |
| `/citoyen/boutique` | BoutiquePage |
| `/citoyen/points` | HistoriquePoints |
| `/citoyen/statistiques` | StatistiquesPage |
| `/citoyen/horaires` | HorairesPage |
| `/citoyen/tri` | TriGuidePage |

## API Backend utilisees (Agent)

| Endpoint | Usage |
|----------|-------|
| `GET /api/routes/my-tournee` | Tournee du jour |
| `GET /api/routes/tournees/:id/etapes` | Etapes de la tournee |
| `GET /api/routes/tournees/:id/progress` | Progression |
| `PATCH /api/routes/tournees/:id/statut` | Demarrer/Terminer |
| `POST /api/routes/tournees/:id/collecte` | Enregistrer collecte |
| `POST /api/routes/tournees/:id/anomalie` | Signaler anomalie |
| `GET /api/routes/tournees/:id/anomalies` | Lister anomalies |
| `GET /api/routes/tournees/:id/map` | GeoJSON carte |
| `GET /api/containers/uid/:uid` | Scan QR code |
| `GET /api/routes/stats/dashboard` | Stats |
| `GET /api/routes/stats/kpis` | KPIs |

## Backend a ajouter (Citoyen - Phase 2)

- Routes signalement CRUD dans service-containers
- Endpoint historique points dans service-gamifications
