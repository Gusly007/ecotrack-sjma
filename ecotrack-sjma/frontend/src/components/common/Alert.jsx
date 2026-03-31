import './Alert.css';

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  return (
    <div className={`alert-message ${type}`}>
      <i className={`fas ${icons[type] || icons.info}`}></i>
      <span>{message}</span>
      {onClose && (
        <button className="alert-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
}
