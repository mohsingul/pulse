import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from '@/app/App';
import '@/styles/tailwind.css';
import '@/styles/index.css';
import '@/styles/fonts.css';
import '@/styles/theme.css';

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onOfflineReady() {
      console.log('[PWA] App is ready for offline use');
    },
    onNeedRefresh() {
      console.log('[PWA] New content available, update ready');
    },
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);