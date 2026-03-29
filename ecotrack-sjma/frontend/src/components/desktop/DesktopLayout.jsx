import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_MENU, GESTIONNAIRE_MENU } from './menuData';
import './DesktopLayout.css';

export default function DesktopLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const role = user?.role || user?.role_par_defaut;
  const isAdmin = role === 'ADMIN';
  const menuItems = isAdmin ? ADMIN_MENU : GESTIONNAIRE_MENU;

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const pageTitle = isAdmin ? 'Administration' : 'Tableau de bord';
  const userName = user?.prenom || user?.name || (isAdmin ? 'Admin' : 'Gestionnaire');
  const userLabel = isAdmin ? 'Administrateur' : 'Gestionnaire';
  const notificationsCount = isAdmin ? 5 : 3;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
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
                  className={
                    item.exact 
                      ? location.pathname === item.path ? 'active' : ''
                      : location.pathname.startsWith(item.path) ? 'active' : ''
                  }
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          ))}
        </ul>
      </aside>
      
      <div className={`admin-content ${sidebarOpen ? '' : 'collapsed'}`}>
        <header className="admin-topbar">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Réduire le menu' : 'Ouvrir le menu'}
          >
            <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-bars'}`}></i>
          </button>
          
          <h1>{pageTitle}</h1>
          
          <div className="topbar-right">
            <span className="topbar-date">{currentDate}</span>
            <button className="icon-btn">
              <i className="fas fa-bell"></i>
              {notificationsCount > 0 && (
                <span className="badge-notif">{notificationsCount}</span>
              )}
            </button>
            <div className="user-info">
              <i className={`fas ${isAdmin ? 'fa-user-shield' : 'fa-user-circle'}`}></i>
              <span>{userName} ({userLabel})</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </header>
        
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
