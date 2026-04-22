import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

export default function BottomNav({ items }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {items.map((item, index) => {
        const isActive = item.path === '/'
          ? false
          : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        const isFab = item.fab;

        return (
          <button
            key={index}
            className={`bottom-nav-item ${isActive ? 'active' : ''} ${isFab ? 'bottom-nav-fab' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <i className={`fas ${item.icon}`}></i>
            {!isFab && <span>{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
