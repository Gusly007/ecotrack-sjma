import './ImpactStats.css';

export default function ImpactStats({ stats }) {
  return (
    <div className="mobile-impact-grid">
      {stats.map((stat) => (
        <div className="mobile-impact-card" key={stat.id}>
          <i className={`fas ${stat.icon}`} style={{ color: stat.color, fontSize: '1.3rem' }}></i>
          <span className="impact-val">{stat.value}</span>
          <span className="impact-lbl">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
