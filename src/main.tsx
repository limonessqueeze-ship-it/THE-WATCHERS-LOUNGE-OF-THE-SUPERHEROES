import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { clearAllLocalAccounts } from './utils/profanityFilter.ts';

// Auto-purge previously created local accounts once
if (typeof window !== 'undefined' && !localStorage.getItem('mcu_accounts_purged_v1')) {
  clearAllLocalAccounts();
  localStorage.setItem('mcu_accounts_purged_v1', 'true');
}

// Suppress benign Vite WebSocket connection warnings/unhandled rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason || '');
    if (
      reason.includes('WebSocket') ||
      reason.includes('failed to connect to websocket') ||
      reason.includes('WebSocket closed without opened')
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('WebSocket') ||
      msg.includes('failed to connect to websocket') ||
      msg.includes('WebSocket closed without opened')
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

