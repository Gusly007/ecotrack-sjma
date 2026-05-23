import './ProgressBar.css';

export default function ProgressBar({ value = 0, max = 100, label, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = color || (pct >= 80 ? '#f44336' : pct >= 50 ? '#FF9800' : '#4CAF50');

  return (
    <div className="mobile-progress">
      <div className="mobile-progress-bar">
        <div
          className="mobile-progress-fill"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      {label && <span className="mobile-progress-label">{label}</span>}
    </div>
  );
}
