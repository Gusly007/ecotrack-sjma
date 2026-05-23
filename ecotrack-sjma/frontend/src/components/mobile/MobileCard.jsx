import './MobileCard.css';

export default function MobileCard({ children, className = '', onClick, gradient }) {
  return (
    <div
      className={`mobile-card ${gradient ? 'mobile-card-gradient' : ''} ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </div>
  );
}
