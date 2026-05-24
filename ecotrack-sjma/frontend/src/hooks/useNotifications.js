import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export function useNotifications(pollInterval = 60000, onNew) {
  const [unreadCount, setUnreadCount] = useState(0);
  const prevRef = useRef(null);
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      const count = res.data?.count || res.data?.unreadCount || 0;
      setUnreadCount(count);
      if (prevRef.current !== null && count > prevRef.current) {
        onNewRef.current?.();
      }
      prevRef.current = count;
    } catch {
      // Silently fail - notifications are non-critical
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, pollInterval);
    window.addEventListener('notifications-refresh', fetchCount);
    return () => {
      clearInterval(id);
      window.removeEventListener('notifications-refresh', fetchCount);
    };
  }, [fetchCount, pollInterval]);

  return { unreadCount, refresh: fetchCount };
}
