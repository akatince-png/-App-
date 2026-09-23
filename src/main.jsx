import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initErrorMonitoring } from './services/errorMonitoring.js'
import { einmalNeuLaden } from './utils/nachladeFehler.js'

initErrorMonitoring()

// Vite meldet hier, wenn ein Teil der App nicht nachgeladen werden konnte
// (z. B. nach einer neuen Veröffentlichung) — dann einmal neu laden statt
// abzustürzen, siehe utils/nachladeFehler.js.
window.addEventListener('vite:preloadError', (event) => {
  if (einmalNeuLaden()) event.preventDefault()
})

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
