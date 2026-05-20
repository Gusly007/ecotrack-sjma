import { useEffect, useMemo, useState } from "react";
import { fetchAllTournees } from "../../../services/tourneeService";
import { Pagination } from "../../common";
import Modal from "../../common/Modal";
import DetailView from "../../common/DetailView";
import TourneeEditModal from "./TourneeEditModal";

function computeHeureFin(heureDebut, dureePrevueMin) {
  if (!heureDebut || !dureePrevueMin) return null;
  const [h, m] = String(heureDebut).substring(0, 5).split(":").map(Number);
  const totalMin = h * 60 + m + Number(dureePrevueMin);
  const hFin = Math.floor(totalMin / 60) % 24;
  const mFin = totalMin % 60;
  return `${String(hFin).padStart(2, "0")}:${String(mFin).padStart(2, "0")}`;
}

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
  const totalEtapes = Number(tournee.total_etapes || 0);
  const etapesCollectees = Number(tournee.etapes_collectees || 0);
  const progression = getProgression(tournee);
  const status = mapStatus(tournee.statut);
  const estEnRetard = Boolean(tournee.est_en_retard)
    && tournee.statut !== "TERMINEE"
    && tournee.statut !== "ANNULEE";

  const heureDebut = tournee.heure_debut_prevue
    ? String(tournee.heure_debut_prevue).substring(0, 5)
    : null;

  return {
    id: tournee.id_tournee,
    code: `T-${tournee.id_tournee}`,
    dateTournee: tournee.date_tournee ? new Date(tournee.date_tournee).toLocaleDateString("fr-FR") : "-",
    agent: `${tournee.agent_prenom || ""} ${tournee.agent_nom || ""}`.trim() || "Agent non assigné",
    zone: tournee.zone_nom || tournee.zone_code || "Zone inconnue",
    vehicule: tournee.numero_immatriculation || "-",
    heureDebutPrevue: heureDebut,
    heureFinPrevue: computeHeureFin(heureDebut, tournee.duree_prevue_min),
    totalEtapes,
    etapesCollectees,
    progression,
    statusLabel: status.label,
    statusColor: status.color,
    estEnRetard,
  };
}

function buildDetailItems(tournee) {
  return [
    { label: "Identifiant", value: tournee.code },
    { label: "Agent", value: tournee.agent },
    { label: "Zone", value: tournee.zone },
    { label: "Véhicule", value: tournee.vehicule },
    { label: "Statut", value: tournee.statusLabel },
    { label: "Date de tournée", value: tournee.dateTournee },
    { label: "Heure de début prévue", value: tournee.heureDebutPrevue ?? "-" },
    { label: "Heure de fin prévue", value: tournee.heureFinPrevue ?? "-" },
    { label: "Étapes collectées", value: `${tournee.etapesCollectees} / ${tournee.totalEtapes}` },
    { label: "Progression", value: `${tournee.progression}%` },
    { label: "En retard", value: tournee.estEnRetard ? "Oui" : "Non" },
  ];
}

export default function ToutesTourneesTable({ statusFilter = "TOUS", searchTerm = "", pageSize = 12, refreshNonce = 0, onActionSuccess }) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: pageSize });
  const [selectedTournee, setSelectedTournee] = useState(null);
  const [editId, setEditId] = useState(null);

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
    <>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((tournee) => (
                <tr key={`all-${tournee.id}`}>
                  <td>{tournee.code}</td>
                  <td>{tournee.dateTournee}</td>
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
                  <td className="tournee-actions-cell">
                    <button
                      type="button"
                      className="btn-icon-detail"
                      title="Voir le détail"
                      onClick={() => setSelectedTournee(tournee)}
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button
                      type="button"
                      className="btn-icon-edit"
                      title="Modifier"
                      onClick={() => setEditId(tournee.id)}
                    >
                      <i className="fas fa-pen"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination
          currentPage={searchTerm.trim() ? 1 : pagination.page}
          totalPages={searchTerm.trim() ? 1 : (pagination.pages || 1)}
          onPageChange={setPage}
          showingFrom={
            searchTerm.trim()
              ? (filteredRows.length > 0 ? 1 : 0)
              : (pagination.page - 1) * pageSize + 1
          }
          showingTo={
            searchTerm.trim()
              ? filteredRows.length
              : Math.min(pagination.page * pageSize, pagination.total || 0)
          }
          totalItems={searchTerm.trim() ? filteredRows.length : (pagination.total || 0)}
          label="tournée"
        />
      </div>

      <Modal
        isOpen={Boolean(selectedTournee)}
        onClose={() => setSelectedTournee(null)}
        title={selectedTournee ? `Détail — ${selectedTournee.code}` : ""}
        headerIcon="fa-route"
        size="sm"
      >
        {selectedTournee && (
          <DetailView items={buildDetailItems(selectedTournee)} />
        )}
      </Modal>

      <TourneeEditModal
        tourneeId={editId}
        isOpen={editId !== null}
        onClose={() => setEditId(null)}
        onSuccess={onActionSuccess}
      />
    </>
  );
}
