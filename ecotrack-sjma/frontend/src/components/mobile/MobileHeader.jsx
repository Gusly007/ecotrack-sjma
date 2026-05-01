import { useNavigate } from 'react-router-dom';
import './MobileHeader.css';

export default function MobileHeader({ title, subtitle, showBack = false, onBack, rightAction }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const hasSubtitle = Boolean(subtitle);

  return (
    <header className={`mobile-header ${hasSubtitle ? 'mobile-header-tall' : ''}`}>
      <div className="mobile-header-left">
        {showBack && (
          <button className="mobile-back-btn" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
      </div>
      <div className={`mobile-header-titles ${showBack ? '' : 'is-leading'}`}>
        <h1 className="mobile-header-title">{title}</h1>
        {hasSubtitle && <p className="mobile-header-subtitle">{subtitle}</p>}
      </div>
      <div className="mobile-header-right">
        {rightAction || <div style={{ width: 40 }} />}
      </div>
    </header>
  );
}
