import './StatCard.css';

export default function StatCard({ icon, iconColor = 'green', label, value, change, changeType }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconColor}`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-change ${changeType || ''}`}>{change}</div>
      )}
    </div>
  );
}

export function StatsGrid({ children }) {
  return <div className="stats-grid">{children}</div>;
}
