# Planification Agile — EcoTrack

Critères RNCP Ce1.4.1 / Ce1.4.2 / A1.4 : Planification Agile et Gestion de Projet

---

## I. Choix de la Méthodologie Agile

EcoTrack est un projet de digitalisation d'un service public impliquant plusieurs profils d'utilisateurs finaux aux besoins hétérogènes — gestionnaires de zones, agents de collecte, citoyens et administrateurs — dont les exigences fonctionnelles n'étaient pas entièrement stabilisées au démarrage. Ce contexte d'incertitude partielle sur le périmètre et la nécessité d'obtenir des retours réguliers des parties prenantes de la collectivité rendent inadaptée une approche en cycle en V, dont les spécifications figées en amont auraient généré un risque élevé de décalage entre le livrable final et les besoins réels. La méthode Scrum a donc été retenue pour sa capacité à découper le développement en incréments fonctionnels démontrables toutes les deux semaines, permettant au Product Owner issu de la Direction des Services Techniques de valider chaque Sprint Review et de réorienter le backlog en fonction des retours terrain. Les itérations courtes favorisent la détection précoce des blocages techniques — notamment sur l'intégration IoT MQTT, l'algorithme d'optimisation NN+2-opt et le pipeline Kafka — et permettent d'y remédier avant qu'ils n'impactent la planification globale. La vélocité cible de 25 Story Points par sprint, mesurée sur les 8 sprints, fournit une métrique objective de pilotage de l'avancement. L'ensemble du projet est ainsi structuré en 8 sprints de 2 semaines, soit 16 semaines de développement, organisés en 4 phases progressives allant du socle technique au déploiement production.

### A. Framework Scrum

| Composante | Détail |
|-----------|--------|
| **Rôles** | Product Owner (collectivité — DST), Scrum Master (certification PSM I), Équipe Dev (3 développeurs Full-Stack M1 + Architecte 50 % + DevOps 50 %) |
| **Événements** | Sprint Planning (2h · début de sprint), Daily Stand-up (15 min · quotidien), Sprint Review (1h · fin de sprint), Rétrospective (1h · fin de sprint), Backlog Refinement (1h · mi-sprint) |
| **Artefacts** | Product Backlog (Jira — 167 items au total), Sprint Backlog (sélection par sprint), Incrément (version déployable en staging à chaque fin de sprint) |

### B. Organisation en Sprints

| Paramètre | Valeur |
|-----------|--------|
| Durée d'un sprint | 2 semaines |
| Nombre de sprints | 8 |
| Durée totale | 16 semaines (4 mois) |
| Vélocité cible | 25 ± 3 Story Points / sprint |
| Capacité totale estimée | 200 Story Points |
| Taille équipe | 7 personnes — 5,5 ETP |

---

## II. Backlog Produit

### A. Statistiques du Backlog (Jira)

| Statut | Nombre |
|--------|-------:|
| Terminé | 110 |
| En cours de revue | 1 |
| A faire | 56 |
| **Total** | **167** |

### B. Structure des Epics (Jira)

| Epic | Identifiant | Titre | Priorité | Statut |
|------|:-----------:|-------|:--------:|:------:|
| EP-00 | KAN-251 | Design et Maquettes Figma | Highest | Terminé |
| EP-01 | KAN-15 | Authentification et Gestion Utilisateurs | Highest | Terminé |
| EP-02 | KAN-16 | Gestion des Conteneurs | Highest | Terminé |
| EP-03 | KAN-17 | Signalements Citoyens | Highest | Terminé |
| EP-04 | KAN-18 | Système de Tournées | Highest | Terminé |
| EP-05 | KAN-19 | Gamification | High | Terminé |
| EP-06 | KAN-20 | Notifications | Highest | Terminé |
| EP-07 | KAN-21 | Analytics et Reporting | High | Terminé |
| EP-08 | KAN-22 | Système IoT | High | Terminé |
| EP-09 | KAN-23 | Administration Système | Highest | Terminé |
| EP-10 | KAN-24 | Interface Carte Interactive | Highest | A faire |
| EP-11 | KAN-25 | Guide de Tri | Low | Terminé |
| EP-12 | KAN-26 | Sécurité Avancée | High | A faire |
| EP-13 | KAN-27 | Assistant Citoyen IA (Chatbot) | High | A faire |
| EP-14 | KAN-28 | Prédiction et Optimisation IA | Medium | A faire |

> EP-10 à EP-14 constituent le périmètre de la v2. EP-13 et EP-14 correspondent aux axes IA Générative identifiés dans la veille technologique.

### C. User Stories Représentatives par Epic (sélection de 20)

| ID | Epic | En tant que | Je veux | Afin de | MoSCoW | SP |
|----|:----:|------------|---------|---------|:------:|---:|
| US-001 | EP-10 | Gestionnaire | consulter la carte des conteneurs de ma zone en temps réel avec leur niveau de remplissage | visualiser l'état du parc et identifier les priorités de collecte | MUST | 8 |
| US-002 | EP-04 | Agent | recevoir ma feuille de route journalière optimisée par algorithme | minimiser les kilomètres parcourus et respecter l'ordre de priorité des conteneurs | MUST | 13 |
| US-003 | EP-08 | Système | ingérer les mesures de 2 000 capteurs IoT via le protocole MQTT | traiter les données de remplissage en temps réel et déclencher les alertes de seuil | MUST | 8 |
| US-004 | EP-01 | Utilisateur | m'authentifier avec un identifiant et un mot de passe sécurisé | accéder aux fonctionnalités correspondant à mon rôle (Admin, Gestionnaire, Agent, Citoyen) | MUST | 5 |
| US-005 | EP-06 | Gestionnaire | recevoir une alerte automatique lorsqu'un conteneur dépasse le seuil de remplissage configuré | anticiper les débordements et programmer une collecte préventive | MUST | 8 |
| US-006 | EP-09 | Admin | créer, modifier, désactiver et supprimer des comptes utilisateurs avec attribution de rôle | administrer les droits d'accès de l'ensemble du personnel de la collectivité | MUST | 5 |
| US-007 | EP-03 | Citoyen | signaler un problème sur un conteneur (débordement, dégradation, tag) depuis mon téléphone | alerter le gestionnaire de zone d'une anomalie constatée sur le terrain | MUST | 5 |
| US-008 | EP-04 | Agent | consulter la liste et le statut des conteneurs affectés à ma tournée du jour | préparer et exécuter mes collectes de manière autonome et traçable | MUST | 3 |
| US-009 | EP-12 | Utilisateur | activer l'authentification à deux facteurs TOTP via une application d'authentification | sécuriser davantage mon accès aux données sensibles des citoyens | SHOULD | 5 |
| US-010 | EP-04 | Gestionnaire | créer et planifier une tournée en sélectionnant une zone et un agent | organiser les collectes en fonction des niveaux de remplissage réels | SHOULD | 8 |
| US-011 | EP-07 | Gestionnaire | consulter un tableau de bord récapitulatif des KPIs de la semaine (collectes, alertes, taux de remplissage moyen) | piloter l'activité de collecte et identifier les zones nécessitant une attention particulière | SHOULD | 8 |
| US-012 | EP-02 | Agent | scanner le QR code d'un conteneur depuis l'application mobile | enregistrer une collecte effectuée ou signaler une anomalie directement sur le terrain sans saisie manuelle | SHOULD | 5 |
| US-013 | EP-05 | Citoyen | gagner des points et obtenir des badges pour chaque signalement validé et chaque défi complété | rester motivé à participer activement au bon fonctionnement du service de collecte | SHOULD | 5 |
| US-014 | EP-07 | Gestionnaire | exporter un rapport PDF mensuel récapitulatif des tournées, alertes et économies réalisées | fournir un compte-rendu chiffré à la direction de la collectivité | SHOULD | 5 |
| US-015 | EP-10 | Citoyen | consulter la carte des conteneurs proches de ma position géographique avec leur état | trouver rapidement un point de dépôt disponible et non saturé | SHOULD | 5 |
| US-016 | EP-14 | Gestionnaire | consulter les prédictions de remplissage pour les 48 prochaines heures générées par le modèle ML | anticiper les débordements avant que les capteurs ne déclenchent une alerte | COULD | 8 |
| US-017 | EP-05 | Citoyen | voir mon classement et celui des participants dans le système de gamification de ma zone | me comparer à mes voisins et renforcer mon engagement citoyen | COULD | 3 |
| US-018 | EP-09 | Admin | accéder aux métriques de performance des 8 microservices via les dashboards Grafana | superviser la santé de l'infrastructure et détecter les dégradations de service en temps réel | COULD | 3 |
| US-019 | EP-01 | Utilisateur | exporter l'ensemble de mes données personnelles au format JSON | exercer mon droit à la portabilité des données prévu par le RGPD | SHOULD | 3 |
| US-020 | EP-13 | Citoyen | interagir avec un assistant IA pour obtenir des informations sur les points de collecte et horaires | accéder au service sans naviguer dans les menus de l'application | COULD | 8 |

**Légende MoSCoW** : MUST = indispensable au MVP · SHOULD = fortement recommandé · COULD = valeur ajoutée · WON'T = hors périmètre v1

**Répartition Story Points des 20 US sélectionnées** : MUST 55 SP · SHOULD 44 SP · COULD 17 SP · Total 116 SP

---

## III. Planification par Sprint

### Sprint 1 (S1–S2) — Socle Technique

| Élément | Détail |
|---------|--------|
| User Stories | US-004 (5 SP), US-006 (5 SP) + stories de setup infrastructure |
| Total SP | 25 SP |
| Objectif | Mise en place de l'architecture microservices, du pipeline CI/CD et de l'authentification JWT |
| Livrables | Migrations PostgreSQL initiales, API Gateway opérationnelle (port 3000), service-users (login/register/refresh), pipeline GitHub Actions (lint + tests + build Docker), docker-compose.yml avec 12 containers |

### Sprint 2 (S3–S4) — Module IoT et Conteneurs

| Élément | Détail |
|---------|--------|
| User Stories | US-003 (8 SP), US-005 (8 SP), US-008 (3 SP) + stories CRUD conteneurs |
| Total SP | 25 SP |
| Objectif | Ingestion des données capteurs IoT et gestion des conteneurs en base |
| Livrables | Broker MQTT Aedes opérationnel (port 1883), mesures capteurs stockées en PostgreSQL, alertes publiées sur Kafka (ecotrack.alerts), service-containers CRUD complet avec zones PostGIS |

### Sprint 3 (S5–S6) — Tournées et Optimisation

| Élément | Détail |
|---------|--------|
| User Stories | US-002 (13 SP), US-010 (8 SP) |
| Total SP | 25 SP |
| Objectif | Système complet de création et d'optimisation des tournées de collecte |
| Livrables | service-routes opérationnel, algorithme NN+2-opt (<500 ms pour 50 conteneurs), étapes GPS avec heures prévisionnelles, export feuille de route PDF agent |

### Sprint 4 (S7–S8) — Interface Temps Réel et Dashboard Gestionnaire

| Élément | Détail |
|---------|--------|
| User Stories | US-001 (8 SP), US-011 (8 SP), US-015 (5 SP) |
| Total SP | 26 SP |
| Objectif | Interface cartographique temps réel et tableau de bord gestionnaire — jalon MVP fonctionnel |
| Livrables | Carte Leaflet + OpenStreetMap avec conteneurs géolocalisés, Socket.IO (statut conteneurs en temps réel), dashboard gestionnaire (KPIs, alertes actives, tournées du jour), application React 18 accessible en staging |

### Sprint 5 (S9–S10) — Gamification et Application Citoyen Mobile

| Élément | Détail |
|---------|--------|
| User Stories | US-007 (5 SP), US-012 (5 SP), US-013 (5 SP), US-017 (3 SP), US-020 (3 SP) |
| Total SP | 24 SP |
| Objectif | Module citoyen complet — signalement, scan QR, gamification et interface mobile-first |
| Livrables | 28 pages React citoyen (CitoyenAuthContext isolé, React.lazy + Suspense), scanner QR (CitoyenScanner), service-gamifications opérationnel (points, badges, défis, classement), beta test avec 5 agents pilotes |

### Sprint 6 (S11–S12) — Analytics et Rapports

| Élément | Détail |
|---------|--------|
| User Stories | US-014 (5 SP), US-016 (8 SP) + stories d'agrégation et détection anomalies |
| Total SP | 25 SP |
| Objectif | Module analytique avec prédictions ML et exports |
| Livrables | service-analytics avec consumer Kafka (ecotrack.sensor.data), prédictions remplissage par régression linéaire, détection anomalies Z-score, vues matérialisées PostgreSQL, exports PDF/Excel, dashboards KPIs agrégés |

### Sprint 7 (S13–S14) — Notifications, Sécurité et RGPD

| Élément | Détail |
|---------|--------|
| User Stories | US-009 (5 SP), US-019 (3 SP) + stories sécurité et notifications |
| Total SP | 25 SP |
| Objectif | Service de notification complet, MFA TOTP, conformité RGPD |
| Livrables | service-notification consumer Kafka (ecotrack.alerts + ecotrack.signalements.nouveau), MFA TOTP speakeasy RFC 6238 (6 endpoints + 10 codes de secours), consentement cookies RGPD, cron purge comptes supprimés J+90, audit log connexions |

### Sprint 8 (S15–S16) — Tests, Performance et Déploiement Production

| Élément | Détail |
|---------|--------|
| User Stories | US-018 (3 SP) + stories tests E2E et déploiement |
| Total SP | 25 SP |
| Objectif | Qualification complète et mise en production |
| Livrables | Tests E2E Cypress (parcours critiques), benchmark Prometheus (p95 API < 200 ms), export Swagger statique pour les 8 services, documentation complète, déploiement AWS (ECS + RDS + MSK), dashboards Grafana production |

---

## IV. Outils de Gestion

### A. Outillage Projet

| Besoin | Outil retenu | Justification |
|--------|-------------|---------------|
| Gestion backlog et sprints | Jira Software | Epics, user stories, sprints, burndown chart, 167 items gérés |
| Communication équipe | Discord | Serveur dédié avec channels par sprint, par service et par rôle (gratuit, historique illimité) |
| Versioning et code review | GitHub | Git Flow : branches main, feat/*, fix/* ; Pull Requests avec minimum 2 approbations requises |
| CI/CD | GitHub Actions | Workflows : lint ESLint, tests Jest, build Docker, push image, déploiement staging automatique |
| Qualité code | SonarCloud | Analyse statique continue — couverture >= 70 %, 0 critical issue requis pour merge |
| Documentation API | Swagger UI | Endpoint /api-docs sur chaque service + export statique HTML/JSON dans docs/swagger/ |
| Monitoring | Prometheus + Grafana | Métriques /metrics sur chaque service, dashboards temps réel, alertes seuil |

### B. Convention Git Flow

```
main          ← production stable (merge via PR uniquement)
feat/*        ← développement de features (ex : feat/gamification)
fix/*         ← correctifs (ex : fix/security-audit)
```

Chaque Pull Request nécessite : CI/CD vert + 2 approbations + review Swagger si endpoint modifié.

---

## V. Indicateurs Clés de Performance (KPI)

### KPIs Techniques

| # | KPI | Formule / Source | Cible | Fréquence |
|---|-----|-----------------|:-----:|:---------:|
| 1 | Couverture de tests | Lignes testées / Total × 100 — SonarCloud | >= 70 % | Hebdo |
| 2 | Temps de réponse API (p95) | Percentile 95 des endpoints — Prometheus | < 200 ms | Temps réel |
| 3 | Disponibilité production | Uptime continu — Uptime Robot / Grafana | >= 99,5 % | Journalier |
| 4 | Issues critiques SonarCloud | Nombre de critical issues ouvertes | 0 | Continu |
| 5 | Vélocité sprint | Story Points complétés — Burndown Jira | 25 ± 3 SP | Par sprint |
| 6 | Bugs critiques ouverts | Tickets Jira severity Critical non résolus | 0 | Journalier |
| 7 | Débit MQTT ingestion | Messages/seconde — Prometheus service-iot | >= 200 msg/s | Temps réel |
| 8 | Temps de calcul tournée | Durée algorithme NN+2-opt pour 50 conteneurs | < 500 ms | Par appel |

### KPIs Métier

| # | KPI | Formule / Source | Cible | Fréquence |
|---|-----|-----------------|:-----:|:---------:|
| 9 | Taux d'optimisation tournées | (KM économisés / KM avant optimisation) × 100 | >= 15 % | Mensuel |
| 10 | Taux de collectes évitées (IoT) | Passages évités / Total passages planifiés × 100 | >= 20 % | Mensuel |
| 11 | Taux d'adoption agents post-lancement | Agents connectés J+30 / Total agents | > 80 % | Mensuel |
| 12 | NPS citoyens | Score Net Promoter — enquête in-app à J+90 | > 40 | Mensuel |
| 13 | Alertes traitées dans les 2h | Alertes résolues < 2h / Total alertes × 100 | >= 95 % | Hebdo |

---

## VI. Gestion des Risques

### Matrice des Risques

| # | Risque | Probabilité | Impact | Score | Mitigation |
|---|--------|:-----------:|:------:|:-----:|-----------|
| R1 | Départ d'un membre clé de l'équipe | Faible | Elevé | 6 | Documentation continue (ADR, Swagger), pair programming, onboarding guide |
| R2 | Retard sur une fonctionnalité critique | Moyenne | Elevé | 9 | Priorisation MoSCoW stricte, MVP défini Sprint 1, buffer 10 % planning |
| R3 | Résistance des agents à l'adoption mobile | Moyenne | Moyen | 6 | Beta test 5 agents pilotes Sprint 5, UX scan QR simplifiée, formation 2h terrain |
| R4 | Complexité intégration SI collectivité | Elevée | Moyen | 8 | OpenAPI 3.0 documentée, adapter pattern dans service-routes, sandbox DSI |
| R5 | Dépassement de budget | Moyenne | Elevé | 9 | Suivi hebdo Jira, alerte PO à 80 % consommé, réserve 10 % incluse (8 755 €) |
| R6 | Failles sécurité données personnelles | Faible | Critique | 8 | SonarCloud continu, RGPD compliance, MFA activable, audit OWASP ZAP staging |
| R7 | Indisponibilité infrastructure AWS | Très faible | Elevé | 4 | SLA 99,99 %, RTO 4h / RPO 24h, backups quotidiens S3 |
| R8 | Performance insuffisante sous charge IoT | Faible | Moyen | 4 | Kafka buffer asynchrone, Redis cache, benchmark Sprint 2, alertes Prometheus |
| R9 | Dette technique accumulée | Moyenne | Moyen | 6 | Code reviews croisées obligatoires, SonarCloud bloquant sur les PRs, refactoring sprint 8 |
| R10 | Non-conformité RGPD lors d'un audit | Faible | Critique | 6 | Journal de traitement, consentement cookies, droit effacement automatisé cron J+90 |

> Score = Probabilité (1–3) × Impact (1–3). Seuil d'alerte : score >= 6.

### Plan d'action risques prioritaires (score >= 8)

**R2 — Retard fonctionnalité critique** : MVP minimal défini Sprint 0 (Auth + carte conteneurs + tournée basique). User story bloquée 3 jours → escalade PO. Stories > 8 SP systématiquement décomposées.

**R4 — Intégration SI existant** : Réunion DSI Sprint 1 pour inventaire APIs disponibles. Couche d'abstraction adapter pattern dans service-routes. Tests d'intégration sur sandbox fourni par la collectivité.

**R5 — Dépassement budget** : Dashboard financier mis à jour chaque vendredi. Estimation jours-homme validée par l'architecte pour chaque item. Réserve 10 % (8 755 €) débloquable uniquement par le commanditaire.

**R6 — Failles sécurité** : Audit OWASP ZAP en staging avant Sprint 8. Contrôle SonarCloud bloquant (0 critical). Rate limiting express (5 tentatives/15 min sur /auth/login). Helmet + CSP sur toutes les réponses.

---

## VII. Ressources et Budget

### A. Équipe Projet

| Rôle | Engagement | Coût projet (4 mois) |
|------|:----------:|--------------------:|
| Product Owner | 25 % ETP | 4 833 € |
| Scrum Master | 25 % ETP | 4 333 € |
| Développeur Full-Stack (× 3) | 100 % ETP | 17 333 € × 3 |
| Architecte Logiciel | 50 % ETP | 12 500 € |
| DevOps / SRE | 50 % ETP | 11 333 € |
| **Sous-total RH** | | **84 998 €** |

> Coûts employeur incluant charges patronales (~42 % du brut). Développeurs profil M1 Expert Dev Web niveau Junior-Confirmé.

### B. Budget Prévisionnel (16 semaines)

| Poste | Montant |
|-------|--------:|
| Ressources Humaines | 84 998 € |
| Infrastructure Cloud AWS (dev + staging) | 1 424 € |
| Licences et Outils (Jira 216 €, GitHub 112 €, DataDog 180 €, Figma 120 €, formation 500 €) | 1 128 € |
| Réserve imprévus (10 %) | 8 755 € |
| **TOTAL PROJET** | **96 305 €** |

> Discord (communication), GitHub Actions (CI/CD) et SonarCloud (open source) sont gratuits — ils ne génèrent pas de coût de licence.

### C. Outils sans coût additionnel

| Outil | Usage | Coût |
|-------|-------|:----:|
| GitHub (plan gratuit) | Versioning, Pull Requests, Issues | 0 € |
| GitHub Actions | CI/CD pipelines (2 000 min/mois gratuits) | 0 € |
| Discord | Communication équipe, channels par service | 0 € |
| SonarCloud | Qualité code (open source gratuit) | 0 € |
| VS Code + extensions | IDE développeurs | 0 € |
| Postman (plan free) | Tests API manuels | 0 € |

---

## VIII. Diagramme de Gantt

```mermaid
gantt
    dateFormat  YYYY-MM-DD
    title       EcoTrack — Planning 8 Sprints / 16 Semaines
    excludes    weekends

    section Phase 1 — Socle et IoT
    Sprint 1 : Socle technique, Auth JWT, CI/CD     :s1, 2025-01-06, 14d
    Sprint 2 : IoT MQTT, Alertes Kafka, Conteneurs  :s2, after s1, 14d

    section Phase 2 — Optimisation et Visualisation
    Sprint 3 : Tournées, NN+2-opt, service-routes   :s3, after s2, 14d
    Sprint 4 : Carte Leaflet, Socket.IO, Dashboard  :s4, after s3, 14d

    section Phase 3 — Citoyens et Analytics
    Sprint 5 : Gamification, App mobile citoyen     :s5, after s4, 14d
    Sprint 6 : Analytics ML, Rapports PDF/Excel     :s6, after s5, 14d

    section Phase 4 — Securite et Production
    Sprint 7 : Notifications Kafka, MFA, RGPD       :s7, after s6, 14d
    Sprint 8 : Tests E2E, Performance, Deploiement  :s8, after s7, 14d

    section Jalons
    MVP fonctionnel (fin Sprint 4)                  :milestone, after s4, 0d
    Recette staging (fin Sprint 7)                  :milestone, after s7, 0d
    Livraison production                            :milestone, after s8, 0d
```

### Représentation textuelle (référence rapide)

```
Sem  S1  S2  S3  S4  S5  S6  S7  S8  S9  S10 S11 S12 S13 S14 S15 S16
     ├───────────┤   ├───────────┤   ├───────────┤   ├───────────┤
     │ Sprint 1  │   │ Sprint 3  │   │ Sprint 5  │   │ Sprint 7  │
         ├───────────┤   ├───────────┤   ├───────────┤   ├───────────┤
         │ Sprint 2  │   │ Sprint 4  │   │ Sprint 6  │   │ Sprint 8  │
                                    ^MVP                             ^Prod
```

---

## IX. Synthèse et Axes d'Amélioration

### A. Récapitulatif

| Paramètre | Valeur |
|-----------|--------|
| Méthodologie | Scrum — 8 sprints de 2 semaines |
| Backlog total | 167 user stories (Jira : 110 terminées, 1 en revue, 56 à faire) |
| User stories MVP documentées | 20 (55 SP MUST + 44 SP SHOULD + 17 SP COULD) |
| KPIs techniques | 8 indicateurs (couverture tests, temps réponse, uptime, vélocité...) |
| KPIs métier | 5 indicateurs (optimisation tournées, adoption agents, NPS citoyens...) |
| Risques identifiés | 10 risques avec mitigation — 4 risques score >= 8 avec plan d'action |
| Budget total | 96 305 € sur 16 semaines |
| Jalons | MVP Sprint 4 · Recette staging Sprint 7 · Production Sprint 8 |

### B. Axes d'Amélioration

**Axe 1 — Augmenter la couverture de tests de 70 % à 85 %**

La Definition of Done impose >= 70 % de couverture, mais les endpoints critiques (auth, routes, IoT) méritent une couverture supérieure. Action : introduire le TDD (Test-Driven Development) dès Sprint 5 pour les nouvelles fonctionnalités, avec un rapport SonarCloud publié automatiquement en commentaire de chaque Pull Request.

**Axe 2 — Mettre en place Redis Sentinel pour la haute disponibilité des sessions**

Redis est actuellement déployé en mode single-node, ce qui constitue un point de défaillance unique pour les sessions utilisateur et la blacklist JWT. Action : migrer vers Redis Sentinel (1 master + 2 replicas) avant la mise en production Sprint 8, sans modification du code applicatif grâce à la transparence du client ioredis.

**Axe 3 — Planifier la migration du broker MQTT vers EMQX dès que la flotte dépasse 3 000 capteurs**

Le broker Aedes embarqué dans service-iot est validé pour 2 000 capteurs (pic 250 msg/s mesuré). Au-delà de 3 000 capteurs, le thread Node.js atteindra ses limites. Action : documenter le point de migration dans la roadmap technique Sprint 8 et réaliser un POC EMQX en parallèle, sans modifier le code MQTT côté capteurs (même protocole).

**Axe 4 — Intégrer Cypress Cloud pour la visibilité des tests E2E en CI**

Les tests E2E Cypress sont exécutés localement, ce qui limite leur parallélisation et leur historique. Action : activer Cypress Cloud (plan gratuit jusqu'à 500 enregistrements/mois) dans le workflow GitHub Actions pour afficher les captures d'écran, vidéos et résultats par sprint dans le dashboard partagé.

**Axe 5 — Anticiper l'intégration IA Générative en v2 dès le Sprint 0 de la prochaine phase**

Les données accumulées en v1 (signalements, mesures capteurs, tournées historiques) constituent un actif exploitable par des modèles LLM. Action : définir en Sprint 8 un document de cadrage v2 incluant 4 cas d'usage concrets — classification automatique des signalements citoyens, génération narrative des rapports PDF analytics, chatbot agent de collecte (questions tournée/statut conteneurs), détection d'anomalies sémantiques — avec une estimation budgétaire présentée au commanditaire avant la fin du projet.
