import { useEffect, useState } from 'react';

/**
 * Lightweight polling tick used by dashboards to refresh API data automatically.
 */
export const useLiveRefresh = (intervalMs = 30000) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        setTick((prev) => prev + 1);
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return tick;
};
