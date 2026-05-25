import { useRef, useCallback, useEffect } from 'react';

/**
 * Web Audio API notification sound — no audio file required.
 * Plays a pleasant two-tone chime when called.
 *
 * Variants:
 *   'default'  — soft ascending ding (citoyen / agent)
 *   'alert'    — slightly more prominent chime (gestionnaire / admin signalement)
 *
 * Handles browser autoplay policy:
 * – AudioContext is created lazily on first user interaction.
 * – Subsequent play() calls work immediately.
 */
export function useNotificationSound() {
  const ctxRef = useRef(null);

  // Unlock AudioContext on first user gesture (browser autoplay policy).
  useEffect(() => {
    const unlock = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!ctxRef.current) {
          ctxRef.current = new AudioCtx();
        } else if (ctxRef.current.state === 'suspended') {
          ctxRef.current.resume();
        }
      } catch { /* unsupported */ }
    };
    document.addEventListener('click',      unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('keydown',    unlock, { once: true });
    return () => {
      document.removeEventListener('click',      unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('keydown',    unlock);
    };
  }, []);

  const play = useCallback(async (variant = 'default') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        ctxRef.current = new AudioCtx();
      }
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const now = ctx.currentTime;

      // Two-tone sequences per variant
      const sequences = {
        default: [
          { freq: 880,  start: 0,    dur: 0.12, gain: 0.22 },
          { freq: 1100, start: 0.14, dur: 0.15, gain: 0.18 },
        ],
        alert: [
          { freq: 660,  start: 0,    dur: 0.15, gain: 0.30 },
          { freq: 880,  start: 0.18, dur: 0.20, gain: 0.25 },
        ],
      };

      const tones = sequences[variant] || sequences.default;

      tones.forEach(({ freq, start, dur, gain: gainVal }) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(gainVal, now + start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.start(now + start);
        osc.stop(now + start + dur + 0.01);
      });
    } catch {
      // AudioContext not supported or permission denied — silent fail
    }
  }, []);

  return { play };
}
