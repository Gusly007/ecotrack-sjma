import './EmptyState.css';

export default function EmptyState({ icon = 'fa-inbox', title, message, action, onAction }) {
  return (
    <div className="mobile-empty-state">
      <div className="mobile-empty-icon">
        <i className={`fas ${icon}`}></i>
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && onAction && (
        <button className="mobile-empty-btn" onClick={onAction}>{action}</button>
      )}
    </div>
  );
}
