import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

const menuItems = [
  { path: '/admin', icon: 'fa-tachometer-alt', label: 'Vue d\'ensemble', exact: true },
  { path: '/admin/users', icon: 'fa-users', label: 'Utilisateurs' },
  { path: '/admin/roles', icon: 'fa-user-shield', label: 'Rôles & Permissions' },
  { path: '/admin/conteneurs', icon: 'fa-dumpster', label: 'Conteneurs' },
  { path: '/admin/zones', icon: 'fa-map-marker-alt', label: 'Zones' },
  { path: '/admin/signalements', icon: 'fa-flag', label: 'Signalements' },
  { section: 'Système' },
  { path: '/admin/logs', icon: 'fa-clipboard-list', label: 'Logs d\'audit' },
  { path: '/admin/config', icon: 'fa-cog', label: 'Configuration' },
  { path: '/admin/monitoring', icon: 'fa-heartbeat', label: 'Monitoring' },
  { path: '/admin/alerts', icon: 'fa-bell', label: 'Alertes' },
];

export default function Sidebar({ className = '' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogoClick = () => {
    if (user?.role === 'ADMIN') {
      navigate('/admin');
    } else if (user?.role === 'GESTIONNAIRE') {
      navigate('/gestionnaire');
    } else if (user?.role === 'AGENT') {
      navigate('/agent');
    } else if (user?.role === 'CITOYEN') {
      navigate('/citoyen');
    } else {
      navigate('/');
    }
  };

  return (
    <aside className={`admin-sidebar ${className}`}>
      <div className="sidebar-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
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