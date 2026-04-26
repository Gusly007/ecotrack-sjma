import './DetailView.css';

export default function DetailView({ items, children }) {
  return (
    <div className="detail-list">
      {items?.map((item, idx) => (
        <div key={idx} className="detail-row">
          <span className="detail-label">{item.label}</span>
          <span className="detail-value">{item.value}</span>
        </div>
      ))}
      {children}
    </div>
  );
}

export function DetailSection({ title, icon, children }) {
  return (
    <div className="detail-section">
      {title && (
        <h4>
          {icon && <i className={`fas ${icon}`}></i>}
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}
