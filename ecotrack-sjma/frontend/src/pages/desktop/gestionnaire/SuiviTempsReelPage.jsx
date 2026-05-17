import { useCallback, useEffect, useMemo, useState } from "react";
import { StatCard } from "../../../components/common";
import { useAutoRefresh } from "../../../hooks";
import TourneeMapView from "../../../components/desktop/gestionnaire/TourneeMapView";
import AgentsActifsPanel from "../../../components/desktop/gestionnaire/AgentsActifsPanel";
import {
  fetchTourneesStats,
  fetchNearlyDoneTournees,
  fetchAverageProgression,
  fetchActiveMapData,
} from "../../../services/tourneeService";
import "./SuiviTempsReelPage.css";

export default function SuiviTempsReelPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [statsData, setStatsData] = useState({});
  const [nearlyDoneCount, setNearlyDoneCount] = useState(null);
  const [avgProgression, setAvgProgression] = useState(null);
  const [activeTournees, setActiveTournees] = useState([]);
  const [focusedTourneeId, setFocusedTourneeId] = useState(null);

  const loadLiveData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [stats, nearlyDone, avgProg, mapData] = await Promise.allSettled([
        fetchTourneesStats(),
        fetchNearlyDoneTournees(80),
        fetchAverageProgression(),
        fetchActiveMapData(),
      ]);

      if (stats.status === "fulfilled") setStatsData(stats.value || {});
      if (nearlyDone.status === "fulfilled") setNearlyDoneCount(nearlyDone.value?.count ?? 0);
      if (avgProg.status === "fulfilled") setAvgProgression(avgProg.value);
      if (mapData.status === "fulfilled") setActiveTournees(mapData.value || []);

      setLastUpdated(new Date());
    } catch {
      // keep previous state on failure
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  const [autoRefreshEnabled, toggleAutoRefresh] = useAutoRefresh(() => loadLiveData(true));

  const handleManualRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshTime >= 5000) {
      setLastRefreshTime(now);
      loadLiveData(true);
    }
  }, [lastRefreshTime, loadLiveData]);

  useEffect(() => {
    loadLiveData(false);
  }, [loadLiveData]);

  function formatTime(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  const statCards = useMemo(() => {
    const tournees = statsData.tournees || {};
    const collectes30j = statsData.collectes_30j || {};
    const tourneesEnCours = Number(tournees.en_cours || 0);
    const totalTournees = Number(tournees.total || 0);
    const conteneursCollectes = Number(collectes30j.conteneurs_collectes || 0);
    const totalCollectes = Number(collectes30j.total_collectes || 0);

    return [
      {
        icon: "fa-truck",
        iconColor: "blue",
        label: "Tournees actives",
        value: `${tourneesEnCours}/${totalTournees}`,
        change: "Mise a jour temps reel",
      },
      {
        icon: "fa-tasks",
        iconColor: "green",
        label: "Progression moyenne",
        value: avgProgression === null ? "-" : `${avgProgression} %`,
        change: "Tournees EN_COURS",
      },
      {
        icon: "fa-flag-checkered",
        iconColor: "orange",
        label: "Tournees > 80%",
        value: nearlyDoneCount === null ? "-" : String(nearlyDoneCount),
        change: "Presque terminees",
      },
      {
        icon: "fa-recycle",
        iconColor: "green",
        label: "Etapes collectees",
        value: String(conteneursCollectes),
        change: `${totalCollectes} collectes (30j)`,
      },
    ];
  }, [statsData, nearlyDoneCount, avgProgression]);

  if (loading) {
    return (
      <div className="suivi-page">
        <i className="fas fa-spinner fa-spin" /> Chargement du suivi en temps reel...
      </div>
    );
  }

  return (
    <div className="suivi-page">
      <div className="suivi-header">
        <div className="suivi-title-wrap">
          <h2>Suivi en temps reel des tournees</h2>
          <p>Visualisez les tournees actives et leur progression en direct.</p>
        </div>

        <div className="suivi-toolbar">
          <button
            type="button"
            className={`auto-refresh-btn ${autoRefreshEnabled ? "enabled" : ""}`}
            onClick={toggleAutoRefresh}
          >
            <i className={`fas ${autoRefreshEnabled ? "fa-toggle-on" : "fa-toggle-off"}`} />
            Auto-refresh 60s
          </button>

          <button
            type="button"
            className="refresh-btn"
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
          >
            <i className={`fas fa-sync-alt ${refreshing ? "fa-spin" : ""}`} />
            {refreshing ? "Actualisation..." : "Rafraichir"}
          </button>

          {lastUpdated && (
            <span className="last-updated">Maj: {formatTime(lastUpdated)}</span>
          )}
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            iconColor={stat.iconColor}
            label={stat.label}
            value={stat.value}
            change={stat.change}
          />
        ))}
      </div>

      <TourneeMapView
        tournees={activeTournees}
        focusedTourneeId={focusedTourneeId}
      />

      <AgentsActifsPanel
        tournees={activeTournees}
        onFocusTournee={setFocusedTourneeId}
        pageSize={6}
      />
    </div>
  );
}
