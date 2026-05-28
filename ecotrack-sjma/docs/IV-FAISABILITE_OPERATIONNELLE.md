# IV. Faisabilité Opérationnelle — EcoTrack

Critères RNCP Ce1.1.4 / A1.3 : Analyse organisationnelle, humains, méthodologiques et risques

---

## A. Organisation de l'Équipe Projet

### 1. Composition de l'Équipe

| Rôle | Nb | Profil | ETP |
|------|----|--------|:---:|
| Product Owner | 1 | Chef de projet métier — connaissance gestion déchets urbains, habilitation RGPD | 0,25 |
| Scrum Master | 1 | Certification PSM I (Professional Scrum Master), expérience Scrum 2+ ans | 0,25 |
| Développeur Full-Stack | 3 | M1 Expert Développement Web, React + Node.js, profil backend orienté | 3,00 |
| Architecte Logiciel | 1 | Expérience microservices, PostgreSQL/PostGIS, Kafka, sécurité applicative | 0,50 |
| DevOps / SRE | 1 | Docker, CI/CD GitHub Actions, monitoring Prometheus/Grafana, AWS | 0,50 |
| **TOTAL** | **7** | | **5,50 ETP** |

L'équipe de 4 développeurs porte les rôles Architecte et DevOps en complément du développement (profil M1 polyvalent). Le Product Owner est issu du commanditaire (Direction des Services Techniques de la collectivité).

### 2. Répartition des Rôles et Responsabilités

| Rôle | Responsabilités principales | Livrables |
|------|----------------------------|-----------|
| Product Owner | Backlog produit, priorisation MoSCoW, validation métier, acceptance criteria, relation commanditaire | Backlog Jira, User Stories, critères d'acceptation |
| Scrum Master | Animation des 4 cérémonies, suppression des blocages, amélioration continue, métriques vélocité | Burndown chart, rapport rétrospective |
| Développeurs | Développement features, tests unitaires (Jest), code review croisée, documentation Swagger | Pull Requests, rapport de tests, API-docs |
| Architecte | Conception des 8 microservices, choix technologiques, POCs, revue de sécurité | ADR (Architecture Decision Records), schéma BDD |
| DevOps | Pipeline CI/CD, Dockerfiles, docker-compose, monitoring, déploiements, backups | docker-compose.yml, .github/workflows/, dashboards Grafana |

---

## B. Méthodologie de Gestion de Projet

### Framework : Scrum

| Paramètre | Valeur |
|-----------|--------|
| Framework | Scrum (Guide Scrum 2020) |
| Durée des sprints | 2 semaines |
| Nombre de sprints | 8 |
| Durée totale | 16 semaines (4 mois) |
| Vélocité cible | 25 ± 3 Story Points / sprint |
| Taille équipe | 7 personnes (5,5 ETP) |

### Cérémonies Scrum

| Cérémonie | Fréquence | Durée | Participants |
|-----------|-----------|:-----:|-------------|
| Sprint Planning | Début de sprint | 2h | Toute l'équipe |
| Daily Scrum | Quotidien | 15 min | Équipe dev + SM |
| Sprint Review | Fin de sprint | 1h | Toute l'équipe + PO + parties prenantes |
| Rétrospective | Fin de sprint | 1h | Équipe complète |
| Backlog Refinement | Mi-sprint | 1h | PO + Développeurs |

### Outils

| Besoin | Outil |
|--------|-------|
| Gestion backlog | Jira Software (epics, user stories, sprints, burndown) |
| Documentation | Confluence |
| Communication | Slack (channels par sprint, par service) |
| Versioning | GitHub (Git Flow : main, develop, feature/*, fix/*) |
| Code review | GitHub Pull Requests (min. 2 approbations) |
| CI/CD | GitHub Actions (lint, tests Jest, build Docker, push ECR) |
| Qualité code | SonarCloud (coverage > 70 %, 0 critical issue) |

### Definition of Done (DoD)

Une User Story est considérée terminée si :
1. Code développé et commité sur la branche feature.
2. Tests unitaires écrits et passants (couverture >= 70 %).
3. Pull Request approuvée par au moins 2 développeurs.
4. Pipeline CI/CD vert (lint + tests + build Docker).
5. Swagger mis à jour si l'endpoint est modifié.
6. Déployé sur l'environnement staging.
7. Démo faite lors de la Sprint Review.
8. Critères d'acceptation validés par le PO.

---

## C. Planning Prévisionnel

### Vue d'ensemble 8 Sprints

```
Sprint 1  S1-S2   : Socle technique — CI/CD, BDD, API Gateway, Auth JWT
Sprint 2  S3-S4   : Ingestion IoT MQTT, alertes, service-containers
Sprint 3  S5-S6   : Tournées CRUD, optimisation NN+2-opt, service-routes
Sprint 4  S7-S8   : Carte Leaflet, Socket.IO temps réel, Dashboard gestionnaire
Sprint 5  S9-S10  : Gamification (points, badges, défis), app citoyen mobile
Sprint 6  S11-S12 : Analytics (agrégations, ML predictions), rapports PDF/Excel
Sprint 7  S13-S14 : Notifications Kafka, MFA 2FA, RGPD, sécurité audit
Sprint 8  S15-S16 : Tests E2E, performance, documentation, déploiement production
```

### Phase 1 — Socle Technique et Module IoT (Sprints 1-2)

| Sprint | Objectif | Livrables |
|--------|----------|-----------|
| Sprint 1 | Architecture + CI/CD + BDD | Migrations SQL, API Gateway, service-users (login/register), pipeline CI/CD GitHub Actions |
| Sprint 2 | Ingestion IoT + Conteneurs | Broker MQTT Aedes, mesures capteurs, alertes Kafka, service-containers CRUD |

### Phase 2 — Optimisation et Visualisation (Sprints 3-4)

| Sprint | Objectif | Livrables |
|--------|----------|-----------|
| Sprint 3 | Tournées + Algorithme | service-routes, optimisation 2-opt, étapes GPS, feuille de route PDF |
| Sprint 4 | Interface temps réel | Carte Leaflet, Socket.IO, dashboard gestionnaire (KPIs, alertes) |

### Phase 3 — Features Citoyens et Analytique (Sprints 5-6)

| Sprint | Objectif | Livrables |
|--------|----------|-----------|
| Sprint 5 | Gamification + Mobile citoyen | Points, badges, défis, 18 pages citoyen (React mobile responsive), scan QR |
| Sprint 6 | Analytics + ML | Dashboard KPIs, prédictions remplissage, détection anomalies, exports |

### Phase 4 — Sécurité, Notifications et Production (Sprints 7-8)

| Sprint | Objectif | Livrables |
|--------|----------|-----------|
| Sprint 7 | Notifications + Sécurité | Consumer Kafka service-notification, MFA TOTP, audit RGPD, cookies consentement |
| Sprint 8 | Qualification + Déploiement | Tests E2E Cypress, benchmark Prometheus, documentation complète, déploiement AWS |

---

## D. Risques Opérationnels

### Matrice des risques

| # | Risque | Probabilité | Impact | Score | Mitigation |
|---|--------|:-----------:|:------:|:-----:|-----------|
| R1 | Départ d'un membre clé de l'équipe | Faible | Elevé | 6 | Documentation continue (ADR, Swagger), pair programming obligatoire, onboarding guide |
| R2 | Retard sur une fonctionnalité critique | Moyenne | Elevé | 9 | Priorisation MoSCoW stricte, MVP défini dès Sprint 1, buffer 10 % sur le planning |
| R3 | Résistance des agents de collecte à l'adoption mobile | Moyenne | Moyen | 6 | Beta testing avec 5 agents pilotes dès Sprint 5, UX simplifiée (scan QR, navigation bottom), formation 2h |
| R4 | Complexité de l'intégration SI existant collectivité | Elevée | Moyen | 8 | APIs REST documentées (OpenAPI 3.0), adaptateurs dédiés, tests d'intégration systématiques |
| R5 | Dépassement de budget | Moyenne | Elevé | 9 | Suivi hebdomadaire tableau de bord Jira, alerte PO à 80 % budget consommé, réserve 10 % incluse |
| R6 | Failles de sécurité (données personnelles citoyens) | Faible | Critique | 8 | Audit SonarCloud continu, RGPD compliance (suppression, export), MFA activable, tests OWASP |
| R7 | Indisponibilité infrastructure cloud (AWS) | Très faible | Elevé | 4 | SLA AWS 99,99 %, plan de reprise (RTO 4h, RPO 24h), backups quotidiens S3 |
| R8 | Performance insuffisante sous charge IoT | Faible | Moyen | 4 | Kafka buffer asynchrone, Redis cache, benchmark dès Sprint 2, seuil alerte Prometheus |
| R9 | Non-conformité RGPD lors d'un audit | Faible | Critique | 6 | DPO consulté, journal de traitement, consentement cookies, droit à l'effacement automatisé |

> Score = Probabilité (1-3) × Impact (1-3). Seuil d'alerte : score >= 6.

### Plan d'action risques prioritaires (score >= 8)

**R2 — Retard fonctionnalité critique** :
- Identification de l'MVP minimal dès le Sprint 0 (kickoff) : authentification + carte conteneurs + tournée basique.
- Toute user story bloquée 3 jours est escaladée au PO pour arbitrage (descope ou renfort).
- Stories > 8 SP sont systématiquement décomposées en sous-tâches.

**R4 — Intégration SI existant** :
- Réunion technique avec la DSI de la collectivité en Sprint 1 pour inventorier les APIs disponibles.
- Couche d'abstraction (adapter pattern) dans service-routes pour isoler les dépendances externes.
- Tests d'intégration dans un environnement sandbox fourni par la collectivité.

**R5 — Dépassement budget** :
- Dashboard financier partagé (Google Sheets ou Confluence) mis à jour chaque vendredi.
- Chaque item de backlog dispose d'une estimation en jours-homme validée par l'architecte.
- La réserve de 10 % (8 755 €) ne peut être débloquée que par le commanditaire.

---

## E. Plan de Conduite du Changement

### Parties prenantes

| Partie prenante | Intérêt | Influence | Stratégie |
|----------------|---------|:---------:|-----------|
| Direction collectivité | ROI, conformité légale | Haute | Reporting mensuel, indicateurs ROI |
| Responsable DSI | Architecture, sécurité SI | Haute | Réunions techniques bi-mensuelles |
| Gestionnaires de zones | Efficacité quotidienne | Moyenne | Beta test, formation, feedback loops |
| Agents de collecte | Adoption mobile | Moyenne | UX mobile-first, formation terrain |
| Citoyens | Service numérique, vie privée | Faible | Interface intuitive, RGPD transparent |

### Plan de formation

| Public | Format | Durée | Sprint |
|--------|--------|:-----:|:------:|
| Gestionnaires | Atelier fonctionnel — dashboard, tournées, alertes | 4h | Sprint 6 |
| Agents | Formation terrain — app mobile, scan QR, anomalies | 2h | Sprint 5 |
| Admins DSI | Guide technique — déploiement, monitoring, backups | 3h | Sprint 8 |
| Citoyens | Guide en ligne + notification in-app | Auto | Sprint 5 |

---

## F. Critères de Succès et KPIs Projet

| KPI | Cible | Mesure |
|-----|-------|--------|
| Vélocité sprint | 25 ± 3 SP | Burndown Jira |
| Couverture tests | >= 70 % | SonarCloud |
| Taux de bugs critiques en recette | 0 | Jira (severity Critical) |
| Temps de réponse API (p95) | < 200 ms | Prometheus / Grafana |
| Taux d'adoption agents (30j post-lancement) | > 80 % | Logs connexions |
| NPS citoyens (3 mois post-lancement) | > 40 | Enquête in-app |
| Disponibilité production | >= 99,5 % | Uptime Robot / Grafana |

---

## G. Conclusion Opérationnelle

La faisabilité opérationnelle d'EcoTrack est établie sur les bases suivantes :

1. **Equipe constituée** : 7 personnes couvrant l'ensemble des compétences requises (métier, technique, infrastructure, qualité). La polyvalence des développeurs M1 Expert Dev Web permet d'absorber les rôles d'architecte et de DevOps sans ressource dédiée supplémentaire.

2. **Méthodologie éprouvée** : Scrum en 8 sprints de 2 semaines avec ceremonies formalisées, Definition of Done stricte et métriques de qualité continues (CI/CD, SonarCloud).

3. **Planning réaliste** : La décomposition en 4 phases progressives (socle, optimisation, citoyens/analytics, sécurité/production) permet des livraisons incrémentales démontrables à chaque Sprint Review. Le Sprint 1 produit un socle déployable en 2 semaines.

4. **Risques maîtrisés** : Les 9 risques identifiés ont tous une mitigation définie. Aucun risque ne présente un profil Probabilité Haute × Impact Critique simultanement.

Le principal facteur de succès opérationnel reste l'implication active du Product Owner issu de la collectivité pour valider les user stories et assurer l'adoption des utilisateurs finaux (agents, gestionnaires, citoyens).
