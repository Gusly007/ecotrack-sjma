# Phase 3 : Alertes Automatiques

## Objectif
Générer automatiquement des alertes quand des seuils sont dépassés.

---

## 3.1 Seuils d'alerte

### Configuration
```javascript
// src/config/config.js
ALERTS: {
  FILL_LEVEL_CRITICAL: 90,      // %
  FILL_LEVEL_WARNING: 75,       // %
  BATTERY_LOW: 20,             // %
  TEMPERATURE_MIN: -10,         // °C
  TEMPERATURE_MAX: 60,          // °C
  SENSOR_TIMEOUT_HOURS: 24     // heures
}
```

### Types d'alertes

| Type | Condition | Seuil | Description |
|------|-----------|-------|-------------|
| `DEBORDEMENT` | fill_level >= 90% | 90% | Conteneur presque plein |
| `BATTERIE_FAIBLE` | battery <= 20% | 20% | Batterie faible |
| `CAPTEUR_DEFAILLANT` | Température anormale | -10°C / 60°C | Capteur défaillant |
| `CAPTEUR_DEFAILLANT` | Pas de données 24h | 24h | Capteur silencieux |

---

## 3.2 Vérification des seuils

### Service
`src/services/alert-service.js`

### Après réception d'une mesure

```
Mesure reçue
    │
    ├── fill_level >= 90% ?  ──▶  Alerte DEBORDEMENT
    │
    ├── battery <= 20% ?     ──▶  Alerte BATTERIE_FAIBLE
    │
    └── temperature hors      ──▶  Alerte CAPTEUR_DEFAILLANT
        [-10°C, 60°C] ?
```

### Code de vérification

```javascript
// src/services/alert-service.js - checkThresholds()
async checkThresholds(measurement) {
  // Vérification niveau critique
  if (measurement.niveau_remplissage_pct >= config.ALERTS.FILL_LEVEL_CRITICAL) {
    await this._createAlertIfNew(...);
  }
  
  // Vérification batterie
  if (measurement.batterie_pct <= config.ALERTS.BATTERY_LOW) {
    await this._createAlertIfNew(...);
  }
  
  // Vérification température
  if (measurement.temperature < config.ALERTS.TEMPERATURE_MIN ||
      measurement.temperature > config.ALERTS.TEMPERATURE_MAX) {
    await this._createAlertIfNew(...);
  }
}
```

---

## 3.3 Vérification capteurs silencieux

### Intervalle automatique
Le service vérifie **toutes les heures** si des capteurs n'ont pas envoyé de données depuis 24h.

```javascript
// index.js
setInterval(async () => {
  await di.alertService.checkSilentSensors();
}, 60 * 60 * 1000); // 1 heure
```

### Requête SQL
```sql
SELECT c.*, cap.uid_capteur
FROM conteneur c
JOIN CAPTEUR cap ON cap.id_conteneur = c.id_conteneur
WHERE cap.derniere_communication < NOW() - INTERVAL '24 hours'
  AND c.statut = 'ACTIF'
  AND cap.statut = 'actif';
```

---

## 3.4 Notifications

### Table des alertes
```sql
CREATE TABLE alerte_capteur (
  id_alerte SERIAL PRIMARY KEY,
  type_alerte VARCHAR(50),        -- DEBORDEMENT, BATTERIE_FAIBLE, CAPTEUR_DEFAILLANT
  valeur_detectee DECIMAL(5,2),
  seuil DECIMAL(5,2),
  description TEXT,
  statut VARCHAR(20),             -- ACTIVE, RESOLUE, IGNOREE
  id_conteneur INTEGER,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_traitement TIMESTAMP
);
```

### Déduplication
 **Important** : Le service ne crée PAS de doublons.

```javascript
// Vérifie si une alerte active existe déjà
const existing = await this.alertRepository.findActiveByContainerAndType(
  idConteneur, 
  typeAlerte
);
if (existing) return null; // Ne pas créer de doublon
```

### Statut des alertes

| Statut | Description |
|--------|-------------|
| `ACTIVE` | Nouvelle alerte, non traitée |
| `RESOLUE` | Problème corrigé |
| `IGNOREE` | Faux positif, ignorée |

---

## 3.5 Mise à jour des alertes

### Endpoint API
```
PATCH /api/iot/alerts/:id
```

### Corps de la requête
```json
{
  "statut": "RESOLUE"  // ou "IGNOREE"
}
```

### Réponses
| Code | Description |
|------|-------------|
| 200 | Alerte mise à jour |
| 400 | Alerte déjà traitée |
| 404 | Alerte non trouvée |

---

## 3.6 Notifications push

 **Non implémenté** dans la version actuelle.

### Pour implémenter
1. Après création d'alerte, appeler le **service-users**
2. Utiliser WebSockets ou SSE 
3. Stocker les tokens des utilisateurs

```javascript
// Exemple (non implémenté)
async function notifyUsers(alert) {
  // Appeler service-users pour envoyer notification
  await fetch('http://service-users:3010/api/notifications', {
    method: 'POST',
    body: {
      type: 'ALERTE',
      titre: `Alerte ${alert.type_alerte}`,
      corps: alert.description,
      utilisateurs: getGestionnairesZone(alert.id_zone)
    }
  });
}
```

---

## 3.7 Consultation des alertes

### Liste des alertes
```
GET /api/iot/alerts?statut=ACTIVE&type_alerte=DEBORDEMENT
```

### Filtres disponibles
| Paramètre | Description |
|-----------|-------------|
| `statut` | ACTIVE, RESOLUE, IGNOREE |
| `type_alerte` | DEBORDEMENT, BATTERIE_FAIBLE, CAPTEUR_DEFAILLANT |
| `id_conteneur` | Filtrer par conteneur |
| `page` | Numéro de page |
| `limit` | Nombre par page |

### Réponse
```json
{
  "success": true,
  "data": [
    {
      "id_alerte": 1,
      "type_alerte": "DEBORDEMENT",
      "valeur_detectee": 95.5,
      "seuil": 90,
      "description": "Niveau de remplissage critique : 95.5%",
      "statut": "ACTIVE",
      "id_conteneur": 10,
      "date_creation": "2026-03-09T14:30:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 12 }
}
```

---

## 3.6 Notifications push

### Service de notifications

Le service IoT envoie automatiquement les alertes au **service-users** pour notifier les gestionnaires.

#### Configuration
```bash
# .env
USERS_SERVICE_URL=http://service-users:3010
USERS_SERVICE_TIMEOUT=5000
ALERT_NOTIFICATIONS_ENABLED=true
```

#### Format de notification
```json
{
  "type": "ALERTE_IOT",
  "titre": "⚠️ Conteneur presque plein",
  "corps": "Niveau de remplissage critique : 95.5%",
  "id_conteneur": 10,
  "priorite": "haute",
  "data": {
    "id_alerte": 1,
    "type_alerte": "DEBORDEMENT",
    "valeur_detectee": 95.5,
    "seuil": 90,
    "id_zone": 2
  }
}
```

#### Priorités par type d'alerte
| Type | Priorité |
|------|----------|
| DEBORDEMENT | haute |
| BATTERIE_FAIBLE | moyenne |
| CAPTEUR_DEFAILLANT | basse |

#### Flux de notification
```
Alerte créée
    │
    ▼
NotificationService.sendAlertNotification()
    │
    ▼
POST http://service-users:3010/api/notifications
    │
    ▼
Service-users notifie les gestionnaires (WebSocket/SSE)
```