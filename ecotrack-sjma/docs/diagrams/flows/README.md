# Diagrammes de Flux - EcoTrack

> Documentation visuelle des flux de l'application EcoTrack

## Index des Diagrammes

| # | Diagramme | Fichier | Description |
|---|------------|---------|-------------|
| 01 | Architecture Overview | [01-architecture.mmd](./01-architecture.mmd) | Vue d'ensemble de l'architecture microservices |
| 02 | Authentication Flow | [02-authentication.mmd](./02-authentication.mmd) | Connexion, logout, refresh token |
| 03 | RBAC Authorization | [03-authorization.mmd](./03-authorization.mmd) | Vérification des permissions par rôle |
| 04 | IoT Data Flow | [04-iot-data.mmd](./04-iot-data.mmd) | Données capteurs MQTT → Kafka → PostgreSQL |
| 05 | Tournee Flow | [05-tournee.mmd](./05-tournee.mmd) | Création, optimisation, exécution tournées |
| 06 | Gamification | [06-gamification.mmd](./06-gamification.mmd) | Points, badges, défis, classement |
| 07 | Analytics & ML | [07-analytics-ml.mmd](./07-analytics-ml.mmd) | Agrégations, prédictions ML |
| 08 | Cache Strategy | [08-cache.mmd](./08-cache.mmd) | Redis cache, invalidation |
| 09 | Logging & Monitoring | [09-logging-monitoring.mmd](./09-logging-monitoring.mmd) | Centralized logging, Grafana |
| 10 | Request Flow | [10-request-flow.mmd](./10-request-flow.mmd) | API Gateway → Services |

## Utilisation

### Visualiser avec VS Code

Installer l'extension "Mermaid Preview" ou "Mermaid Markdown Syntax Highlighting"

### Générer une image

```bash
# Avec mermaid-cli
mmdc -i 01-architecture.mmd -o 01-architecture.png

# Avec Docker
docker run -v $(pwd):/docs minlag/mermaid-cli -i /docs/01-architecture.mmd -o /docs/01-architecture.png
```