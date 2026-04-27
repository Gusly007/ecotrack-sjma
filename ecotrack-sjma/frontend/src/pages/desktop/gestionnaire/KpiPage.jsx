import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, StatCard, StatsGrid, useAlert } from '../../../components/common';
import { analyticsService } from '../../../services/analyticsService';
import './KpiPage.css';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDateLabel(dateValue) {
  if (!dateValue) return '-';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, toNumber(value)));
}

export default function GestionnaireKpisPage() {
  const { alert, showError, showWarning, clearAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [fillTrends, setFillTrends] = useState([]);
  const [zonePerformance, setZonePerformance] = useState([]);
  const [environmental, setEnvironmental] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadKpis = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [kpisResult, trendsResult, zoneResult, environmentalResult] = await Promise.allSettled([
        analyticsService.getKPIs('30d'),
        analyticsService.getFillTrends(30),
        analyticsService.getZonePerformance(),
        analyticsService.getEnvironmentalMetricsByPeriod('month')
      ]);

      if (kpisResult.status === 'fulfilled') {
        setKpis(kpisResult.value?.data || null);
      }

      if (trendsResult.status === 'fulfilled') {
        const trends = trendsResult.value?.data?.trends;
        setFillTrends(Array.isArray(trends) ? trends : []);
      }

      if (zoneResult.status === 'fulfilled') {
        const zones = zoneResult.value?.data?.zones;
        setZonePerformance(Array.isArray(zones) ? zones : []);
      }

      if (environmentalResult.status === 'fulfilled') {
        setEnvironmental(environmentalResult.value?.data?.environmental || null);
      }

      const failed = [
        kpisResult.status === 'rejected' && 'KPIs',
        trendsResult.status === 'rejected' && 'Tendances',
        zoneResult.status === 'rejected' && 'Zones',
        environmentalResult.status === 'rejected' && 'Environnement',
      ].filter(Boolean);

      if (failed.length === 4) {
        showError('Impossible de charger les données. Vérifiez votre connexion.');
      } else if (failed.length > 0) {
        showWarning(`Données partiellement indisponibles : ${failed.join(', ')}.`);
      }

      setLastUpdated(new Date());
    } catch (error) {
      showError('Erreur de chargement des KPIs.');
    } finally {
      if (isManualRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [showError]);

  useEffect(() => {
    loadKpis(false);
  }, [loadKpis]);

  const overview = useMemo(() => {
    const totalContainers = toNumber(kpis?.totalContainers);
    const criticalContainers = toNumber(kpis?.criticalContainers);
    const overflowRate = totalContainers > 0
      ? (criticalContainers / totalContainers) * 100
      : 0;

    const monthDistance = toNumber(environmental?.distance?.actual);
    const daysInMonth = Math.max(1, new Date().getDate());
    const avgDistancePerDay = monthDistance / daysInMonth;

    const fuelSavedMonth = toNumber(environmental?.fuel?.saved);
    const co2Reduced = toNumber(environmental?.co2?.saved);
    const co2ReductionPct = toNumber(environmental?.co2?.reductionPct);

    return {
      overflowRate,
      avgDistancePerDay,
      fuelSavedMonth,
      co2Reduced,
      co2ReductionPct
    };
  }, [environmental, kpis]);

  const trendPoints = useMemo(() => {
    if (!fillTrends.length) return [];

    return fillTrends.map((point) => {
      const level = clampPercent(point.avgFillLevel);
      return {
        dateLabel: formatDateLabel(point.date),
        level,
        measurementCount: toNumber(point.measurementCount)
      };
    });
  }, [fillTrends]);

  const zoneBars = useMemo(() => {
    if (!zonePerformance.length) return [];

    return [...zonePerformance]
      .sort((a, b) => toNumber(b.fillRate) - toNumber(a.fillRate))
      .slice(0, 10)
      .map((zone) => ({
        id: zone.id,
        label: zone.code || zone.name || `Zone ${zone.id}`,
        containers: toNumber(zone.containerCount),
        fillRate: clampPercent(zone.fillRate)
      }));
  }, [zonePerformance]);

  if (loading) {
    return <div className="gestionnaire-kpis-page"><i className="fas fa-spinner fa-spin"></i> Chargement des KPIs...</div>;
  }

  return (
    <div className="gestionnaire-kpis-page">
      <div className="kpis-header">
        <div>
          <h2>Analyse des KPIs</h2>
          <p>Vue d'ensemble des performances opérationnelles et environnementales.</p>
        </div>

        <div className="kpis-actions">
          {lastUpdated && (
            <span className="kpis-last-updated">
              Maj: {lastUpdated.toLocaleTimeString('fr-FR')}
            </span>
          )}
          <Button
            variant="secondary"
            icon="fa-sync-alt"
            onClick={() => loadKpis(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Actualisation...' : 'Rafraichir'}
          </Button>
        </div>
      </div>

      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={clearAlert} />
      )}

      <StatsGrid>
        <StatCard
          icon="fa-exclamation-triangle"
          iconColor="red"
          label="Taux de debordement"
          value={`${overview.overflowRate.toFixed(1)}%`}
          change={`${toNumber(kpis?.criticalContainers)} conteneurs critiques`}
        />
        <StatCard
          icon="fa-route"
          iconColor="blue"
          label="Distance moyenne / jour"
          value={`${overview.avgDistancePerDay.toFixed(1)} km`}
          change="Mois en cours"
        />
        <StatCard
          icon="fa-gas-pump"
          iconColor="green"
          label="Carburant economise ce mois"
          value={`${overview.fuelSavedMonth.toFixed(1)} L`}
          change="Optimisation des tournees"
        />
        <StatCard
          icon="fa-leaf"
          iconColor="green"
          label="CO2 reduit"
          value={`${overview.co2Reduced.toFixed(1)} kg`}
          change={`${overview.co2ReductionPct.toFixed(1)}% de reduction`}
        />
      </StatsGrid>

      <div className="kpis-charts-grid">
        <section className="kpis-panel">
          <div className="kpis-panel-header">
            <h3>Evolution du taux de remplissage (30 jours)</h3>
            <span>{trendPoints.length} points</span>
          </div>

          {!trendPoints.length ? (
            <div className="kpis-empty">Aucune donnee de tendance disponible.</div>
          ) : (
            <div className="kpis-trend-chart">
              {trendPoints.map((point, index) => (
                <div className="trend-point" key={`${point.dateLabel}-${index}`}>
                  <div className="trend-value">{point.level.toFixed(0)}%</div>
                  <div className="trend-bar-wrap">
                    <div className="trend-bar" style={{ height: `${Math.max(6, point.level)}%` }}></div>
                  </div>
                  <div className="trend-label">{point.dateLabel}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="kpis-panel">
          <div className="kpis-panel-header">
            <h3>Repartition par zone</h3>
            <span>{zoneBars.length} zones</span>
          </div>

          {!zoneBars.length ? (
            <div className="kpis-empty">Aucune donnee par zone disponible.</div>
          ) : (
            <div className="zone-bars">
              {zoneBars.map((zone) => (
                <div className="zone-row" key={zone.id || zone.label}>
                  <div className="zone-row-head">
                    <strong>{zone.label}</strong>
                    <span>{zone.fillRate.toFixed(1)}%</span>
                  </div>
                  <div className="zone-row-meta">{zone.containers} conteneurs</div>
                  <div className="zone-row-track">
                    <div className="zone-row-fill" style={{ width: `${zone.fillRate}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
