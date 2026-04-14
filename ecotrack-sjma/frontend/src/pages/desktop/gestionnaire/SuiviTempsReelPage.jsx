import { useCallback, useEffect, useMemo, useState } from "react";
import { StatCard } from "../../../components/common";
import { fetchActiveTournees, fetchTourneeProgress } from "../../../services/tourneeService";
import "./SuiviTempsReelPage.css";

function toPercent(done, total) {
  if (!total || total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

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

function normalizeTournee(tournee, progressById) {
  const progress = progressById[tournee.id_tournee] || {};
  const totalEtapes = Number(progress.total_etapes ?? tournee.total_etapes ?? 0);
  const etapesCollectees = Number(progress.etapes_collectees ?? tournee.etapes_collectees ?? 0);
  const progression = toPercent(etapesCollectees, totalEtapes);

  let statusLabel = "En cours";
  let statusColor = "green";

  if (progression >= 90) {
    statusLabel = "Bientot finie";
    statusColor = "blue";
  } else if (progression <= 20) {
    statusLabel = "Demarrage";
    statusColor = "orange";
  }

  return {
    id: tournee.id_tournee,
    code: tournee.code || `T-${tournee.id_tournee}`,
    agent: `${tournee.agent_prenom || ""} ${tournee.agent_nom || ""}`.trim() || "Agent non assigne",
    zone: tournee.zone_nom || tournee.zone_code || "Zone inconnue",
    vehicule: tournee.numero_immatriculation || "-",
    progression,
    totalEtapes,
    etapesCollectees,
    statusLabel,
    statusColor,
  };
}

export default function SuiviTempsReelPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tournees, setTournees] = useState([]);

  const loadLiveData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const activeResult = await fetchActiveTournees({ page: 1, limit: 50 });
      const activeTournees = activeResult?.data || [];

      const progressResults = await Promise.allSettled(
        activeTournees.map((tournee) => fetchTourneeProgress(tournee.id_tournee))
      );

      const progressById = {};
      progressResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          progressById[activeTournees[index].id_tournee] = result.value || {};
        }
      });

      const normalized = activeTournees.map((tournee) => normalizeTournee(tournee, progressById));
      setTournees(normalized);
      setLastUpdated(new Date());
    } catch (_err) {
      // Keep previous state visible if refresh fails.
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

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
    }, 15000);

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, loadLiveData, loading, refreshing]);

  const stats = useMemo(() => {
    const totalActives = tournees.length;
    const avgProgress = totalActives > 0
      ? Math.round(tournees.reduce((sum, t) => sum + t.progression, 0) / totalActives)
      : 0;
    const almostDone = tournees.filter((t) => t.progression >= 80).length;
    const totalCollectees = tournees.reduce((sum, t) => sum + t.etapesCollectees, 0);

    return { totalActives, avgProgress, almostDone, totalCollectees };
  }, [tournees]);

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
            Auto-refresh 15s
          </button>

          <button
            type="button"
            className="refresh-btn"
            onClick={() => loadLiveData(true)}
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
        <StatCard icon="fa-truck" iconColor="blue" label="Tournees actives" value={String(stats.totalActives)} change="Actuellement en cours" />
        <StatCard icon="fa-tasks" iconColor="green" label="Progression moyenne" value={`${stats.avgProgress}%`} change="Mise a jour dynamique" />
        <StatCard icon="fa-flag-checkered" iconColor="orange" label="Tournees > 80%" value={String(stats.almostDone)} change="Presque terminees" />
        <StatCard icon="fa-recycle" iconColor="green" label="Etapes collectees" value={String(stats.totalCollectees)} change="Total des etapes valides" />
      </div>

      <div className="suivi-table-wrap">
        <h3>Etat live des tournees</h3>
        {tournees.length === 0 ? (
          <div className="empty-state">Aucune tournee active pour le moment.</div>
        ) : (
          <table className="bo-table">
            <thead>
              <tr>
                <th>Tournee</th>
                <th>Agent</th>
                <th>Zone</th>
                <th>Vehicule</th>
                <th>Progression</th>
                <th>Collectees</th>
                <th>Etat</th>
              </tr>
            </thead>
            <tbody>
              {tournees.map((tournee) => (
                <tr key={tournee.id}>
                  <td>{tournee.code}</td>
                  <td>{tournee.agent}</td>
                  <td>{tournee.zone}</td>
                  <td>{tournee.vehicule}</td>
                  <td>
                    <div className="progress-cell">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${tournee.progression}%` }}></div>
                      </div>
                      <span>{tournee.progression}%</span>
                    </div>
                  </td>
                  <td>{tournee.etapesCollectees}/{tournee.totalEtapes}</td>
                  <td>
                    <span className={`status-pill ${tournee.statusColor}`}>
                      <span className="status-dot"></span>
                      {tournee.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
