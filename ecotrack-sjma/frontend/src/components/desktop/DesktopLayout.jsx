import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks';
import api from '../../services/api';
import { ADMIN_MENU, GESTIONNAIRE_MENU } from './menuData';
import './DesktopLayout.css';

export default function DesktopLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const { unreadCount: wsUnreadCount } = useNotifications();
  const role = user?.role || user?.role_par_defaut;
  const isAdmin = role === 'ADMIN';
  const menuItems = isAdmin ? ADMIN_MENU : GESTIONNAIRE_MENU;

  const gestionnaireTitleByPath = {
    '/gestionnaire': 'Tableau de bord',
    '/gestionnaire/tournees': 'Tournées',
    '/gestionnaire/suivi': 'Suivi temps réel',
    '/gestionnaire/zones': 'Zones',
    '/gestionnaire/conteneurs': 'Conteneurs',
    '/gestionnaire/kpis': 'KPIs',
    '/gestionnaire/signalements': 'Signalements',
    '/gestionnaire/maintenance': 'Maintenance',
    '/gestionnaire/rapports': 'Rapports',
    '/gestionnaire/notifications': 'Notifications',
    '/admin/notifications': 'Notifications',
  };

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const pageTitle = isAdmin ? 'Administration' : (gestionnaireTitleByPath[location.pathname] || 'Tableau de bord');
  const userName = user?.prenom || user?.name || (isAdmin ? 'Admin' : 'Gestionnaire');
  const userLabel = isAdmin ? 'Administrateur' : 'Gestionnaire';

  const notificationConfig = useMemo(() => ({
    listPath: isAdmin ? '/api/admin/notifications' : '/api/notifications/list',
    countPath: isAdmin ? '/api/admin/notifications/stats' : '/api/notifications/unread/count',
    markReadPath: (id) => isAdmin ? `/api/admin/notifications/${id}/read` : `/api/notifications/${id}/read`,
    markAllReadPath: isAdmin ? '/api/admin/notifications/read-all' : '/api/notifications/read-all',
    itemLabel: isAdmin ? 'Notifications admin' : 'Notifications gestionnaire',
    emptyLabel: isAdmin ? 'Aucune notification admin' : 'Aucune notification gestionnaire',
    fallbackRoute: isAdmin ? '/admin/alerts' : '/gestionnaire/signalements'
  }), [isAdmin]);

  const loadNotifications = async (signal = { active: true }) => {
    setNotificationsLoading(true);

    try {
      const [listResponse, countResponse] = await Promise.all([
        api.get(notificationConfig.listPath, { params: { page: 1, limit: 100 } }),
        api.get(notificationConfig.countPath),
      ]);

      const listPayload = listResponse?.data?.data ?? listResponse?.data ?? [];
      const listItems = Array.isArray(listPayload)
        ? listPayload
        : Array.isArray(listPayload?.data)
          ? listPayload.data
          : [];

      const countPayload = countResponse?.data ?? {};
      const countValue = isAdmin
        ? Number(countPayload?.totals?.non_lues ?? countPayload?.non_lues ?? countPayload?.unread_count ?? 0)
        : Number(countPayload?.unread_count ?? countPayload?.count ?? 0);

      if (!signal.active) return;
      setNotifications(listItems);
      setNotificationsCount(Number.isFinite(countValue) ? countValue : 0);
    } catch (error) {
      if (!signal.active) return;
      setNotifications([]);
      setNotificationsCount(0);
      console.warn('Impossible de charger les notifications', error);
    } finally {
      if (signal.active) {
        setNotificationsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setNotificationsCount(0);
      return;
    }

    const signal = { active: true };
    loadNotifications(signal);

    const onRefresh = () => loadNotifications({ active: true });
    window.addEventListener('notifications-refresh', onRefresh);

    return () => {
      signal.active = false;
      window.removeEventListener('notifications-refresh', onRefresh);
    };
  }, [user, isAdmin, notificationConfig.countPath, notificationConfig.listPath]);

  const formatNotificationPreview = (notification) => {
    if (!notification) return '';
    return notification.titre || notification.corps || 'Nouvelle notification';
  };

  const formatNotificationMeta = (notification) => {
    const pieces = [];
    if (notification?.priorite !== undefined && notification?.priorite !== null) {
      pieces.push(`Priorité ${notification.priorite}`);
    }
    if (notification?.categorie) {
      pieces.push(notification.categorie);
    }
    if (notification?.date_creation) {
      pieces.push(new Date(notification.date_creation).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }));
    }
    return pieces.join(' • ');
  };

  const handleNotificationClick = () => {
    setNotificationsOpen((prev) => !prev);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch(notificationConfig.markAllReadPath);
      await loadNotifications({ active: true });
    } catch (error) {
      console.warn('Impossible de marquer toutes les notifications comme lues', error);
    }
  };

  const handleNotificationItemClick = async (notification) => {
    if (!notification?.id_notification) {
      navigateToNotifications();
      return;
    }

    try {
      await api.patch(notificationConfig.markReadPath(notification.id_notification));
      await loadNotifications({ active: true });
    } catch (error) {
      console.warn('Impossible de marquer la notification comme lue', error);
      navigateToNotifications();
    }
  };

  const notificationsPagePath = isAdmin ? '/admin/notifications' : '/gestionnaire/notifications';

  const navigateToNotifications = () => {
    setNotificationsOpen(false);
    navigate(notificationsPagePath);
  };

  const visibleNotifications = notifications.filter((notification) => {
    if (notification.est_lu) return false;
    if (notification.type && localStorage.getItem(`notif_${notification.type}`) === 'false') return false;
    return true;
  });

  const filteredCount = visibleNotifications.length;

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
            <div className="notifications-wrapper">
              <button
                className="icon-btn"
                onClick={handleNotificationClick}
                title={notificationConfig.itemLabel}
                aria-label={notificationConfig.itemLabel}
              >
                <i className="fas fa-bell"></i>
                {wsUnreadCount > 0 && (
                  <span className="badge-notif">{wsUnreadCount}</span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notifications-popover">
                  <div className="notifications-header">
                    <div>
                      <strong>{notificationConfig.itemLabel}</strong>
                      <span>{filteredCount} non lue{filteredCount > 1 ? 's' : ''}</span>
                    </div>
                    <button type="button" className="notifications-see-all" onClick={navigateToNotifications}>
                      Voir tout
                    </button>
                  </div>

                  <div className="notifications-list">
                    {notificationsLoading ? (
                      <div className="notifications-empty">Chargement...</div>
                    ) : visibleNotifications.length === 0 ? (
                      <div className="notifications-empty">{notificationConfig.emptyLabel}</div>
                    ) : (
                      visibleNotifications.map((notification) => (
                        <button
                          key={notification.id_notification || `${notification.type}-${notification.date_creation}`}
                          type="button"
                          className={`notification-item ${notification.est_lu ? 'read' : 'unread'}`}
                          onClick={() => handleNotificationItemClick(notification)}
                        >
                          <span className={`notification-dot ${notification.est_lu ? 'read' : 'unread'}`}></span>
                          <div className="notification-item-content">
                            <strong>{formatNotificationPreview(notification)}</strong>
                            <span>{notification.corps || 'Nouvelle alerte'}</span>
                            {formatNotificationMeta(notification) && (
                              <small>{formatNotificationMeta(notification)}</small>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="notifications-footer">
                    <button type="button" className="notifications-view-all" onClick={navigateToNotifications}>
                      <i className="fas fa-list"></i> Voir toutes les notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="user-info" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
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
