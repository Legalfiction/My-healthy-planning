
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registreer de Service Worker voor PWA-functionaliteit
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('SW registered successfully with scope: ', registration.scope);
        
        // Check voor updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nieuwe versie gevonden, reload om te activeren
                console.log('Nieuwe versie beschikbaar, herladen...');
                window.location.reload();
              }
            };
          }
        };
      })
      .catch(registrationError => {
        console.error('SW registration failed: ', registrationError);
      });
  });
}
