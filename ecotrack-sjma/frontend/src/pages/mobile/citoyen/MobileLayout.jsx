import { Outlet } from 'react-router-dom';
import { useEffect, useRef, useCallback } from 'react';
import BottomNav from '../../../components/mobile/citoyen/BottomNav';
import { useNotificationSound } from '../../../hooks/useNotificationSound';
import { citoyenService } from '../../../services/citoyenService';
import './MobileLayout.css';

export default function MobileLayout() {
  const { play } = useNotificationSound();
  const prevRef = useRef(null);
  const playRef = useRef(play);
  playRef.current = play;

  const poll = useCallback(async () => {
    try {
      const data = await citoyenService.getUnreadCount();
      const count = data?.count || data?.unreadCount || 0;
      if (prevRef.current !== null && count > prevRef.current) {
        playRef.current('default');
      }
      prevRef.current = count;
    } catch {}
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [poll]);

  return (
    <div className="mobile-layout">
      <div className="mobile-content">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
