import React, { useState } from "react";
import { Card, PrimaryButton } from "./primitives";
import { cardBorder, danger, textMuted } from "./theme";
import NumberWheelField from "./NumberWheelField";

// Bearbeitbare Verlauf-Liste für die "Tages-Gesamtsumme"-Kategorien
// (Hydration/Tageslicht/Bildschirmzeit) — bisher reine Anzeige, ein
// vergangener Tag ließ sich weder korrigieren noch löschen, anders als
// bei Medikamenten/Supplementen/Mahlzeiten/Trainingseinheiten (17.09.,
// Konsistenz-Check). `feld` liefert pro Eintrag den Wert (z. B. `mengeMl`),
// `onSetzen(datum, wert)`/`onLoeschen(datum)` sind die jeweiligen
// `…EintragSetzen`/`…EintragLoeschen`-Funktionen aus dem Daten-Hook.
export default function EintragVerlaufListe({ eintraege, feld, einheit, min = 0, max = 5000, step = 50, onSetzen, onLoeschen }) {
  const [bearbeiten, setBearbeiten] = useState(null);
  const [entwurf, setEntwurf] = useState("");

  const oeffnen = (e) => {
    setBearbeiten(e.datum);
    setEntwurf(String(e[feld] ?? ""));
  };

  const speichern = async (datum) => {
    await onSetzen(datum, entwurf);
    setBearbeiten(null);
  };

  const loeschen = async (datum) => {
    if (!window.confirm("Diesen Tages-Eintrag wirklich löschen?")) return;
    await onLoeschen(datum);
    setBearbeiten(null);
  };

  return (
    <Card>
      {eintraege
        .slice()
        .reverse()
        .slice(0, 10)
        .map((e) => (
          <div key={e.datum} style={{ padding: "6px 0", borderBottom: `1px solid ${cardBorder}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
              <span style={{ color: textMuted }}>{e.datum}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700 }}>
                  {e[feld]} {einheit}
                </span>
                <button
                  type="button"
                  onClick={() => (bearbeiten === e.datum ? setBearbeiten(null) : oeffnen(e))}
                  style={{ border: "none", background: "transparent", color: textMuted, fontSize: 13, cursor: "pointer", padding: "0 2px" }}
                  title="Bearbeiten"
                >
                  ✏️
                </button>
              </div>
            </div>
            {bearbeiten === e.datum && (
              <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <NumberWheelField value={entwurf} onChange={setEntwurf} min={min} max={max} step={step} />
                </div>
                <div style={{ width: 90 }}>
                  <PrimaryButton onClick={() => speichern(e.datum)}>Speichern</PrimaryButton>
                </div>
                <button
                  type="button"
                  onClick={() => loeschen(e.datum)}
                  style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer", padding: "0 4px" }}
                  title="Eintrag löschen"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
    </Card>
  );
}
