import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/common";
import {
  assignTourneeAgent,
  fetchAgentsForAssignment,
  fetchAllTournees,
  fetchTourneeById,
  fetchTourneeEtapes,
} from "../../../services/tourneeService";

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
    rawStatus: String(tournee.statut || "").toUpperCase(),
    dateDebut: tournee.date_tournee ? new Date(tournee.date_tournee).toLocaleDateString("fr-FR") : "-",
    agent: `${tournee.agent_prenom || ""} ${tournee.agent_nom || ""}`.trim() || "Agent non assigne",
    zone: tournee.zone_nom || tournee.zone_code || "Zone inconnue",
    vehicule: tournee.numero_immatriculation || "-",
    progression,
    statusLabel: status.label,
    statusColor: status.color,
  };
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback;
}

export default function ToutesTourneesTable({ statusFilter = "TOUS", searchTerm = "", pageSize = 12, refreshNonce = 0, onActionSuccess }) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: pageSize });
  const [viewOpen, setViewOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTournee, setSelectedTournee] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [tourneeDetails, setTourneeDetails] = useState(null);
  const [tourneeEtapes, setTourneeEtapes] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const canAssignStatus = (rawStatus) => rawStatus !== "TERMINEE" && rawStatus !== "ANNULEE";

  const reloadList = async () => {
    const result = await fetchAllTournees({
      statut: statusFilter,
      page,
      limit: pageSize,
    });
    setRows((result.data || []).map(normalizeTournee));
    setPagination(result.pagination || { page: 1, pages: 1, total: 0, limit: pageSize });
  };

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

  async function handleView(tournee) {
    setActionError("");
    setSelectedTournee(tournee);
    setViewOpen(true);
    setDetailsLoading(true);

    try {
      const [details, etapes] = await Promise.all([
        fetchTourneeById(tournee.id),
        fetchTourneeEtapes(tournee.id),
      ]);
      setTourneeDetails(details || null);
      setTourneeEtapes(Array.isArray(etapes) ? etapes : []);
    } catch (error) {
      setActionError(getErrorMessage(error, "Impossible de charger les details de la tournee."));
      setTourneeDetails(null);
      setTourneeEtapes([]);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleOpenAssign(tournee) {
    setActionError("");
    setSelectedTournee(tournee);
    setAssignOpen(true);
    setAssignLoading(true);

    try {
      const list = await fetchAgentsForAssignment({ page: 1, limit: 100 });
      setAgents(list);

      const current = list.find((a) => String(a.id_utilisateur) === String(tourneeDetails?.id_agent || ""));
      if (current) {
        setSelectedAgentId(String(current.id_utilisateur));
      } else {
        setSelectedAgentId("");
      }
    } catch (error) {
      setActionError(getErrorMessage(error, "Impossible de charger la liste des agents."));
      setAgents([]);
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleAssignSubmit(event) {
    event.preventDefault();
    setActionError("");

    if (!selectedTournee?.id || !selectedAgentId) {
      setActionError("Veuillez selectionner un agent.");
      return;
    }

    try {
      setAssignSubmitting(true);
      await assignTourneeAgent(selectedTournee.id, selectedAgentId);
      setAssignOpen(false);
      await reloadList();
      if (typeof onActionSuccess === "function") {
        await onActionSuccess();
      }
    } catch (error) {
      setActionError(getErrorMessage(error, "Impossible d'assigner la tournee a cet agent."));
    } finally {
      setAssignSubmitting(false);
    }
  }

  function closeViewModal() {
    setViewOpen(false);
    setTourneeDetails(null);
    setTourneeEtapes([]);
    setActionError("");
  }

  function closeAssignModal() {
    setAssignOpen(false);
    setSelectedAgentId("");
    setAgents([]);
    setActionError("");
  }

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
              <th>Action</th>
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
                <td>
                  <div className="tournee-actions-cell">
                    <button
                      type="button"
                      className="table-action-btn"
                      onClick={() => handleView(tournee)}
                    >
                      Voir
                    </button>
                    <button
                      type="button"
                      className="table-action-btn secondary"
                      onClick={() => handleOpenAssign(tournee)}
                      disabled={!canAssignStatus(tournee.rawStatus)}
                      title={!canAssignStatus(tournee.rawStatus) ? "Assignation indisponible pour ce statut" : "Assigner a un autre agent"}
                    >
                      Assigner
                    </button>
                  </div>
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

      <Modal
        isOpen={viewOpen}
        onClose={closeViewModal}
        title={`Details ${selectedTournee?.code || "tournee"}`}
        headerIcon="fa-map"
        headerColor="#4CAF50"
        size="lg"
        showFooter={false}
      >
        {detailsLoading ? (
          <p className="tournee-modal-info">Chargement des details...</p>
        ) : (
          <div className="tournee-view-wrap">
            {actionError && <p className="tournee-modal-error">{actionError}</p>}

            {tourneeDetails && (
              <div className="tournee-view-kpis">
                <div><span>Zone:</span> <strong>{tourneeDetails.zone_nom || tourneeDetails.zone_code || "-"}</strong></div>
                <div><span>Agent:</span> <strong>{`${tourneeDetails.agent_prenom || ""} ${tourneeDetails.agent_nom || ""}`.trim() || "Non assigne"}</strong></div>
                <div><span>Vehicule:</span> <strong>{tourneeDetails.numero_immatriculation || "-"}</strong></div>
                <div><span>Distance prevue:</span> <strong>{Number(tourneeDetails.distance_prevue_km || 0).toFixed(2)} km</strong></div>
                <div><span>Duree prevue:</span> <strong>{Number(tourneeDetails.duree_prevue_min || 0)} min</strong></div>
                <div><span>Progression:</span> <strong>{Number(selectedTournee?.progression || 0)}%</strong></div>
              </div>
            )}

            <div className="tournee-view-steps">
              <p>Itineraire optimise ({tourneeEtapes.length} etapes)</p>
              {tourneeEtapes.length === 0 ? (
                <div className="empty-state">Aucune etape disponible pour cette tournee.</div>
              ) : (
                <ol>
                  {tourneeEtapes.map((etape) => (
                    <li key={etape.id_etape || `${etape.sequence}-${etape.id_conteneur}`}>
                      #{etape.sequence} - {etape.conteneur_uid || `Conteneur ${etape.id_conteneur}`} ({Number(etape.fill_level || 0).toFixed(1)}%)
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={assignOpen}
        onClose={closeAssignModal}
        title={`Assigner ${selectedTournee?.code || "tournee"}`}
        headerIcon="fa-user-edit"
        headerColor="#2196F3"
        size="md"
        showFooter={false}
      >
        <form className="tournee-assign-form" onSubmit={handleAssignSubmit}>
          {assignLoading ? (
            <p className="tournee-modal-info">Chargement des agents...</p>
          ) : (
            <>
              <label htmlFor="assign_agent_id">Nouvel agent</label>
              <select
                id="assign_agent_id"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                disabled={assignSubmitting}
              >
                <option value="">Selectionner un agent</option>
                {agents.map((agent) => (
                  <option key={agent.id_utilisateur} value={agent.id_utilisateur}>
                    {agent.prenom || ""} {agent.nom || ""} ({agent.email || "-"})
                  </option>
                ))}
              </select>

              {actionError && <p className="tournee-modal-error">{actionError}</p>}

              <div className="tournee-modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeAssignModal}
                  disabled={assignSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={assignSubmitting || !selectedAgentId}
                >
                  {assignSubmitting ? "Assignation..." : "Confirmer"}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
