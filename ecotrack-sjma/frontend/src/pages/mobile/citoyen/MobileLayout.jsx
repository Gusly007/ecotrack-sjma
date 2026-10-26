import { Outlet } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import BottomNav from '../../../components/mobile/citoyen/BottomNav';
import { useNotificationSound } from '../../../hooks/useNotificationSound';
import { useUnreadCount } from './UnreadCountContext';
import './MobileLayout.css';

export default function MobileLayout() {
  const { play } = useNotificationSound();
  const prevRef = useRef(null);
  const playRef = useRef(play);
  // Compteur partagé : UnreadCountProvider interroge /notifications/
  // unread-count (30 s + événement notifications-refresh). MobileLayout
  // n'émet plus son propre appel — il observe le compteur pour le son.
  const { unreadCount } = useUnreadCount();

  useEffect(() => {
    playRef.current = play;
  });

  useEffect(() => {
    if (prevRef.current !== null && unreadCount > prevRef.current) {
      playRef.current('default');
    }
    prevRef.current = unreadCount;
  }, [unreadCount]);

  return (
    <div className="mobile-layout">
        <div className="citoyen-content">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
