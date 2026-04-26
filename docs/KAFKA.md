# Kafka - Message Broker EcoTrack

## Pourquoi Kafka ?

### Contexte de Scale
Avec le volume prévu :
- **2000 conteneurs** avec capteurs
- **2000 capteurs** envoyant des mesures
- **~2000 mesures / 5 min** = ~7 msg/sec (pic possible : 100+ msg/sec)
- **15000 citoyens** utilisant l'application
- **50 agents** + **10 gestionnaires**

### Problèmes résolus par Kafka

| Problème | Solution Kafka |
|----------|---------------|
| **Pic de mesures IoT** | Buffer asynchrone pour absorber les pics |
| **Découplage services** | Producers/Consumers indépendants |
| **Temps réel** | Traitement streaming pour alertes |
| **Scalabilité** | Partitionnement horizontal |

### Comparaison HTTP vs Kafka

| Critère | HTTP REST | Kafka |
|---------|-----------|-------|
| **Latence** | Synchrone | Asynchrone |
| **Débit** | ~100 req/sec | ~100k msg/sec |
| **Pic de charge** | Timeout | Buffer automatique |
| **Réception** | Poll (pull) | Push temps réel |
| **Stockage** | Non | Oui (rétention configurable) |

---

## Architecture Kafka EcoTrack

```
┌─────────────────┐     ┌─────────────┐
│   Capteurs IoT  │────▶│  service-iot │────┐
│  (MQTT/broker) │     │  (Producer)  │    │
└─────────────────┘     └─────────────┘    │
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        KAFKA                                │
│  Topics: ecotrack.sensor.data, ecotrack.alerts, etc.      │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│service-analytics│  │ service-users   │  │ service-routes  │
│  (Consumer)     │  │  (Consumer)     │  │  (Consumer)     │
│  - ML/Stats     │  │  - Notifications│  │  - Optimisation │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Topics Kafka

| Topic | Description | Partitions | Usage |
|-------|-------------|------------|-------|
| `ecotrack.sensor.data` | Données brutes capteurs | 6 | Analytics ML, stats |
| `ecotrack.alerts` | Alertes conteneurs | 3 | Notifications users |
| `ecotrack.container.status` | Statut conteneurs | 3 | Routes optimisation |
| `ecotrack.notifications` | Notifications | 3 | Service notifications |

---

## Topics par Service

### Service-IoT (Producer)
```javascript
// Envoie des données capteurs vers Kafka
kafkaProducer.sendSensorData({
  capteurId: 1,
  conteneurId: 100,
  niveauRemplissage: 75.5,
  batterie: 85,
  temperature: 22.3
});

// Envoie des alertes
kafkaProducer.sendAlert({
  type: 'DEBORDEMENT',
  conteneurId: 100,
  niveau: 95,
  timestamp: new Date()
});
```

### Service-Analytics (Consumer)
```javascript
// Consomme les données capteurs pour ML/Stats
kafkaConsumer.subscribe('ecotrack.sensor.data', async (message) => {
  const { data } = JSON.parse(message.value);
  await updatePredictions(data);
  await aggregateStats(data);
});

// Consomme les alertes pour rapports
kafkaConsumer.subscribe('ecotrack.alerts', async (message) => {
  const { alert } = JSON.parse(message.value);
  await storeAlertReport(alert);
});
```

### Service-Users (Consumer)
```javascript
// Consomme les alertes pour notifications
kafkaConsumer.subscribe('ecotrack.alerts', async (message) => {
  const { alert } = JSON.parse(message.value);
  await sendPushNotification(alert);
  await sendEmailAlert(alert);
});
```

---

## Installation Docker

### Démarrer Kafka
```bash
docker compose up -d zookeeper kafka kafka-ui
```

### Vérifier Kafka UI
- URL: http://localhost:8080
- Interface web pour : Topics, Consumers, Messages

### Topics créés automatiquement
```
ecotrack.sensor.data
ecotrack.alerts
ecotrack.container.status
ecotrack.notifications
```

### Commandes utiles
```bash
# Lister les topics
docker compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Voir les messages d'un topic
docker compose exec kafka kafka-console-consumer --topic ecotrack.alerts --from-beginning --bootstrap-server localhost:9092

# Statistiques topic
docker compose exec kafka kafka-topics --describe --topic ecotrack.sensor.data --bootstrap-server localhost:9092
```

---

## Configuration

### Variables d'environnement
```bash
# .env
KAFKA_BROKERS=kafka:29092
```

### Dans docker-compose.yml
```yaml
service-iot:
  environment:
    KAFKA_BROKERS: ${KAFKA_BROKERS:-kafka:29092}
```

---

## Consommation Locale (sans Docker)

Pour tester sans Docker :
```javascript
const KAFKA_BROKERS = process.env.KAFKA_BROKERS || 'localhost:9092';
```

Connectez-vous à :
- Zookeeper: localhost:2181
- Kafka: localhost:9092
- Kafka UI: localhost:8080

---

## Monitoring

### Kafka UI (Recommandé)
- **URL**: http://localhost:8080
- **Fonctionnalités**:
  - Visualiser topics
  - Voir messages en temps réel
  - Consumer groups
  - Lag monitoring

### Métriques Prometheus
```yaml
# prometheus.yml
- job_name: 'kafka'
  static_configs:
    - targets: ['kafka:9092']
```

---

## Considérations Production

### Nombre de Partitions
- `ecotrack.sensor.data`: 6 partitions (pour 2000 capteurs)
- Autres topics: 3 partitions

### Réplication
- Factor de réplication: 1 (dev), 3 (prod)
- Min ISR: 1 (dev), 2 (prod)

### Rétention
- `sensor.data`: 7 jours
- `alerts`: 30 jours
- `notifications`: 7 jours

---

## Alternatives Evaluées

| Solution | Avantages | Inconvénients |
|----------|-----------|---------------|
| **Kafka** | Débit, streaming, rétention | Complexité |
| RabbitMQ | Simple, manage queues | Moins performant |
| Redis Pub/Sub | Simple | Pas de rétention |
| AWS SQS | Managé | Vendor lock-in |

**Choix**: Kafka pour son débit élevé et sa capacité de streaming.
