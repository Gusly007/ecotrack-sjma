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

// Reflète UNIQUEMENT le statut métier de la tournée (PLANIFIEE/EN_COURS/TERMINEE/ANNULEE).
// Le retard est désormais une *information indépendante* dérivée de est_en_retard
// renvoyé par le backend (cf. 3.9.0). On ne mélange plus les deux.
function mapStatus(statut) {
  const normalized = String(statut || "").toUpperCase();

  if (normalized === "TERMINEE") return { label: "Terminée", color: "green" };
  if (normalized === "ANNULEE") return { label: "Annulée", color: "gray" };
  if (normalized === "EN_COURS") return { label: "En cours", color: "green" };
  // PLANIFIEE par défaut
  return { label: "Planifiée", color: "blue" };
}

function normalizeTournee(tournee) {
  const progression = getProgression(tournee);
  const status = mapStatus(tournee.statut);
  // Le flag est renvoyé par le backend. On ne le calcule plus côté front
  // pour rester cohérent (un seul lieu de vérité = la requête SQL).
  // Ne pas afficher "en retard" sur une tournée déjà clôturée.
  const estEnRetard = Boolean(tournee.est_en_retard)
    && tournee.statut !== "TERMINEE"
    && tournee.statut !== "ANNULEE";

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
    estEnRetard,
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
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const result = await fetchAllTournees({
          statut: statusFilter,
          page,
          limit: pageSize,
          signal: controller.signal,
        });
        setRows((result.data || []).map(normalizeTournee));
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
                  {tournee.estEnRetard && (
                    <span
                      className="status-pill orange tournee-retard-badge"
                      title="L'heure prévue de fin est dépassée et la tournée n'est pas terminée"
                    >
                      ⚠ EN RETARD
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pagination-row">
        <span className="pagination-meta">
          {searchTerm.trim()
            ? `${filteredRows.length} résultat(s) sur ${pagination.total || 0} tournées (filtre actif)`
            : `Page ${pagination.page} / ${pagination.pages || 1} • ${pagination.total || 0} tournées`}
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
