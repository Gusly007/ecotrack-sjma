# Phase 1 : Réception des Données

## Objectif
Recevoir et traiter les données des 2000 capteurs IoT via MQTT.

## 1.1 Setup MQTT Broker

### Broker utilisé
- **Aedes** : Broker MQTT embarqué (Node.js)
- Port TCP : `1883`
- Pas besoin de broker externe (Mosquitto)

### Configuration
```javascript
// src/config/config.js
MQTT: {
  port: parseInt(process.env.MQTT_PORT, 10) || 1883,
  host: process.env.MQTT_HOST || '0.0.0.0',
  topics: {
    SENSOR_DATA: 'containers/+/data',
    SENSOR_STATUS: 'containers/+/status'
  }
}
```

### Topics configurés
| Topic | Description |
|-------|-------------|
| `containers/{uid_capteur}/data` | Données de mesure |
| `containers/{uid_capteur}/status` | Statut du capteur |

### Sécurité (TLS)
⚠️ **Non implémenté** - Le broker utilise TCP plain. Pour production:
- Utiliser un broker externe (Mosquitto) avec TLS
- Ou configurer TLS dans Aedes

---

## 1.2 Réception des messages

### Fichier principal
`src/mqtt/mqtt-handler.js`

### Format du message MQTT
```json
{
  "fill_level": 75.5,
  "battery": 92.0,
  "temperature": 22.3
}
```

| Champ | Type | Obligatoire | Plage |
|-------|------|:-----------:|-------|
| `fill_level` | number | ✅ | 0-100 |
| `battery` | number | ✅ | 0-100 |
| `temperature` | number | ❌ | -50 à 100 |

### Validation des données

Le handler vérifie:
1. **Format du topic** : `containers/{uid}/data`
2. **JSON valide** : payload parsable
3. **Champs requis** : `fill_level`, `battery`
4. **Plages valides** :
   - `fill_level` : 0-100
   - `battery` : 0-100
   - `temperature` : -50 à 100 (si présent)

### Flux
```
Capteur IoT
    │
    ▼ MQTT (topic: containers/CAP-001/data)
┌────────────────┐
│  MQTT Broker   │  ← Aedes (TCP 1883)
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ MQTT Handler   │  ← Parse, Valide, Dispatch
└───────┬────────┘
        │
        ▼
   Message validé
```

---

## 1.3 Test de réception

### Avec mosquitto_pub
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "containers/CAP-001/data" \
  -m '{"fill_level": 85.0, "battery": 45.0, "temperature": 18.5}'
```

### Avec l'API REST (simulation)
```bash
curl -X POST http://localhost:3013/iot/simulate \
  -H "Content-Type: application/json" \
  -d '{"uid_capteur":"CAP-001","fill_level":85,"battery":45,"temperature":18.5}'
```

### Vérifier la réception
```bash
curl http://localhost:3013/iot/measurements?limit=5
```

---

## 1.4 Métriques

| Métrique | Description |
|----------|-------------|
| `mqtt_messages_total` | Messages MQTT traités |
| `http_requests_total` | Requêtes HTTP |

---

## Résumé Phase 1

| Tâche | Status |
|-------|--------|
| MQTT Broker (Aedes) | ✅ |
| Topics configurés | ✅ |
| Parse JSON | ✅ |
| Validation données | ✅ |
| TLS/Auth | ⚠️ Non |
