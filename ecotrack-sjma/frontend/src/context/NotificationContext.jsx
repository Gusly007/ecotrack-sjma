import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({ unreadCount: 0, refresh: () => {} });

export function useNotifications() {
  return useContext(NotificationContext);
}

// ─── Audio ────────────────────────────────────────────────────────────────────
// Uses an <audio> element with an inline WAV (more reliable than AudioContext
// across Chrome's autoplay policy, background tabs, and mobile Safari).
let _chimeEl = null;
let _pendingChime = false;

function _buildChimeWav() {
  const rate = 22050;
  const dur  = 0.38;
  const n    = Math.floor(rate * dur);
  const buf  = new ArrayBuffer(44 + n * 2);
  const v    = new DataView(buf);
  const str  = (off, s) => { for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true);
  str(8, 'WAVEfmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const t   = i / rate;
    const env = Math.min(1, t * 40) * Math.exp(-t * 9);
    const sig = (Math.sin(2 * Math.PI * 880 * t) * 0.55 + Math.sin(2 * Math.PI * 1100 * t) * 0.45) * env;
    v.setInt16(44 + i * 2, sig * 28000, true);
  }
  const bytes  = new Uint8Array(buf);
  let binary   = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
}

function _getChime() {
  if (!_chimeEl && typeof Audio !== 'undefined') {
    try { _chimeEl = new Audio(_buildChimeWav()); _chimeEl.volume = 0.6; } catch {}
  }
  return _chimeEl;
}

// On first user gesture: create the element AND play+pause at volume 0
// so Chrome marks this audio element as "user-activated" for future calls.
function _prewarmChime() {
  const el = _getChime();
  if (!el || el.dataset.unlocked) return;
  el.volume = 0;
  el.play().then(() => {
    el.pause();
    el.currentTime = 0;
    el.volume = 0.6;
    el.dataset.unlocked = '1';
  }).catch(() => {
    el.volume = 0.6;
  });
}
function _onGesture() {
  _prewarmChime();
  if (_pendingChime) {
    _pendingChime = false;
    setTimeout(playChime, 80);
  }
}
if (typeof window !== 'undefined') {
  ['click', 'touchstart', 'keydown', 'pointerdown'].forEach(e =>
    window.addEventListener(e, _onGesture, { once: false, passive: true })
  );
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && _pendingChime) {
      _pendingChime = false;
      setTimeout(playChime, 80);
    }
  });
}

function playChime() {
  if (document.visibilityState === 'hidden') { _pendingChime = true; return; }
  const el = _getChime();
  if (!el) return;
  el.currentTime = 0;
  el.play().catch(() => { _pendingChime = true; });
}

// ─── Baseline (localStorage so it survives tab close/refresh) ─────────────────
function baselineKey(userId) { return `notif_baseline_${userId}`; }
function readBaseline(userId) {
  try { return Number(localStorage.getItem(baselineKey(userId)) ?? 'NaN'); } catch { return NaN; }
}
function writeBaseline(userId, n) {
  try { localStorage.setItem(baselineKey(userId), String(n)); } catch {}
}

// URL WebSocket : passe par la gateway (port 3000) → proxié vers le service notification.
// Fallback sur localhost:3016 si la gateway n'est pas disponible.
const WS_URL = import.meta.env.VITE_NOTIFICATION_WS_URL
  || import.meta.env.VITE_API_URL
  || 'http://localhost:3000';

// ─── Provider ─────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const baselineRef  = useRef(NaN);
  const intervalRef  = useRef(null);
  const socketRef    = useRef(null);

  const userId = user?.id_utilisateur || user?.id || null;

  // ── Fetch HTTP (polling 15s comme avant + fallback si WS absent) ─────────────
  // exact=true → toujours écraser (initial load, mark-as-read, refresh forcé)
  // exact=false (défaut, timer) → Math.max quand WS alive pour éviter que le cache
  //   périmé n'écrase le badge déjà incrémenté par le WS
  const fetchCount = useCallback(async ({ exact = false } = {}) => {
    if (!userId) return;
    try {
      const res = await api.get('/api/V1/notifications/unread/count');
      const count = Number(
        res.data?.unread_count ?? res.data?.count ?? res.data?.unreadCount ?? 0
      );

      const wsAlive = socketRef.current?.connected;
      if (exact || !wsAlive) {
        setUnreadCount(count);
        const baseline = baselineRef.current;
        if (!wsAlive && !isNaN(baseline) && count > baseline) {
          playChime();
        }
      } else {
        // WS vivant : ne pas réduire le badge (cache potentiellement périmé)
        setUnreadCount(prev => count > prev ? count : prev);
      }

      baselineRef.current = count;
      writeBaseline(userId, count);
    } catch {}
  }, [userId]);

  // ── WebSocket temps réel ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(WS_URL, {
      path: '/ws/notifications',
      auth: (cb) => cb({ token: localStorage.getItem('token') }),
      transports: ['polling', 'websocket'],
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.debug('[WS-Notif] connecté ✓');
    });

    socket.on('notification:new', (data) => {
      console.debug('[WS-Notif] notification:new reçue', data);
      setUnreadCount(prev => {
        const next = prev + 1;
        baselineRef.current = next;
        writeBaseline(userId, next);
        return next;
      });
      playChime();
      window.dispatchEvent(new Event('notifications-refresh'));
    });

    socket.on('connect_error', (err) => {
      console.debug('[WS-Notif] connexion échouée:', err.message, '— poll actif');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  // ── Polling HTTP 15s (fallback fiable) ───────────────────────────────────────
  useEffect(() => {
    if (!userId) { setUnreadCount(0); return; }

    baselineRef.current = readBaseline(userId);

    fetchCount({ exact: true }); // chargement initial : compte exact
    intervalRef.current = setInterval(fetchCount, 15000); // timer : max si WS vivant

    const onRefresh = () => fetchCount({ exact: true }); // mark-as-read : exact
    window.addEventListener('notifications-refresh', onRefresh);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('notifications-refresh', onRefresh);
    };
  }, [userId, fetchCount]);

  const refresh = useCallback(() => fetchCount({ exact: true }), [fetchCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}
