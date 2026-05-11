import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Sidebar from './Sidebar';
import './GestionnaireLayout.css';

export default function GestionnaireLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };
  
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const notificationsCount = 3;
  const userName = user?.prenom || user?.name || 'Gestionnaire';

  return (
    <div className="admin-layout">
      <Sidebar className={sidebarOpen ? '' : 'collapsed'} />
      
      <div className={`admin-content ${sidebarOpen ? '' : 'collapsed'}`}>
        <header className="admin-topbar">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-bars'}`}></i>
          </button>
          
          <h1>Tableau de bord</h1>
          
          <div className="topbar-right">
            <span className="topbar-date">{currentDate}</span>
            <button className="icon-btn">
              <i className="fas fa-bell"></i>
              {notificationsCount > 0 && (
                <span className="badge-notif">{notificationsCount}</span>
              )}
            </button>
            <div className="user-info">
              <i className="fas fa-user-circle"></i>
              <span>{userName}</span>
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