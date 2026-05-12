import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Gère un auto-refresh périodique avec protection contre les exécutions concurrentes.
 * Utilise un ref pour la fonction afin d'éviter de recréer l'intervalle à chaque render.
 *
 * @param {() => Promise<void>} fn  - Callback async à appeler à chaque tick
 * @param {number} intervalMs       - Intervalle en ms (défaut 60 000)
 * @returns {[boolean, Function]}   - [enabled, setEnabled]
 */
export function useAutoRefresh(fn, intervalMs = 60000) {
  const [enabled, setEnabled] = useState(true);
  const fnRef = useRef(fn);
  const busyRef = useRef(false);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    const id = setInterval(async () => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        await fnRef.current();
      } finally {
        busyRef.current = false;
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [enabled, intervalMs]);

  const toggle = useCallback(() => setEnabled((prev) => !prev), []);

  return [enabled, toggle];
}
