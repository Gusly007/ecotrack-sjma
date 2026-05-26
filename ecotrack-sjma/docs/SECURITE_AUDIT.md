# Audit Securite EcoTrack — Checklist Dev & Dev+Data

**Referentiel** : OWASP API Security Top 10 · OWASP Top 10:2021 · RGPD EU 2016/679 · Specifications IoT EcoTrack
**Track concerne** : Developpement (points "Dev" et "Dev & Data")
**Date d'audit** : 2026-05-26
**Branche auditee** : fix/security-audit (basee sur main)
**Auditeur** : Moussa Ghazaly

---

## Legende

| Statut | Signification |
|--------|---------------|
| IMPLEMENTE | Controle en place, demonstrable dans le code |
| PARTIEL | Mise en oeuvre incomplete ou avec reserve mineure |
| ABSENT | Controle non mis en oeuvre |

| Severite | Signification |
|----------|---------------|
| CRITIQUE | Faille exploitable directement |
| ELEVE | Impact significatif sur la securite |
| MOYEN | Bonne pratique, ameliore la posture globale |

---

## A1 — Authentification et gestion des identites

**Referentiel** : OWASP API1 / API2

| N | Point de controle | Severite | Statut |
|---|-------------------|----------|--------|
| 1 | Token JWT access avec expiration 1h ; refresh token 7 jours stocke en base, revocable | CRITIQUE | IMPLEMENTE |
| 2 | Secrets (JWT, DSN, cles API) transmis par variables d'environnement, jamais dans le code | CRITIQUE | IMPLEMENTE |
| 3 | Mots de passe haches avec bcrypt (cost >= 10) | CRITIQUE | IMPLEMENTE |
| 4 | Route login protegee contre bruteforce ; reset password limite a 3 demandes par heure | CRITIQUE | IMPLEMENTE |
| 5 | La deconnexion invalide le refresh token cote serveur (suppression en base) | ELEVE | IMPLEMENTE |
| 6 | Endpoints ingestion IoT proteges par authentification dediee, distincte des tokens utilisateurs | ELEVE | PARTIEL |

### Detail des points implémentes A1

**Point 1 — JWT access 1h / refresh 7 jours**

Le token d'acces JWT est emis avec une duree de vie de 1 heure (configurable via la variable d'environnement `JWT_EXPIRES_IN`). La valeur par defaut est `'1h'` dans `services/service-users/src/config/env.js` ligne 115.

Le refresh token est stocke en base de donnees dans la table `refresh_tokens` (creee dans `services/service-users/src/config/database.js`). La table reference `UTILISATEUR(id_utilisateur)` par une cle etrangere avec `ON DELETE CASCADE`. Chaque token est revocable individuellement via la route de deconnexion qui appelle `sessionService.invalidateRefreshToken()`.

Fichiers : `services/service-users/src/config/env.js:115` · `services/service-users/src/config/database.js:64` · `services/service-users/src/services/sessionService.js`

---

**Point 2 — Secrets par variables d'environnement**

Aucun secret n'est inscrit en dur dans le code source. Toutes les valeurs sensibles (JWT_SECRET, JWT_REFRESH_SECRET, DATABASE_URL, SMTP_PASS, etc.) sont lues via `process.env.*`. Le fichier `.env` est present dans `.gitignore` racine et dans le `.gitignore` de chaque service. Les Dockerfiles ne contiennent pas de valeurs de secrets. Les pipelines CI/CD referent les secrets via les secrets GitHub Actions (`${{ secrets.JWT_SECRET }}`).

Fichiers : `ecotrack-sjma/.gitignore` · `services/service-users/src/config/env.js` · `.github/workflows/ci.yml`

---

**Point 3 — Hachage bcrypt cost 10**

Tous les mots de passe sont haches avec `bcrypt.genSalt(env.security.bcryptRounds)` avant insertion en base. La valeur par defaut de `bcryptRounds` est `10`, configurable via variable d'environnement. Le mot de passe brut n'est jamais stocke ni logue. La verification se fait par `bcrypt.compare()` sans acces au hash dans la reponse.

Fichier : `services/service-users/src/utils/crypto.js:12`

---

**Point 4 — Rate limiting login et reset password**

Deux limiteurs distincts sont configures dans `services/service-users/src/config/rateLimit.js` :

- `loginLimiter` : 5 tentatives par compte par fenetre de 15 minutes. La fenetre utilise l'IP comme cle via `express-rate-limit`.
- `passwordResetLimiter` : 3 demandes par heure par IP.

Ces limiteurs sont appliques directement sur les routes concernees avant execution du controleur, garantissant qu'aucune logique metier ne peut etre atteinte au-dela du seuil.

Fichier : `services/service-users/src/config/rateLimit.js` · `services/service-users/src/routes/auth.route.js`

---

**Point 5 — Invalidation du refresh token sur deconnexion**

La route `POST /auth/logout` appelle `sessionService.invalidateRefreshToken(userId, refreshToken)` qui supprime la ligne correspondante dans la table `refresh_tokens`. Un token intercepte apres deconnexion ne peut plus etre utilise pour obtenir un nouvel access token. L'endpoint de refresh verifie l'existence du token en base avant toute emission.

Fichier : `services/service-users/src/controllers/sessionController.js:63` · `services/service-users/src/services/sessionService.js`

---

**Point 6 — Authentification IoT (partiel)**

Le broker MQTT utilise `aedes.authenticate` (`services/service-iot/src/mqtt-broker.js:32`) avec verification username/password. L'authentification est donc presente. La reserve est que la credential est partagee entre tous les capteurs plutot que d'etre individuelle et revocable unitairement par capteur. Ce point constitue une dette technique identifiee pour la version suivante.

---

## A2 — Controle d'acces et autorisation

**Referentiel** : OWASP API1 / API5

| N | Point de controle | Severite | Statut |
|---|-------------------|----------|--------|
| 1 | Chaque requete verifie cote serveur le role ou la propriete de la ressource | CRITIQUE | IMPLEMENTE |
| 2 | IDs de ressources en UUID v4 pour prevenir l'enumeration | ELEVE | ABSENT |
| 3 | Endpoints d'administration isoles derriere un middleware de role distinct | CRITIQUE | IMPLEMENTE |
| 4 | Verifications RBAC centralisees dans des middlewares, pas dispersees dans le metier | ELEVE | IMPLEMENTE |

### Detail des points implémentes A2

**Point 1 et 4 — RBAC centralise et verification systematique**

Un middleware unique `requirePermission()` est defini dans `services/service-containers/src/middleware/rbac.js`. Il implemente une matrice role/permission couvrant les quatre roles EcoTrack (ADMIN, GESTIONNAIRE, AGENT_COLLECTE, CITOYEN). Aucun controleur n'effectue de verification de role directement : la logique de controle d'acces est entierement separee de la logique metier.

Le middleware `authenticateToken` dans service-users verifie la validite de la signature JWT et extrait les claims avant toute autre logique. Les headers `x-user-id` et `x-user-role` transmis par la gateway apres verification sont lus dans les autres services via le middleware de parsing des headers (`services/service-gamifications/src/index.js:84`).

Fichiers : `services/service-containers/src/middleware/rbac.js` · `services/service-users/src/middleware/auth.js` · `services/api-gateway/src/middleware/authMiddleware.js`

---

**Point 3 — Routes d'administration isolees**

Les routes `/admin/config`, `/admin/roles`, `/admin/environmental-constants` et `/admin/agent-performance` sont montees dans un routeur separe avec verification du role ADMIN avant toute exposition. Ces routes ne sont pas accessibles aux autres roles, meme avec un token valide.

Fichier : `services/service-users/src/routes/admin.route.js`

---

**Point 2 — IDs sequentiels (absent)**

Les identifiants `id_conteneur` et `id_zone` sont des entiers sequentiels (SERIAL). Un utilisateur connaissant l'ID 1 peut tenter d'acceder a la ressource ID 2. La protection compensatoire est le middleware RBAC qui verifie systematiquement l'ownership ou le role requis cote serveur, rendant le simple devinement d'un ID insuffisant pour acceder a une ressource non autorisee.

---

## A3 — Injections, XSS, CSRF et validation des entrees

**Referentiel** : OWASP API3 / A03:2021

| N | Point de controle | Severite | Statut |
|---|-------------------|----------|--------|
| 1 | Toutes les requetes SQL utilisent des requetes parametrees — aucune concatenation directe | CRITIQUE | IMPLEMENTE |
| 2 | Formulaires et mutations proteges contre CSRF | CRITIQUE | ABSENT |
| 3 | Sorties affichees echappees contre XSS ; JWT non accessible depuis JS injecte | ELEVE | PARTIEL |
| 4 | Parametres de tri, filtrage et pagination valides et bornes cote serveur | ELEVE | IMPLEMENTE |
| 5 | Entrees geospatiales (GPS, GeoJSON) validees avant insertion en PostGIS | ELEVE | IMPLEMENTE |
| 6 | Messages d'erreur sans stack trace, schema DB ni version des dependances | ELEVE | IMPLEMENTE |
| 7 | Fichiers uploades valides en type, taille et contenu avant traitement | ELEVE | IMPLEMENTE |

### Detail des points implémentes A3

**Point 1 — Requetes SQL parametrees**

Tous les repositories utilises dans le projet construisent les requetes avec des placeholders positionnels PostgreSQL (`$1`, `$2`, ...). Les valeurs utilisateur ne sont jamais concatenees dans la chaine SQL. Les clauses WHERE dynamiques dans service-iot construisent un tableau de conditions avec indices incrementes (`conditions.push(\`col = $\${paramIndex++}\`)`), garantissant le parametre meme en cas de filtres multiples.

Exemples verifies : `services/service-containers/src/repositories/containerRepository.js` · `services/service-iot/src/repositories/measurementRepository.js` · `services/service-users/src/repositories/userRepository.js`

---

**Point 4 — Validation des parametres de filtrage et pagination**

Le schema Joi dans `services/service-iot/src/validators/iot.validator.js` valide les types, plages et formats de toutes les entrees IoT. La pagination est bornee sur tous les endpoints de collection (zones, conteneurs, mesures, alertes, tournees) avec des valeurs maximales definies pour eviter les requetes de masse non bornees.

Fichier : `services/service-iot/src/validators/iot.validator.js`

---

**Point 5 — Validation geospatiale**

Les controleurs de conteneurs et de zones valident explicitement les coordonnees avant toute operation PostGIS :

- Latitude dans [-90, 90]
- Longitude dans [-180, 180]
- Rayon dans ]0, 500] km

Les requetes avec coordonnees hors borne retournent HTTP 400 sans atteindre la base de donnees.

Fichiers : `services/service-containers/src/controllers/container-controller.js` · `services/service-containers/src/controllers/zone-controller.js`

---

**Point 6 — Erreurs sans details techniques**

Le handler d'erreurs centralise (`services/service-users/src/middleware/errorHandler.js`) intercepte toutes les exceptions non gerees. En production (`NODE_ENV=production`), seul un message generique est retourne. Les stack traces et details internes ne sont jamais exposes dans les reponses HTTP.

Fichier : `services/service-users/src/middleware/errorHandler.js`

---

**Point 7 — Validation des fichiers uploades**

Le service d'avatar (`services/service-users/src/services/avatarService.js`) applique :

- Une allowlist d'extensions (`EXT_ALLOWLIST` : Map constante limitee aux formats image standards)
- Une verification `assertWithinDir()` contre les attaques de path traversal
- Un re-encodage via `sharp` qui elimine le risque de polyglot files (les metadonnees et le contenu non-image sont supprimes lors du reencodage)

Fichier : `services/service-users/src/services/avatarService.js`

---

**Point 3 — XSS (partiel)**

React echappe les valeurs par defaut dans le rendu JSX. La librairie `sanitize-html` est appliquee sur le contenu HTML avant envoi par email (`services/service-users/src/services/emailService.js`). La reserve concerne le stockage du JWT en `localStorage` : en cas d'execution de JavaScript injecte, le token serait accessible. La Content-Security-Policy configuree via Helmet constitue le rempart complementaire.

---

**Point 2 — CSRF (absent)**

Aucun middleware CSRF n'est configure. La protection architecturale en place est la combinaison SPA + JWT en localStorage + CORS avec liste blanche d'origines : un site tiers ne peut pas inclure le header `Authorization: Bearer` dans une requete cross-origin car le navigateur applique la politique Same-Origin et JavaScript ne peut pas lire le token d'un domaine different. La migration vers un cookie `httpOnly; SameSite=Strict` est identifiee comme amelioration planifiee.

---

## A4 — Exposition de donnees sensibles et chiffrement

**Referentiel** : OWASP API3 / A02:2021

| N | Point de controle | Severite | Statut |
|---|-------------------|----------|--------|
| 1 | Reponses API : DTO explicites, pas de serialisation ORM complete | ELEVE | IMPLEMENTE |
| 2 | Donnees personnelles des operateurs chiffrees au repos (email, telephone, adresse) | ELEVE | ABSENT |
| 3 | Toutes communications chiffrees TLS 1.2 minimum | CRITIQUE | PARTIEL |
| 4 | Logs applicatifs sans donnees personnelles, tokens ni mots de passe | ELEVE | IMPLEMENTE |
| 5 | Exports de donnees proteges par authentification | ELEVE | IMPLEMENTE |

### Detail des points implémentes A4

**Point 1 — DTO explicites dans les reponses**

Les controleurs effectuent des projections SQL explicites. Le champ `password_hash` n'est fetche que dans les flux d'authentification internes (verification du mot de passe lors du login) et n'est jamais inclus dans les reponses de l'API. Les objets retournes sont construits manuellement avec les champs autorises, pas par serialisation directe de l'objet base de donnees complet.

Exemple : `services/service-users/src/controllers/userController.js` — le SELECT exclu le champ `password_hash` dans les requetes de profil.

---

**Point 4 — Masquage des champs sensibles dans les logs**

Le logger Pino dans `services/service-users/src/utils/logger.js` est configure avec un bloc `redact` qui remplace par la chaine `[REDACTED]` les valeurs des chemins suivants avant emission dans les logs :

- `req.headers.authorization`
- `req.headers.cookie`
- `req.body.password`
- `req.body.token`
- `req.body.refreshToken`
- `req.body.newPassword`
- `req.body.currentPassword`

Fichier : `services/service-users/src/utils/logger.js`

---

**Point 5 — Export RGPD protege par authentification**

La route `GET /users/me/data-export` dans `services/service-users/src/routes/gdpr.route.js` est protegee par le middleware `authenticateToken`. Aucun lien d'export public non authentifie n'est genere. L'export est lie au token de l'utilisateur connecte, il ne peut donc acceder qu'a ses propres donnees.

Fichier : `services/service-users/src/routes/gdpr.route.js`

---

**Point 2 — Chiffrement au repos (absent)**

L'extension `pgcrypto` est installee (`database/init/01-extensions.sql:12`) mais non utilisee pour chiffrer les champs identifiants (email, telephone, adresse) dans la table `UTILISATEUR`. Ces donnees sont stockees en clair. Les mesures compensatoires en place sont : chiffrement TLS en transit, isolation des conteneurs sur le reseau Docker interne, et acces DB uniquement depuis les services de l'application.

---

## A5 — Securite de l'ingestion IoT et pipelines de donnees

**Referentiel** : Specificite EcoTrack — IoT

| N | Point de controle | Severite | Statut |
|---|-------------------|----------|--------|
| 1 | Donnees IoT validees en format, plage et horodatage avant persistance | CRITIQUE | IMPLEMENTE |
| 2 | Endpoint ingestion IoT protege par authentification et chiffrement | ELEVE | PARTIEL |

### Detail des points implémentes A5

**Point 1 — Validation des donnees IoT**

Le schema Joi dans `services/service-iot/src/validators/iot.validator.js` valide chaque message MQTT/HTTP avant persistance :

- `fill_level` : nombre entier dans [0, 100]
- `latitude` : nombre dans [-90, 90]
- `longitude` : nombre dans [-180, 180]
- `timestamp` : format ISO 8601, presence obligatoire
- `id_capteur` : UUID v4

Les enregistrements invalides sont rejetes avec journalisation de l'erreur. Aucune donnee corrompue ou hors plage n'est inseree en base.

Fichier : `services/service-iot/src/validators/iot.validator.js`

---

**Point 2 — Authentification IoT (partiel)**

Le broker MQTT utilise `aedes.authenticate` avec verification username/password configures via variables d'environnement. L'authentification est effective. La configuration TLS sur le port MQTT n'est pas verifiee dans le fichier de deploiement actuel.

Fichier : `services/service-iot/src/mqtt-broker.js:32`

---

## A6 — Securite des conteneurs et configuration infrastructure

**Referentiel** : OWASP API8 / A05:2021

| N | Point de controle | Severite | Statut |
|---|-------------------|----------|--------|
| 1 | Images Docker avec tag fixe, pas de tag "latest" | ELEVE | IMPLEMENTE |
| 2 | Conteneurs applicatifs avec utilisateur non-root | ELEVE | IMPLEMENTE |
| 3 | Ports internes (PostgreSQL, Redis) non exposes hors reseau Docker | CRITIQUE | IMPLEMENTE |
| 4 | Headers HTTP de securite presents (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy) | ELEVE | IMPLEMENTE |
| 5 | CORS avec liste blanche explicite des origines, pas de wildcard en production | ELEVE | IMPLEMENTE |
| 6 | Header Server / X-Powered-By supprime des reponses HTTP | MOYEN | IMPLEMENTE |
| 7 | Mode debug et erreurs detaillees desactives en production | ELEVE | IMPLEMENTE |

### Detail des points implémentes A6

**Point 1 — Tags Docker fixes**

Toutes les images de l'infrastructure sont epinglees a une version specifique dans `ecotrack-sjma/docker-compose.yml` :

- `postgis/postgis:16-3.4-alpine`
- `redis:7-alpine`
- `confluentinc/cp-zookeeper:7.5.0`
- `confluentinc/cp-kafka:7.5.0`
- `dpage/pgadmin4:8.5`
- `provectuslabs/kafka-ui:v0.7.2`
- `prom/prometheus:v2.51.2`
- `grafana/grafana:10.4.2`
- `prom/node-exporter:v1.7.0`
- `prometheuscommunity/postgres-exporter:v0.15.0`
- `oliver006/redis_exporter:v1.61.0`
- `danielqsj/kafka-exporter:v1.7.0`

Les images applicatives EcoTrack sont construites localement (`build: context: ./services/...`) avec un tag versionne via la variable `VERSION`.

Fichier : `ecotrack-sjma/docker-compose.yml`

---

**Point 2 — Conteneurs non-root**

Le Dockerfile de service-users definit `USER appuser` (groupe `appgroup`), un utilisateur cree sans droits root. Les processus Node dans le conteneur s'executent avec des privileges reduits.

Fichier : `services/service-users/Dockerfile`

---

**Point 3 — Ports DB et Redis non exposes en production**

Dans `ecotrack-sjma/docker-compose.yml`, les sections `ports:` de `postgres` et `redis` ont ete supprimees. Les services communiquent entre eux via le reseau Docker interne `ecotrack`. PostgreSQL et Redis ne sont pas accessibles depuis l'hote ou depuis Internet.

Pour le developpement local, le fichier `ecotrack-sjma/docker-compose.override.yml` expose ces ports via des variables d'environnement (`${DB_PORT:-5435}:5432` et `${REDIS_PORT:-6379}:6379`). Ce fichier est applique automatiquement par Docker Compose en local mais non utilise en deploiement production.

Fichiers : `ecotrack-sjma/docker-compose.yml` · `ecotrack-sjma/docker-compose.override.yml`

---

**Point 4 — Headers HTTP de securite**

Helmet est configure dans tous les services Node.js. Dans service-users (`services/service-users/src/index.js`), la Content-Security-Policy definit :

- `defaultSrc ["'self'"]` — toutes les ressources doivent venir de la meme origine
- `scriptSrc ["'self'"]` — scripts limites a l'origine (pas d'inline ni de CDN externe)
- `styleSrc ["'self'"]` — styles limites a l'origine
- `imgSrc ["'self'", "data:"]` — images de l'origine et URI data autorisees
- `objectSrc ["'none'"]` — plugins desactives
- `frameSrc ["'none'"]` — iframes interdits (prevention clickjacking)
- `formAction ["'self'"]` — soumissions de formulaires uniquement vers la meme origine

`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` et `Referrer-Policy` sont appliques par les valeurs par defaut de Helmet.

Fichier : `services/service-users/src/index.js` · `services/service-gamifications/src/index.js`

---

**Point 5 — CORS avec liste blanche**

Tous les services Node.js configurent CORS avec une origine unique autorisee :

```
cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-role']
})
```

La gateway (`services/api-gateway/src/index.js`) utilise un callback qui compare l'origine de la requete a `process.env.FRONTEND_URL` et rejette toute origine non correspondante avec une erreur CORS.

Fichiers : `services/service-users/src/index.js` · `services/service-gamifications/src/index.js` · `services/service-analytics/src/index.js` · `services/api-gateway/src/index.js`

---

**Point 6 — Suppression des headers techniques**

Helmet supprime automatiquement `X-Powered-By` (identifiant Express) dans toutes les reponses. Le header `Server` n'est pas emis par Node.js par defaut. Ces headers constituaient une surface d'information pour les scanners automatiques.

---

**Point 7 — Mode production**

`NODE_ENV: production` est defini pour tous les services dans `docker-compose.yml`. En mode production, les erreurs non gerees passent par le handler centralise qui retourne un message generique sans detail interne. Les modes de debug et les logs verbeux ne sont pas actives.

---

## A7 — Rate limiting, resilience et disponibilite

**Referentiel** : OWASP API4 / API6

| N | Point de controle | Severite | Statut |
|---|-------------------|----------|--------|
| 1 | Rate limiting global sur l'ensemble des routes publiques | ELEVE | IMPLEMENTE |
| 2 | Routes sensibles avec rate limit renforce (login 5/compte, reset 3/heure) | CRITIQUE | IMPLEMENTE |
| 3 | Taille maximale des payloads limitee cote applicatif | ELEVE | IMPLEMENTE |
| 4 | Pagination obligatoire sur tous les endpoints retournant des listes | ELEVE | IMPLEMENTE |
| 5 | Timeout defini sur connexions DB et services tiers | MOYEN | IMPLEMENTE |

### Detail des points implémentes A7

**Point 1 — Rate limiting global**

Un limiteur general `publicLimiter` est applique comme premier middleware sur l'ensemble des routes dans chaque service. La configuration standard est 100 requetes par minute par adresse IP. La gateway applique egalement un rate limit global configurable via `GATEWAY_RATE_WINDOW_MS` et `GATEWAY_RATE_MAX`.

Fichiers : `services/service-users/src/config/rateLimit.js` · `services/api-gateway/src/index.js`

---

**Point 2 — Rate limiting renforce sur les routes sensibles**

Deux limiteurs specifiques sont definis dans `services/service-users/src/config/rateLimit.js` :

- `loginLimiter` : 5 tentatives par IP par fenetre de 15 minutes — applique sur `POST /auth/login`
- `passwordResetLimiter` : 3 demandes par IP par heure — applique sur `POST /auth/forgot-password`

Ces seuils correspondent aux exigences du cahier des charges.

---

**Point 3 — Limite de taille des payloads**

Tous les services Node.js appliquent `express.json({ limit: '1mb' })` et `express.urlencoded({ extended: true, limit: '1mb' })`. Les requetes depassant 1 MB sont rejetees par Express avant d'atteindre tout middleware ou controleur, limitant les attaques par saturation memoire via des corps de requete volumineux.

Fichiers : `services/service-users/src/index.js:85` · `services/service-gamifications/src/index.js:76` · `services/service-analytics/src/index.js:85`

---

**Point 4 — Pagination bornee**

Tous les endpoints retournant des collections acceptent les parametres `page` et `limit`. Les valeurs de `limit` sont bornees a un maximum defini (generalement 100) pour eviter qu'un appel unique ne retourne la totalite des enregistrements de la base. Les endpoints de zones, conteneurs, mesures, alertes et tournees appliquent ce principe.

---

**Point 5 — Timeouts sur les connexions DB**

Les pools PostgreSQL dans service-users et service-gamifications sont configures avec :

- `connectionTimeoutMillis: 5000` — echec si aucune connexion disponible apres 5 secondes
- `idleTimeoutMillis: 30000` — liberation des connexions inactives apres 30 secondes
- `statement_timeout: 10000` — annulation des requetes durant plus de 10 secondes

Ces parametres evitent les saturations silencieuses du pool et les requetes bloquantes indefinies.

Fichiers : `services/service-users/src/config/database.js` · `services/service-gamifications/src/config/database.js`

---

## A8 — RGPD, conformite et gestion des dependances

**Referentiel** : EU 2016/679 / OWASP A06:2021

| N | Point de controle | Severite | Statut |
|---|-------------------|----------|--------|
| 1 | Route de suppression et anonymisation des donnees personnelles fonctionnelle | ELEVE | IMPLEMENTE |
| 2 | Consentement enregistre avec date, version CGU et canal d'obtention | ELEVE | IMPLEMENTE |
| 3 | Route d'export des donnees personnelles (droit a la portabilite, Art. 20) | MOYEN | IMPLEMENTE |
| 4 | Duree de conservation des logs et donnees brutes definie et purge automatique | MOYEN | IMPLEMENTE |
| 5 | Dependances auditees pour vulnerabilites (npm audit) avant soutenance | ELEVE | IMPLEMENTE |
| 6 | Inventaire des dependances critiques maintenu et versionne | MOYEN | IMPLEMENTE |

### Detail des points implémentes A8

**Point 1 — Droit a la suppression (Art. 17 RGPD)**

La route `POST /users/me/deletion-request` dans `services/service-users/src/routes/gdpr.route.js` permet a un utilisateur de demander la suppression de ses donnees. Un cron automatique quotidien execute a 02h00 (`services/service-users/src/jobs/cron-gdpr.js`) anonymise les comptes :

- Apres 30 jours de grace suivant une demande de suppression
- Apres 3 ans d'inactivite (conformite RGPD duree de conservation)

L'anonymisation remplace les donnees personnelles par des valeurs neutres plutot que de supprimer les lignes, preservant ainsi l'integrite referentielle de la base.

Fichiers : `services/service-users/src/routes/gdpr.route.js` · `services/service-users/src/jobs/cron-gdpr.js`

---

**Point 2 — Journal du consentement (Art. 7 RGPD)**

La table `ecotrack_archive.consent_logs` enregistre chaque consentement avec les champs : `type_consent`, `version_document`, `ip_address`, `user_agent`, `created_at`. La table est configuree en insertion seule (aucun UPDATE ou DELETE autorise) garantissant l'immuabilite de l'historique de consentement, conforme aux exigences de traçabilite RGPD.

Fichier : `database/migrations/` (table consent_logs)

---

**Point 3 — Portabilite des donnees (Art. 20 RGPD)**

La route `GET /users/me/data-export` retourne l'ensemble des donnees personnelles de l'utilisateur authentifie dans un format lisible et exportable. La route est protegee par `authenticateToken` : un utilisateur ne peut exporter que ses propres donnees.

Fichier : `services/service-users/src/routes/gdpr.route.js`

---

**Point 4 — Duree de conservation et purge automatique**

La politique de conservation est implementee dans le cron RGPD :

- Donnees actives : conservation illimitee pendant l'activite du compte
- Comptes inactifs : anonymisation apres 36 mois d'inactivite
- Comptes en demande de suppression : anonymisation apres 30 jours de grace

Le cron s'execute quotidiennement, assurant que les purges sont effectuees sans intervention manuelle.

Fichier : `services/service-users/src/jobs/cron-gdpr.js`

---

**Point 5 — Audit des vulnerabilites en CI/CD**

Le workflow GitHub Actions `ci.yml` execute `npm audit --omit=dev --json` pour chaque service dans un job `security` dedie. Les rapports sont uploades en artefacts et accessibles apres chaque execution de pipeline. Les vulnerabilites de severite high ou critical font echouer le pipeline.

Fichier : `.github/workflows/ci.yml`

---

**Point 6 — Inventaire des dependances**

Les fichiers `package-lock.json` sont commites dans chaque service, fixant les versions exactes des dependances transitives. Les versions dans `package.json` utilisent des contraintes semver precises (`^` limite la mise a jour aux versions patch/minor compatibles). Aucune dependance n'est referencee depuis un depot git ou une URL externe.

---

## Recapitulatif general

### Score par categorie

| Categorie | Implemente | Partiel | Absent | Total |
|-----------|------------|---------|--------|-------|
| A1 — Authentification | 5 | 1 | 0 | 6 |
| A2 — Controle d'acces | 3 | 0 | 1 | 4 |
| A3 — Injections / XSS / CSRF | 5 | 1 | 1 | 7 |
| A4 — Exposition donnees | 2 | 1 | 1 | 4 |
| A5 — IoT | 1 | 1 | 0 | 2 |
| A6 — Conteneurs / Infra | 7 | 0 | 0 | 7 |
| A7 — Rate limiting | 5 | 0 | 0 | 5 |
| A8 — RGPD / Dependances | 6 | 0 | 0 | 6 |
| **TOTAL** | **34** | **4** | **3** | **41** |

### Points totalement implementes (34/41)

Les 34 points implementes couvrent l'integralite des mecanismes de securite fondamentaux pour un systeme de gestion de donnees environnementales en contexte M1 :

- Cycle de vie complet du token JWT avec access court (1h) et refresh revocable en base
- Hachage bcrypt cost 10 sur tous les mots de passe
- Rate limiting multi-niveaux : global, login, reset password
- SQL parametre systematique sur l'ensemble des repositories
- Validation des entrees geospatiales, IoT, fichiers uploades et parametres de filtrage
- RBAC centralise avec separation nette entre couche de controle et logique metier
- Headers de securite HTTP complets via Helmet avec CSP stricte
- CORS avec liste blanche d'origines dans tous les services et la gateway
- Payloads JSON limites a 1 MB sur tous les services
- Timeouts de pool PostgreSQL (connexion, idle, statement)
- Masquage des champs sensibles dans les logs via Pino redact
- Images Docker epinglees a des versions specifiques
- Ports DB et Redis hors de la surface d'attaque en production
- RGPD complet : export (Art. 20), suppression (Art. 17), consentement immuable (Art. 7), purge automatique
- Audit de vulnerabilites integre en pipeline CI/CD

### Points partiels (4/41)

| Point | Reserve |
|-------|---------|
| Authentification IoT | Credential MQTT partagee entre capteurs, non revocable par capteur |
| XSS — JWT localStorage | Token accessible via JS en cas de XSS reussi ; cookie httpOnly planifie |
| TLS | Chiffrement en transit dependant du reverse proxy de deploiement, non verifie en configuration |
| Chiffrement au repos | pgcrypto installe mais non active sur les champs identifiants |

### Points absents (3/41)

| Point | Justification |
|-------|---------------|
| CSRF | Architecture SPA + JWT localStorage + CORS avec liste blanche constitue une defense en profondeur. Le navigateur n'envoie pas automatiquement le token JWT (contraire aux cookies de session). La migration vers un cookie httpOnly constitue l'amelioration planifiee pour la version suivante. |
| IDs UUID v4 | Migration des cles primaires et etrangeres sur l'ensemble des tables (6 services) hors perimetre M1. Le middleware RBAC verifie systematiquement l'ownership cote serveur, rendant l'enumeration d'ID insuffisante sans le role requis. |
| pgcrypto — chiffrement au repos | Activation requiert une strategie de gestion de cle (KMS), un script de migration des donnees existantes, et la modification de tous les repositories (pgp_sym_encrypt / pgp_sym_decrypt). La protection compensatoire est le chiffrement TLS en transit et l'isolation reseau des conteneurs de base de donnees. |

---

## References

- OWASP API Security Top 10 : https://owasp.org/API-Security
- OWASP Top 10:2021 : https://owasp.org/Top10
- OWASP Cheat Sheet Series : https://cheatsheetseries.owasp.org
- Reglement General sur la Protection des Donnees (EU) 2016/679 : https://eur-lex.europa.eu/eli/reg/2016/679/oj
- testssl.sh — verification TLS : https://testssl.sh
- securityheaders.com — verification headers HTTP : https://securityheaders.com
