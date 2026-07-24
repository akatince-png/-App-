import React, { useState } from "react";
import { TextInput } from "./primitives";
import { accentDark, cardBorder, success, textMuted } from "./theme";
import { LABORWERTE_ALLE, LABORWERTE_KATEGORIEN } from "../constants";

// Kategorisierte, aufklappbare Laborwert-Eingabe — geteilt zwischen ProfilTab
// (laufende Pflege, inkl. Kamera-Erfassung dort) und dem Biomarker-Plan im
// Onboarding (Ersteingabe). Reine Werteingabe ohne Foto/OCR, damit beide
// Stellen dieselbe Basis benutzen statt eigene Kopien zu pflegen.
export default function LaborwerteFelder({ biomarker, setBiomarkerWert }) {
  const [offeneKategorien, setOffeneKategorien] = useState(() => new Set());
  const [neuerLaborwertName, setNeuerLaborwertName] = useState("");

  const toggleKategorie = (name) =>
    setOffeneKategorien((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const laborwertHinzufuegen = () => {
    const name = neuerLaborwertName.trim();
    if (!name) return;
    setBiomarkerWert(name, "");
    setNeuerLaborwertName("");
  };

  const eigeneWerte = Object.keys(biomarker).filter((k) => !LABORWERTE_ALLE.includes(k));

  return (
    <>
      {LABORWERTE_KATEGORIEN.map((kat) => {
        const offen = offeneKategorien.has(kat.kategorie);
        const erfasst = kat.werte.filter((w) => biomarker[w]).length;
        return (
          <div key={kat.kategorie}>
            <button
              type="button"
              onClick={() => toggleKategorie(kat.kategorie)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 2px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                borderBottom: `1px solid ${cardBorder}`,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>{kat.kategorie}</span>
              <span style={{ fontSize: 11, color: textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                {erfasst > 0 && <span style={{ color: success, fontWeight: 700 }}>{erfasst} erfasst</span>}
                {offen ? "▲" : "▼"}
              </span>
            </button>
            {offen && (
              <div style={{ padding: "2px 0 10px" }}>
                {kat.werte.map((b) => (
                  <div key={b} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                    <span style={{ fontSize: 13 }}>{b}</span>
                    <div style={{ width: 100 }}>
                      <TextInput value={biomarker[b] || ""} onChange={(v) => setBiomarkerWert(b, v)} placeholder="—" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {eigeneWerte.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 2 }}>Eigene Werte</div>
          {eigeneWerte.map((k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${cardBorder}` }}>
              <span style={{ fontSize: 13 }}>{k}</span>
              <div style={{ width: 100 }}>
                <TextInput value={biomarker[k] || ""} onChange={(v) => setBiomarkerWert(k, v)} placeholder="—" />
              </div>
            </div>
          ))}
        </>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <div style={{ flex: 1 }}>
          <TextInput value={neuerLaborwertName} onChange={setNeuerLaborwertName} placeholder="Eigener Wert, z. B. Kortisol im Speichel" />
        </div>
        <button
          type="button"
          onClick={laborwertHinzufuegen}
          style={{ padding: "0 14px", borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", color: accentDark, fontWeight: 700, cursor: "pointer" }}
        >
          +
        </button>
      </div>
    </>
  );
}
