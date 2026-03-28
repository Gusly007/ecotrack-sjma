import './StatCard.css';

const iconMap = {
  'fa-check-circle': '🟢',
  'fa-users': '👥',
  'fa-database': '💾',
  'fa-tachometer-alt': '⚡',
  'fa-server': '🖥️',
  'fa-network-wired': '🌐',
  'fa-memory': '🧠',
  'fa-microchip': '🔲',
  'fa-hdd': '💿',
  'fa-exclamation-triangle': '⚠️',
  'fa-heartbeat': '💓',
  'fa-bell': '🔔',
  'fa-shield-alt': '🛡️',
  'fa-tools': '🔧',
  'fa-clock': '⏰',
  'fa-archive': '📦',
  'fa-lock': '🔒',
  'fa-leaf': '🌿',
};

export function StatIcon({ icon, color }) {
  return (
    <div className="stat-icon" style={color ? { background: color + '20', color } : undefined}>
      <i className={`fas ${icon}`}></i>
    </div>
  );
}

export default function StatCard({ icon, iconColor, label, value, change, changeType }) {
  return (
    <div className="stat-card">
      <StatIcon icon={icon} color={iconColor} />
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-change ${changeType || ''}`}>{change}</div>
    </div>
  );
}