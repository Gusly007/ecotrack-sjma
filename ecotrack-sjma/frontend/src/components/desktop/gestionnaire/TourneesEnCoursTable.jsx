import { useEffect, useMemo, useState } from "react";
import { fetchActiveTournees } from "../../../services/tourneeService";
import { Pagination } from "../../common";

function computeHeureFin(heureDebut, dureePrevueMin) {
  if (!heureDebut || !dureePrevueMin) return null;
  const [h, m] = String(heureDebut).substring(0, 5).split(":").map(Number);
  const totalMin = h * 60 + m + Number(dureePrevueMin);
  const hFin = Math.floor(totalMin / 60) % 24;
  const mFin = totalMin % 60;
  return `${String(hFin).padStart(2, "0")}:${String(mFin).padStart(2, "0")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function normalizeActiveTournee(tournee) {
  const total = Number(tournee.total_etapes || 0);
  const done = Number(tournee.etapes_collectees || 0);
  const progression = total > 0 ? Math.round((done / total) * 100) : 0;

  const estEnRetard = tournee.est_en_retard ?? false;

  let statusText = "En cours";
  let statusColor = "green";

  if (estEnRetard) {
    statusText = "En retard";
    statusColor = "orange";
  } else if (progression >= 90) {
    statusText = "Bientôt fini";
  }

  const heureDebut = tournee.heure_debut_prevue
    ? String(tournee.heure_debut_prevue).substring(0, 5)
    : null;

  return {
    id: tournee.code || `T-${tournee.id_tournee}`,
    rawId: tournee.id_tournee,
    agent: `${tournee.agent_prenom || ""} ${tournee.agent_nom || ""}`.trim() || "Agent non assigné",
    zone: tournee.zone_nom || tournee.zone_code || "Zone inconnue",
    progression,
    statusText,
    statusColor,
    statut: tournee.statut || "EN_COURS",
    totalEtapes: total,
    etapesCollectees: done,
    dateTournee: formatDate(tournee.date_tournee),
    heureDebutPrevue: heureDebut,
    heureFinPrevue: computeHeureFin(heureDebut, tournee.duree_prevue_min),
    dureePrevueMin: tournee.duree_prevue_min || null,
    estEnRetard,
  };
}

function buildDetailItems(tournee) {
  return [
    { label: "Identifiant", value: tournee.id },
    { label: "Agent", value: tournee.agent },
    { label: "Zone", value: tournee.zone },
    { label: "Statut", value: tournee.statusText },
    { label: "Date de tournée", value: tournee.dateTournee ?? "-" },
    { label: "Heure de début prévue", value: tournee.heureDebutPrevue ?? "-" },
    { label: "Heure de fin prévue", value: tournee.heureFinPrevue ?? "-" },
    { label: "Étapes collectées", value: `${tournee.etapesCollectees} / ${tournee.totalEtapes}` },
    { label: "Progression", value: `${tournee.progression}%` },
  ];
}

export default function TourneesEnCoursTable({ pageSize = 6, refreshNonce = 0 }) {
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

  return (
    <>
      <div className="chart-container">
        <h3>Tournées en cours</h3>
        {loading && !hasRows ? (
          <div className="empty-state">Chargement des tournées actives...</div>
        ) : !hasRows ? (
          <div className="empty-state">Aucune tournée active pour le moment.</div>
        ) : (
          <table className="bo-table">
            <thead>
              <tr>
                <th>Tournée</th>
                <th>Agent</th>
                <th>Zone</th>
                <th>Progression</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tournee) => (
                <tr key={tournee.rawId}>
                  <td>{tournee.id}</td>
                  <td>{tournee.agent}</td>
                  <td>{tournee.zone}</td>
                  <td>
                    <div
                      className="progress-bar"
                      style={{ width: "120px", display: "inline-block", verticalAlign: "middle" }}
                    >
                      <div className="progress-fill" style={{ width: `${tournee.progression}%` }}></div>
                    </div>{" "}
                    {tournee.progression}%
                  </td>
                  <td>
                    <span className={`status-dot ${tournee.statusColor}`}></span>
                    {tournee.statusText}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages || 1}
          onPageChange={setPage}
          showingFrom={(pagination.page - 1) * pageSize + 1}
          showingTo={Math.min(pagination.page * pageSize, pagination.total || 0)}
          totalItems={pagination.total || 0}
          label="tournée active"
        />
      </div>
    </>
  );
}
