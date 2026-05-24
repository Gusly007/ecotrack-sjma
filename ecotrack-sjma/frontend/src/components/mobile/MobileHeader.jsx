import { useNavigate } from 'react-router-dom';
import './MobileHeader.css';

export default function MobileHeader({ title, showBack = false, onBack, rightAction, greeting, greetingDate }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  if (greeting) {
    return (
      <header className="mobile-header mobile-header-greeting">
        <div className="mobile-header-greeting-left">
          <span className="header-greeting-text">{greeting}</span>
          {greetingDate && <span className="header-greeting-date">{greetingDate}</span>}
        </div>
        <div className="mobile-header-right">
          {rightAction || <div style={{ width: 40 }} />}
        </div>
      </header>
    );
  }

  return (
    <header className="mobile-header">
      <div className="mobile-header-left">
        {showBack && (
          <button className="mobile-back-btn" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
      </div>
      <h1 className="mobile-header-title">{title}</h1>
      <div className="mobile-header-right">
        {rightAction || <div style={{ width: 40 }} />}
      </div>
    </header>
  );
}
