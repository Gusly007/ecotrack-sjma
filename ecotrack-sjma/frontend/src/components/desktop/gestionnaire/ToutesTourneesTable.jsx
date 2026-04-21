import { useEffect, useMemo, useState } from "react";
import { fetchAllTournees } from "../../../services/tourneeService";

function getProgression(tournee) {
  const totalEtapes = Number(tournee.total_etapes || 0);
  const etapesCollectees = Number(tournee.etapes_collectees || 0);

  if (totalEtapes <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((etapesCollectees / totalEtapes) * 100)));
}

function mapStatus(statut, progression) {
  const normalized = String(statut || "").toUpperCase();

  if (normalized === "TERMINEE") {
    return { label: "Terminee", color: "green" };
  }
  if (normalized === "ANNULEE") {
    return { label: "Annulee", color: "gray" };
  }
  if (normalized === "PLANIFIEE") {
    return { label: "Planifiee", color: "blue" };
  }

  if (progression <= 20) {
    return { label: "En retard", color: "orange" };
  }

  return { label: "En cours", color: "green" };
}

function normalizeTournee(tournee) {
  const progression = getProgression(tournee);
  const status = mapStatus(tournee.statut, progression);

  return {
    id: tournee.id_tournee,
    code: `T-${tournee.id_tournee}`,
    dateDebut: tournee.date_tournee ? new Date(tournee.date_tournee).toLocaleDateString("fr-FR") : "-",
    agent: `${tournee.agent_prenom || ""} ${tournee.agent_nom || ""}`.trim() || "Agent non assigne",
    zone: tournee.zone_nom || tournee.zone_code || "Zone inconnue",
    vehicule: tournee.numero_immatriculation || "-",
    progression,
    statusLabel: status.label,
    statusColor: status.color,
  };
}

export default function ToutesTourneesTable({ statusFilter = "TOUS", searchTerm = "", pageSize = 12, refreshNonce = 0 }) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: pageSize });

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const result = await fetchAllTournees({
          statut: statusFilter,
          page,
          limit: pageSize,
        });

        if (!mounted) {
          return;
        }

        setRows((result.data || []).map(normalizeTournee));
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
  }, [statusFilter, page, pageSize, refreshNonce]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      return rows;
    }

    return rows.filter((tournee) => (
      tournee.code.toLowerCase().includes(q)
      || tournee.agent.toLowerCase().includes(q)
      || tournee.zone.toLowerCase().includes(q)
      || tournee.vehicule.toLowerCase().includes(q)
    ));
  }, [rows, searchTerm]);

  return (
    <div className="chart-container">
      <h3>Toutes les tournées</h3>
      {loading && rows.length === 0 ? (
        <div className="empty-state">Chargement des tournees...</div>
      ) : filteredRows.length === 0 ? (
        <div className="empty-state">Aucune tournee ne correspond aux filtres.</div>
      ) : (
        <table className="bo-table">
          <thead>
            <tr>
              <th>Tournée</th>
              <th>Date</th>
              <th>Agent</th>
              <th>Zone</th>
              <th>Vehicule</th>
              <th>Progression</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((tournee) => (
              <tr key={`all-${tournee.id}`}>
                <td>{tournee.code}</td>
                <td>{tournee.dateDebut}</td>
                <td>{tournee.agent}</td>
                <td>{tournee.zone}</td>
                <td>{tournee.vehicule}</td>
                <td>{tournee.progression}%</td>
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

      <div className="pagination-row">
        <span className="pagination-meta">
          Toutes: page {pagination.page} / {pagination.pages || 1} • {pagination.total || 0} tournées
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
    </div>
  );
}
