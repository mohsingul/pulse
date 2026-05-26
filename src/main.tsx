import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from '@/app/App';
import { AppErrorBoundary } from '@/app/components/AppErrorBoundary';
import '@/styles/tailwind.css';
import '@/styles/index.css';
import '@/styles/fonts.css';
import '@/styles/theme.css';

// Recover from stale cached bundles after deploy (common PWA blank-screen cause)
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onOfflineReady() {
      console.log('[PWA] App is ready for offline use');
    },
    onNeedRefresh() {
      console.log('[PWA] New version available — reloading');
      window.location.reload();
    },
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);