import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

const navItems = [
  { path: '/citoyen', icon: 'fa-home', label: 'Accueil', exact: true },
  { path: '/citoyen/carte', icon: 'fa-map', label: 'Carte' },
  { path: '/citoyen/signaler', icon: 'fa-plus', label: 'Signaler', fab: true },
  { path: '/citoyen/defis', icon: 'fa-trophy', label: 'Defis' },
  { path: '/citoyen/profil', icon: 'fa-user', label: 'Profil' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`mobile-nav-item ${item.fab ? 'mobile-nav-fab' : ''} ${isActive(item) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <i className={`fas ${item.icon}`}></i>
          {!item.fab && <span>{item.label}</span>}
        </button>
      ))}
    </nav>
  );
}
