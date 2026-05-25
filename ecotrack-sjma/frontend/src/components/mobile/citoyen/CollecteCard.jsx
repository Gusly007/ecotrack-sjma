import './CollecteCard.css';

export default function CollecteCard({ collecte }) {
  return (
    <div className="mobile-collecte-card">
      <div className="collecte-icon-wrap" style={{ background: collecte.iconBg }}>
        <i className={`fas ${collecte.icon}`} style={{ color: collecte.iconColor }}></i>
      </div>
      <div className="collecte-info">
        <strong>{collecte.type}</strong>
        <span>{collecte.jour} &mdash; {collecte.horaire}</span>
      </div>
      <span
        className="collecte-countdown"
        style={{ color: collecte.countdownColor, background: collecte.countdownColor + '18' }}
      >
        {collecte.countdown}
      </span>
    </div>
  );
}
