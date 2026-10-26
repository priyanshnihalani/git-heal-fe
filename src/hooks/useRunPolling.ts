import { useEffect, useRef } from 'react';

export function useRunPolling(callback: () => Promise<void> | void, intervalMs: number = 5000): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const tick = async () => {
      // Pause polling when the document is hidden / tab is in background
      if (document.hidden) return;

      try {
        await savedCallback.current();
      } catch (err) {
        console.warn('Polling tick error:', err);
      }
    };

    const schedule = () => {
      if (!isMounted) return;
      timer = setTimeout(async () => {
        await tick();
        schedule();
      }, intervalMs);
    };

    // Initial timer
    schedule();

    // Listen for tab visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab just became visible: trigger immediate refresh and restart timer
        tick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs]);
}

export default useRunPolling;
