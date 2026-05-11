const Y_TICKS = [100, 75, 50, 25, 0];

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
      <div className="chart-wrapper">

        {/* Axe Y */}
        <div className="chart-y-axis">
          {Y_TICKS.map(tick => (
            <span key={tick} className="y-tick-label" style={{ bottom: `${tick}%` }}>
              {tick}%
            </span>
          ))}
        </div>

        {/* Zone plot + labels X */}
        <div className="chart-area">
          <div className="chart-plot">
            {Y_TICKS.map(tick => (
              <div key={tick} className="grid-line" style={{ bottom: `${tick}%` }} />
            ))}
            <div className="chart-bars">
              {collectesParZone.map((item) => (
                <div key={item.label} className="bar-col">
                  <span className="bar-pct">{item.height}</span>
                  <div
                    className="chart-bar"
                    style={{ height: item.height, ...(item.color ? { background: item.color } : {}) }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Labels zone sous l'axe X */}
          <div className="chart-x-labels">
            {collectesParZone.map((item) => (
              <span key={item.label} className="bar-label">{item.label}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
