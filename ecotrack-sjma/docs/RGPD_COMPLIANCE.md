#  Documentation Conformité RGPD - EcoTrack

---

##  Vue d'ensemble

EcoTrack implémente une conformité complète au **Règlement Général sur la Protection des Données (RGPD)** en respectant tous les principes fondamentaux et les droits des individus.

**Articles respectés:** 5, 7, 12, 13, 14, 15, 17, 18, 20, 21, 25, 32, 33, 34

---

##  Articles RGPD Implémentés

### **Article 5 - Principes relatifs au traitement des données**

#### 5.1.a - Licéité, loyauté et transparence 
- **Implémentation:** 
  - Politique de confidentialité claire et accessible
  - Consentement explicite pour cookies et données sensibles
  - CGU détaillées avant inscription
  - Page `PrivacyPage.jsx` avec document complet

#### 5.1.b - Limitation de finalité 
- **Implémentation:**
  - Données collectées **uniquement** pour fonctionnement plateforme
  - Aucune revente à tiers
  - Aucun traçage publicitaire
  - Utilisation strictement définie dans la politique

#### 5.1.c - Minimisation des données 
- **Implémentation:**
  - Champs obligatoires réduits au minimum
  - Pas de collecte excessive
  - Avatar optionnel
  - Données supprimées au bout de 3 ans d'inactivité

#### 5.1.d - Exactitude et mise à jour 
- **Implémentation:**
  - Profil utilisateur modifiable (`ProfilePage.jsx`) — prénom, **nom** et email éditables
  - Validation email lors de l'inscription
  - Correction possible des données personnelles
  - Endpoint PUT `/users/profile` — champs acceptés : `prenom`, `nom`, `email`
  - Avatar téléchargeable et supprimable (champ `avatar_url`)

#### 5.1.e - Limitation de conservation 
- **Implémentation:**
  - **Soft-delete** avec délai de 30 jours (Art. 17)
  - Logs archivés après 7 jours
  - Logs archivés supprimés après 12 mois
  - Consent logs conservés **13 mois max** (CNIL)
  - Anonymisation après 3 ans d'inactivité

#### 5.1.f - Intégrité et confidentialité 
- **Implémentation:**
  - Chiffrage bcrypt (10 tours) des mots de passe
  - Stockage sécurisé PostgreSQL avec chiffrage
  - HTTPS obligatoire en production
  - JWT pour authentification avec expiration
  - Rate limiting sur endpoints sensibles

#### 5.2 - Responsabilité 
- **Implémentation:**
  - Documentation complète (ce document)
  - Logs d'audit pour traçabilité
  - CRON jobs automatisés avec logs
  - Consentement versionnés

---

### **Article 7 - Conditions du consentement**

#### Preuve de consentement
- **Implémentation:** 
  - POST `/api/V1/consent` - Enregistrement du consentement
  - Données capturées:
    - **IP address** (via X-Forwarded-For ou socket)
    - **User-agent** (navigateur/device)
    - **Timestamp exact** (CURRENT_TIMESTAMP)
    - **Type de consentement** (cookies, CGU, privacy)
    - **Action** (accepted/rejected)
    - **Version du document** (pour traceabilité)
  - Stockage: `ecotrack_archive.consent_logs`
  - Rétention: **13 mois max** (recommandation CNIL)

#### Interface de consentement cookies (CookieBanner)
- **Implémentation:**
  - Bannière RGPD affichée à la première visite (`CookieBanner.jsx`)
  - Actions disponibles : **Refuser tout** / **Accepter tout**
  - Consentement enregistré en base via `POST /api/V1/cookies/consent` avec `session_id`, `consent_status` (`ACCEPTED`/`REJECTED`), `cookies_accepted`
  - Session persistée en `sessionStorage`
  - Conformément à la recommandation CNIL : interface simple, choix binaire clair

#### Changement de consentement
- **Implémentation:**
  - Utilisateur peut modifier ses préférences notification par type réel (`ALERTE`, `ADMIN_SERVICE`…)
  - Préférences effectives : le filtre est appliqué en temps réel dans la cloche de notifications
  - Consent history consultable (GET `/users/me/consents`)
  - LocalStorage pour persistance client
  - Notification preferences par rôle (GESTIONNAIRE / ADMIN)

#### Suppression de consentement (Droit à l'oubli)
- **Implémentation:**
  - DELETE `/api/V1/cookies/consent` - Suppression immédiate
  - Suppression complète du consentement
  - Aucune trace persistante

---

### **Article 12 - Transparence de l'information**

#### Informations claires et accessibles
- **Implémentation:**
  - Page Privacy (`PrivacyPage.jsx`) - Politique complète
  - Page Terms (`TermsPage.jsx`) - CGU
  - Page Legal (`LegalPage.jsx`) - Mentions légales
  - Footer component avec liens accessibles
  - Langage simple et français
  - DPO contact: dpo@ecotrack.fr

#### Modalité facile d'exercice des droits
- **Implémentation:**
  - Section "Données" dans ProfilePage
  - Bouton "Télécharger mes données" visible
  - Bouton "Supprimer mon compte" avec confirmation
  - Historique des consentements consultable

---

### **Article 13 & 14 - Information de l'utilisateur**

#### À la collecte (Art. 13)
- **Implémentation:**
  - Politique de confidentialité avant inscription
  - Formulaire d'inscription avec consentement explcite
  - Données obligatoires clairement identifiées
  - Finalité du traitement indiquée

#### Ultérieurement (Art. 14)
- **Implémentation:**
  - Notification via email pour modification politique
  - Historique des versions de consentement
  - Accès à l'historique audit trail

---

### **Article 15 - Droit d'accès**

#### Export complet des données
- **Implémentation:**
  - GET `/users/me/export` - Téléchargement JSON
  - Données incluses:
    - Profil utilisateur (sans mot de passe)
    - Tous les signalements créés
    - Toutes les tournées assignées
    - Badges et achievements
    - Défis et points
    - Historique d'activité complet
    - Enregistrement des consentements
  - Format: **JSON standard** (Data Portability - Art. 20)
  - Horodatage: timestamp d'export

#### Accès dans ProfilePage
- **Implémentation:**
  - Onglet "Données" dédié
  - Bouton "Télécharger mes données"
  - Téléchargement direct en JSON
  - Exporte en fichier `ecotrack-data-{timestamp}.json`

---

### **Article 17 - Droit à l'oubli (Suppression)**

#### Demande de suppression
- **Implémentation:**
  - POST `/users/me/delete` - Demande suppression
  - Paramètre: password (confirmation)
  - Timestamp: `deletion_requested_at`
  - Réponse: délai de 30 jours
  - Endpoint accessible depuis ProfilePage onglet "Supprimer"

#### Période de grâce (30 jours)
- **Implémentation:**
  - Champ: `deletion_requested_at` TIMESTAMPTZ
  - Utilisateur peut annuler: POST `/users/me/cancel-deletion`
  - Modal de confirmation avec avertissements
  - Délai calculé: `deletion_requested_at + 30 days`

#### Anonymisation après expiration
- **Implémentation:**
  - CRON: `0 2 * * *` (02:00 UTC) - anonymizeExpiredDeletions()
  - Après 30 jours:
    - `deleted_at` = NOW()
    - `anonymized` = TRUE
    - `prenom` = "Anonyme"
    - `nom` = "Utilisateur"
    - `email` = "anonymized_{id}@ecotrack.local"
    - `telephone` = NULL
    - `deletion_requested_at` = NULL
  - Index: `idx_utilisateur_deletion_requested`

#### Anonymisation automatique (inactivité)
- **Implémentation:**
  - CRON: `15 2 * * *` (02:15 UTC) - anonymizeInactiveUsers()
  - Condition: `last_login_date < NOW() - 3 years`
  - Anonymisation complète (prenom, nom, email, telephone)
  - Pas de soft-delete (donnée conservée pour audit)

#### Droits des personnes concernées
- **Implémentation:**
  - Suppression des signalements associés
  - Archivage des tournées complétées
  - Suppression des points et badges (non pertinent)
  - Conservation logs audit (légitime intérêt)
  - Conservation pour conformité légale si nécessaire

---

### **Article 18 - Droit de rectification**

#### Correction des données
- **Implémentation:**
  - PUT `/users/profile` - Modification profil
  - Champs modifiables:
    - `prenom`
    - `nom`
    - `email`
  - Interface: ProfilePage onglet "Profil" mode édition
  - Validation email unique

#### Historique des modifications
- **Implémentation:**
  - Logs d'audit dans `archived_logs`
  - Action: `update_profile`
  - Timestamp et utilisateur tracés
  - Accès via GET `/users/me/consents` (audit trail)

---

### **Article 20 - Droit à la portabilité**

#### Format structuré et lisible
- **Implémentation:**
  - Export JSON standard
  - Format parsable machine
  - Lisible humain
  - Encodage UTF-8

#### Transmission directe
- **Implémentation:**
  - Téléchargement direct via navigateur
  - Pas d'intermédiaire
  - Timestamp: horodatage du fichier
  - Versioning: `dataVersion: "1.0"`

---

### **Article 21 - Droit d'opposition**

#### Préférences de notifications
- **Implémentation:**
  - Toggles par type de notification
  - ProfilePage onglet "Notifications"
  - Stockage: localStorage
  - Notifications adaptées au rôle:
    - **GESTIONNAIRE:** zones, tournees, conteneurs, signalements, analytics, news
    - **ADMIN:** utilisateurs, systeme, securite, maintenance, logs, news

#### Conservation des choix
- **Implémentation:**
  - LocalStorage: `notif_{type}` = true/false
  - Persistance au rechargement
  - Synchro avec backend (possibilité d'ajout)

---

### **Article 25 - Protection dès la conception**

#### Data Protection by Design
- **Implémentation:**
  - Minimisation des données (Art. 5.1.c)
  - Chiffrage des mots de passe (bcrypt)
  - JWT expiration courte
  - HTTPS obligatoire
  - Validation input stricte

#### Data Protection by Default
- **Implémentation:**
  - Soft-delete par défaut (pas suppression physique)
  - Anonymisation automatique après 3 ans
  - Logs archivés automatiquement
  - Consentements auto-supprimés à 13 mois
  - Rate limiting par défaut

#### Automatisation de la conformité
- **Implémentation:**
  - CRON jobs quotidiens:
    - `03:00` - archiveOldLogs() (logs > 7 jours)
    - `03:15` - cleanupArchivedLogs() (archived > 12 mois)
    - `03:30` - cleanupExpiredConsents() (consents > 13 mois)
    - `02:00` - anonymizeInactiveUsers() (> 3 ans)
    - `02:15` - anonymizeExpiredDeletions() (> 30 jours)

#### Audit et traçabilité
- **Implémentation:**
  - Tous les CRON jobs loggés
  - Actions sensibles tracées (delete, export, etc.)
  - Logs structurés avec contexte
  - Rétention audit trail: 12 mois

---

### **Article 32 - Sécurité des données**

#### Chiffrage
- **Implémentation:**
  - **Mots de passe:** bcrypt (10 tours)
  - **Transit:** HTTPS obligatoire (TLS 1.2+)
  - **Stockage:** PostgreSQL avec chiffrage optionnel
  - **Tokens:** JWT signé (HS256/RS256)

#### Confidentialité
- **Implémentation:**
  - Authentification obligatoire pour endpoints sensibles
  - Authorization via JWT + roles
  - Rate limiting: 100 req/15min par IP
  - Helmet headers (CSP, X-Frame-Options, etc.)

#### Intégrité
- **Implémentation:**
  - Validation stricte des inputs (Zod schemas)
  - SQL prepared statements (paramétré)
  - CORS restrictif
  - Validation JSON schema

#### Disponibilité et résilience
- **Implémentation:**
  - Database connection pooling
  - Backup automatiques (docker volumes)
  - Health checks: /health, /health/db
  - Monitoring Prometheus + Grafana
  - Alertes sur anomalies

#### Authentification multi-facteurs
- **Implémentation:**
  - MFA optionnel disponible
  - JWT + TOTP/SMS
  - Session tokens sécurisés
  - Logout explicite requis

#### Logs de sécurité
- **Implémentation:**
  - Tous les accès loggés
  - Tentatives échouées tracées
  - Format structuré (JSON)
  - Centralisation logs (winston/pino)
  - Pas de données sensibles en logs

---

### **Articles 33 & 34 - Notification des violations**

#### Plan de réponse
- **Implémentation:**
  - Monitoring temps réel des logs
  - Alertes Prometheus sur anomalies
  - Procédure d'escalade définie
  - Contact DPO: dpo@ecotrack.fr

#### Notification aux utilisateurs
- **Implémentation:**
  - Service notification avec templates
  - Email notifications (possibilité)
  - Dashboard admin pour incidents
  - Historique violations loggé

#### Notification à l'autorité
- **Implémentation:**
  - Procédure manuelle pour CNIL
  - Documentation incidents
  - Délai 72h respecté

---

##  Architecture de Conformité

### Diagramme flux données

```
┌─────────────┐
│  Utilisateur │
└──────┬──────┘
       │
       ├─→ [Profil] ─→ PUT /users/profile (rectification)
       ├─→ [Consent] ─→ POST /api/V1/consent (Art. 7 preuve)
       ├─→ [Export] ─→ GET /users/me/export (Art. 15)
       ├─→ [Delete] ─→ POST /users/me/delete (Art. 17)
       └─→ [History] ─→ GET /users/me/consents (audit)
       
┌──────────────────────────────────────────┐
│    Base de données - PostgreSQL           │
│  ┌──────────────────────────────────────┐ │
│  │ public.utilisateur                   │ │
│  │ - deleted_at (soft delete)           │ │
│  │ - deletion_requested_at (grace 30j) │ │
│  │ - anonymized (flag anonymisation)    │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │ ecotrack_archive.consent_logs        │ │
│  │ - IP, user_agent (preuve Art. 7)    │ │
│  │ - version_document (traçabilité)    │ │
│  │ - expires_at (13 mois max)          │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │ ecotrack_archive.archived_logs       │ │
│  │ - action, ip_address, user_agent    │ │
│  │ - created_at (12 mois conservation)  │ │
│  └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
       │
       ├─→ CRON 03:00 - archiveOldLogs()
       ├─→ CRON 03:15 - cleanupArchivedLogs()
       ├─→ CRON 03:30 - cleanupExpiredConsents()
       ├─→ CRON 02:00 - anonymizeInactiveUsers()
       └─→ CRON 02:15 - anonymizeExpiredDeletions()
```

### Modèle données GDPR

```sql
-- Soft-delete et anonymisation
ALTER TABLE public.utilisateur
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN anonymized BOOLEAN DEFAULT FALSE;

-- Preuve de consentement (Art. 7)
CREATE TABLE ecotrack_archive.consent_logs (
  id SERIAL,
  id_utilisateur INTEGER,
  session_id VARCHAR(255),
  type_consent VARCHAR(50),       -- cookies, cgu, privacy
  action_consent VARCHAR(20),     -- accepted, rejected
  version_document VARCHAR(50),   -- v1.0, v2.0
  intitule TEXT,                  -- texte exact du consentement
  ip_address INET,                -- preuve de consentement
  user_agent TEXT,                -- preuve de consentement
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ          -- 13 mois max
);

-- Audit trail archivé
CREATE TABLE ecotrack_archive.archived_logs (
  id SERIAL,
  id_utilisateur INTEGER,
  action VARCHAR(100),
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ
);
```

---

##  Fichiers implémentation

### Frontend
- `frontend/src/pages/auth/ProfilePage.jsx` - Gestion profil + GDPR
- `frontend/src/pages/auth/PrivacyPage.jsx` - Politique confidentialité
- `frontend/src/components/layout/Footer.jsx` - Liens accessibilité
- `frontend/src/services/userService.js` - Appels API GDPR

### Backend Services

#### API Gateway
- `services/api-gateway/src/routes/gdpr.route.js` - Endpoints consent
- `services/api-gateway/src/repositories/consentRepository.js` - Data layer
- `services/api-gateway/src/cron-gdpr.js` - CRON logs archival

#### Service-Users
- `services/service-users/src/services/gdprService.js` - Métier GDPR
- `services/service-users/src/repositories/gdprRepository.js` - Data layer
- `services/service-users/src/routes/gdpr.route.js` - Endpoints export/delete
- `services/service-users/src/config/cron-gdpr.js` - CRON anonymisation

### Database
- `database/migrations/026_add_gdpr_fields_to_utilisateur.sql` - Soft-delete
- `database/migrations/027_create_consent_and_archive_tables.sql` - Audit trail


---