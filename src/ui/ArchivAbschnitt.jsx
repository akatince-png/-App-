import React from "react";
import { Card } from "./primitives";
import { cardBorder, danger, textMuted } from "./theme";
import { useMehrfachauswahl } from "./useMehrfachauswahl";
import MehrfachauswahlLeiste from "./MehrfachauswahlLeiste";

// Mehrfachauswahl fürs Archiv (12.09., Nutzerin-Vorgabe: "diese einzelnen
// Löschreihen sind voll nervig ... alle markieren und dann alle auf einmal
// löschen"). Eine Checkbox je Zeile, "Alle auswählen" markiert alle aktuell
// angezeigten Zeilen, der Sammel-Löschen-Knopf ruft `onLoeschen(id)` für
// jede ausgewählte Zeile auf (dieselbe Funktion wie beim einzelnen 🗑,
// der bewusst erhalten bleibt — schnelles Löschen eines einzelnen
// Eintrags soll weiterhin ohne Auswahlmodus gehen).
export default function ArchivAbschnitt({ titel, leerText, items, getId, onLoeschen, confirmEinzeln, confirmMehrfach, renderZeile }) {
  const { ausgewaehlt, alleAusgewaehlt, umschalten, alleUmschalten, entfernenAusAuswahl, zuruecksetzen } = useMehrfachauswahl(items, getId);

  const einzelnLoeschen = (item) => {
    if (!window.confirm(confirmEinzeln(item))) return;
    onLoeschen(getId(item));
    entfernenAusAuswahl(getId(item));
  };

  const mehrfachLoeschen = () => {
    const ids = [...ausgewaehlt];
    if (ids.length === 0) return;
    if (!window.confirm(confirmMehrfach(ids.length))) return;
    ids.forEach((id) => onLoeschen(id));
    zuruecksetzen();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{titel}</div>
        {items.length > 0 && (
          <MehrfachauswahlLeiste
            anzahlAusgewaehlt={ausgewaehlt.size}
            alleAusgewaehlt={alleAusgewaehlt}
            onAlleUmschalten={alleUmschalten}
            onMehrfachLoeschen={mehrfachLoeschen}
          />
        )}
      </div>
      <Card style={{ marginBottom: 14 }}>
        {items.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>{leerText}</div>}
        {items.map((item, i) => {
          const id = getId(item);
          return (
            <div
              key={id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 0",
                borderBottom: i < items.length - 1 ? `1px solid ${cardBorder}` : "none",
              }}
            >
              <input
                type="checkbox"
                checked={ausgewaehlt.has(id)}
                onChange={() => umschalten(id)}
                style={{ marginTop: 4, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>{renderZeile(item)}</div>
              <button
                type="button"
                onClick={() => einzelnLoeschen(item)}
                title="Endgültig löschen"
                style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 9, border: "none", background: "#FDE9EC", color: danger, fontSize: 14, cursor: "pointer" }}
              >
                🗑
              </button>
            </div>
          );
        })}
      </Card>
    </>
  );
}
