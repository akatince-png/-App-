import Icon from "./Icon";
import { textMuted } from "./theme";
import { STREAK_SCHWELLEN } from "../utils/errungenschaften";

// Ordner-Kürzel im widgets-Array (siehe HomeView.jsx) vs. die Kategorie-
// Schlüssel im Erfolge-System (utils/errungenschaften.js) heißen an ein
// paar Stellen unterschiedlich (historisch gewachsen, z. B. "hormon" vs.
// "medikamente") — diese Zuordnung verbindet beide, damit hier nur echte
// Treffer landen. Schlaf/Atemübungen haben auf Home kein eigenes Widget
// (siehe miniWidgetData in HomeView.jsx) und tauchen deshalb hier nie auf.
const WIDGET_ZU_ORDEN_KATEGORIE = {
  gewohnheit: "gewohnheiten",
  morgenroutine: "morgenroutine",
  abendroutine: "abendroutine",
  hormon: "medikamente",
  supplement: "supplemente",
  mahlzeit: "ernaehrung",
  training: "training",
  hydration: "hydration",
  tageslicht: "tageslicht",
};

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
// Tage-Zahl statt der Vorschau-Zahl.
export default function TagesfortschrittOrden({ widgets, kategorien, verdiente, onClick }) {
  const aktiveSchluessel = new Set(
    widgets.filter((w) => w.aktiv && WIDGET_ZU_ORDEN_KATEGORIE[w.kategorie]).map((w) => WIDGET_ZU_ORDEN_KATEGORIE[w.kategorie])
  );
  const eintraege = kategorien.filter((k) => aktiveSchluessel.has(k.key));
  if (eintraege.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="mp-tagesfortschritt-orden"
      title="Zu den Erfolgen"
      style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
    >
      {eintraege.map((k) => {
        const erreichteSchwellen = STREAK_SCHWELLEN.filter((s) => verdiente[`${k.key}_streak_${s}`]);
        const freigeschaltet = erreichteSchwellen.length > 0;
        const schwelle = freigeschaltet ? erreichteSchwellen[erreichteSchwellen.length - 1] : STREAK_SCHWELLEN[0];
        return (
          <div
            key={k.key}
            title={`${k.label}: ${freigeschaltet ? `${schwelle}-Tage-Orden erreicht` : `noch ${Math.max(0, schwelle - k.streak)} Tage bis zum ersten Orden`}`}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: freigeschaltet ? `linear-gradient(135deg, ${k.grad[0]}, ${k.grad[1]})` : "#F2F2F0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: freigeschaltet ? 1 : 0.55,
              flexShrink: 0,
              transition: "opacity 200ms ease",
            }}
          >
            <Icon name={k.icon} size={14} color={freigeschaltet ? "#fff" : textMuted} />
            <span style={{ fontSize: 8, fontWeight: 800, color: freigeschaltet ? "#fff" : textMuted, marginTop: 1 }}>{schwelle}</span>
          </div>
        );
      })}
    </button>
  );
}
