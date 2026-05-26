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

    // Delay attaching pagehide so iOS Safari doesn't fire it during initial paint
    const attachTimer = window.setTimeout(() => {
      window.addEventListener('pagehide', handlePageHide);
    }, 500);

    return () => {
      window.clearTimeout(attachTimer);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [onSessionEnd]);
}
