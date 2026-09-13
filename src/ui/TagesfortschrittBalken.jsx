import { KATEGORIE_META } from "../utils/dayItems";
import Icon from "./Icon";

// Tagesfortschritt als Balkendiagramm (12.09., Nutzerinnen-Vorgabe: "so ein
// Diagramm mit so Stäbchen" statt eines einzelnen Rings) — ein Balken je
// Lebensbereich statt einer einzelnen Gesamtzahl, damit auf einen Blick
// sichtbar ist, WO es heute hakt. Graue Kurz-Balken markieren Bereiche, die
// noch gar nicht eingerichtet sind (aktiv: false).
export default function TagesfortschrittBalken({ widgets }) {
  const MAX_HOEHE = 100;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: MAX_HOEHE }}>
        {widgets.map((w) => {
          const hoehe = w.aktiv ? Math.max(4, Math.round(Math.min(1, w.dailyCount / (w.dailyTotal || 1)) * MAX_HOEHE)) : 6;
          // Bug-Fix: w.farbe ist NUR bei Morgen-/Abendroutine gesetzt (siehe
          // ROUTINE_FARBE in HomeView.jsx) — alle anderen Kategorien holen
          // ihre Farbe aus KATEGORIE_META, wie schon bei "Als Nächstes"/
          // "Weitere Pläne". Ohne diesen Fallback waren hier bisher ALLE
          // Balken außer Morgen-/Abendroutine unsichtbar (kein background
          // gesetzt).
          const farbe = w.aktiv ? w.farbe || KATEGORIE_META[w.kategorie]?.dot : "#E2E2DC";
          return (
            <div key={w.kategorie} title={w.name} style={{ width: 26, flexShrink: 0, height: hoehe, borderRadius: "6px 6px 2px 2px", background: farbe }} />
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 7 }}>
        {widgets.map((w) => {
          // Kleine Symbole neben/statt dem reinen Farbpunkt (13.09.,
          // Nutzerinnen-Vorgabe): "damit man nicht nur an der Farbe, sondern
          // auch an diesem Symbol erkennt, um welche Protokollart es sich
          // handelt" — soll als zusätzlicher visueller Anker (Farbe + Form)
          // im Kopf hängen bleiben. Fällt auf den bisherigen Punkt zurück,
          // falls eine Kategorie kein Icon hat.
          const icon = w.icon || KATEGORIE_META[w.kategorie]?.icon;
          const farbe = w.aktiv ? w.farbe || KATEGORIE_META[w.kategorie]?.dot : "#B5B5AE";
          return (
            <div key={w.kategorie} style={{ width: 26, flexShrink: 0, display: "flex", justifyContent: "center" }}>
              {icon ? <Icon name={icon} size={14} color={farbe} strokeWidth={2} /> : <span style={{ width: 7, height: 7, borderRadius: 4, background: farbe }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
