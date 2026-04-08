const defaultCollectesParZone = [
  { label: "Zone N", height: "75%" },
  { label: "Zone S", height: "60%" },
  { label: "Centre", height: "90%" },
  { label: "Zone E", height: "45%", color: "#FF9800" },
  { label: "Zone O", height: "30%", color: "#FF9800" },
];

export default function CollectesAujourdhuiPanel({ collectesParZone = defaultCollectesParZone }) {
  return (
    <div className="panel">
      <h3><i className="fas fa-chart-bar" style={{ color: "#4CAF50" }}></i> Collectes aujourd'hui</h3>
      <div className="chart-bars">
        {collectesParZone.map((item) => (
          <div
            key={item.label}
            className="chart-bar"
            style={{ height: item.height, ...(item.color ? { background: item.color } : {}) }}
          >
            <span className="bar-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
