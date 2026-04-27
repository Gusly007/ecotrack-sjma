import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { signalementService } from '../../../services/signalementService';
import Sidebar from './Sidebar';
import './GestionnaireLayout.css';

export default function GestionnaireLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    signalementService.getStats()
      .then((data) => {
        const stats = data?.data || data || {};
        const open = Number(stats.nouveau || stats.open || stats.total_open || 0);
        setNotificationsCount(open);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // logout errors are non-fatal
    }
    navigate('/login', { replace: true });
  };

  const currentDate = useMemo(() => new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }), []);

  const userName = user?.prenom || user?.name || 'Gestionnaire';

  return (
    <div className="admin-layout">
      <Sidebar className={sidebarOpen ? '' : 'collapsed'} />

      <div className={`admin-content ${sidebarOpen ? '' : 'collapsed'}`}>
        <header className="admin-topbar">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <i className={`fas ${sidebarOpen ? 'fa-chevron-left' : 'fa-bars'}`}></i>
          </button>

          <h1>Tableau de bord</h1>

          <div className="topbar-right">
            <span className="topbar-date">{currentDate}</span>
            <button
              className="icon-btn"
              onClick={() => navigate('/gestionnaire/signalements')}
              title="Signalements ouverts"
            >
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
