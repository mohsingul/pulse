import { useEffect } from 'react';
import { storage } from '@/utils/storage';

/**
 * Ends login only when the page is actually unloaded (not bfcache / quick resume).
 * Home-screen app resume keeps the session; swiping the app away clears it.
 */
export function useSessionLifecycle(onSessionEnd?: () => void) {
  useEffect(() => {
    const endSession = () => {
      storage.clearSession();
      onSessionEnd?.();
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      // persisted = page may return from back-forward cache (stay logged in)
      if (event.persisted) return;
      endSession();
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [onSessionEnd]);
}
