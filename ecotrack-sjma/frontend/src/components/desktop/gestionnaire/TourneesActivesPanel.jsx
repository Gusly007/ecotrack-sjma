import { useEffect, useMemo, useState } from "react";
import TourneesEnCoursTable from "./TourneesEnCoursTable";
import { fetchActiveTournees } from "../../../services/tourneeService";

function normalizeActiveTournee(tournee) {
  const total = Number(tournee.total_etapes || 0);
  const done = Number(tournee.etapes_collectees || 0);
  const progression = total > 0 ? Math.round((done / total) * 100) : 0;

  // Statut métier prioritaire : on reflète le vrai statut, pas une heuristique sur la progression.
  // Le retard est désormais une info indépendante, alimentée par le flag backend est_en_retard.
  let statusText = "En cours";
  let statusColor = "green";

  if (progression >= 90) {
    statusText = "Bientôt fini";
  }

  // est_en_retard prime visuellement quand la tournée n'est pas terminée
  const estEnRetard = Boolean(tournee.est_en_retard)
    && tournee.statut !== "TERMINEE"
    && tournee.statut !== "ANNULEE";

  if (estEnRetard) {
    statusText = "En retard";
    statusColor = "orange";
  }

  return {
    id: `T-${tournee.id_tournee}`,
    agent: `${tournee.agent_prenom || ""} ${tournee.agent_nom || ""}`.trim() || "Agent non assigne",
    zone: tournee.zone_nom || tournee.zone_code || "Zone inconnue",
    progression,
    statusText,
    statusColor,
    estEnRetard,
    statut: tournee.statut || "—",
    totalEtapes: total,
    etapesCollectees: done,
    heureDebutPrevue: tournee.heure_debut_prevue || null,
  };
}

export default function TourneesActivesPanel({ pageSize = 6, refreshNonce = 0 }) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: pageSize });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const result = await fetchActiveTournees({ page, limit: pageSize, signal: controller.signal });
        setRows((result.data || []).map(normalizeActiveTournee));
        setPagination(result.pagination || { page: 1, pages: 1, total: 0, limit: pageSize });
      } catch (err) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") return;
        setRows([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
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
