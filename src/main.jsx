import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initErrorMonitoring } from './services/errorMonitoring.js'

initErrorMonitoring()

// Nachlade-Fehler (neue Veröffentlichung, Verbindung kurz weg) behandelt
// seit 24.09. lazyAnsicht in AuthenticatedApp: erst still wiederholen, dann
// über das Auffangnetz einmal neu laden. Der frühere Sofort-Neuladen hier
// ("vite:preloadError" + preventDefault) ließ den Import mit `undefined`
// enden → kurzer Absturz-Bildschirm vor dem Neuladen.

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
