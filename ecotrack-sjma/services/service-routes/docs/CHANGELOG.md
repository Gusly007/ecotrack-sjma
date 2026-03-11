# Changelog - Service Routes

## [1.0.0] - Mars 2026

### Ajouté

#### Gestion des tournées
- Création de tournées avec code auto-généré `T-YYYY-NNN`
- Liste paginée avec filtres (statut, zone, agent, dates)
- Détail avec JOIN zone, agent, véhicule, progression étapes
- Mise à jour partielle
- Changement de statut avec audit trail (`historique_statut`)
- Suppression protégée (impossible si EN_COURS)
- Tournées actives (EN_COURS uniquement)
- Tournée du jour par agent (`GET /my-tournee` via header `X-User-Id`)
- Liste des étapes avec coordonnées GPS et niveau de remplissage
- Progression temps réel (%, quantité collectée, étapes restantes)

#### Optimisation des itinéraires
- Algorithme Nearest Neighbor (O(n²)) — rapide
- Algorithme 2-opt — solution optimale (-15% à -45%)
- Distance Haversine pour précision GPS
- Filtre par seuil de remplissage (0-100%)
- Filtre `AND c.position IS NOT NULL` (exclut conteneurs sans GPS)
- Calcul automatique des heures estimées d'étape (base 07:30, arithmétique entière)
- Estimation durée : 20 km/h + 5 min/conteneur
- Endpoint `POST /optimize` : création tournée complète + étapes en une requête

#### Collectes & Anomalies
- Enregistrement collecte (transaction : INSERT collecte + UPDATE etape_tournee.collectee)
- Vérification tournée EN_COURS et agent assigné
- Clôture automatique de la tournée si toutes étapes collectées
- Signalement anomalies via table SIGNALEMENT existante
- Types : `CONTENEUR_INACCESSIBLE`, `CONTENEUR_ENDOMMAGE`, `CAPTEUR_DEFAILLANT`
- Liste des collectes par tournée
- Liste des anomalies par tournée

#### Gestion des véhicules
- CRUD complet (liste, créer, détail, modifier, supprimer)
- Comptage tournées actives par véhicule

#### Statistiques & KPIs
- Dashboard : compteurs tournées + collectes 30j + véhicules
- KPIs : taux complétion, distances, quantité, CO2 (distance × 0.27 kg/km)
- Statistiques collectes par date + zone (filtrable)
- Comparaison algorithmes : historique DB + simulation live sur 20 conteneurs actifs

#### Infrastructure
- Health check (`/health`) avec vérification DB
- `healthcheck.cjs` pour Docker (HTTP check)
- Métriques Prometheus (`/metrics`) : requêtes total + latences
- Swagger UI (`/api-docs`) avec JSDoc complet sur toutes les routes
- Logger Pino structuré (JSON prod, pretty dev)
- Error handler centralisé (codes PG 23505/23503/23514)
- Middleware request-logger (method, url, statusCode, duration, ip)
- Injection de dépendances (`di.js`)

#### Tests
- 141 tests unitaires, 0 échec, 12 suites
- Coverage : utils, middleware, services, controllers
- Pattern : mock repositories → service → assert

### Corrigé

- **Bug `invalid input syntax for type time: "Inval"`** : remplacé le calcul d'heure via `new Date()` (pouvant produire "Invalid Date") par arithmétique entière sur les minutes
- **Bug "Connection terminated due to connection timeout"** : pool PostgreSQL saturé lors de redémarrages multiples — résolu en attendant la libération naturelle des connexions

### Architecture

- Pattern Controller → Service → Repository
- CommonJS (`require/module.exports`)
- Pool PostgreSQL (pg, max: 10 connexions)
- Joi pour validation des entrées
- Aucune dépendance circulaire
