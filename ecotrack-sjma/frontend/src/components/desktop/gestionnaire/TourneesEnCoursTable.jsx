import { useState } from "react";
import Modal from "../../common/Modal";
import DetailView from "../../common/DetailView";
import TourneeEditModal from "./TourneeEditModal";

const defaultTourneesEnCours = [
  {
    id: "T-2026-00042",
    rawId: 42,
    agent: "Marc Lefebvre",
    zone: "Centre-Ville",
    progression: 73,
    statusText: "En cours",
    statusColor: "green",
    statut: "EN_COURS",
    totalEtapes: 15,
    etapesCollectees: 11,
    heureDebutPrevue: null,
  },
  {
    id: "T-2026-00043",
    rawId: 43,
    agent: "Julie Renard",
    zone: "Zone Nord",
    progression: 45,
    statusText: "En cours",
    statusColor: "green",
    statut: "EN_COURS",
    totalEtapes: 20,
    etapesCollectees: 9,
    heureDebutPrevue: null,
  },
  {
    id: "T-2026-00044",
    rawId: 44,
    agent: "Pierre Morel",
    zone: "Zone Sud",
    progression: 92,
    statusText: "Bientôt fini",
    statusColor: "green",
    statut: "EN_COURS",
    totalEtapes: 12,
    etapesCollectees: 11,
    heureDebutPrevue: null,
  },
  {
    id: "T-2026-00045",
    rawId: 45,
    agent: "Luc Bernard",
    zone: "Zone Est",
    progression: 10,
    statusText: "Retard",
    statusColor: "orange",
    statut: "EN_COURS",
    totalEtapes: 18,
    etapesCollectees: 2,
    heureDebutPrevue: null,
  },
];

function buildDetailItems(tournee) {
  return [
    { label: "Identifiant", value: tournee.id },
    { label: "Agent", value: tournee.agent },
    { label: "Zone", value: tournee.zone },
    { label: "Statut", value: tournee.statusText },
    { label: "Statut système", value: tournee.statut },
    { label: "Étapes collectées", value: `${tournee.etapesCollectees} / ${tournee.totalEtapes}` },
    { label: "Progression", value: `${tournee.progression}%` },
    ...(tournee.heureDebutPrevue
      ? [{ label: "Heure de début prévue", value: tournee.heureDebutPrevue }]
      : []),
    { label: "En retard", value: tournee.estEnRetard ? "Oui" : "Non" },
  ];
}

export default function TourneesEnCoursTable({ tourneesEnCours = defaultTourneesEnCours, onActionSuccess }) {
  const [selectedTournee, setSelectedTournee] = useState(null);
  const [editId, setEditId] = useState(null);

  return (
    <>
      <div className="chart-container">
        <h3>Tournées en cours</h3>
        <table className="bo-table">
          <thead>
            <tr>
              <th>Tournée</th>
              <th>Agent</th>
              <th>Zone</th>
              <th>Progression</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tourneesEnCours.map((tournee) => (
              <tr key={tournee.id}>
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
                    onClick={() => setEditId(tournee.rawId)}
                  >
                    <i className="fas fa-pen"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={Boolean(selectedTournee)}
        onClose={() => setSelectedTournee(null)}
        title={selectedTournee ? `Détail — ${selectedTournee.id}` : ""}
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
