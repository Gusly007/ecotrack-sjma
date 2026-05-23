import './MobileListItem.css';

export default function MobileListItem({ icon, iconColor, iconBg, number, title, subtitle, right, onClick }) {
  return (
    <div className="mobile-list-item" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      {number !== undefined && (
        <div className="mobile-list-number" style={iconBg ? { background: iconBg, color: '#fff' } : undefined}>
          {number}
        </div>
      )}
      {icon && !number && (
        <div className="mobile-list-icon" style={{ color: iconColor || '#4CAF50', background: iconBg || '#e8f5e9' }}>
          <i className={`fas ${icon}`}></i>
        </div>
      )}
      <div className="mobile-list-info">
        <strong>{title}</strong>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="mobile-list-right">
        {right || <i className="fas fa-chevron-right" style={{ color: '#ccc', fontSize: '0.8rem' }}></i>}
      </div>
    </div>
  );
}
