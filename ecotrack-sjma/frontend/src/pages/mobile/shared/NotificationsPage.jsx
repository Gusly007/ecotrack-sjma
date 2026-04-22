import { useState, useEffect } from 'react';
import MobileLayout from '../../../components/mobile/MobileLayout';
import MobileListItem from '../../../components/mobile/MobileListItem';
import EmptyState from '../../../components/mobile/EmptyState';
import api from '../../../services/api';
import './NotificationsPage.css';

const NOTIF_ICONS = {
  ALERTE: { icon: 'fa-exclamation-circle', color: '#f44336', bg: '#fef0f0' },
  TOURNEE: { icon: 'fa-route', color: '#2196F3', bg: '#e3f2fd' },
  BADGE: { icon: 'fa-medal', color: '#FF9800', bg: '#fff3e0' },
  SYSTEME: { icon: 'fa-cog', color: '#607d8b', bg: '#eceff1' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data?.data || res.data || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id_notification === id ? { ...n, est_lu: true } : n));
    } catch { /* ignore */ }
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id_notification !== id));
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <MobileLayout title="Notifications" showBack>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#4CAF50' }}></i>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Notifications" showBack>
      {notifications.length === 0 ? (
        <EmptyState icon="fa-bell-slash" title="Aucune notification" message="Vous etes a jour !" />
      ) : (
        notifications.map((notif) => {
          const style = NOTIF_ICONS[notif.type] || NOTIF_ICONS.SYSTEME;
          return (
            <div key={notif.id_notification} className={`notif-item ${!notif.est_lu ? 'notif-unread' : ''}`}>
              <MobileListItem
                icon={style.icon}
                iconColor={style.color}
                iconBg={style.bg}
                title={notif.titre}
                subtitle={notif.corps}
                onClick={() => markAsRead(notif.id_notification)}
                right={
                  <button className="notif-delete-btn" onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id_notification); }}>
                    <i className="fas fa-trash-alt"></i>
                  </button>
                }
              />
            </div>
          );
        })
      )}
    </MobileLayout>
  );
}
