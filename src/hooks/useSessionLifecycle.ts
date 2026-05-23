import { useEffect } from 'react';
import { storage } from '@/utils/storage';

/**
 * Ends the login session when the app/page is closed (not when cached for back-navigation).
 */
export function useSessionLifecycle(onSessionEnd?: () => void) {
  useEffect(() => {
    const endSession = () => {
      storage.clearSession();
      onSessionEnd?.();
    };

    const handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      endSession();
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [onSessionEnd]);
}
