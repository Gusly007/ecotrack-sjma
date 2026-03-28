import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Sidebar from './Sidebar';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  
  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const notificationsCount = 5;
  const adminName = user?.prenom || user?.name || 'Admin';

  return (
    <div className="admin-layout">
      <Sidebar className={sidebarOpen ? '' : 'collapsed'} />
      
      <div className={`admin-content ${sidebarOpen ? '' : 'collapsed'}`}>
        <header className="admin-topbar">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Réduire le menu' : 'Ouvrir le menu'}
          >
            <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-bars'}`}></i>
          </button>
          
          <h1>Administration</h1>
          
          <div className="topbar-right">
            <span className="topbar-date">{currentDate}</span>
            <button className="icon-btn">
              <i className="fas fa-bell"></i>
              {notificationsCount > 0 && (
                <span className="badge-notif">{notificationsCount}</span>
              )}
            </button>
            <div className="user-info">
              <i className="fas fa-user-shield"></i>
              <span>{adminName} (Administrateur)</span>
            </div>
            <button className="logout-btn" onClick={logout}>
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