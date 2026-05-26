import './SignalementItem.css';

// Palette des statuts alignée sur les valeurs DB : OUVERT=bleu,
// EN_COURS=jaune, RESOLU=vert, FERME/REJETE=rouge. Toujours en cohérence
// avec STATUT_TO_UI des pages mobiles.
const statusColorMap = {
  blue: '#2196F3',
  yellow: '#FFC107',
  green: '#4CAF50',
  red: '#f44336',
};

const badgeClassMap = {
  new: 'sig-badge-new',
  progress: 'sig-badge-progress',
  resolved: 'sig-badge-resolved',
  rejected: 'sig-badge-rejected',
};

export default function SignalementItem({ signalement, onClick }) {
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
  };
  return (
    <div className="mobile-sig-item" onClick={onClick} onKeyDown={handleKey} role="button" tabIndex={0}>
      <div
        className="mobile-sig-bar"
        style={{ background: statusColorMap[signalement.statusColor] || '#ccc' }}
      />
      <div className="mobile-sig-info">
        <strong>#{signalement.id}</strong>
        <span>{signalement.type} - {signalement.adresse}</span>
      </div>
      <span className={`mobile-sig-badge ${badgeClassMap[signalement.statusType] || ''}`}>
        {signalement.status}
      </span>
    </div>
  );
}
