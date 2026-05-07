# Kafka — Notifications automatiques

## Vue d'ensemble

Le service consomme deux topics Kafka pour créer des notifications **sans intervention humaine**. Dès qu'une alerte IoT ou un nouveau signalement citoyen est détecté, le gestionnaire et l'admin responsables de la zone sont notifiés automatiquement.

```
┌─────────────────┐     ecotrack.alerts          ┌──────────────────────────────┐
│   service-iot   │ ──────────────────────────►  │                              │
│  (capteurs IoT) │                              │  service-notification-       │
└─────────────────┘                              │  gestionnaire                │
                                                 │                              │
┌─────────────────┐  ecotrack.signalements.      │  kafkaConsumer.js            │
│ service-routes  │  nouveau                     │       │                      │
│  (signalements) │ ──────────────────────────►  │       ▼                      │
└─────────────────┘                              │  zone.repository             │
                                                 │  (conteneur → responsables)  │
                                                 │       │                      │
                                                 │       ▼                      │
                                                 │  notification.service        │
                                                 │  createBulkNotifications()   │
                                                 │       │                      │
                                                 │       ▼                      │
                                                 │    PostgreSQL                │
                                                 └──────────────────────────────┘
```

---

## Topics consommés

| Topic | Producteur | Déclencheur |
|-------|-----------|-------------|
| `ecotrack.alerts` | `service-iot` | Capteur franchit un seuil (remplissage > 90 %, batterie faible, température anormale) |
| `ecotrack.signalements.nouveau` | `service-routes` | Citoyen soumet un nouveau signalement |

**Group ID :** `notification-gestionnaire-group`  
**Stratégie de lecture :** `fromBeginning: false` — seuls les messages arrivés après le démarrage du consumer sont traités.

---

## Format des messages

### Topic `ecotrack.alerts`

Publié par `service-iot/kafkaProducer.js` → `sendAlert(alert)`.

```json
{
  "timestamp": "2026-05-07T10:00:00.000Z",
  "alert": {
    "id_alerte": 42,
    "type_alerte": "DEBORDEMENT",
    "description": "Niveau de remplissage critique : 93% (seuil: 90%)",
    "valeur_detectee": 93,
    "seuil": 90,
    "id_conteneur": 44
  }
}
```

**Clé du message :** `id_conteneur` (string) — utilisée pour le partitionnement Kafka.

**Types d'alertes possibles :**

| `type_alerte` | Déclencheur |
|---------------|-------------|
| `DEBORDEMENT` | Niveau remplissage ≥ 90 % |
| `BATTERIE_FAIBLE` | Batterie capteur ≤ 20 % |
| `CAPTEUR_DEFAILLANT` | Température anormale ou capteur silencieux > N heures |

---

### Topic `ecotrack.signalements.nouveau`

Publié par `service-routes/kafkaProducer.js` → `sendSignalement(signalement)`.

```json
{
  "timestamp": "2026-05-07T10:00:00.000Z",
  "signalement": {
    "id_signalement": 7,
    "description": "Conteneur renversé, déchets éparpillés.",
    "id_conteneur": 44,
    "id_citoyen": 5,
    "id_type": 2,
    "statut": "OUVERT"
  }
}
```

**Clé du message :** `id_conteneur` (string).

---

## Algorithme de traitement

Pour chaque message reçu sur n'importe quel topic :

```
1. Parser le JSON du message
2. Extraire id_conteneur
3. Requête DB :
     SELECT z.id_gestionnaire, z.id_admin, z.nom, z.code
     FROM zone z
     JOIN conteneur c ON c.id_zone = z.id_zone
     WHERE c.id_conteneur = $1
4. Si zone introuvable → log warning, ignorer le message
5. Construire le tableau de notifications :
     ├─ si id_gestionnaire → { id_utilisateur: id_gestionnaire, type: 'ALERTE', titre, corps }
     └─ si id_admin        → { id_utilisateur: id_admin,        type: 'ALERTE', titre, corps }
6. Appeler notificationService.createBulkNotifications([...])
7. Log info : "N notifications créées automatiquement"
```

**Format du titre et du corps générés :**
```
titre : "[Z01] Alerte : DEBORDEMENT"
corps : "Zone : Centre-Ville\nNiveau de remplissage critique : 93%"

titre : "[Z01] Nouveau signalement #7"
corps : "Zone : Centre-Ville\nConteneur renversé, déchets éparpillés."
```

---

## Flux end-to-end complet

### Scénario 1 — Zone saturée

```
1. Capteur IoT mesure niveau = 93 %
        │
        ▼ MQTT
2. service-iot/mqtt-handler reçoit la mesure
        │
        ▼
3. alert-service._createAlertIfNew()
   → INSERT INTO alerte_capteur
        │
        ▼ Kafka
4. kafkaProducer.sendAlert(alert)
   → topic: ecotrack.alerts
   → key:   "44"  (id_conteneur)
        │
        ▼ Kafka consumer (service-notification-gestionnaire)
5. handleAlert(payload)
   → zone.repository.findResponsablesByContainer(44)
   → zone: { id_gestionnaire: 2, id_admin: 1, zone_nom: "Centre-Ville", zone_code: "Z01" }
        │
        ▼
6. notificationService.createBulkNotifications([
     { id_utilisateur: 2, type: "ALERTE", titre: "[Z01] Alerte : DEBORDEMENT", corps: "..." },
     { id_utilisateur: 1, type: "ALERTE", titre: "[Z01] Alerte : DEBORDEMENT", corps: "..." }
   ])
        │
        ▼
7. INSERT INTO notification × 2
   + Invalidation cache Redis pour userId 2 et 1
        │
        ▼
8. Gestionnaire (id=2) et Admin (id=1) ont leur notification ✅
```

---

### Scénario 2 — Nouveau signalement citoyen

```
1. Citoyen soumet POST /api/routes/signalements
        │
        ▼
2. signalement-service.create()
   → INSERT INTO signalement
        │
        ▼ Kafka
3. kafkaProducer.sendSignalement(signalement)
   → topic: ecotrack.signalements.nouveau
   → key:   "44"  (id_conteneur)
        │
        ▼ Kafka consumer (service-notification-gestionnaire)
4. handleSignalement(payload)
   → zone.repository.findResponsablesByContainer(44)
   → zone: { id_gestionnaire: 2, id_admin: 1, ... }
        │
        ▼
5. notificationService.createBulkNotifications([
     { id_utilisateur: 2, type: "ALERTE", titre: "[Z01] Nouveau signalement #7", corps: "..." },
     { id_utilisateur: 1, type: "ALERTE", titre: "[Z01] Nouveau signalement #7", corps: "..." }
   ])
        │
        ▼
6. Gestionnaire et Admin notifiés ✅
```

---

## Configuration

### Variables d'environnement

```bash
KAFKA_BROKERS=localhost:9092          # Adresse du broker (liste CSV si cluster)
KAFKAJS_NO_PARTITIONER_WARNING=1      # Silence l'avertissement KafkaJS v2
```

### Paramètres du consumer

| Paramètre | Valeur | Raison |
|-----------|--------|--------|
| `clientId` | `service-notification-gestionnaire` | Identification dans les logs Kafka |
| `groupId` | `notification-gestionnaire-group` | Un seul consumer dans le groupe |
| `fromBeginning` | `false` | Ne re-traite pas l'historique au redémarrage |
| `retries` | `8` | Reconnexion automatique si Kafka est temporairement indisponible |

---

## Gestion des erreurs

### Message mal formé

```
Erreur : JSON.parse échoue
Action : log error + message ignoré (pas de crash du consumer)
```

### Conteneur sans zone assignée

```
Erreur : zone.repository retourne null
Action : log warning "Conteneur sans zone — notification ignorée"
         le message est consommé (pas de retry)
```

### Kafka indisponible au démarrage

```
Erreur : connexion refusée
Action : log warn "Kafka indisponible — notifications automatiques désactivées"
         le service HTTP continue de fonctionner normalement
         le consumer ne tourne pas
```

### Erreur lors de createBulkNotifications

```
Erreur : ApiError (ex: rôle incompatible)
Action : log error + message Kafka consommé
         → pas de retry infini pour éviter une boucle de poison pill
```

---

## Arrêt propre

Lors d'un `SIGTERM` ou `SIGINT` :

```javascript
process.on('SIGTERM', async () => {
  await kafkaConsumer.disconnect();  // Ferme proprement le consumer Kafka
  server.close(() => process.exit(0));
});
```

Cela évite les messages en cours de traitement qui seraient perdus ou traités deux fois.

---

## Monitoring

### Logs clés à surveiller

| Message | Niveau | Signification |
|---------|--------|---------------|
| `Kafka Consumer connecté` | INFO | Consumer prêt |
| `Message Kafka reçu` | DEBUG | Chaque message entrant |
| `Notifications ALERTE créées automatiquement` | INFO | Traitement réussi |
| `Conteneur sans zone — notification ignorée` | WARN | Données manquantes en base |
| `Erreur traitement message Kafka` | ERROR | Exception non gérée sur un message |
| `Kafka Consumer — connexion échouée` | ERROR | Broker inaccessible |

### Vérification via Kafka UI

Le projet EcoTrack expose une interface Kafka UI sur `http://localhost:8080`.

Vérifications utiles :
- **Topics** → `ecotrack.alerts` et `ecotrack.signalements.nouveau` : voir les messages produits
- **Consumer Groups** → `notification-gestionnaire-group` : vérifier le lag (doit rester à 0)
- **Brokers** → état des partitions

### Vérification via CLI

```bash
# Voir les messages du topic alerts (depuis le début)
docker exec ecotrack-kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic ecotrack.alerts \
  --from-beginning

# Voir le lag du consumer group
docker exec ecotrack-kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --group notification-gestionnaire-group
```

---

## Ajouter un nouveau topic

Pour étendre le consumer à un nouveau topic (ex: `ecotrack.tournees.planifiee`) :

**1. Déclarer le topic dans `kafkaConsumer.js`**
```javascript
const TOPICS = {
  ALERTS:       'ecotrack.alerts',
  SIGNALEMENTS: 'ecotrack.signalements.nouveau',
  TOURNEES:     'ecotrack.tournees.planifiee'   // ← ajouter ici
};
```

**2. Ajouter le handler**
```javascript
async function handleTournee(payload) {
  const tournee = payload.tournee || payload;
  // ... même logique de résolution zone → responsables
}
```

**3. Ajouter le case dans `dispatch()`**
```javascript
case TOPICS.TOURNEES:
  await handleTournee(value);
  break;
```

**4. Le producteur (service concerné) publie dans ce topic**
```javascript
await producer.send({
  topic: 'ecotrack.tournees.planifiee',
  messages: [{ key: String(id_zone), value: JSON.stringify({ timestamp, tournee }) }]
});
```
