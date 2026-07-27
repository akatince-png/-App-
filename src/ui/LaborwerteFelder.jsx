import React, { useState } from "react";
import { TextInput } from "./primitives";
import { accentDark, accentSoft, cardBorder, danger, success, textMain, textMuted } from "./theme";
import { LABORWERTE_ALLE, LABORWERTE_KATEGORIEN } from "../constants";
import { useAppData } from "../context/AppDataContext";

// Eine Laborwert-Zeile: Label + Info-Button (Lexikon-Erklärung, eigene, vom
// gewählten KI-Provider unabhängige Anbindung, siehe useLexikon.js) + Eingabe.
// Die aufgeklappte Erklärung erscheint als eigener Block unterhalb der Zeile.
// Eigene Komponente statt Inline-Logik, damit jede Zeile ihren eigenen
// Lade-/Antwort-Zustand hat, ohne die anderen Zeilen zu beeinflussen.
function LaborwertZeile({ name, value, onChange, borderBottom }) {
  const { lexikonSchnellFragen } = useAppData();
  const [offen, setOffen] = useState(false);
  const [laden, setLaden] = useState(false);
  const [antwort, setAntwort] = useState(null);
  const [fehler, setFehler] = useState(null);

  const umschalten = async () => {
    const wirdGeoeffnet = !offen;
    setOffen(wirdGeoeffnet);
    if (wirdGeoeffnet && antwort === null && !laden) {
      setLaden(true);
      setFehler(null);
      try {
        const text = await lexikonSchnellFragen(
          `Erkläre den Laborwert "${name}" kurz und verständlich: was er misst, wieso er gemessen wird, welche Relevanz er hat, und in welchem Bereich er normalerweise liegen sollte. Keine Diagnose, nur allgemeine Einordnung.`,
          "Laborwerte"
        );
        setAntwort(text);
      } catch (err) {
        setFehler(err.message || "Erklärung konnte nicht geladen werden.");
      } finally {
        setLaden(false);
      }
    }
  };

  return (
    <div style={{ padding: "6px 0", borderBottom }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 2 }}>
          {name}
          <button
            type="button"
            onClick={umschalten}
            title={`${name} erklären`}
            style={{
              border: "none",
              background: "transparent",
              color: offen ? accentDark : textMuted,
              fontSize: 14,
              cursor: "pointer",
              padding: "2px 4px",
              flexShrink: 0,
            }}
          >
            ℹ️
          </button>
        </span>
        <div style={{ width: 100 }}>
          <TextInput value={value} onChange={onChange} placeholder="—" />
        </div>
      </div>
      {offen && (
        <div
          style={{
            marginTop: 6,
            padding: "8px 10px",
            borderRadius: 10,
            background: accentSoft,
            fontSize: 12,
            lineHeight: 1.5,
            color: textMain,
          }}
        >
          {laden && "Lädt Erklärung…"}
          {fehler && <span style={{ color: danger }}>{fehler}</span>}
          {antwort}
        </div>
      )}
    </div>
  );
}

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
                  <LaborwertZeile
                    key={b}
                    name={b}
                    value={anzeige[b] || ""}
                    onChange={(v) => wertAendern(b, v)}
                  />
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
            <LaborwertZeile
              key={k}
              name={k}
              value={anzeige[k] || ""}
              onChange={(v) => wertAendern(k, v)}
              borderBottom={`1px solid ${cardBorder}`}
            />
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
