import './Modal.css';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showFooter = true,
  showCloseButton = true,
  footer,
  headerIcon,
  headerColor
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content modal-${size}`} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header" style={headerColor ? { borderColor: headerColor } : {}}>
          <h2>
            {headerIcon && <i className={`fas ${headerIcon}`} style={{ color: headerColor }}></i>}
            {title}
          </h2>
          {showCloseButton && (
            <button className="modal-close" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <div className="modal-body">
          {children}
        </div>
        {showFooter && (
          <div className="modal-footer">
            {footer || (
              <>
                <button className="btn-secondary" onClick={onClose}>Fermer</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ModalConfirmation({ 
  isOpen, 
  onClose, 
  title = 'Confirmer', 
  message, 
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  danger = false,
  closeAfterConfirm = true
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm?.();
    if (closeAfterConfirm !== false) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
        <div className={`modal-header ${danger ? 'danger' : ''}`}>
          <h2>
            <i className={`fas ${danger ? 'fa-exclamation-triangle' : 'fa-question-circle'}`}></i>
            {title}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>{cancelText}</button>
          <button 
            className={`${danger ? 'btn-danger' : 'btn-primary'} btn-equal`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
