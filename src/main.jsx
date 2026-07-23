import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Registrierung ist Voraussetzung für Push-Benachrichtigungen (auch wenn die
// App gerade geschlossen ist) — schadet nicht, wenn der Browser das nicht
// unterstützt oder die App gerade nicht als installierte PWA läuft.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
