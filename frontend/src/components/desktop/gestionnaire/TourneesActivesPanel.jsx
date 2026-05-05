import { useEffect, useMemo, useState } from "react";
import TourneesEnCoursTable from "./TourneesEnCoursTable";
import { fetchActiveTournees } from "../../../services/tourneeService";

function normalizeActiveTournee(tournee) {
  const total = Number(tournee.total_etapes || 0);
  const done = Number(tournee.etapes_collectees || 0);
  const progression = total > 0 ? Math.round((done / total) * 100) : 0;

  let statusText = "En cours";
  let statusColor = "green";

  if (progression >= 90) {
    statusText = "Bientot fini";
  } else if (progression <= 20) {
    statusText = "Retard";
    statusColor = "orange";
  }

  return {
    id: `T-${tournee.id_tournee}`,
    agent: `${tournee.agent_prenom || ""} ${tournee.agent_nom || ""}`.trim() || "Agent non assigne",
    zone: tournee.zone_nom || tournee.zone_code || "Zone inconnue",
    progression,
    statusText,
    statusColor,
  };
}

export default function TourneesActivesPanel({ pageSize = 6, refreshNonce = 0 }) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: pageSize });

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const result = await fetchActiveTournees({ page, limit: pageSize });
        if (!mounted) {
          return;
        }

        setRows((result.data || []).map(normalizeActiveTournee));
        setPagination(result.pagination || { page: 1, pages: 1, total: 0, limit: pageSize });
      } catch (_err) {
        if (!mounted) {
          return;
        }
        setRows([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [page, pageSize, refreshNonce]);

  const hasRows = useMemo(() => rows.length > 0, [rows]);

  if (loading && !hasRows) {
    return <div className="chart-container">Chargement des tournees actives...</div>;
  }

  return (
    <>
      {hasRows ? (
        <TourneesEnCoursTable tourneesEnCours={rows} />
      ) : (
        <div className="empty-state">Aucune tournee active pour le moment.</div>
      )}

      <div className="pagination-row">
        <span className="pagination-meta">
          Actives: page {pagination.page} / {pagination.pages || 1} • {pagination.total || 0} tournées
        </span>
        <div className="pagination-actions">
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={loading || pagination.page <= 1}
          >
            Précédent
          </button>
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setPage((prev) => Math.min(pagination.pages || 1, prev + 1))}
            disabled={loading || pagination.page >= (pagination.pages || 1)}
          >
            Suivant
          </button>
        </div>
      </div>
    </>
  );
}
