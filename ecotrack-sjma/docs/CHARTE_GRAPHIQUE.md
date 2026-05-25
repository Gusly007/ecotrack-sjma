# Charte Graphique — EcoTrack

> Document de référence visuelle pour le design system du projet EcoTrack.
> Couvre toutes les interfaces par rôle : Admin, Gestionnaire, Agent (mobile), Citoyen (mobile).
> Destiné à la mise en page Figma.

---

## 1. Design Tokens — Fondations globales

### 1.1 Palette de couleurs principale

| Token | Hex | Rôle |
|-------|-----|------|
| `--primary` | `#4CAF50` | Couleur principale — actions, accents, liens actifs |
| `--primary-dark` | `#43A047` | Hover sur boutons primaires |
| `--primary-deep` | `#2E7D32` | Textes sur fond clair, dégradés |
| `--primary-deeper` | `#1b5e20` | Valeurs impact environnemental |
| `--secondary` | `#2196F3` | Informations, liens secondaires (Gestionnaire) |
| `--secondary-dark` | `#1976D2` | Hover secondaire |
| `--danger` | `#f44336` | Erreurs, suppression, rejets |
| `--danger-dark` | `#d32f2f` | Hover danger, erreurs critiques |
| `--danger-deeper` | `#c62828` | Active état danger |
| `--warning` | `#FF9800` | Alertes, récompenses, niveaux oranges |
| `--warning-dark` | `#f57f17` | Statut "en cours" |
| `--warning-accent` | `#d68900` | Badges pédagogiques |
| `--bg-dark` | `#1a1a2e` | Sidebar admin/gestionnaire, fond auth |
| `--bg-dark-mid` | `#16213e` | Dégradé auth (milieu) |
| `--bg-dark-deep` | `#0f3460` | Dégradé auth (fin) |
| `--bg-light` | `#f0f2f5` | Fond global desktop |
| `--bg-page` | `#f8f9fa` | Fond pages mobiles |
| `--surface` | `#ffffff` | Surface cartes, modals, inputs |
| `--text-primary` | `#1a1a2e` | Titres principaux |
| `--text-strong` | `#333` | Corps de texte fort |
| `--text-body` | `#555` | Corps standard |
| `--text-secondary` | `#888` | Labels, dates, sous-titres |
| `--text-muted` | `#aaa` | Placeholders, icônes inactives |
| `--border` | `#e0e0e0` | Bordures cartes |
| `--border-light` | `#eee` | Séparateurs internes |

### 1.2 Couleurs de statut (signalements & notifications)

| Statut | Fond | Texte | Usage |
|--------|------|-------|-------|
| Nouveau / OUVERT | `#e3f2fd` | `#2196F3` | Badge bleu |
| En cours | `#fff8e1` | `#f57f17` | Badge orange |
| Résolu | `#e8f5e9` | `#4CAF50` | Badge vert |
| Rejeté / Fermé | `#ffebee` | `#f44336` | Badge rouge |
| Fond succès | `#e8f5e9` | `#2E7D32` | Confirmation |
| Fond impact | dégradé `#e8f5e9 → #c8e6c9` | `#2E7D32` | Cartes ADEME |

### 1.3 Couleurs gamification (classement)

| Rang | Couleur | Icône |
|------|---------|-------|
| 1ᵉʳ | `#FFD700` (or) | `fas fa-trophy` |
| 2ᵉ | `#C0C0C0` (argent) | `fas fa-medal` |
| 3ᵉ | `#CD7F32` (bronze) | `fas fa-medal` |
| Utilisateur courant | fond `#e8f5e9`, bordure `#4CAF50` | — |

### 1.4 Typographie

| Niveau | Taille | Poids | Usage |
|--------|--------|-------|-------|
| H1 Auth | 2rem | 700 | Titre connexion |
| H1 Dashboard | 1.3rem | 700 | Salutation citoyen |
| H2 Topbar | 1.25rem | 600 | Titre sidebar desktop |
| H2 Page mobile | 1.05rem | 600 | MobileScreenHeader |
| H3 Section | 0.95rem | 700 | Titres de sections |
| Corps | 0.88rem | 400 | Contenu standard |
| Label | 0.82–0.85rem | 600 | Labels formulaires |
| Méta / date | 0.75–0.78rem | 400 | Dates, zones, sous-infos |
| Badge | 0.65–0.72rem | 700 | Badges, étiquettes |
| Nav bottom | 0.65rem | 500 | Onglets bottom nav citoyen |

**Famille** : `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

### 1.5 Border-radius

| Valeur | Usage |
|--------|-------|
| `50%` | Avatars, boutons ronds, FAB, dots |
| `20px` | Modals (sheet bottom) |
| `16px` | Grandes cartes (profil-hero, points-card) |
| `14px` | Cartes signalements, défis, cartes info |
| `12px` | Boutons, inputs, petites cartes, tags |
| `10px` | Boutons RGPD, sous-sections |
| `8px` | Icônes carrées (menu-icon, section-icon) |
| `4px` | Badges statut, barres de timeline |
| `3px` | Code inline |

### 1.6 Ombres (box-shadow)

| Niveau | Valeur | Usage |
|--------|--------|-------|
| Légère | `0 1px 4px rgba(0,0,0,0.05)` | Cartes de liste |
| Standard | `0 1px 4px rgba(0,0,0,0.06)` | Cartes défis, signalements |
| Verte douce | `0 2px 8px rgba(76,175,80,0.08)` | Cartes impact ADEME |
| Verte moyenne | `0 2px 6px rgba(76,175,80,0.18)` | Avatar profil |
| FAB | `0 4px 12px rgba(76,175,80,0.4)` | Bouton + citoyen |
| Modal | `0 -8px 24px rgba(0,0,0,0.18)` | Sheet modale |
| Auth | `0 20px 60px rgba(0,0,0,0.3)` | Box de connexion |

### 1.7 Transitions & animations

| Type | Valeur | Usage |
|------|--------|-------|
| Standard | `all 0.2s ease` | Hover cartes, onglets |
| Rapide | `0.15s ease` | Tap mobile |
| Lente | `0.3s ease` | Fade modals |
| Spring | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Slide-up sheet |
| Spin | `0.8s linear infinite` | Spinners de chargement |
| Pulse | `2s ease infinite` | Icône succès |

---

## 2. Auth — Connexion & Inscription (tous rôles)

> Routes : `/login`, `/citoyen/login`, `/citoyen/inscription`, `/citoyen/reset-password`

### Fond global
- Dégradé : `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`
- Effet glassmorphism sur la box : `background: rgba(255,255,255,0.05)`, `backdrop-filter: blur(20px)`
- Bordure box : `rgba(255,255,255,0.1)`, border-radius `20px`

### Champs de saisie
- Fond : `rgba(255,255,255,0.1)`, focus `rgba(255,255,255,0.15)`
- Bordure : `rgba(255,255,255,0.2)`, focus `#4CAF50`
- Texte : `#fff`, placeholder `rgba(255,255,255,0.6)`
- Border-radius : `12px`

### Boutons auth

| Type | Fond | Texte | Hover |
|------|------|-------|-------|
| Primaire | `#4CAF50` | `#fff` | `#43A047` |
| Secondaire | transparent | `#fff` | `rgba(255,255,255,0.3)` |
| Sélecteur rôle actif | `rgba(76,175,80,0.15)` | `#4CAF50` | — |

### Icônes auth

| Champ | Icône |
|-------|-------|
| Email | `fas fa-envelope` |
| Mot de passe | `fas fa-lock` |
| Prénom / Nom | `fas fa-user` |
| Téléphone | `fas fa-phone` |
| Voir/masquer MDP | `fas fa-eye` / `fas fa-eye-slash` |
| MFA / Code | `fas fa-shield-alt` |
| Succès | `fas fa-check-circle` (fond `#e8f5e9`, icône `#4CAF50`) |
| Erreur | `fas fa-exclamation-circle` |

---

## 3. Interface Admin — Desktop

> Routes : `/admin/*` — Rôle ADMIN

### Layout général

```
┌─────────────────────────────────────────────────┐
│  SIDEBAR (250px)  │  TOPBAR (56px)              │
│  fond #1a1a2e     │  fond #fff, border #e0e0e0  │
│                   ├─────────────────────────────┤
│  nav items        │  CONTENU                    │
│  actif: #4CAF50   │  fond #f5f6fa              │
└─────────────────────────────────────────────────┘
```

### Sidebar Admin

| État | Fond item | Texte | Bordure gauche |
|------|-----------|-------|----------------|
| Normal | transparent | `rgba(255,255,255,0.8)` | aucune |
| Hover | `rgba(255,255,255,0.05)` | `#fff` | aucune |
| Actif | `rgba(76,175,80,0.2)` | `#4CAF50` | `3px solid #4CAF50` |

**Largeur** : 250px (étendue) / 60px (réduite)

### Navigation Admin — Icônes

| Page | Icône Font Awesome | Route |
|------|--------------------|-------|
| Vue d'ensemble | `fas fa-tachometer-alt` | `/admin` |
| Utilisateurs | `fas fa-users` | `/admin/users` |
| Rôles | `fas fa-user-shield` | `/admin/roles` |
| Conteneurs | `fas fa-dumpster` | `/admin/conteneurs` |
| Zones | `fas fa-map-marker-alt` | `/admin/zones` |
| Signalements | `fas fa-flag` | `/admin/signalements` |
| Journaux | `fas fa-clipboard-list` | `/admin/logs` |
| Configuration | `fas fa-cog` | `/admin/configuration` |
| Monitoring | `fas fa-heartbeat` | `/admin/monitoring` |
| Alertes | `fas fa-bell` | `/admin/alerts` |

### Topbar Admin

| Élément | Style |
|---------|-------|
| Logo / marque | `fas fa-leaf` couleur `#4CAF50` |
| Toggle sidebar | `fas fa-bars`, couleur `#666`, hover `#4CAF50` |
| Date | couleur `#888`, font-size 0.85rem |
| Info utilisateur | fond `#f5f5f5`, border-radius `8px` |
| Badge notifications | fond `#f44336`, couleur `#fff`, border-radius `10px` |
| Déconnexion | couleur `#f44336` |

### Composants communs desktop

**StatCard** — `fas fa-*` + valeur numérique + label
- Fond `#fff`, border-radius `12px`, shadow légère
- Valeur : `#1a1a2e`, 1.5rem, bold
- Icône : couleur `#4CAF50` sur fond `#e8f5e9`

**Table** — fond `#fff`, header fond `#f8f9fa`, rows alternées
- Bordure : `#e0e0e0`
- Actions : `fas fa-eye`, `fas fa-edit`, `fas fa-trash` (couleurs info/warning/danger)

**Modal confirmation suppression**
- Icône avertissement : `fas fa-exclamation-triangle`, fond `#fff3e0`, couleur `#FF9800`
- Bouton Annuler : fond `#f0f2f5`, couleur `#333`
- Bouton Supprimer : fond `#f44336`, couleur `#fff`

---

## 4. Interface Gestionnaire — Desktop

> Routes : `/gestionnaire/*` — Rôle GESTIONNAIRE

### Différences visuelles vs Admin

| Élément | Admin | Gestionnaire |
|---------|-------|--------------|
| Accent sidebar | `#4CAF50` | `#4CAF50` (identique) |
| Accent topbar icônes | `#4CAF50` | `#2196F3` (bleu) |
| Couleur icône utilisateur | `#4CAF50` | `#2196F3` |

### Navigation Gestionnaire — Icônes

| Page | Icône Font Awesome | Route |
|------|--------------------|-------|
| Dashboard | `fas fa-tachometer-alt` | `/gestionnaire` |
| Tournées | `fas fa-route` | `/gestionnaire/tournees` |
| Suivi temps réel | `fas fa-satellite-dish` | `/gestionnaire/suivi` |
| Zones | `fas fa-map` | `/gestionnaire/zones` |
| Conteneurs | `fas fa-dumpster` | `/gestionnaire/conteneurs` |
| KPIs | `fas fa-chart-pie` | `/gestionnaire/kpis` |
| Signalements | `fas fa-flag` | `/gestionnaire/signalements` |
| Maintenance | `fas fa-wrench` | `/gestionnaire/maintenance` |
| Rapports | `fas fa-file-alt` | `/gestionnaire/rapports` |

### Composants spécifiques Gestionnaire

**Carte tournée active**
- Statut PLANIFIEE : badge `#2196F3` sur `#e3f2fd`
- Statut EN_COURS : badge `#FF9800` sur `#fff8e1`
- Statut TERMINEE : badge `#4CAF50` sur `#e8f5e9`

**Carte Leaflet (suivi réel)**
- Marqueur rouge ≥ 80% remplissage : `#f44336`
- Marqueur orange ≥ 50% : `#FF9800`
- Marqueur vert < 50% : `#4CAF50`
- Marqueur bleu (collecté) : `#2196F3`

---

## 5. Interface Agent — Mobile

> Routes : `/agent/*` — Rôle AGENT

### Layout Agent

```
┌──────────────────────┐
│  MOBILE HEADER (56px)│  fond #fff, shadow légère
│  fa-leaf + titre     │
├──────────────────────┤
│                      │
│  CONTENU (scroll)    │  fond #f8f9fa
│  padding-bottom 72px │
│                      │
├──────────────────────┤
│  BOTTOM NAV (64px)   │  fond #fff, border-top #eee
│  5 onglets           │
└──────────────────────┘
```

### Bottom Navigation Agent

| Onglet | Icône | Route |
|--------|-------|-------|
| Dashboard | `fas fa-home` | `/agent` |
| Tournée | `fas fa-route` | `/agent/tournee` |
| Scan | `fas fa-qrcode` | `/scan` |
| Notifications | `fas fa-bell` | `/agent/notifications` |
| Profil | `fas fa-user` | `/agent/profil` |

Actif : `#4CAF50` / Inactif : `#aaa`

### Dashboard Agent (`/agent`)

| Section | Icônes clés |
|---------|-------------|
| Salutation (header) | `fas fa-bell` (notifs), `fas fa-user-circle` (profil) |
| Tournée du jour | `fas fa-route` (carte), `fas fa-check-circle` (collectée) |
| Stats semaine | `fas fa-chart-bar`, `fas fa-trophy` (classement) |
| Bouton tournée | `fas fa-arrow-right` / `fas fa-play` |

**Bouton primaire mobile**
- Fond : `linear-gradient(135deg, #4CAF50, #66BB6A)`
- Texte : `#fff`, font-weight 600, border-radius `12px`
- Active : `opacity: 0.9`

### Tournée (`/agent/tournee`)

| Élément | Icône | Couleur |
|---------|-------|---------|
| Progression | `fas fa-check` | `#4CAF50` |
| Carte Leaflet | — | marqueurs colorés (voir §4) |
| Prochain conteneur | `fas fa-map-marker-alt` | `#f44336` |
| Barre de progression | fond `#e8f5e9`, fill `#4CAF50` | — |
| Bouton scanner | `fas fa-qrcode` | fond `#4CAF50` |

### Scan QR (`/agent/scan`, `/scan`)

| Élément | Icône | Style |
|---------|-------|-------|
| Caméra active | `fas fa-camera` | — |
| Saisie manuelle | `fas fa-keyboard` | — |
| UID trouvé | `fas fa-check-circle` | `#4CAF50` |
| UID inconnu | `fas fa-exclamation-circle` | `#f44336` |

### Formulaire anomalie (`/agent/anomalie/form`)

| Type | Icône | Code |
|------|-------|------|
| Accès bloqué | `fas fa-ban` | `CONTENEUR_INACCESSIBLE` |
| Endommagé | `fas fa-tools` | `CONTENEUR_ENDOMMAGE` |
| Capteur défaillant | `fas fa-microchip` | `CAPTEUR_DEFAILLANT` |

**Niveaux de gravité (boutons radio)**

| Niveau | Couleur | Priorité DB |
|--------|---------|-------------|
| Basse | `#4CAF50` | 4 |
| Moyenne | `#FF9800` | 3 |
| Haute | `#f44336` | 2 |
| Critique | `#9c27b0` | 1 |

---

## 6. Interface Citoyen — Mobile

> Routes : `/citoyen/*` — Rôle CITOYEN

### Layout Citoyen

```
┌──────────────────────┐
│  CONTENU (scroll)    │  fond #f8f9fa — pages principales
│  CitoyenHome         │
│                      │
├──────────────────────┤
│  BOTTOM NAV (72px)   │  fond #fff, border-top #eee, position fixed
│  5 onglets + FAB     │
└──────────────────────┘

Sous-pages (profil, signalements...) :
┌──────────────────────┐
│  SCREEN HEADER (52px)│  fond #fff, border-bottom #eee, sticky top:0
│  ← Titre     action  │
├──────────────────────┤
│  CORPS (scroll)      │  flex:1, overflow-y:auto
└──────────────────────┘
```

### Bottom Navigation Citoyen

| Onglet | Icône | Route | Note |
|--------|-------|-------|------|
| Accueil | `fas fa-home` | `/citoyen` | — |
| Carte | `fas fa-map` | `/citoyen/carte` | — |
| **Signaler** | `fas fa-plus` | `/citoyen/signaler` | FAB central 50px, fond `#4CAF50` |
| Défis | `fas fa-trophy` | `/citoyen/defis` | — |
| Profil | `fas fa-user` | `/citoyen/profil` | — |

Badge notifications : fond `#f44336`, texte `#fff`, 16px×16px, border-radius 50%

---

### 6.1 Dashboard (`/citoyen`) — `CitoyenHome`

**Header**

| Élément | Icône | Style |
|---------|-------|-------|
| Classement | `fas fa-trophy` | fond `#f8f9fa`, couleur `#555` |
| Notifications | `fas fa-bell` | fond `#f8f9fa`, badge rouge `#f44336` |
| Avatar | `fas fa-user-circle` | 48px, border `2px solid #4CAF50`, fond `#e8f5e9` |

**Prochaine collecte**

| Urgence | Couleur |
|---------|---------|
| ≤ 1 jour | `#f44336` |
| ≤ 3 jours | `#FF9800` |
| > 3 jours / EN_COURS | `#4CAF50` / `#2196F3` |

**Actions rapides**

| Action | Icône | Couleur icône |
|--------|-------|---------------|
| Signaler | `fas fa-flag` | `#f44336` |
| Carte | `fas fa-map-marked-alt` | `#1976D2` |
| Guide du tri | `fas fa-recycle` | `#4CAF50` |
| Défis | `fas fa-trophy` | `#FF9800` |

**Impact environnemental**

| Métrique | Icône | Couleur |
|----------|-------|---------|
| CO₂ économisé | `fas fa-cloud` | `#4CAF50` |
| Déchets collectés | `fas fa-dumpster` | `#FF9800` |
| Signalements résolus | `fas fa-flag` | `#2196F3` |

**Niveaux citoyen**

| Niveau | Points min |
|--------|-----------|
| Nouveau | 0 |
| Éco-Starter | 100 |
| Éco-Acteur (Argent) | 500 |
| Éco-Héros (Or) | 1 000 |
| Éco-Légende | 5 000 |
| Maître | 10 000 |

---

### 6.2 Nouveau signalement (`/citoyen/signaler`) — `CitoyenSignaler`

**Identification conteneur**

| Bouton | Icône | Couleur |
|--------|-------|---------|
| Scanner QR | `fas fa-qrcode` | fond `#e8f5e9`, icône `#4CAF50` |
| Carte | `fas fa-map-marker-alt` | fond `#e3f2fd`, icône `#2196F3` |
| Confirmation UID trouvé | `fas fa-check-circle` | `#4CAF50` |

**Types de problème (grille 2×4)**

| Type | Icône | Code backend |
|------|-------|-------------|
| Conteneur plein | `fas fa-dumpster-fire` | `CONTENEUR_PLEIN` |
| Endommagé | `fas fa-tools` | `CONTENEUR_ENDOMMAGE` |
| Dépôt sauvage | `fas fa-trash` | `DEPOT_SAUVAGE` |
| Mauvaise odeur | `fas fa-wind` | `MAUVAISE_ODEUR` |
| Accès bloqué | `fas fa-ban` | `CONTENEUR_INACCESSIBLE` |
| Sale | `fas fa-broom` | `CONTENEUR_SALE` |
| Capteur défaillant | `fas fa-microchip` | `CAPTEUR_DEFAILLANT` |

**Niveau d'urgence**

| Niveau | Style bouton actif |
|--------|--------------------|
| BASSE | fond `#e8f5e9`, texte `#2E7D32`, bordure `#4CAF50` |
| NORMALE | fond `#e8f5e9`, texte `#2E7D32`, bordure `#4CAF50` |
| HAUTE | fond `#fff8e1`, texte `#f57f17`, bordure `#FF9800` |
| CRITIQUE | fond `#ffebee`, texte `#f44336`, bordure `#f44336` |

**Photo** : `fas fa-camera` + `fas fa-times` (retirer)

**Bouton envoyer** : fond `#4CAF50`, texte `#fff`, icône `fas fa-paper-plane` / `fas fa-spinner fa-spin`

---

### 6.3 Mes signalements (`/citoyen/signalements`) — `CitoyenMesSignalements`

**Bandeau récap (4 cartes)**

| Carte | Fond | Texte valeur |
|-------|------|-------------|
| Total | `#f8f9fa` | `#1a1a2e` |
| Nouveaux | `#e3f2fd` | `#1976d2` |
| En cours | `#fff8e1` | `#f57f17` |
| Résolus | `#e8f5e9` | `#2e7d32` |

**Onglets filtres** : actif `#4CAF50` + underline 2px / inactif `#888`
Bouton refresh : `fas fa-rotate`, couleur `#4CAF50`

**Carte signalement**

| Élément | Icône | Style |
|---------|-------|-------|
| ID + type | `fas fa-[type]` | icône dans carré 36px, border-radius 10px |
| Badge statut | — | voir tableau statuts §1.2 |
| Date | `fas fa-clock` | `#888` |
| Zone | `fas fa-map-marker-alt` | `#888` |
| Note agent | `fas fa-comment-alt` | fond `#e3f2fd`, texte `#2196F3` |
| Caret | `fas fa-chevron-right` | `#ccc` |

**Timeline statut** (3 points)
- Point actif : 10px, fond `#4CAF50`, bordure `#4CAF50`
- Point inactif : 10px, fond `#e0e0e0`
- Ligne entre points : 24px de long, verte si étape done

---

### 6.4 Notifications (`/citoyen/notifications`) — `CitoyenNotifications`

**Entête** : titre "Notifications" + bouton `fas fa-check-double` (marquer tout lu), couleur `#4CAF50`

**Item notification**

| État | Style |
|------|-------|
| Non lue | bordure gauche `3px solid #4CAF50`, fond `#fff` |
| Lue | fond `#fff` sans bordure |
| Pastille | 8px, fond `#4CAF50`, border-radius 50% |

**Icônes par type de notification**

| Type | Icône |
|------|-------|
| SYSTEME | `fas fa-bell` |
| SIGNALEMENT | `fas fa-flag` |
| ALERTE | `fas fa-exclamation-triangle` |
| TOURNEE | `fas fa-route` |

---

### 6.5 Profil (`/citoyen/profil`) — `CitoyenProfil`

**Carte héro**
- Avatar : 72px, border-radius 50%, fond `linear-gradient(135deg, #4CAF50, #2E7D32)`, icône `fas fa-user` (si pas de photo)
- 3 compteurs en ligne séparés par dividers `#eee`

**Menu de navigation**

| Item | Icône | Couleur fond icône | Couleur icône |
|------|-------|--------------------|---------------|
| Modifier profil | `fas fa-user-edit` | `#e8f5e9` | `#4CAF50` |
| Mes signalements | `fas fa-flag` | `#e8f5e9` | `#4CAF50` |
| Historique points | `fas fa-history` | `#e8f5e9` | `#4CAF50` |
| Défis & badges | `fas fa-trophy` | `#e8f5e9` | `#4CAF50` |
| Guide du tri | `fas fa-recycle` | `#e8f5e9` | `#4CAF50` |
| Déconnexion | `fas fa-sign-out-alt` | `#ffebee` | `#f44336` |

Chevron caret : `fas fa-chevron-right`, couleur `#ccc`

**Sections RGPD**

| Section | Icône header | Couleur icône |
|---------|--------------|---------------|
| Données personnelles | `fas fa-download` | `#1976d2` (fond `#e3f2fd`) |
| Supprimer le compte | `fas fa-user-slash` | `#f44336` (fond `#ffebee`) |

Bouton export : fond `#4CAF50`, icône `fas fa-download` / `fas fa-spinner fa-spin`
Bouton suppression : fond `#f44336`, icône `fas fa-trash`

**Modal confirmation suppression**
- Fond overlay : `rgba(0,0,0,0.5)`, sheet bottom border-radius `20px 20px 0 0`
- Titre : `fas fa-times` (bouton fermer, 32px, fond `#f5f5f5`)
- Input MDP : style standard
- Bouton Annuler : fond `#f9f9f9`, bordure `#ddd`, texte `#555`
- Bouton Supprimer : fond `#f44336`, texte `#fff`

**Footer légal**

| Lien | Icône |
|------|-------|
| Politique de confidentialité | `fas fa-shield-alt` |
| CGU | `fas fa-file-contract` |
| Mentions légales | `fas fa-gavel` |
| DPO (email) | `fas fa-envelope` |
| Conforme RGPD | `fas fa-check-circle` |

---

### 6.6 Modifier mon profil (`/citoyen/profil/modifier`) — `CitoyenEditProfil`

**Avatar upload**
- Zone avatar : 80px, border-radius 50%, fond `#e8f5e9`
- Bouton changer photo : `fas fa-camera`, fond `#4CAF50`, texte `#fff`
- Bouton retirer : `fas fa-trash`, fond `#ffebee`, texte `#f44336`
- Upload en cours : `fas fa-spinner fa-spin`

**Formulaire**

| Champ | Icône prefix |
|-------|-------------|
| Prénom | `fas fa-user` |
| Nom | `fas fa-user` |
| Email | `fas fa-envelope` |
| Téléphone | `fas fa-phone` |
| Ancien MDP | `fas fa-lock` |
| Nouveau MDP | `fas fa-lock` |
| Toggle visibilité | `fas fa-eye` / `fas fa-eye-slash` |

Bouton sauvegarder : fond `#4CAF50`, icône `fas fa-check` / `fas fa-spinner fa-spin`

---

### 6.7 Historique des points (`/citoyen/points-historique`) — `CitoyenPointsHistorique`

**Carte récap**
- Fond : `linear-gradient(135deg, #4CAF50, #2E7D32)`
- Texte blanc, 3 colonnes séparées par lignes `rgba(255,255,255,0.3)`

**Onglets filtres** (style pills)
- Actif : fond `#4CAF50`, texte `#fff`
- Inactif : fond transparent, texte `#888`

**Icônes par raison de transaction**

| Raison | Icône | Couleur montant |
|--------|-------|-----------------|
| Signalement validé | `fas fa-flag` | `#4CAF50` (gain) |
| Signalement résolu | `fas fa-check-circle` | `#4CAF50` (gain) |
| Défi complété | `fas fa-medal` | `#4CAF50` (gain) |
| Badge gagné | `fas fa-award` | `#4CAF50` (gain) |
| Participation défi | `fas fa-trophy` | `#4CAF50` (gain) |
| Ajustement | `fas fa-sliders-h` | contextuel |
| Dépense (archivée) | `fas fa-shopping-bag` | `#f44336` |

---

### 6.8 Défis & Badges (`/citoyen/defis`) — `CitoyenDefis`

**Onglets** : Défis / Badges — actif `#4CAF50`, underline 2px

**Carte défi**
- Fond `#fff`, border-radius `14px`, shadow standard
- Tag catégorie : border-radius `10px`, couleur selon catégorie
- Récompense points : `fas fa-star`, couleur `#FF9800`
- Barre progression : fond `#e0e0e0`, fill `#4CAF50`, height 6px, radius 3px

**Tags catégories**

| Catégorie | Fond | Texte |
|-----------|------|-------|
| ECO | `#e8f5e9` | `#2e7d32` |
| SOCIAL | `#e3f2fd` | `#1565c0` |
| SANTÉ | `#fce4ec` | `#ad1457` |
| Autre | `#f3e5f5` | `#6a1b9a` |

**Grille badges** (2 colonnes)
- Badge gagné : icône colorée, nom `#333`, sous-titre `#888`
- Badge verrouillé : opacité 0.5, `fas fa-lock` en `#bbb`
- Cercle icône : 52px, border-radius 50%

---

### 6.9 Guide du tri (`/citoyen/tri`) — `CitoyenTri`

**Barre de recherche**
- Fond `#fff`, bordure `#e0e0e0`, icône `fas fa-search`, couleur `#aaa`

**Catégories de tri**

| Catégorie | Icône | Couleur icône | Fond icône |
|-----------|-------|---------------|------------|
| Plastiques & Emballages | `fas fa-wine-bottle` | `#2196F3` | `#e3f2fd` |
| Verre | `fas fa-glass-martini-alt` | `#4CAF50` | `#e8f5e9` |
| Papier & Carton | `fas fa-newspaper` | `#FF9800` | `#fff3e0` |
| Non-recyclables | `fas fa-trash` | `#f44336` | `#ffebee` |
| DEEE | `fas fa-laptop` | `#9c27b0` | `#f3e5f5` |

Chevron catégorie : `fas fa-chevron-down` / `fas fa-chevron-up`, couleur `#aaa`

**Section impact pédagogique**
- Bordure gauche : `4px solid #4CAF50`
- Icône section : fond `rgba(76,175,80,0.14)`, couleur `#4CAF50`
- Titre : `fas fa-leaf`, sous-titre gris `#888`
- Tableaux ADEME : header fond `#fff`, text `#555`, data `#444`
- Badge "Estimation" : fond `rgba(255,152,0,0.15)`, texte `#d68900`
- Liens sources : couleur `#2e7d32`, bordure `#ececec`, hover fond `#f0f7f1`

---

### 6.10 Carte des conteneurs (`/citoyen/carte`) — `CitoyenMap`

- Fond page : `#f8f9fa`
- Carte Leaflet pleine largeur
- Marqueurs colorés identiques à §4 (rouge/orange/vert selon remplissage)
- Bouton retour : `MobileScreenHeader` avec `fas fa-arrow-left`

---

## 7. Composants partagés mobiles

### MobileScreenHeader

| Élément | Icône | Style |
|---------|-------|-------|
| Bouton retour | `fas fa-arrow-left` | 36px, fond `#f8f9fa`, couleur `#555`, border-radius 50% |
| Titre | — | centré, 1.05rem, weight 600, `#1a1a2e` |
| Zone droite (optionnelle) | selon page | 36px aligné à droite |

Fond : `#fff`, bordure-bas : `1px solid #eee`, `min-height: 52px`, `position: sticky; top: 0; z-index: 50`

### ImpactStats

Cartes horizontales avec : icône + valeur `≈X` + label

| Métrique | Icône | Couleur de fond icône |
|----------|-------|-----------------------|
| CO₂ (kg) | `fas fa-cloud` | `#e8f5e9` |
| Déchets (kg) | `fas fa-dumpster` | `#fff3e0` |
| Signalements | `fas fa-flag` | `#e3f2fd` |

### PointsCard

- Dégradé : `linear-gradient(135deg, #4CAF50, #2E7D32)`
- Texte blanc, 3 métriques, border-radius `16px`
- Icône : `fas fa-star` (points), `fas fa-flag` (signalements), `fas fa-award` (badges)

### ClassementModal (sheet bottom)

- Overlay `rgba(0,0,0,0.45)`, sheet radius `20px 20px 0 0`
- Handle : 4px×32px, fond `#d8d8d8`, radius 999px
- Bouton fermer : `fas fa-times`, fond `#f5f5f5`, radius 50%
- Rang 1 : `fas fa-trophy`, `#FFD700`
- Rang 2–3 : `fas fa-medal`, `#C0C0C0` / `#CD7F32`
- Rang autres : numéro seul, `#555`
- Ligne utilisateur courant : fond `#e8f5e9`, bordure `4px solid #4caf50`

---

## 8. Icônes — Index global par usage

### Navigation & Actions

| Usage | Icône |
|-------|-------|
| Retour | `fas fa-arrow-left` |
| Fermer / Supprimer | `fas fa-times` |
| Confirmer | `fas fa-check` |
| Rafraîchir | `fas fa-rotate` |
| Envoyer / Submit | `fas fa-paper-plane` |
| Télécharger | `fas fa-download` |
| Upload / Photo | `fas fa-camera` |
| Scan QR | `fas fa-qrcode` |
| Chargement | `fas fa-spinner fa-spin` |
| Menu | `fas fa-bars` |
| Chevron droite | `fas fa-chevron-right` |
| Chevron bas/haut | `fas fa-chevron-down` / `fas fa-chevron-up` |

### Utilisateurs & Profil

| Usage | Icône |
|-------|-------|
| Utilisateur | `fas fa-user` |
| Utilisateur cercle | `fas fa-user-circle` |
| Modifier profil | `fas fa-user-edit` |
| Supprimer compte | `fas fa-user-slash` |
| Rôle | `fas fa-user-shield` |
| Déconnexion | `fas fa-sign-out-alt` |
| MFA / Sécurité | `fas fa-shield-alt` |

### Conteneurs & Environnement

| Usage | Icône |
|-------|-------|
| Conteneur | `fas fa-dumpster` |
| Plein (urgence) | `fas fa-dumpster-fire` |
| Endommagé | `fas fa-tools` |
| Odeur | `fas fa-wind` |
| Accès bloqué | `fas fa-ban` |
| Sale | `fas fa-broom` |
| Capteur | `fas fa-microchip` |
| Dépôt sauvage | `fas fa-trash` |
| Recyclage | `fas fa-recycle` |
| Feuille / Écologie | `fas fa-leaf` |
| CO₂ / Nuage | `fas fa-cloud` |

### Statuts & Informations

| Usage | Icône |
|-------|-------|
| Nouveau signalement | `fas fa-flag` |
| Résolu | `fas fa-check-circle` |
| Erreur | `fas fa-exclamation-circle` |
| Avertissement | `fas fa-exclamation-triangle` |
| Information | `fas fa-info-circle` |
| Verrouillé | `fas fa-lock` |
| RGPD OK | `fas fa-check-circle` |

### Gamification

| Usage | Icône |
|-------|-------|
| Points / Étoile | `fas fa-star` |
| Trophée | `fas fa-trophy` |
| Médaille | `fas fa-medal` |
| Badge | `fas fa-award` |
| Classement | `fas fa-trophy` |

### Localisation & Transport

| Usage | Icône |
|-------|-------|
| Carte | `fas fa-map` |
| Carte détaillée | `fas fa-map-marked-alt` |
| Marqueur | `fas fa-map-marker-alt` |
| Tournée | `fas fa-route` |
| Satellite | `fas fa-satellite-dish` |

---

## 9. Résumé — Design par rôle

| Rôle | Interface | Accent couleur | Style dominant |
|------|-----------|---------------|----------------|
| **Admin** | Desktop | `#4CAF50` | Sidebar sombre `#1a1a2e`, fond `#f5f6fa` |
| **Gestionnaire** | Desktop | `#2196F3` (topbar) + `#4CAF50` (sidebar actif) | Identique Admin |
| **Agent** | Mobile | `#4CAF50` | Fond `#f8f9fa`, cartes blanches, gradient boutons |
| **Citoyen** | Mobile | `#4CAF50` | Fond `#f8f9fa`, cartes blanches, FAB central vert |
| **Auth** | Tous | `#4CAF50` | Glassmorphism sombre, dégradé `#1a1a2e → #0f3460` |
