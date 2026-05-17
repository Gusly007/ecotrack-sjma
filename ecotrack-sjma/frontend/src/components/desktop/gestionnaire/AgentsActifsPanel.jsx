import { useMemo, useState } from "react";
import { Pagination } from "../../common";

function normalizeAgent(tournee) {
  const total = Number(tournee.total_etapes || 0);
  const done = Number(tournee.etapes_collectees || 0);
  const progression = total > 0 ? Math.round((done / total) * 100) : 0;
  const estEnRetard = tournee.est_en_retard ?? false;

  return {
    id_tournee: tournee.id_tournee,
    code: tournee.code || `T-${tournee.id_tournee}`,
    agent: `${tournee.agent_prenom || ""} ${tournee.agent_nom || ""}`.trim() || "Agent non assigné",
    zone: tournee.zone_nom || tournee.zone_code || "Zone inconnue",
    totalEtapes: total,
    etapesCollectees: done,
    progression,
    estEnRetard,
  };
}

export default function AgentsActifsPanel({ tournees = [], onFocusTournee, pageSize = 6 }) {
  const [page, setPage] = useState(1);

  const agents = useMemo(() => tournees.map(normalizeAgent), [tournees]);

  const totalPages = Math.max(1, Math.ceil(agents.length / pageSize));
  const sliced = agents.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="chart-container">
      <h3>Agents actifs</h3>

      {agents.length === 0 ? (
        <div className="empty-state">Aucun agent actif pour le moment.</div>
      ) : (
        <>
          <table className="bo-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Tournée</th>
                <th>Zone</th>
                <th>Progression</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sliced.map((agent) => (
                <tr key={agent.id_tournee}>
                  <td>{agent.agent}</td>
                  <td>{agent.code}</td>
                  <td>{agent.zone}</td>
                  <td>
                    <div className="agents-progress-cell">
                      <div
                        className="progress-bar"
                        style={{ width: "100px", display: "inline-block", verticalAlign: "middle" }}
                      >
                        <div
                          className="progress-fill"
                          style={{ width: `${agent.progression}%` }}
                        />
                      </div>
                      <span className="agents-progress-text">
                        {agent.etapesCollectees}/{agent.totalEtapes}
                      </span>
                    </div>
                  </td>
                  <td>
                    {agent.estEnRetard ? (
                      <span className="status-pill orange">
                        <span className="status-dot" />
                        En retard
                      </span>
                    ) : (
                      <span className="status-pill green">
                        <span className="status-dot" />
                        En cours
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-map-focus"
                      title="Voir sur la carte"
                      onClick={() => onFocusTournee?.(agent.id_tournee)}
                    >
                      <i className="fas fa-map-marker-alt" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            showingFrom={(page - 1) * pageSize + 1}
            showingTo={Math.min(page * pageSize, agents.length)}
            totalItems={agents.length}
            label="agent actif"
          />
        </>
      )}
    </div>
  );
}
