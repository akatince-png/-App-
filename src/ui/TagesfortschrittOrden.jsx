import Icon from "./Icon";
import { textMuted } from "./theme";
import { WIDGET_ZU_ORDEN_KATEGORIE, ordenFuerWidgetKategorie } from "../utils/errungenschaften";

// Orden-Vorschau rechts neben dem Tagesfortschritt-Balkendiagramm (13.09.,
// Nutzerinnen-Vorgabe zum Tablet-Layout: "rechts ist recht viel Platz...
// wenn Pläne gesetzt wurden, die nächsten und potenziellen Orden dort
// angezeigt werden, noch in so einem durchsichtigen Modus, weil sie noch
// nicht erreicht wurden, sollen erst dann Farbe bekommen... wenn Ziel
// erreicht wurde"). Ein Orden-Platz pro Bereich, für den bereits ein Plan
// eingerichtet ist (widget.aktiv) — noch nicht der erste 7-Tage-Streak
// geschafft: grau/transparent als Vorschau, was als Nächstes ansteht.
// Sobald mindestens ein Streak-Orden in dem Bereich verdient ist: voll
// eingefärbt (Kategorie-Verlauf wie in ErfolgeTab.jsx) mit der erreichten
// Tage-Zahl statt der Vorschau-Zahl. Zuordnung Widget- zu Orden-Kategorie
// und die Freischalt-Logik selbst stecken in utils/errungenschaften.js,
// gemeinsam genutzt mit dem kleineren Orden-Hinweis auf den einzelnen
// Direktzugriff-Kacheln (siehe MiniPlanWidget.jsx/HomeView.jsx) — diese
// Leiste hier ist nur ab Tablet-Breite sichtbar (index.css), die Kacheln
// unten dagegen auf jedem Gerät.
export default function TagesfortschrittOrden({ widgets, kategorien, verdiente, onClick }) {
  const eintraege = widgets
    .filter((w) => w.aktiv && WIDGET_ZU_ORDEN_KATEGORIE[w.kategorie])
    .map((w) => ordenFuerWidgetKategorie(w.kategorie, kategorien, verdiente))
    .filter(Boolean);
  if (eintraege.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="mp-tagesfortschritt-orden"
      title="Zu den Erfolgen"
      style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
    >
      {eintraege.map((orden) => (
        <div
          key={orden.key}
          title={`${orden.label}: ${orden.freigeschaltet ? `${orden.schwelle}-Tage-Orden erreicht` : `noch ${Math.max(0, orden.schwelle - orden.streak)} Tage bis zum ersten Orden`}`}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: orden.freigeschaltet ? `linear-gradient(135deg, ${orden.grad[0]}, ${orden.grad[1]})` : "#F2F2F0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: orden.freigeschaltet ? 1 : 0.55,
            flexShrink: 0,
            transition: "opacity 200ms ease",
          }}
        >
          <Icon name={orden.icon} size={14} color={orden.freigeschaltet ? "#fff" : textMuted} />
          <span style={{ fontSize: 8, fontWeight: 800, color: orden.freigeschaltet ? "#fff" : textMuted, marginTop: 1 }}>{orden.schwelle}</span>
        </div>
      ))}
    </button>
  );
}
