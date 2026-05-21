import './PointsCard.css';

export default function PointsCard({ points, niveau, progression, pointsRestants, niveauSuivant }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progression / 100) * circumference;

  return (
    <div className="mobile-points-card">
      <div className="points-info">
        <span className="points-label">Mes Points</span>
        <span className="points-value">{points.toLocaleString()}</span>
        <span className="points-niveau">
          <i className="fas fa-seedling"></i> {niveau}
        </span>
      </div>
      <div className="points-progress">
        <svg width="84" height="84" viewBox="0 0 84 84">
          <circle
            cx="42" cy="42" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="6"
          />
          <circle
            cx="42" cy="42" r={radius}
            fill="none"
            stroke="#fff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 42 42)"
          />
          <text x="42" y="40" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700">
            {progression}%
          </text>
        </svg>
        <span className="points-next">{pointsRestants} pts &rarr; {niveauSuivant}</span>
      </div>
    </div>
  );
}
