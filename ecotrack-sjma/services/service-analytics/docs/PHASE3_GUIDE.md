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
- Recommandations
- Envoi le lundi 9h

### Mensuel (Direction)
- Synthèse exécutive
- Atteinte des objectifs
- Tendances et prévisions
- Envoi le 1er du mois 9h

##  Endpoints

### POST /api/analytics/reports/generate
Générer un rapport à la demande

**Body:**
```json
{
  "format": "pdf | excel",
  "reportType": "daily | weekly | monthly",
  "email": "user@example.com" (optionnel)
}
```

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