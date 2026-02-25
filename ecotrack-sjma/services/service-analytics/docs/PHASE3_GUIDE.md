# Phase 3 - Rapports Automatisés

##  Objectifs
- Génération de rapports PDF professionnels
- Export Excel avec analyses
- Envoi automatique par email
- Scheduling quotidien/hebdomadaire/mensuel

##  Installation

```bash
npm install pdfkit exceljs nodemailer node-cron
```

##  Types de Rapports

### Quotidien (Agents)
- Résumé de la journée
- Tournées effectuées
- Conteneurs collectés
- Envoi à 18h

### Hebdomadaire (Gestionnaires)
- KPIs de la semaine
- Performance par zone
- Impact environnemental (CO2, fuel, coûts)
- Recommandations
- Envoi le lundi 9h

### Mensuel (Direction)
- Synthèse exécutive
- Atteinte des objectifs
- Tendances et prévisions
- Envoi le 1er du mois 9h

##  Endpoints

### POST /api/analytics/reports/generate
Générer un rapport général (quotidien/hebdomadaire/mensuel)

**Body:**
```json
{
  "format": "pdf | excel",
  "reportType": "daily | weekly | monthly",
  "email": "user@example.com"
}
```

### POST /api/analytics/reports/environmental
Générer un rapport d'impact environnemental détaillé

**Body:**
```json
{
  "format": "pdf | excel",
  "period": "day | week | month",
  "email": "user@example.com"
}
```

**Contenu:**
- Impact CO2 (économisé, réduction %, équivalences)
- Carburant économisé (L)
- Coûts économies (total, fuel, main d'œuvre, maintenance)
- Distance (prévue, réelle, économisée)
- Performance par zone

### POST /api/analytics/reports/routes-performance
Générer un rapport de performance des tournées

**Body:**
```json
{
  "format": "pdf | excel",
  "period": "day | week | month",
  "email": "user@example.com"
}
```

**Contenu:**
- Statistiques des tournées (complétées, totales, conteneurs)
- Performance des agents (taux de réussite, classement)
- Top performer
- Recommandations

### GET /api/analytics/reports/download/:filename
Télécharger un rapport

##  Configuration Email

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=ecotrack@ingetis.fr
```

##  Scheduling

Les rapports sont automatiquement générés et envoyés :
- **Quotidien** : 18h00
- **Hebdomadaire** : Lundi 9h00
- **Mensuel** : 1er du mois 9h00

##  Constantes Environnementales

Les calculs utilisent les constantes définies dans `src/utils/environmentalConstants.js`:

```javascript
CO2_PER_KM: 0.85,           // kg CO2/km
FUEL_CONSUMPTION_PER_100KM: 35,  // L/100km
FUEL_PRICE_PER_LITER: 1.65,      // €/L
LABOR_COST_PER_HOUR: 50,         // €/heure
MAINTENANCE_COST_PER_KM: 0.15,   // €/km
```

##  Performance Agents

Les calculs de performance utilisent les poids dans `src/utils/agentPerformanceConstants.js`:

```javascript
WEIGHTS: {
  COLLECTION_RATE: 0.4,      // 40% : collecte effective
  COMPLETION_RATE: 0.3,     // 30% : complétion tournées
  TIME_EFFICIENCY: 0.15,     // 15% : respect temps
  DISTANCE_EFFICIENCY: 0.15  // 15% : respect distance
}
```
