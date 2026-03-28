import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const menuItems = [
  { path: '/gestionnaire', icon: 'fa-tachometer-alt', label: 'Tableau de bord' },
  { path: '/gestionnaire/tournees', icon: 'fa-route', label: 'Tournées' },
  { path: '/gestionnaire/suivi', icon: 'fa-satellite-dish', label: 'Suivi temps réel' },
  { path: '/gestionnaire/zones', icon: 'fa-map', label: 'Zones' },
  { path: '/gestionnaire/conteneurs', icon: 'fa-dumpster', label: 'Conteneurs' },
  { path: '/gestionnaire/kpis', icon: 'fa-chart-pie', label: 'KPIs' },
  { section: 'Gestion' },
  { path: '/gestionnaire/signalements', icon: 'fa-flag', label: 'Signalements' },
  { path: '/gestionnaire/maintenance', icon: 'fa-wrench', label: 'Maintenance' },
  { path: '/gestionnaire/rapports', icon: 'fa-file-alt', label: 'Rapports' },
];

export default function Sidebar({ className = '' }) {
  const location = useLocation();

  return (
    <aside className={`admin-sidebar ${className}`}>
      <div className="sidebar-logo">
        <i className="fas fa-leaf"></i> <span>EcoTrack</span>
      </div>
      <ul className="sidebar-menu">
        {menuItems.map((item, index) => (
          item.section ? (
            <div key={index} className="sidebar-section">{item.section}</div>
          ) : (
            <li key={index}>
              <Link 
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <i className={`fas ${item.icon}`}></i>
                <span>{item.label}</span>
              </Link>
            </li>
          )
        ))}
      </ul>
    </aside>
  );
}