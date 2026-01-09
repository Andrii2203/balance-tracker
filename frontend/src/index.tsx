import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { logger } from './utils/logger';
import './i18n';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { tryFlushPending } from './services/offlineSync';
import { sendPendingChatMessage } from './services/offlineSync';
import { supabase } from './supabaseClient';
import prepopulateQueryClient from './boot/prepopulate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

(async function init() {
  // Prepopulate react-query from IndexedDB for instant offline display
  try {
    await prepopulateQueryClient(queryClient);
  } catch (e) {
    // don't block render on prepopulate errors
    console.warn('[prepopulate] init failed', e);
  }

  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  );
})();

if ('serviceWorker' in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        logger.info("ServiceWorker registered:", registration);
      })
      .catch(error => {
        logger.error("ServiceWorker registration failed:", error);
      });
  });
}

// Listen for service worker messages (e.g., sync trigger) and flush pending messages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (ev) => {
    try {
      const data = ev.data || {};
      if (data.type === 'bt:sys-sync') {
        // trigger client-side flush using the centralized sendPendingChatMessage helper
        tryFlushPending(sendPendingChatMessage).catch((e) => logger.error('[index] tryFlushPending failed', e));
      }
    } catch (e) {
      logger.warn('[index] SW message handling failed', e);
    }
  });
}

// Expose a helper to trigger skipWaiting from the app (useful after build deploy)
export const triggerSkipWaiting = async () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
};

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
