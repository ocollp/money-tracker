import { useState, useEffect, useRef } from 'react';

const PROGRESS_CAP = 88;
const PROGRESS_COMPLETE = 100;

/**
 * Simulates smooth progress while `active` is true, then jumps to 100% when inactive.
 */
export function useLoadingProgress(active) {
  const [progress, setProgress] = useState(active ? 0 : PROGRESS_COMPLETE);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!active) {
      setProgress(PROGRESS_COMPLETE);
      return undefined;
    }

    setProgress(0);
    let raf;
    const start = performance.now();

    const tick = (now) => {
      if (!activeRef.current) return;
      const elapsed = now - start;
      const next = Math.min(
        PROGRESS_CAP,
        PROGRESS_CAP * (1 - Math.exp(-elapsed / 1100)),
      );
      setProgress(next);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return Math.round(progress);
}
