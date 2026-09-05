import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Toaster } from 'sonner';

// The VitePWA plugin will automatically register the service worker
// when registerType: 'autoUpdate' is set in vite.config.ts

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster 
      position="bottom-right" 
      toastOptions={{
        className: 'font-sans font-bold shadow-2xl rounded-xl border border-slate-200 dark:border-slate-800',
      }} 
    />
  </StrictMode>,
);
