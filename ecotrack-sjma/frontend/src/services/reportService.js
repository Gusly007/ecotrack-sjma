import api from './api';
import { analyticsService } from './analyticsService';

const RECENT_REPORTS_KEY = 'gestionnaire_recent_reports';
const MAX_RECENT_REPORTS = 12;

function safeString(value) {
  if (value === null || value === undefined) return '';
  return String(value).replaceAll('"', '""');
}

function rowsToCsv(rows) {
  return rows
    .map((row) => row.map((cell) => `"${safeString(cell)}"`).join(','))
    .join('\n');
}

function buildCsvBlob(content) {
  return new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8;' });
}

function formatDateForFile(date) {
  return date.toISOString().slice(0, 10);
}

function getPeriodMeta(period) {
  if (period === 'day') return { analyticsPeriod: 'day', trendDays: 7, collecteDays: 7, kpiPeriod: '7d' };
  if (period === 'month') return { analyticsPeriod: 'month', trendDays: 30, collecteDays: 30, kpiPeriod: '30d' };
  return { analyticsPeriod: 'week', trendDays: 14, collecteDays: 14, kpiPeriod: '14d' };
}

function buildMonthlyCsv(data) {
  const rows = [];
  rows.push(['Rapport', 'Mensuel complet']);
  rows.push(['Genere le', new Date().toLocaleString('fr-FR')]);
  rows.push([]);

  rows.push(['KPIs']);
  rows.push(['Taux debordement (%)', data.overflowRate.toFixed(2)]);
  rows.push(['Distance moyenne / jour (km)', data.avgDistancePerDay.toFixed(2)]);
  rows.push(['Carburant economise (L)', data.fuelSaved.toFixed(2)]);
  rows.push(['CO2 reduit (kg)', data.co2Saved.toFixed(2)]);
  rows.push([]);

  rows.push(['Evolution taux remplissage']);
  rows.push(['Date', 'Taux moyen (%)', 'Mesures']);
  data.fillTrends.forEach((item) => {
    rows.push([item.date, item.avgFillLevel, item.measurementCount]);
  });
  rows.push([]);

  rows.push(['Repartition zone']);
  rows.push(['Zone', 'Code', 'Conteneurs', 'Taux remplissage (%)', 'Mesures']);
  data.zonePerformance.forEach((zone) => {
    rows.push([zone.name, zone.code, zone.containerCount, zone.fillRate, zone.measurementCount]);
  });

  return rowsToCsv(rows);
}

function buildRoutesPerfCsv(data) {
  const rows = [];
  rows.push(['Rapport', 'Performance de tournee']);
  rows.push(['Genere le', new Date().toLocaleString('fr-FR')]);
  rows.push([]);
  rows.push(['KPI', 'Valeur']);
  rows.push(['Distance planifiee (km)', data.environmental?.distance?.planned || 0]);
  rows.push(['Distance reelle (km)', data.environmental?.distance?.actual || 0]);
  rows.push(['Distance economisee (km)', data.environmental?.distance?.saved || 0]);
  rows.push(['Reduction distance (%)', data.environmental?.distance?.reductionPct || 0]);
  rows.push(['Routes terminees', data.environmental?.routes?.completed || 0]);
  rows.push(['Routes totales', data.environmental?.routes?.total || 0]);
  rows.push(['Conteneurs collectes', data.environmental?.containers?.collected || 0]);
  rows.push(['Total collectes (periode)', data.collecteSummary?.totalCollections || 0]);
  return rowsToCsv(rows);
}

function buildEnvironmentalCsv(data) {
  const rows = [];
  rows.push(['Rapport', 'Analyse impact environnemental']);
  rows.push(['Genere le', new Date().toLocaleString('fr-FR')]);
  rows.push([]);
  rows.push(['KPI', 'Valeur']);
  rows.push(['CO2 economise (kg)', data.environmental?.co2?.saved || 0]);
  rows.push(['Reduction CO2 (%)', data.environmental?.co2?.reductionPct || 0]);
  rows.push(['Carburant economise (L)', data.environmental?.fuel?.saved || 0]);
  rows.push(['Equivalent arbres', data.environmental?.co2?.equivalents?.trees || 0]);
  rows.push(['Equivalent km voiture', data.environmental?.co2?.equivalents?.carKm || 0]);
  rows.push(['Cout economise total', data.environmental?.costs?.total || 0]);
  rows.push([]);
  rows.push(['Zones']);
  rows.push(['Zone', 'Code', 'Conteneurs', 'Taux remplissage (%)']);
  data.zonePerformance.forEach((zone) => {
    rows.push([zone.name, zone.code, zone.containerCount, zone.fillRate]);
  });
  return rowsToCsv(rows);
}

function toRecentItem(base) {
  return {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...base
  };
}

function readRecentReports() {
  try {
    const raw = localStorage.getItem(RECENT_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecentReports(items) {
  localStorage.setItem(RECENT_REPORTS_KEY, JSON.stringify(items.slice(0, MAX_RECENT_REPORTS)));
}

function addRecentReport(item) {
  const current = readRecentReports();
  writeRecentReports([item, ...current]);
}

async function fetchDataForCsv(reportType, period) {
  const { analyticsPeriod, trendDays, collecteDays, kpiPeriod } = getPeriodMeta(period);

  const [kpis, env, trends, zones, collecte] = await Promise.all([
    analyticsService.getKPIs(kpiPeriod),
    analyticsService.getEnvironmentalMetricsByPeriod(analyticsPeriod),
    analyticsService.getFillTrends(trendDays),
    analyticsService.getZonePerformance(),
    analyticsService.getCollecteStats(collecteDays)
  ]);

  const kpiData = kpis?.data || {};
  const environmental = env?.data?.environmental || null;
  const fillTrends = Array.isArray(trends?.data?.trends) ? trends.data.trends : [];
  const zonePerformance = Array.isArray(zones?.data?.zones) ? zones.data.zones : [];
  const collecteSummary = collecte?.data?.summary || null;

  const overflowRate = (Number(kpiData.totalContainers) || 0) > 0
    ? ((Number(kpiData.criticalContainers) || 0) / Number(kpiData.totalContainers)) * 100
    : 0;

  const dayOfMonth = Math.max(1, new Date().getDate());
  const avgDistancePerDay = Number(environmental?.distance?.actual || 0) / dayOfMonth;

  return {
    kpiData,
    environmental,
    fillTrends,
    zonePerformance,
    collecteSummary,
    overflowRate,
    avgDistancePerDay,
    fuelSaved: Number(environmental?.fuel?.saved || 0),
    co2Saved: Number(environmental?.co2?.saved || 0)
  };
}

export const reportService = {
  getRecentReports: () => readRecentReports(),

  clearRecentReports: () => {
    writeRecentReports([]);
  },

  generatePdfReport: async ({ reportType, period = 'week' }) => {
    let response;

    if (reportType === 'monthly_complete') {
      response = await api.post('/api/analytics/reports/generate', {
        format: 'pdf',
        reportType: period === 'month' ? 'monthly' : period === 'day' ? 'daily' : 'weekly'
      });
    } else if (reportType === 'routes_performance') {
      response = await api.post('/api/analytics/reports/routes-performance', {
        format: 'pdf',
        period
      });
    } else {
      response = await api.post('/api/analytics/reports/environmental', {
        format: 'pdf',
        period
      });
    }

    const payload = response?.data?.data || {};
    const recent = toRecentItem({
      source: 'backend',
      format: 'pdf',
      reportType,
      period,
      title: payload.fileName || 'rapport.pdf',
      fileName: payload.fileName || null,
      url: payload.url || null,
      generatedAt: payload.generatedAt || new Date().toISOString()
    });

    addRecentReport(recent);
    return recent;
  },

  generateCsvReport: async ({ reportType, period = 'week' }) => {
    const data = await fetchDataForCsv(reportType, period);

    let content = '';
    if (reportType === 'monthly_complete') {
      content = buildMonthlyCsv(data);
    } else if (reportType === 'routes_performance') {
      content = buildRoutesPerfCsv(data);
    } else {
      content = buildEnvironmentalCsv(data);
    }

    const fileName = `${reportType}_${period}_${formatDateForFile(new Date())}.csv`;

    const recent = toRecentItem({
      source: 'local',
      format: 'csv',
      reportType,
      period,
      title: fileName,
      fileName,
      csvContent: content,
      generatedAt: new Date().toISOString()
    });

    addRecentReport(recent);
    return recent;
  },

  downloadRecentReport: async (reportItem) => {
    if (reportItem.source === 'local' && reportItem.csvContent) {
      const localBlob = buildCsvBlob(reportItem.csvContent);
      const localUrl = URL.createObjectURL(localBlob);
      const link = document.createElement('a');
      link.href = localUrl;
      link.setAttribute('download', reportItem.fileName || 'rapport.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(localUrl);
      return;
    }

    if (reportItem.fileName) {
      const response = await api.get(`/api/analytics/reports/download/${encodeURIComponent(reportItem.fileName)}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', reportItem.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
};
