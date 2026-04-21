import { useCallback, useEffect, useMemo, useState } from "react";
import { StatCard } from "../../../components/common";
import TourneesActivesPanel from "../../../components/desktop/gestionnaire/TourneesActivesPanel";
import { fetchTourneesStats } from "../../../services/tourneeService";
import "./SuiviTempsReelPage.css";

export default function SuiviTempsReelPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [statsData, setStatsData] = useState({});

  const loadLiveData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch stats and trigger TourneesActivesPanel refresh
      const stats = await fetchTourneesStats();
      setStatsData(stats || {});
      setRefreshNonce((prev) => prev + 1);
      setLastUpdated(new Date());
    } catch {
      // Keep previous state visible if refresh fails.
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Throttle manual refresh: max 1 call per 5 seconds
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

  useEffect(() => {
    if (!autoRefreshEnabled) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      if (!loading && !refreshing) {
        loadLiveData(true);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, loadLiveData, loading, refreshing]);

  function formatDateTime(value) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  const statCards = useMemo(() => {
    const tournees = statsData.tournees || {};
    const collectes30j = statsData.collectes_30j || {};
    const totalTournees = Number(tournees.total || 0);
    const tourneesEnCours = Number(tournees.en_cours || 0);
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
        value: "-",
        change: "Mise a jour dynamique",
      },
      {
        icon: "fa-flag-checkered",
        iconColor: "orange",
        label: "Tournees > 80%",
        value: "-",
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
  }, [statsData]);

  if (loading) {
    return <div className="suivi-page">Chargement du suivi en temps reel...</div>;
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
            onClick={() => setAutoRefreshEnabled((prev) => !prev)}
          >
            <i className={`fas ${autoRefreshEnabled ? "fa-toggle-on" : "fa-toggle-off"}`}></i>
            Auto-refresh 60s
          </button>

          <button
            type="button"
            className="refresh-btn"
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
          >
            <i className={`fas fa-sync-alt ${refreshing ? "fa-spin" : ""}`}></i>
            {refreshing ? "Actualisation..." : "Rafraichir"}
          </button>

          {lastUpdated && (
            <span className="last-updated">Maj: {formatDateTime(lastUpdated)}</span>
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

      <TourneesActivesPanel pageSize={6} refreshNonce={refreshNonce} />
    </div>
  );
}
