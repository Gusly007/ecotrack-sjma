const defaultAlertesUrgentes = [
  {
    level: "critical",
    icon: "fa-fill-drip",
    color: "#f44336",
    text: "Zone Nord : 3 conteneurs débordants",
  },
  {
    level: "warning",
    icon: "fa-clock",
    color: "#FF9800",
    text: "Agent AGT-007 : Retard de 45 min",
  },
  {
    level: "warning",
    icon: "fa-truck",
    color: "#FF9800",
    text: "Camion CAM-012 : Maintenance requise",
  },
  {
    level: "info",
    icon: "fa-info-circle",
    color: "#2196F3",
    text: "12 signalements citoyens en attente",
  },
  {
    level: "info",
    icon: "fa-microchip",
    color: "#2196F3",
    text: "Capteur CAPT-045 : batterie faible (15%)",
  },
];

export default function AlertesUrgentesPanel({ alertes = defaultAlertesUrgentes }) {
  return (
    <div className="panel">
      <h3><i className="fas fa-exclamation-circle" style={{ color: "#f44336" }}></i> Alertes urgentes</h3>
      {alertes.map((alerte) => (
        <div key={alerte.text} className={`alert-item ${alerte.level}`}>
          <i className={`fas ${alerte.icon}`} style={{ color: alerte.color }}></i>
          {alerte.text}
        </div>
      ))}
    </div>
  );
}
