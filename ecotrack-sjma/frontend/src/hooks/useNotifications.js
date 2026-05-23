import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

let _audioCtx = null;

function getCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}

// Unlock AudioContext on first user gesture (Chrome/Firefox autoplay policy)
function unlockOnGesture() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* ignore */ }
}
if (typeof window !== 'undefined') {
  ['click', 'touchstart', 'keydown', 'scroll'].forEach(e =>
    window.addEventListener(e, unlockOnGesture, { once: false, passive: true })
  );
}

function playChime() {
  try {
    const ctx = getCtx();

    const doPlay = () => {
      const note = (freq, t0, dur) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now + t0);
        gain.gain.linearRampToValueAtTime(0.28, now + t0 + 0.01);
        gain.gain.linearRampToValueAtTime(0, now + t0 + dur);
        osc.start(now + t0);
        osc.stop(now + t0 + dur + 0.05);
      };
      note(880,  0,    0.14);
      note(1100, 0.16, 0.20);
    };

    if (ctx.state === 'running') {
      doPlay();
    } else {
      ctx.resume().then(doPlay).catch(() => {});
    }
  } catch { /* Audio not supported */ }
}

const BASELINE_KEY = 'notif_baseline';

function readBaseline() {
  try { return Number(sessionStorage.getItem(BASELINE_KEY) ?? 'NaN'); } catch { return NaN; }
}
function writeBaseline(n) {
  try { sessionStorage.setItem(BASELINE_KEY, String(n)); } catch { /* ignore */ }
}

export function useNotifications(pollInterval = 15000) {
  const [unreadCount, setUnreadCount] = useState(0);
  const baselineRef = useRef(readBaseline());

  const fetchCount = useCallback(async () => {
    try {
      const res   = await api.get('/api/notifications/unread/count');
      const count = Number(
        res.data?.unread_count ?? res.data?.count ?? res.data?.unreadCount ?? 0
      );

      setUnreadCount(count);

      const baseline = baselineRef.current;
      if (isNaN(baseline)) {
        baselineRef.current = count;
        writeBaseline(count);
      } else if (count > baseline) {
        playChime();
        baselineRef.current = count;
        writeBaseline(count);
      } else {
        baselineRef.current = count;
        writeBaseline(count);
      }
    } catch { /* non-critical */ }
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
