import React, { useState } from "react";
import { Card } from "./primitives";
import { accentDark, cardBorder, danger, textMuted } from "./theme";

// Mehrfachauswahl fürs Archiv (12.09., Nutzerin-Vorgabe: "diese einzelnen
// Löschreihen sind voll nervig ... alle markieren und dann alle auf einmal
// löschen"). Eine Checkbox je Zeile bleibt oben Auswahl-Stand nur lokal
// (kein Serverzustand nötig) — "Alle auswählen" markiert alle aktuell
// angezeigten Zeilen, der Sammel-Löschen-Knopf ruft `onLoeschen(id)` für
// jede ausgewählte Zeile auf (dieselbe Funktion wie beim einzelnen 🗑,
// der bewusst erhalten bleibt — schnelles Löschen eines einzelnen
// Eintrags soll weiterhin ohne Auswahlmodus gehen).
export default function ArchivAbschnitt({ titel, leerText, items, getId, onLoeschen, confirmEinzeln, confirmMehrfach, renderZeile }) {
  const [ausgewaehlt, setAusgewaehlt] = useState(new Set());

  const alleAusgewaehlt = items.length > 0 && items.every((item) => ausgewaehlt.has(getId(item)));

  const umschalten = (id) =>
    setAusgewaehlt((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const alleUmschalten = () => setAusgewaehlt(alleAusgewaehlt ? new Set() : new Set(items.map(getId)));

  const einzelnLoeschen = (item) => {
    if (!window.confirm(confirmEinzeln(item))) return;
    onLoeschen(getId(item));
    setAusgewaehlt((prev) => {
      const next = new Set(prev);
      next.delete(getId(item));
      return next;
    });
  };

  const mehrfachLoeschen = () => {
    const ids = [...ausgewaehlt];
    if (ids.length === 0) return;
    if (!window.confirm(confirmMehrfach(ids.length))) return;
    ids.forEach((id) => onLoeschen(id));
    setAusgewaehlt(new Set());
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{titel}</div>
        {items.length > 0 && (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {ausgewaehlt.size > 0 && (
              <button
                type="button"
                onClick={mehrfachLoeschen}
                style={{ border: "none", background: "transparent", color: danger, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
              >
                {ausgewaehlt.size} löschen
              </button>
            )}
            <button
              type="button"
              onClick={alleUmschalten}
              style={{ border: "none", background: "transparent", color: accentDark, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
            >
              {alleAusgewaehlt ? "Auswahl aufheben" : "Alle auswählen"}
            </button>
          </div>
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
