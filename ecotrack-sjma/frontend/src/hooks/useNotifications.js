import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useNotifications(pollInterval = 60000) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data?.count || res.data?.unreadCount || 0);
    } catch {
      // Silently fail - notifications are non-critical
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, pollInterval);
    return () => clearInterval(interval);
  }, [fetchCount, pollInterval]);

  return { unreadCount, refresh: fetchCount };
}
