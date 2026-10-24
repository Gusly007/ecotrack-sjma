import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { citoyenService } from '../../../services/citoyenService';

// Source unique du compteur de notifications non lues pour l'app citoyen
// mobile. Avant : CitoyenHome déduisait le compteur de la liste complète
// /notifications pendant que MobileLayout interrogeait /notifications/
// unread-count — deux endpoints pour la même donnée à chaque chargement.
// Désormais un seul endpoint (unread-count), interrogé ici : au montage,
// toutes les 30 s, et sur l'événement 'notifications-refresh' (émis après
// un mark-as-read). Le garde in-flight évite le double appel du double
// montage StrictMode en dev.
const UnreadCountContext = createContext({ unreadCount: 0, refresh: () => {} });

// eslint-disable-next-line react-refresh/only-export-components
export const useUnreadCount = () => useContext(UnreadCountContext);

export function UnreadCountProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const inFlightRef = useRef(null);

  const fetchCount = useCallback(async () => {
    if (inFlightRef.current) return inFlightRef.current;
    inFlightRef.current = citoyenService
      .getUnreadCount()
      .then((data) => {
        const count = Number(data?.unread_count ?? data?.count ?? data?.unreadCount ?? 0);
        if (Number.isFinite(count)) setUnreadCount(count);
      })
      .catch(() => {
        // Non bloquant : le polling retentera.
      })
      .finally(() => {
        inFlightRef.current = null;
      });
    return inFlightRef.current;
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    const onRefresh = () => fetchCount();
    window.addEventListener('notifications-refresh', onRefresh);
    return () => {
      clearInterval(id);
      window.removeEventListener('notifications-refresh', onRefresh);
    };
  }, [fetchCount]);

  return (
    <UnreadCountContext.Provider value={{ unreadCount, refresh: fetchCount }}>
      {children}
    </UnreadCountContext.Provider>
  );
}
