import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, StatCard, StatsGrid, useAlert } from '../../../components/common';
import FillTrendChart from '../../../components/desktop/gestionnaire/FillTrendChart';
import ZoneRepartitionTable from '../../../components/desktop/gestionnaire/ZoneRepartitionTable';
import { analyticsService } from '../../../services/analyticsService';
import '../../../components/desktop/gestionnaire/FillTrendChart.css';
import '../../../components/desktop/gestionnaire/ZoneRepartitionTable.css';
import './KpiPage.css';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}


export default function GestionnaireKpisPage() {
  const { alert, showError, showWarning, clearAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [environmental, setEnvironmental] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadKpis = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [kpisResult, zoneResult, environmentalResult] = await Promise.allSettled([
        analyticsService.getKPIs('30d'),
        analyticsService.getZonePerformance(),
        analyticsService.getEnvironmentalMetricsByPeriod('month')
      ]);

      if (kpisResult.status === 'fulfilled') {
        setKpis(kpisResult.value?.data || null);
      }

      if (environmentalResult.status === 'fulfilled') {
        setEnvironmental(environmentalResult.value?.data?.environmental || null);
      }

      const failed = [
        kpisResult.status === 'rejected' && 'KPIs',
        zoneResult.status === 'rejected' && 'Zones',
        environmentalResult.status === 'rejected' && 'Environnement',
      ].filter(Boolean);

      if (failed.length === 3) {
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
        <FillTrendChart days={30} />

        <ZoneRepartitionTable />
      </div>
    </div>
  );
}
