#  Phase 2 - Tableaux de Bord

##  Objectifs
- Dashboard temps réel avec auto-refresh
- Visualisations interactives (graphiques, heatmaps)
- KPIs en direct
- Génération d'insights automatiques

##  Installation

```bash
# Installer les dépendances graphiques
npm install chart.js chartjs-node-canvas
```

## Fonctionnalités

### Dashboard Principal
- KPIs temps réel
- Évolution du remplissage
- Heatmap des zones
- Top conteneurs critiques
- Insights automatiques

### Visualisations
- Graphiques en ligne (évolutions temporelles)
- Graphiques en barres (comparaisons)
- Heatmaps géographiques
- Données formatées pour Chart.js

## Endpoints

### GET /api/analytics/dashboard
Dashboard complet

**Query params:**
- `period`: day | week | month

**Response:** Données complètes avec graphiques et insights

### GET /api/analytics/realtime
Stats en temps réel (pour auto-refresh)

### GET /api/analytics/heatmap
Heatmap des zones (GeoJSON)

### GET /api/analytics/evolution
Évolution temporelle

**Query params:**
- `days`: nombre de jours (default: 7)

##  Intégration Frontend

```javascript
// React Hook
function useDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/analytics/dashboard');
      const json = await res.json();
      setData(json.data);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s
    
    return () => clearInterval(interval);
  }, []);

  return data;
}
```