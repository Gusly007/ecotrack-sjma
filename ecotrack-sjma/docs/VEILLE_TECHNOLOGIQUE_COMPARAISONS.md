# Veille Technologique et Comparaisons Techniques — EcoTrack

Critères RNCP Ce1.2.1 / Ce1.2.2 / A1.2 : Veille structurée et analyse comparative

---

## I. Méthodologie de Veille Technologique

### Approche générale

La veille technologique menée dans le cadre du projet EcoTrack suit une démarche structurée en deux niveaux : une veille passive quotidienne (scan rapide des flux RSS et alertes automatisées) et une veille active hebdomadaire centrée sur l'analyse approfondie des technologies du périmètre projet. Les sources sont sélectionnées selon trois critères : fiabilité de l'émetteur (documentation officielle, mainteneurs reconnus, organismes de référence), pertinence par rapport aux domaines couverts (Node.js, React, PostgreSQL, Kafka, sécurité, RGPD, IoT), et actualité (publications des 12 derniers mois prioritaires). Les résultats de veille sont consignés dans un fichier Notion partagé, structuré par domaine technologique, avec une note de synthèse mensuelle présentée en réunion d'équipe.

La veille réglementaire est traitée séparément de la veille technique, avec un suivi des publications CNIL (RGPD, cookies, données personnelles), ANSSI (recommandations cryptographiques, bonnes pratiques DevSecOps) et OWASP (mises à jour du Top 10, fiches techniques par vulnérabilité). Cette séparation garantit que les obligations légales ne sont pas noyées dans le flux technique quotidien et font l'objet d'une validation explicite par le Product Owner avant implémentation. Une revue de sécurité trimestrielle intègre systématiquement les nouvelles entrées OWASP et les CVE critiques affectant les dépendances npm du projet (npm audit automatisé en CI/CD).

---

### A. Sources Consultées

#### Sources Techniques

| Source | Type | Fréquence de consultation | Domaine |
|--------|------|:-------------------------:|---------|
| GitHub Trending | Repos populaires par langage | Quotidien | Node.js, React, Docker, Kafka |
| MDN Web Docs | Référence Web (MDN Mozilla) | À la demande | JavaScript, Web APIs, HTTP |
| Node.js Changelog | Releases et breaking changes | Hebdomadaire | Node.js LTS |
| React Blog (react.dev) | Annonces officielles React team | Hebdomadaire | React 18+, Server Components |
| Kafka Documentation (Confluent) | Docs officielles + blog | Mensuel | Kafka, KafkaJS, streams |
| Stack Overflow | Questions trending, tags suivis | Quotidien | Debugging, best practices |
| Dev.to / Medium (Engineering blogs) | Articles techniques | Hebdomadaire | Architecture, performance |
| npm Advisory Database | Vulnérabilités packages | Automatisé (CI/CD) | Sécurité dépendances |
| PostgreSQL Release Notes | Nouvelles fonctionnalités | Mensuel | PostgreSQL, PostGIS |

#### Conférences et Événements

| Événement | Type | Fréquence | Sujets pertinents |
|-----------|------|:---------:|-------------------|
| React Summit | Conférence internationale | Annuel | React, architecture frontend |
| KubeCon Europe | CNCF / Cloud native | Annuel | Kubernetes, microservices |
| Devoxx France | Conférence généraliste | Annuel | Backend, sécurité, DevOps |
| OWASP AppSec Global | Sécurité applicative | Annuel | Vulnérabilités, OWASP Top 10 |
| AWS re:Invent (replays) | Cloud infrastructure | Annuel | Serverless, RDS, MSK (Kafka AWS) |
| Paris.js Meetup | Communauté locale | Mensuel | Node.js, JavaScript écosystème |
| CNIL webinars | Réglementaire | Trimestriel | RGPD, transferts de données |

#### Veille Réglementaire

| Organisme | Publication | Pertinence EcoTrack |
|-----------|-------------|---------------------|
| CNIL | Guides RGPD, référentiels, délibérations | Données citoyens, droit à l'effacement, consentement cookies |
| ANSSI | Guides de sécurité, recommandations TLS/cryptographie | JWT, bcrypt, MFA, HTTPS, headers Helmet |
| OWASP | Top 10 (2021), ASVS, cheat sheets | Injection SQL, XSS, authentification, IDOR/BOLA |
| NIST | FIPS 140-3, TOTP RFC 6238 | Implémentation MFA speakeasy |

---

### B. Outils Utilisés

| Outil | Usage | Coût |
|-------|-------|:----:|
| Feedly | Agrégateur RSS — 50+ sources organisées en collections (Frontend, Backend, Sécurité, IoT, Réglementation) | Gratuit |
| Google Alerts | Alertes email sur mots-clés : "Node.js vulnerability", "React 19", "Kafka security", "RGPD collectivité" | Gratuit |
| GitHub Watch/Star | Suivi des repos critiques (expressjs, react, kafkajs, speakeasy) — notifications de release | Gratuit |
| Dependabot (GitHub) | Alertes automatiques CVE sur package.json de chaque service | Gratuit |
| npm audit (CI/CD) | Scan automatique à chaque push — bloque le pipeline si vulnérabilité High/Critical | Gratuit |
| Notion | Base de connaissance partagée : notes de veille, ADR (Architecture Decision Records), comparatifs | Payant |
| Reddit | r/node, r/reactjs, r/PostgreSQL, r/netsec — signal communautaire | Gratuit |

---

### C. Fréquence et Organisation

| Niveau | Durée | Contenu | Livrable |
|--------|:-----:|---------|---------|
| Veille quotidienne | 15-20 min | Scan GitHub Trending, Google Alerts, flux RSS prioritaires | Signets Feedly, notes rapides |
| Veille hebdomadaire | 2h | Lecture approfondie des 3-5 articles retenus, test POC si pertinent | Note technique Notion |
| Revue mensuelle | 1h | Synthèse tendances, mises à jour dépendances npm, CVE | Rapport mensuel partagé équipe |
| Présentation trimestrielle | 30 min | Veille à impact projet : nouvelles pratiques, migration, sécurité | Slide de synthèse Sprint Review |

---

## II. Comparaison des Technologies

### A. Frameworks Frontend : React vs Vue.js vs Angular

#### Tableau comparatif pondéré

| Critère | Poids | React 18 | Vue.js 3 | Angular 17 |
|---------|:-----:|:--------:|:--------:|:----------:|
| **Performance** | 20 % | 9/10 | 8/10 | 7/10 |
| **Courbe d'apprentissage** | 15 % | 7/10 | 9/10 | 5/10 |
| **Communauté** | 20 % | 10/10 | 7/10 | 8/10 |
| **Ecosystème** | 20 % | 10/10 | 7/10 | 8/10 |
| **Maintenance** | 10 % | 8/10 | 9/10 | 7/10 |
| **Mobile / Multi-plateforme** | 15 % | 9/10 | 6/10 | 6/10 |
| **Score pondéré /10** | | **9,0** | **7,6** | **6,9** |

#### Détail des évaluations

**Performance (React 18 : 9/10)**

React 18 introduit le Concurrent Mode (rendu prioritisé), `useTransition` pour les mises à jour non-urgentes et `Suspense` pour le chargement asynchrone déclaratif. Le bundle Vite + React sans SSR reste à ~150 KB gzippé pour l'entrée. Vue.js 3 (8/10) est légèrement plus léger (~130 KB) grâce à la Composition API et le tree-shaking amélioré, mais sans équivalent direct au Concurrent Mode. Angular 17 (7/10) introduit les Signals mais souffre d'un bundle initial plus lourd (~200 KB) et d'une compilation AOT plus longue.

Pour EcoTrack, le rendu prioritisé de React 18 est crucial : la carte Leaflet, le compteur de notifications Socket.IO et les graphiques Recharts se mettent à jour simultanément sans bloquer l'interface.

**Courbe d'apprentissage (Vue.js : 9/10)**

Vue.js 3 est considéré comme le framework le plus accessible grâce à son API Options intuitive et sa documentation exemplaire en français. React (7/10) demande une maîtrise des hooks (useState, useEffect, useCallback, useMemo) et des patterns avancés (Context, Suspense) pour éviter les re-renders excessifs. Angular (5/10) impose TypeScript strict, les Decorators, les Modules NgModule, les Observables RxJS et l'injection de dépendances — courbe d'apprentissage significative pour un M1.

**Communauté (React : 10/10)**

React est le framework le plus téléchargé sur npm : 22 millions de téléchargements/semaine (mai 2026) vs 4,5M pour Vue.js et 3,2M pour Angular. Les offres d'emploi en France mentionnent React dans 78 % des JD frontend, contre 15 % pour Vue.js et 12 % pour Angular (source : LinkedIn, Indeed, avril 2026). L'écosystème React englobe React Native (mobile), Next.js (SSR/SSG), Remix, React Query, Zustand, et une communauté GitHub de 220k+ étoiles.

**Ecosystème (React : 10/10)**

React dispose du plus large catalogue de composants UI compatibles (Shadcn/UI, Material UI, Ant Design, Chakra UI), de librairies de cartographie (react-leaflet, deck.gl), de charts (Recharts, Victory, Nivo), de gestion d'état (Redux Toolkit, Zustand, Jotai) et d'outils de test (React Testing Library). Vue.js (7/10) dispose d'un écosystème solide mais plus réduit, avec moins de composants tiers maintenus activement. Angular (8/10) bénéficie d'une intégration forte avec l'écosystème Google (Firebase, Angular Material) mais les packages tiers Angular-specific sont moins nombreux.

**Recommandation : React 18**

Score pondéré 9,0/10. React 18 est retenu pour EcoTrack en raison de sa performance sur les interfaces temps réel, son écosystème (react-leaflet pour la carte, Recharts pour les graphiques), sa communauté (recrutement facilité) et la réutilisabilité potentielle vers React Native pour une app mobile native.

---

### B. Frameworks Backend : Node.js/Express vs FastAPI vs Spring Boot

#### Tableau comparatif pondéré

| Critère | Poids | Node.js/Express 5 | FastAPI (Python) | Spring Boot 3 |
|---------|:-----:|:-----------------:|:----------------:|:-------------:|
| **Performance I/O** | 25 % | 9/10 | 8/10 | 7/10 |
| **Scalabilité** | 20 % | 8/10 | 8/10 | 9/10 |
| **Typage / Robustesse** | 15 % | 7/10 | 9/10 | 10/10 |
| **Async / Concurrence** | 20 % | 9/10 | 8/10 | 6/10 |
| **Déploiement / Légèreté** | 10 % | 9/10 | 8/10 | 5/10 |
| **Ecosystème IoT / Messaging** | 10 % | 10/10 | 7/10 | 7/10 |
| **Score pondéré /10** | | **8,7** | **8,2** | **7,3** |

#### Détail des évaluations

**Performance I/O (Node.js : 9/10)**

Node.js est architecturalement conçu pour les opérations I/O non-bloquantes grâce à son event loop (libuv). Sur les benchmarks TechEmpower Framework (round 22), Express atteint ~120 000 requêtes/seconde pour des endpoints JSON simples, comparable à FastAPI (~100 000 req/s avec uvicorn). Spring Boot Reactive (WebFlux) atteint des performances similaires (~110 000 req/s) mais Spring Boot MVC (blocking) est à ~60 000 req/s. Pour EcoTrack — 33 messages MQTT/s entrants, 15 000 citoyens potentiels, Kafka consumers — le profil I/O-intensif favorise Node.js.

**Scalabilité (Spring Boot : 9/10)**

Spring Boot avec Spring WebFlux (Reactor) offre la scalabilité la plus mature pour les architectures enterprise, avec un support natif de Kubernetes, Spring Cloud Gateway et des fonctionnalités de circuit breaker (Resilience4j). Node.js (8/10) scale horizontalement sans état partagé (stateless JWT), mais le clustering natif est limité à `pm2` ou à l'orchestration Docker. FastAPI (8/10) scale bien avec Gunicorn multi-workers mais l'event loop Python est moins performant que Node.js pour les charges mixtes I/O + CPU.

**Typage / Robustesse (Spring Boot : 10/10)**

Java est statiquement typé par nature avec une vérification à la compilation exhaustive. FastAPI (9/10) s'appuie sur les type hints Python 3.10+ et Pydantic pour la validation automatique des requêtes/réponses — la documentation OpenAPI est générée automatiquement depuis les types. Node.js/Express (7/10) peut être typé via TypeScript, mais le projet EcoTrack est en JavaScript pur avec validation Joi — moins robuste qu'un typage statique, mais suffisant avec une couverture de tests >= 70 %.

**Async / Concurrence (Node.js : 9/10)**

Node.js single-thread avec event loop est optimal pour les I/O concurrents sans overhead de threads. `async/await` natif, Promises et le modèle non-bloquant permettent de gérer 10 000+ connexions simultanées avec une faible consommation mémoire (~50 MB/service vs ~200 MB pour Spring Boot). FastAPI (8/10) avec asyncio Python est proche, mais le GIL (Global Interpreter Lock) limite la parallélisation CPU. Spring Boot MVC (6/10) bloque un thread par requête — Spring WebFlux corrige ce point mais impose un paradigme réactif complexe.

**Déploiement / Légèreté (Node.js : 9/10)**

Image Docker Node.js 20 Alpine : ~180 MB. Image Python 3.12 slim : ~200 MB. Image OpenJDK 21 slim : ~450 MB + JVM startup time ~2-3s vs < 100ms pour Node.js. Pour des microservices déployés sur des instances t3.medium (4 GB RAM), la légèreté de Node.js permet de cohabiter 4-5 services par instance sans contrainte mémoire.

**Ecosystème IoT / Messaging (Node.js : 10/10)**

L'écosystème npm pour l'IoT est le plus riche : `mqtt` (client MQTT), `aedes` (broker MQTT embarqué), `kafkajs` (client Kafka pur JS), `ws` et `socket.io` (WebSocket), `speakeasy` (TOTP). FastAPI (7/10) dispose d'alternatives Python (paho-mqtt, aiokafka) mais l'intégration avec le broker MQTT embarqué est moins naturelle. Spring Boot (7/10) dispose de Spring Integration pour MQTT et Spring Kafka, mais la verbosité Java alourdit l'implémentation.

**Recommandation : Node.js/Express 5**

Score pondéré 8,7/10. Node.js est retenu pour l'uniformité JavaScript full-stack, sa performance I/O adaptée au profil EcoTrack, la légèreté des containers et la richesse de l'écosystème MQTT/Kafka/WebSocket.

FastAPI (8,2/10) serait pertinent si EcoTrack intégrait un service ML Python intensif (scikit-learn, TensorFlow). Ce cas est marginal dans service-analytics (régression linéaire, Z-score) et ne justifie pas l'introduction d'un second langage dans la stack.

---

### C. Bases de Données : PostgreSQL vs MongoDB vs TimescaleDB

#### Tableau comparatif pondéré

| Critère | Poids | PostgreSQL 16 + PostGIS | MongoDB 7 | TimescaleDB 2 |
|---------|:-----:|:-----------------------:|:---------:|:-------------:|
| **Requêtes complexes / SQL** | 20 % | 10/10 | 5/10 | 9/10 |
| **Support géospatial** | 20 % | 10/10 | 6/10 | 7/10 |
| **Séries temporelles (IoT)** | 20 % | 7/10 | 6/10 | 10/10 |
| **Scalabilité horizontale** | 15 % | 6/10 | 9/10 | 8/10 |
| **Transactions ACID** | 15 % | 10/10 | 7/10 | 10/10 |
| **Coût / Licence** | 10 % | 10/10 | 7/10 | 8/10 |
| **Score pondéré /10** | | **8,8** | **6,6** | **8,8** |

#### Détail des évaluations

**Requêtes complexes / SQL (PostgreSQL : 10/10)**

PostgreSQL implémente le standard SQL le plus complet de l'industrie open source : CTEs récursives, window functions, lateral joins, JSONB avec indexation GIN, Full Text Search, vues matérialisées, triggers, et procédures stockées. EcoTrack exploite intensivement ces fonctionnalités : CTE pour la vérification type/rôle dans service-notification, window functions pour les classements gamification, vues matérialisées pour les agrégations analytics (rafraîchissement planifié). MongoDB (5/10) dispose d'un langage d'agrégation puissant mais non-standard, avec un JOIN ($lookup) moins performant que PostgreSQL sur des volumes > 1M documents.

**Support géospatial (PostgreSQL/PostGIS : 10/10)**

PostGIS est l'extension géospatiale de référence pour les bases de données open source. Elle ajoute les types GEOMETRY et GEOGRAPHY, les fonctions ST_DWithin, ST_Distance, ST_Contains, ST_Intersects, les index GIST spatiaux et l'import/export GeoJSON natif. EcoTrack l'utilise pour : déterminer quels conteneurs se trouvent dans une zone (ST_Within), calculer les distances GPS pour l'algorithme Haversine, et exporter les tournées en GeoJSON pour Leaflet. MongoDB (6/10) dispose d'un support géospatial via les index 2dsphere, mais limité aux formes simples (Point, Polygon) sans la richesse des opérations PostGIS. TimescaleDB (7/10), étant une extension PostgreSQL, hérite de PostGIS mais son positionnement principal reste les séries temporelles.

**Séries temporelles / IoT (TimescaleDB : 10/10)**

TimescaleDB est une extension PostgreSQL spécialement conçue pour les données temporelles : hypertables avec partitionnement automatique par temps, compression native (~10x), continuous aggregates (équivalent des vues matérialisées rafraîchies automatiquement), et des fonctions analytiques dédiées (time_bucket, first, last, histogram). Pour les 2 000 capteurs × 1 mesure/min = 2,88 millions de mesures/jour, TimescaleDB offrirait des performances d'ingestion et de requête supérieures. PostgreSQL (7/10) gère ce volume avec des index BRIN sur `date_mesure` et un partitionnement manuel par plage de dates, mais sans l'automatisation de TimescaleDB. MongoDB (6/10) avec les Time Series Collections (5.0+) approche TimescaleDB mais reste moins efficace sur les agrégations temporelles complexes.

**Scalabilité horizontale (MongoDB : 9/10)**

MongoDB est conçu nativement pour le sharding horizontal : partitionnement automatique des données sur plusieurs nœuds, replica sets avec élection automatique du primaire, et scalabilité sans configuration manuelle. PostgreSQL (6/10) scale verticalement très bien (instance unique jusqu'à plusieurs TB) et horizontalement via Citus ou pg_logical pour la réplication en lecture, mais le sharding natif est absent dans la version communautaire. TimescaleDB (8/10) bénéficie du mode multi-node pour la distribution horizontale des hypertables (disponible dans la version Community depuis 2.0).

**Transactions ACID (PostgreSQL/TimescaleDB : 10/10)**

PostgreSQL garantit les propriétés ACID complètes avec un MVCC (Multi-Version Concurrency Control) mature. Chaque opération dans EcoTrack critique (collecte + mise à jour étape + calcul gamification) est encapsulée dans une transaction explicite. MongoDB (7/10) offre des transactions multi-documents depuis la version 4.0, mais avec un overhead de performance plus significatif que PostgreSQL et une sémantique légèrement différente.

**Coût / Licence (PostgreSQL : 10/10)**

PostgreSQL est sous licence PostgreSQL (similaire BSD) — entièrement gratuit, sans restriction d'usage commercial. PostGIS est sous licence GPL v2. TimescaleDB (8/10) est disponible en version Community (Apache 2.0, fonctionnalités principales) et Enterprise (payant, compression avancée, support SLA). MongoDB (7/10) est sous licence SSPL (Server Side Public License) depuis la version 4.0 — non reconnue comme open source par l'OSI, avec des restrictions pour les offres cloud managées.

**Recommandation : PostgreSQL 16 + PostGIS**

Score pondéré 8,8/10 ex-aequo avec TimescaleDB. PostgreSQL est retenu pour EcoTrack pour les raisons suivantes :

1. **Polyvalence** : une seule technologie couvre les besoins relationnels, géospatiaux et semi-structurés (JSONB) — pas besoin d'une base hybride.
2. **PostGIS** : indispensable pour le géospatial (zones, GPS tournées). TimescaleDB hérite de PostGIS mais ajoute une complexité opérationnelle pour un gain limité au volume actuel (< 3M mesures/jour).
3. **Maturité opérationnelle** : PostgreSQL bénéficie d'un outillage de sauvegarde, monitoring et migration plus standardisé (pg_dump, Patroni, pgBouncer).
4. **Volume IoT maîtrisable** : les 2 880 000 mesures/jour restent dans les capacités de PostgreSQL avec des index BRIN et un partitionnement par mois. TimescaleDB devient clairement supérieur au-delà de 100M mesures/jour.

**Evolution possible** : Si le projet monte à 20 000 capteurs (×10), migrer la table `mesure` vers TimescaleDB (compatible PostgreSQL) serait une évolution naturelle sans réécriture applicative.

---

## III. Synthèse des Choix Technologiques

| Couche | Technologie retenue | Alternative principale écartée | Avantage décisif |
|--------|--------------------|---------------------------------|-----------------|
| Frontend | React 18 + Vite | Vue.js 3 | Ecosystème, Concurrent Mode, react-leaflet |
| Backend | Node.js 20 + Express 5 | FastAPI (Python) | Performance I/O, MQTT/Kafka ecosystem, uniformité JS |
| Base de données | PostgreSQL 16 + PostGIS | TimescaleDB | PostGIS natif, polyvalence, maturité opérationnelle |
| Cache | Redis 7 | Memcached | Structures de données avancées (sets, sorted sets), pub/sub |
| Messaging | Kafka 3 + MQTT (Aedes) | RabbitMQ + MQTT externe | Rétention, partitionnement, débit 100k msg/s |
| Cartographie | Leaflet + OpenStreetMap | Mapbox GL | Licence open source, coût nul, intégration GeoJSON native |
| Charts | Recharts | Chart.js | Composants React déclaratifs, TypeScript-friendly |
| Auth 2FA | speakeasy (TOTP RFC 6238) | Authy API (SaaS) | Indépendance, pas de coût tiers, conformité FIPS |
| Conteneurisation | Docker + Docker Compose | Kubernetes | Complexité adaptée au scope (pas de multi-nœuds en dev) |
| CI/CD | GitHub Actions | GitLab CI / Jenkins | Intégration native GitHub, gratuit jusqu'à 2000 min/mois |

---

## IV. Tendances Identifiées par la Veille et Impact sur EcoTrack

| Tendance | Source | Pertinence EcoTrack | Action retenue |
|----------|--------|:-------------------:|---------------|
| IA Générative et LLMs (GPT-4o, Claude, LLaMA 3) | OpenAI, Anthropic, Meta AI Research, Hugging Face | Elevée — 4 cas d'usage directs identifiés dans EcoTrack | v2 : (1) Classification automatique des signalements citoyens par gravité et catégorie (embeddings + LLM) ; (2) Génération narrative des rapports PDF dans service-analytics (résumé KPI en langage naturel) ; (3) Chatbot agent de collecte : questions sur statut tournée et conteneurs prioritaires via fine-tuning léger ; (4) Détection d'anomalies sémantiques sur les commentaires de signalements |
| React Server Components (Next.js 14+) | React Blog, Vercel | Moyenne — SSR non requis actuellement | A surveiller pour la v2 si SEO citoyen devient prioritaire |
| Kafka KRaft (suppression ZooKeeper) | Kafka 3.3+ | Elevée — simplification opérationnelle | Migration planifiée lors du passage en production |
| PostgreSQL 17 (incremental backup, MERGE) | PostgreSQL Release Notes | Faible à court terme | Mise à jour mineure sans impact code |
| Bun (runtime JS alternatif à Node.js) | GitHub Trending, Bun.sh | Faible — pas encore production-ready | Veille active, test POC prévu en Q4 2026 |
| OWASP Top 10 2025 — A07 SSRF | OWASP | Elevée — service-analytics appelle Open-Meteo | Ajout validation stricte des URLs externes (liste blanche) |
| CNIL — délibération 2025 cookies SaaS | CNIL | Elevée — Jira/Confluence stockent des données EU | Vérification DPA (Data Processing Agreement) avec Atlassian |
| TimescaleDB 2.14 — vectorisation columnstore | TimescaleDB Blog | Moyenne — pertinent si croissance capteurs x10 | Note d'évolution dans la roadmap technique |

---

## V. Plan de Veille Continue

### A. Pendant le Projet (16 semaines — 8 sprints)

#### Veille hebdomadaire individuelle

Chaque développeur consacre **1 heure par semaine** à la veille sur les technologies directement utilisées dans son périmètre de sprint. Cette heure n'est pas optionnelle : elle est planifiée en début de semaine (lundi matin ou vendredi après-midi) et son résultat est consigné dans la base Notion de l'équipe. La granularité est volontairement restreinte aux technologies actives du sprint en cours pour éviter la dispersion.

| Profil | Technologies surveillées en priorité |
|--------|--------------------------------------|
| Développeur frontend | React 18 changelog, Vite releases, react-leaflet, Recharts, Tailwind CSS |
| Développeur backend services IoT / Routes | Node.js LTS, Express 5, KafkaJS, Aedes (MQTT), Joi, pino |
| Développeur backend Auth / Notif | speakeasy CVE, JWT best practices, Helmet, Redis changelog |
| Architecte | PostgreSQL releases, PostGIS, Docker security advisories, GitHub Actions |
| DevOps | Prometheus/Grafana releases, Docker Hub base images CVE, npm audit |

#### Sprint Review — partage des découvertes

À chaque Sprint Review (toutes les 2 semaines), un slot de **15 minutes** est réservé au partage des découvertes de veille. Format : une découverte par développeur maximum, une slide ou un lien, impact concret sur le projet ou décision de ne pas adopter. Ce format court évite les présentations longues non actionnables.

#### Tech Watch mensuelle

Une fois par mois (fin de Sprint 2, 4, 6, 8), une présentation de **45 minutes** est organisée avec l'ensemble de l'équipe. Le Scrum Master en assure l'animation. Structure type :

1. Tendances macro du mois (10 min) — un développeur en rotation
2. CVE critiques et correctifs appliqués (10 min) — DevOps
3. Décision d'adoption ou de rejet d'une technologie émergente (15 min) — vote collectif
4. Mise à jour du tableau "Tendances EcoTrack" du présent document (10 min)

#### Alertes critiques automatisées

Les alertes ne nécessitent pas d'intervention humaine quotidienne — elles sont intégrées dans le pipeline CI/CD et remontent directement dans le canal Slack `#security-alerts` :

| Mécanisme | Déclencheur | Destinataire | Seuil d'urgence |
|-----------|-------------|:------------:|:---------------:|
| `npm audit` (GitHub Actions) | Chaque push + PR | Canal Slack + PO | High/Critical bloque le merge |
| Dependabot (GitHub) | Quotidien | PR automatique | Toutes sévérités |
| Google Alerts | Temps réel | Email développeur référent | Mots-clés : "Node.js RCE", "PostgreSQL CVE", "KafkaJS vulnerability" |
| ANSSI bulletin | Hebdomadaire | Email Architecte | Toutes alertes catégorie 3+ |
| OWASP Top 10 update | A chaque publication | Architecte + DevOps | Revue immédiate |

En cas de CVE critique affectant une dépendance en production (score CVSS >= 9,0), la procédure d'urgence est la suivante : patch en moins de 48h, PR dédiée, revue par 2 développeurs, déploiement staging + test de non-régression, déploiement production dans les 72h.

---

### B. Post-Déploiement (Maintenance et MCO)

#### Monitoring automatisé des versions

| Outil | Fonctionnement | Configuration EcoTrack |
|-------|---------------|------------------------|
| **Dependabot** (GitHub) | Ouvre des PRs automatiques pour chaque dépendance npm obsolète ou vulnérable | Activé sur les 8 repos de services, fréquence hebdomadaire, groupement par type (dev/prod deps) |
| **Renovate Bot** | Alternative plus configurable à Dependabot — supporte le monorepo, peut grouper les PRs par service | Activé en complément pour le `docker-compose.yml` (images de base) et les GitHub Actions versions |
| **Socket Security** | Analyse les comportements suspects des packages npm (typosquatting, dépendances malveillantes) | Intégré au pipeline CI/CD — bloque les packages avec comportements anormaux |

#### Veille sécurité post-production

| Source | Fréquence de consultation | Responsable | Action en cas d'alerte |
|--------|:------------------------:|:-----------:|------------------------|
| ANSSI — Centre de veille et alertes | Hebdomadaire | DevOps / Architecte | Patch dans les 48-72h selon criticité |
| OWASP — nouvelles vulnérabilités | Mensuel | Architecte | Revue de code ciblée sur le vecteur concerné |
| NVD (National Vulnerability Database) | Automatisé (Dependabot) | DevOps | PR automatique + test de régression |
| CVE Details (filtré Node.js, PostgreSQL, Redis, Kafka) | Hebdomadaire | Développeurs | Evaluation d'impact + patch si CVSS >= 7,0 |
| HaveIBeenPwned API | Mensuel | DevOps | Vérification si emails de comptes de service compromis |

#### Suivi des roadmaps officielles

| Technologie | Ressource officielle | Horizon surveillé | Risque de breaking change |
|-------------|---------------------|:-----------------:|:------------------------:|
| Node.js LTS | nodejs.org/en/about/releases | LTS N+1 (Node.js 22 → 24) | Faible — deprecations annoncées longtemps à l'avance |
| React | github.com/reactjs/rfcs | React 19 (Server Components) | Moyen — APIs expérimentales stabilisées |
| Express | github.com/expressjs/express | Express 6 (en beta) | Moyen — refactoring async natif |
| PostgreSQL | postgresql.org/support/versioning | PostgreSQL 17 → 18 | Faible — compatibilité ascendante forte |
| Kafka / KafkaJS | kafka.apache.org/downloads | KRaft mode stable | Faible — migration ZooKeeper planifiée |
| Docker / Compose | docs.docker.com/release-notes | Compose v3 spec | Faible |

Un audit de compatibilité est planifié **tous les 6 mois** : vérifier que les versions utilisées en production ne sont pas en End-of-Life, mettre à jour les dépendances mineures, et tester les dépendances majeures sur staging avant promotion en production.

#### Participation communauté

| Activité | Fréquence | Bénéfice attendu |
|----------|:---------:|-----------------|
| Paris.js Meetup | Mensuel | Réseau, retours d'expérience Node.js production, recrutement |
| Contributions open source (issues, PRs) | Trimestriel | Visibilité, compréhension interne des librairies utilisées |
| Talks internes (brown-bag lunch) | Mensuel | Partage interne, montée en compétence transversale |
| Conférences (Devoxx France, React Summit) | Annuel | Tendances long terme, networking, certification |
| Blog technique de l'équipe (Dev.to ou Medium) | Trimestriel | Rayonnement, consolidation des connaissances |

---

### C. Ressources Recommandées par Domaine

#### Newsletters

| Newsletter | Domaine | Fréquence | Lien |
|-----------|---------|:---------:|------|
| JavaScript Weekly | Node.js, React, outillage JS | Hebdomadaire | javascriptweekly.com |
| Node Weekly | Node.js exclusif | Hebdomadaire | nodeweekly.com |
| React Status | React, Next.js, ecosystem | Hebdomadaire | react.statuscode.com |
| DB Weekly | PostgreSQL, bases de données | Hebdomadaire | dbweekly.com |
| SANS NewsBites | Cybersécurité, CVE | Bi-hebdomadaire | sans.org/newsletters/newsbites |
| tldr.tech | Résumé multi-domaines tech | Quotidien | tldr.tech |
| Architecture Weekly | Architecture logicielle, patterns | Hebdomadaire | architecture-weekly.com |

#### Podcasts

| Podcast | Domaine | Format |
|---------|---------|--------|
| Syntax.fm | JavaScript, React, Node.js, outillage | ~45 min, 2x/semaine |
| JS Party | JavaScript écosystème, open source | ~1h, hebdomadaire |
| Backend Banter | Node.js, APIs, performance | ~1h, variable |
| Darknet Diaries | Cybersécurité, incidents réels | ~1h, bi-mensuel |
| Le Coin du Dev (FR) | Développement web, carrière, architecture | ~1h, variable |
| Artisan Développeur (FR) | Craft, clean code, architecture | ~45 min, variable |

#### Chaînes YouTube

| Chaîne | Domaine | Usage recommandé |
|--------|---------|-----------------|
| Fireship | JavaScript, React, Docker, tendances | Shorts (100s) pour veille rapide, vidéos longues pour découverte |
| Traversy Media | Node.js, React, projets pratiques | Tutoriels hands-on |
| Theo (t3.gg) | React, Next.js, architecture frontend | Opinions techniques, débats framework |
| TechWorld with Nana | Docker, Kubernetes, CI/CD | DevOps, containerisation |
| Hussein Nasser | Node.js, PostgreSQL, réseau, performance | Architecture backend, deep dives |
| Grafikart (FR) | PHP/JS/DevOps en français | Tutoriels en français accessibles |

#### Formation continue et certifications

| Formation | Organisme | Domaine | Pertinence EcoTrack |
|-----------|-----------|---------|:-------------------:|
| AWS Certified Developer Associate | AWS | Cloud, déploiement | Elevée — infrastructure AWS EcoTrack |
| Professional Scrum Master I (PSM I) | Scrum.org | Méthodologie | Elevée — Scrum Master de l'équipe |
| Node.js Application Developer (JSNAD) | OpenJS Foundation | Node.js | Elevée — stack backend |
| PostgreSQL Administration | Dalibo (FR) | BDD | Moyenne — PostgreSQL/PostGIS prod |
| Certified Kubernetes Administrator (CKA) | CNCF | Orchestration | Moyenne — évolution Docker Compose vers k8s |
| OWASP Top 10 Training | OWASP / PortSwigger Web Academy | Sécurité | Elevée — sécurité applicative |
| RGPD DPO Foundation | CNIL / IAPP | Réglementaire | Moyenne — conformité données citoyens |

---

### D. Tableau de Bord de la Veille — Cadence Récapitulative

| Action | Qui | Quand | Durée | Livrable |
|--------|-----|:-----:|:-----:|---------|
| Scan flux RSS + alertes | Chaque développeur | Quotidien (lundi-vendredi) | 15 min | Signets Feedly / notes rapides |
| Veille approfondie hebdomadaire | Chaque développeur | Vendredi matin | 1h | Note Notion (titre + résumé + impact EcoTrack) |
| npm audit + Dependabot review | DevOps | Lundi | 20 min | PRs mergées ou issues créées |
| Partage découvertes Sprint Review | Equipe | Fin de sprint (J14) | 15 min | Slide ou lien dans Confluence |
| Tech Watch mensuelle | Equipe (SM animateur) | Fin sprint 2, 4, 6, 8 | 45 min | CR réunion Notion + décisions actées |
| Audit dépendances post-prod | DevOps + Architecte | Tous les 6 mois | 2h | Rapport de compatibilité + PRs mises à jour |
| Revue sécurité post-prod | Architecte + DevOps | Trimestriel | 3h | Rapport CVE traités + mesures correctives |
| Présentation veille commanditaire | PO + Architecte | Annuel | 1h | Rapport tendances + recommandations évolution |
