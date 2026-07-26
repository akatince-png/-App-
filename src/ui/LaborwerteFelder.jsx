import React, { useState } from "react";
import { TextInput } from "./primitives";
import { accentDark, cardBorder, success, textMuted } from "./theme";
import { LABORWERTE_ALLE, LABORWERTE_KATEGORIEN } from "../constants";

// Kategorisierte, aufklappbare Laborwert-Eingabe — geteilt zwischen ProfilTab
// (laufende Pflege, inkl. Kamera-Erfassung dort) und dem Biomarker-Plan im
// Onboarding (Ersteingabe). Reine Werteingabe ohne Foto/OCR, damit beide
// Stellen dieselbe Basis benutzen statt eigene Kopien zu pflegen.
//
// `frisch`: im Onboarding sollen die Felder leer wirken statt Laborwerte aus
// einem früheren Durchlauf zu zeigen — ohne bestehende Werte zu löschen
// (bleiben unangetastet, solange nicht erneut eingetragen). Der ProfilTab
// zeigt weiterhin ganz normal die echten, zuletzt erfassten Werte.
export default function LaborwerteFelder({ biomarker, setBiomarkerWert, frisch = false }) {
  const [offeneKategorien, setOffeneKategorien] = useState(() => new Set());
  const [neuerLaborwertName, setNeuerLaborwertName] = useState("");
  const [lokal, setLokal] = useState({});

  const anzeige = frisch ? lokal : biomarker;

  const wertAendern = (name, val) => {
    if (frisch) setLokal((prev) => ({ ...prev, [name]: val }));
    setBiomarkerWert(name, val);
  };

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
    wertAendern(name, "");
    setNeuerLaborwertName("");
  };

  const eigeneWerte = Object.keys(anzeige).filter((k) => !LABORWERTE_ALLE.includes(k));

  return (
    <>
      {LABORWERTE_KATEGORIEN.map((kat) => {
        const offen = offeneKategorien.has(kat.kategorie);
        const erfasst = kat.werte.filter((w) => anzeige[w]).length;
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
                      <TextInput value={anzeige[b] || ""} onChange={(v) => wertAendern(b, v)} placeholder="—" />
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
                <TextInput value={anzeige[k] || ""} onChange={(v) => wertAendern(k, v)} placeholder="—" />
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
