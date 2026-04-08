const defaultTourneesEnCours = [
  {
    id: "T-2026-00042",
    agent: "Marc Lefebvre",
    zone: "Centre-Ville",
    progression: 73,
    statusText: "En cours",
    statusColor: "green",
  },
  {
    id: "T-2026-00043",
    agent: "Julie Renard",
    zone: "Zone Nord",
    progression: 45,
    statusText: "En cours",
    statusColor: "green",
  },
  {
    id: "T-2026-00044",
    agent: "Pierre Morel",
    zone: "Zone Sud",
    progression: 92,
    statusText: "Bientôt fini",
    statusColor: "green",
  },
  {
    id: "T-2026-00045",
    agent: "Luc Bernard",
    zone: "Zone Est",
    progression: 10,
    statusText: "Retard",
    statusColor: "orange",
  },
];

export default function TourneesEnCoursTable({ tourneesEnCours = defaultTourneesEnCours }) {
  return (
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
              <td><span className={`status-dot ${tournee.statusColor}`}></span>{tournee.statusText}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
