#  API Reference - Service Routes

**Base URL (direct)**  : `http://localhost:3012/api/routes`
**Base URL (gateway)** : `http://localhost:3000/api/routes`
**Swagger UI**         : http://localhost:3012/api-docs

---

## Format des réponses

### Succès

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Succès",
  "data": { ... },
  "timestamp": "2026-03-15T07:30:00.000Z"
}
```

### Erreur

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Tournée 99 introuvable",
  "details": null
}
```

### Paginé

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8,
    "hasMore": true
  }
}
```

---

## Tournées

### GET /tournees

Liste paginée des tournées avec filtres.

**Query params**

| Paramètre | Type | Description |
|---|---|---|
| `page` | number | Page (défaut : 1) |
| `limit` | number | Résultats par page (défaut : 20) |
| `statut` | string | PLANIFIEE \| EN_COURS \| TERMINEE \| ANNULEE |
| `id_zone` | number | Filtrer par zone |
| `id_agent` | number | Filtrer par agent |
| `date_debut` | date | Date minimum (ISO) |
| `date_fin` | date | Date maximum (ISO) |

**Réponse 200**

```json
{
  "success": true,
  "data": [{
    "id_tournee": 1,
    "code": "T-2026-001",
    "date_tournee": "2026-03-15",
    "statut": "EN_COURS",
    "distance_prevue_km": 23.4,
    "duree_prevue_min": 255,
    "zone_nom": "Centre-Ville",
    "agent_nom": "Lefebvre",
    "agent_prenom": "Marc",
    "numero_immatriculation": "CAM-003",
    "total_etapes": 45,
    "etapes_collectees": 33
  }],
  "pagination": { "page": 1, "limit": 20, "total": 156, "pages": 8, "hasMore": true }
}
```

---

### POST /tournees

Crée une tournée manuellement.

**Body**

```json
{
  "date_tournee": "2026-03-15",
  "id_zone": 1,
  "id_agent": 5,
  "duree_prevue_min": 90,
  "id_vehicule": 2,
  "distance_prevue_km": 12.5,
  "statut": "PLANIFIEE"
}
```

| Champ | Requis | Description |
|---|---|---|
| `date_tournee` | **Oui** | Format ISO (YYYY-MM-DD) |
| `id_zone` | **Oui** | ID de la zone |
| `id_agent` | **Oui** | ID de l'agent assigné |
| `duree_prevue_min` | **Oui** | Durée prévue en minutes |
| `id_vehicule` | Non | ID du véhicule |
| `distance_prevue_km` | Non | Distance prévue |
| `statut` | Non | Défaut : PLANIFIEE |

**Réponse 201** — Objet tournée créé

---

### POST /optimize

Crée une tournée optimisée automatiquement pour une zone.

**Body**

```json
{
  "id_zone": 1,
  "date_tournee": "2026-03-15",
  "id_agent": 5,
  "seuil_remplissage": 70,
  "id_vehicule": 2,
  "algorithme": "2opt"
}
```

| Champ | Requis | Description |
|---|---|---|
| `id_zone` | **Oui** | Zone à optimiser |
| `date_tournee` | **Oui** | Date de la tournée |
| `id_agent` | **Oui** | Agent assigné |
| `seuil_remplissage` | Non | Niveau min % (défaut : 70) |
| `id_vehicule` | Non | Véhicule |
| `algorithme` | Non | `nearest_neighbor` ou `2opt` (défaut : `2opt`) |

**Réponse 201**

```json
{
  "success": true,
  "data": {
    "tournee": {
      "id_tournee": 10,
      "code": "T-2026-010",
      "date_tournee": "2026-03-15",
      "statut": "PLANIFIEE",
      "distance_prevue_km": 10.01,
      "duree_prevue_min": 70
    },
    "optimisation": {
      "algorithme_utilise": "2opt",
      "nb_conteneurs": 8,
      "distance_prevue_km": 10.01,
      "distance_originale_km": 17.44,
      "gain_pct": 42.62,
      "duree_prevue_min": 70
    },
    "etapes": [
      { "sequence": 1, "id_conteneur": 3, "heure_estimee": "07:30", "latitude": 48.86, "longitude": 2.35 }
    ]
  }
}
```

**Erreur 400** si aucun conteneur avec fill_level ≥ seuil dans la zone.

---

### GET /tournees/active

Toutes les tournées EN_COURS avec agent, zone, véhicule et progression.

**Réponse 200** — Tableau des tournées actives

---

### GET /my-tournee

Tournée du jour de l'agent connecté.

**Header requis** : `X-User-Id: 5`

**Réponse 200** — Tournée + étapes du jour

**Réponse 400** si `X-User-Id` absent.
**Réponse 404** si aucune tournée assignée aujourd'hui.

---

### GET /tournees/:id

Détail complet d'une tournée.

**Réponse 200**

```json
{
  "data": {
    "id_tournee": 1,
    "code": "T-2026-001",
    "statut": "EN_COURS",
    "zone_code": "CTR", "zone_nom": "Centre-Ville",
    "agent_nom": "Lefebvre", "agent_prenom": "Marc", "agent_email": "marc@eco.fr",
    "numero_immatriculation": "CAM-003", "vehicule_modele": "Renault Trucks D",
    "total_etapes": 45, "etapes_collectees": 33
  }
}
```

---

### PATCH /tournees/:id

Mise à jour partielle (au moins 1 champ requis).

**Champs modifiables** : `date_tournee`, `distance_prevue_km`, `duree_prevue_min`, `duree_reelle_min`, `distance_reelle_km`, `id_vehicule`, `id_zone`, `id_agent`

---

### PATCH /tournees/:id/statut

Changement de statut avec enregistrement dans `historique_statut`.

**Body** : `{ "statut": "EN_COURS" }`

**Valeurs** : `PLANIFIEE` | `EN_COURS` | `TERMINEE` | `ANNULEE`

---

### DELETE /tournees/:id

**Erreur 400** si statut = EN_COURS.
**Réponse 200** — `{ "message": "Tournée supprimée" }`

---

### GET /tournees/:id/etapes

Liste ordonnée des étapes avec coordonnées GPS et niveau de remplissage.

**Réponse 200**

```json
{
  "data": [{
    "sequence": 1,
    "id_conteneur": 3,
    "uid": "CONT-2026-00789",
    "heure_estimee": "07:30",
    "collectee": false,
    "latitude": 48.8566,
    "longitude": 2.3522,
    "fill_level": 85.0
  }]
}
```

---

### GET /tournees/:id/progress

Progression en temps réel.

**Réponse 200**

```json
{
  "data": {
    "id_tournee": 1,
    "total_etapes": 45,
    "etapes_collectees": 33,
    "etapes_restantes": 12,
    "progression_pct": 73.3,
    "quantite_totale_kg": 1250.5,
    "etapes": [...]
  }
}
```

---

### GET /tournees/:id/pdf

Génère une feuille de route PDF pour une tournée.

**Réponse** : `application/pdf`

Télécharge un fichier PDF contenant :
- Informations de la tournée (code, date, statut, distance, durée)
- Agent assigné
- Véhicule
- Itinéraire complet avec liste des conteneurs

---

### GET /tournees/:id/map

Retourne les données cartographiques GeoJSON pour affichage sur une carte.

**Réponse 200**

```json
{
  "success": true,
  "data": {
    "tournee": { "id_tournee": 1, "code": "T-2026-001", ... },
    "agent": { "id": 5, "prenom": "Jean", "nom": "Dupont" },
    "vehicule": { "immatriculation": "AB-123-CD", "modele": "Renault Master" },
    "geojson": {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {
            "id_conteneur": 10,
            "uid_conteneur": "CNT-0010",
            "sequence": 1,
            "collectee": false,
            "niveau_remplissage": 85.5
          },
          "geometry": {
            "type": "Point",
            "coordinates": [2.3522, 48.8566]
          }
        }
      ]
    }
  }
}
```

---

## Collectes

### POST /tournees/:id/collecte

Enregistre une collecte. Clôture automatiquement la tournée si toutes les étapes sont faites.

**Header** : `X-User-Id: 5` (optionnel — si présent, vérifie l'assignation)

**Body** : `{ "id_conteneur": 10, "quantite_kg": 85.5 }`

**Réponse 201**

```json
{
  "data": {
    "collecte": { "id_collecte": 42, "date_heure_collecte": "2026-03-15T08:42:00Z", ... },
    "tournee_terminee": false,
    "progression": { "total": 45, "collectees": 33 }
  }
}
```

**Erreur 400** si tournée pas EN_COURS ou agent non assigné.

---

### POST /tournees/:id/anomalie

Signale une anomalie sur un conteneur.

**Header requis** : `X-User-Id: 5`

**Body**

```json
{
  "id_conteneur": 10,
  "type_anomalie": "CONTENEUR_ENDOMMAGE",
  "description": "Couvercle cassé, impossible de fermer"
}
```

**Types** : `CONTENEUR_INACCESSIBLE` | `CONTENEUR_ENDOMMAGE` | `CAPTEUR_DEFAILLANT`

**Réponse 201** — Signalement créé (table SIGNALEMENT)

**Erreur 400** si tournée TERMINEE ou ANNULEE.
**Erreur 400** si `X-User-Id` absent.

---

### GET /tournees/:id/collectes

Liste des collectes enregistrées pour une tournée.

---

### GET /tournees/:id/anomalies

Liste des anomalies signalées pour une tournée.

---

## Véhicules

### GET /vehicules

**Query** : `?page=1&limit=50`

---

### POST /vehicules

**Body**

```json
{
  "numero_immatriculation": "AB-123-CD",
  "modele": "Renault Trucks D",
  "capacite_kg": 2000
}
```

Tous les champs sont requis.

---

### GET /vehicules/:id

Détail avec comptage des tournées actives.

---

### PATCH /vehicules/:id

Mise à jour partielle (au moins 1 champ parmi `numero_immatriculation`, `modele`, `capacite_kg`).

---

### DELETE /vehicules/:id

---

## Statistiques

### GET /stats/dashboard

**Réponse 200**

```json
{
  "data": {
    "tournees": {
      "total": 156, "planifiees": 15, "en_cours": 12,
      "terminees": 128, "annulees": 1, "aujourd_hui": 15
    },
    "collectes_30j": {
      "total_collectes": 4320,
      "quantite_totale_kg": 185640.5,
      "quantite_moyenne_kg": 43.0,
      "conteneurs_collectes": 650
    },
    "vehicules": { "total_vehicules": 8, "vehicules_en_service": 5 }
  }
}
```

---

### GET /stats/kpis

**Query** : `?date_debut=2026-01-01&date_fin=2026-03-31&id_zone=1`

**Réponse 200**

```json
{
  "data": {
    "total_tournees": 156,
    "tournees_terminees": 128,
    "taux_completion_pct": 82.05,
    "distance_totale_km": 3456.8,
    "distance_moyenne_km": 22.1,
    "distance_economisee_km": 245.3,
    "total_collectes": 4320,
    "quantite_totale_kg": 185640.5,
    "duree_moyenne_min": 210.5,
    "co2_economise_kg": 66.2
  }
}
```

> CO2 calculé : `distance_reelle_km × 0.27 kg/km`

---

### GET /stats/collectes

Statistiques groupées par date et zone.

**Query** : `?date_debut=2026-03-01&date_fin=2026-03-31&id_zone=1`

**Réponse 200** — Tableau `[{ date_tournee, zone_nom, nb_collectes, quantite_kg, nb_tournees }]`

---

### GET /stats/algorithm-comparison

Comparaison NN vs 2-opt : historique DB + simulation live sur 20 conteneurs actifs.

**Réponse 200**

```json
{
  "data": {
    "statistiques_historiques": {
      "tournees_analysees": 128,
      "distance_prevue_moyenne": 22.4,
      "distance_reelle_moyenne": 19.1,
      "gain_pourcentage": 14.7
    },
    "simulation_actuelle": {
      "nb_conteneurs": 20,
      "nearest_neighbor_km": 16.15,
      "two_opt_km": 14.35,
      "gain_pct": 11.09,
      "recommandation": "2opt"
    }
  }
}
```

> `simulation_actuelle` est `null` si moins de 3 conteneurs actifs avec GPS.

---

## Infrastructure

### GET /health

```json
{ "status": "OK", "service": "service-routes", "database": "connected", "uptime": 3600 }
```

**Réponse 503** si la DB est inaccessible.

### GET /metrics

Métriques Prometheus (format texte).

### GET /api-docs

Interface Swagger UI interactive.
