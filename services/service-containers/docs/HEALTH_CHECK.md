# 🏥 Health Check - Guide Complet

## 📋 Qu'est-ce qu'un Health Check ?

Un **health check** (vérification de santé) est un endpoint API qui permet de vérifier rapidement l'état de fonctionnement du microservice et de ses dépendances.

### 🎯 À quoi ça sert ?

1. **Monitoring** - Les outils de surveillance (Prometheus, Datadog, etc.) appellent ce endpoint régulièrement
2. **Load Balancers** - Vérifient si l'instance est opérationnelle avant d'envoyer du trafic
3. **Orchestrateurs** (Kubernetes, Docker Swarm) - Redémarrent automatiquement les conteneurs défaillants
4. **CI/CD** - Valident que le déploiement s'est bien passé
5. **Debugging** - Diagnostic rapide en cas de problème

### 🔍 Informations Retournées

Le health check vérifie l'état de :
- ✅ **API** - Le serveur Express répond
- ✅ **Base de données** - Connexion PostgreSQL active
- ✅ **Socket.IO** - Service de notifications disponible
- ✅ **Uptime** - Temps depuis le démarrage
- ✅ **Environment** - Environnement d'exécution (dev/prod)

---

## 🚀 Comment Utiliser le Health Check

### 1️⃣ Via curl (Terminal)

```bash
curl http://localhost:8080/health
```

**Réponse attendue (tout va bien) :**
```json
{
  "status": "OK",
  "timestamp": "2026-01-16T13:45:30.123Z",
  "uptime": 1234.56,
  "environment": "development",
  "services": {
    "api": "healthy",
    "socketio": "healthy",
    "database": "healthy"
  }
}
```

**Code HTTP : 200** ✅

---

**Réponse si problème (ex: base de données inaccessible) :**
```json
{
  "status": "DEGRADED",
  "timestamp": "2026-01-16T13:45:30.123Z",
  "uptime": 1234.56,
  "environment": "development",
  "services": {
    "api": "healthy",
    "socketio": "healthy",
    "database": "unhealthy"
  }
}
```

**Code HTTP : 503** ❌

---

### 2️⃣ Via PowerShell

```powershell
Invoke-WebRequest -Uri http://localhost:8080/health | Select-Object StatusCode, Content
```

### 3️⃣ Via Navigateur

Ouvre simplement : **http://localhost:8080/health**

### 4️⃣ Via Postman / Insomnia

```
GET http://localhost:8080/health
```

---

## 📊 Interprétation des Statuts

| Statut | Code HTTP | Signification |
|--------|-----------|---------------|
| **OK** | 200 | Tous les services fonctionnent correctement |
| **DEGRADED** | 503 | Au moins un service est défaillant mais l'API répond |
| **Aucune réponse** | - | Le serveur est complètement arrêté |

### Détails des Services

| Service | healthy | unavailable | unhealthy |
|---------|---------|-------------|-----------|
| **api** | Express répond | - | - |
| **socketio** | Socket.IO initialisé | Pas configuré | - |
| **database** | Connexion PostgreSQL OK | - | Connexion échouée |

---

## 🔄 Utilisation avec Docker / Kubernetes

### Docker Healthcheck

Ajoute dans ton `Dockerfile` :

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
```

### Kubernetes Liveness Probe

Dans ton `deployment.yaml` :

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 3
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
```

---

## 📈 Monitoring Automatisé

### Avec un script bash (Linux/macOS)

```bash
#!/bin/bash
# check-health.sh

response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)

if [ $response -eq 200 ]; then
  echo "✅ Service healthy"
  exit 0
else
  echo "❌ Service unhealthy (HTTP $response)"
  exit 1
fi
```

### Avec PowerShell (Windows)

```powershell
# check-health.ps1

$response = Invoke-WebRequest -Uri http://localhost:8080/health -UseBasicParsing
if ($response.StatusCode -eq 200) {
    Write-Host "✅ Service healthy" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Service unhealthy" -ForegroundColor Red
    exit 1
}
```

### Surveillance toutes les 30 secondes

**Linux/macOS :**
```bash
watch -n 30 'curl -s http://localhost:8080/health | jq'
```

**PowerShell :**
```powershell
while ($true) {
    $response = Invoke-RestMethod -Uri http://localhost:8080/health
    Write-Host "Status: $($response.status) - DB: $($response.services.database)" -ForegroundColor $(if($response.status -eq "OK"){"Green"}else{"Red"})
    Start-Sleep -Seconds 30
}
```

---

## 🐛 Debugging avec Health Check

### Scénario 1 : Base de données inaccessible

```json
{
  "status": "DEGRADED",
  "services": {
    "database": "unhealthy"
  }
}
```

**Action :**
1. Vérifier que PostgreSQL tourne : `Get-Service postgresql*`
2. Vérifier les credentials dans `.env`
3. Tester la connexion : `npm run test-db`

### Scénario 2 : Socket.IO unavailable

```json
{
  "services": {
    "socketio": "unavailable"
  }
}
```

**Action :**
1. Vérifier que Socket.IO est bien initialisé dans `index.js`
2. Regarder les logs au démarrage pour `[Socket] Initialisation...`

### Scénario 3 : Pas de réponse

```bash
curl: (7) Failed to connect to localhost port 8080
```

**Action :**
1. Vérifier que le serveur tourne : `Get-Process node`
2. Démarrer le serveur : `npm run dev`
3. Vérifier le port : `netstat -ano | findstr :8080`

---

## 📞 Intégration avec Services Externes

### Uptime Robot (Gratuit)

1. Créer un compte sur [uptimerobot.com](https://uptimerobot.com)
2. Ajouter un monitor HTTP
3. URL : `http://votre-serveur.com/health`
4. Interval : 5 minutes
5. Recevoir des alertes par email/SMS si down

### Prometheus

Ajoute dans `prometheus.yml` :

```yaml
scrape_configs:
  - job_name: 'ecotrack-containers'
    metrics_path: '/health'
    static_configs:
      - targets: ['localhost:8080']
```

---

## ✅ Checklist Déploiement

Avant de déployer en production, vérifie que :

- [ ] Le health check retourne 200 en conditions normales
- [ ] Le health check retourne 503 si la BD est down
- [ ] Le monitoring externe est configuré
- [ ] Les logs d'erreur sont envoyés quelque part
- [ ] Un plan de réaction existe si le service devient unhealthy

---

## 🔗 Endpoints Connexes

| Endpoint | Description |
|----------|-------------|
| `GET /health` | État des services |
| `GET /api` | Infos API + liste endpoints |
| `GET /api-docs` | Documentation Swagger |

---

**Dernière mise à jour :** 16 Janvier 2026
