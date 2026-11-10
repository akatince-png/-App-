import React, { useEffect, useMemo, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { hinweisInhalt, offenerRoutineHinweis } from "../utils/termineMorgen";

// Kurze Termin-Erinnerung direkt nach der Morgen- und der Abendroutine
// (10.11.2026, Nutzer). Hört auf neue Einträge in `routineDurchlaeufe` –
// egal ob die Routine per geführtem Ablauf, per Checkliste oder per Coach
// abgeschlossen wurde. Erscheint einmal pro Routine und Tag, nur in den
// ersten 90 Minuten nach dem Abschluss, und bleibt stehen, bis man
// „Alles klar“ tippt. Logik: `utils/termineMorgen.js`.
const GEZEIGT_KEY = "aka-termine-hinweis-gezeigt";

function gezeigtLesen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(GEZEIGT_KEY) || "[]"));
  } catch {
    return new Set();
  }
}
function gezeigtMerken(schluessel) {
  try {
    const liste = [...gezeigtLesen(), schluessel].slice(-10);
    localStorage.setItem(GEZEIGT_KEY, JSON.stringify(liste));
  } catch {
    // ohne Speicher: erscheint dann höchstens noch einmal
  }
}

const zeitText = (t) => (t.zeit ? `${t.zeit}${t.ende ? `–${t.ende}` : ""}` : "ganztags");

function Liste({ titel, termine }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, color: "color-mix(in srgb, #6B7178 var(--mp-schrift), var(--mp-schrift-hell))" }}>{titel}</div>
      {termine.map((t) => (
        <div key={t.key} style={{ display: "flex", gap: 10, padding: "5px 0", fontSize: 14.5, fontWeight: t.wichtig ? 800 : 600 }}>
          <span style={{ minWidth: 92, fontVariantNumeric: "tabular-nums" }}>{zeitText(t)}</span>
          <span>{t.titel}</span>
        </div>
      ))}
    </div>
  );
}

export default function TermineMorgenHinweis() {
  const { routineDurchlaeufe, alltagEintraege, matrixAufgaben } = useAppData();
  const [offen, setOffen] = useState(null);

  useEffect(() => {
    if (offen) return;
    const treffer = offenerRoutineHinweis(routineDurchlaeufe || [], { gezeigt: gezeigtLesen() });
    if (!treffer) return;
    // Kurz warten, damit zuerst die „Routine geschafft“-Feier erscheint.
    const t = setTimeout(() => setOffen(treffer), 1200);
    return () => clearTimeout(t);
  }, [routineDurchlaeufe, offen]);

  const inhalt = useMemo(() => (offen ? hinweisInhalt(offen.routine, { alltagEintraege, matrixAufgaben }) : null), [offen, alltagEintraege, matrixAufgaben]);

  if (!offen || !inhalt) return null;
  const schliessen = () => {
    gezeigtMerken(offen.schluessel);
    setOffen(null);
  };
  const nichts = !inhalt.morgen.length && !inhalt.heute.length;

  return (
    <div
      role="dialog"
      aria-label="Termine morgen"
      data-testid="termine-morgen-hinweis"
      style={{ position: "fixed", left: 12, right: 12, bottom: 86, zIndex: 65, maxWidth: 480, margin: "0 auto", background: "var(--mp-karte)", borderRadius: 18, padding: 16, boxShadow: "0 12px 34px rgba(20,23,26,.22)", border: "1.5px solid color-mix(in srgb, #E4E6EE var(--mp-flaeche), var(--mp-rand-dunkel))" }}
    >
      <div style={{ fontWeight: 900, fontSize: 16 }}>{offen.routine === "abend" ? "🌙" : "☀️"} Hey, denk dran{nichts ? "" : ":"}</div>
      {nichts && <div style={{ fontSize: 14.5, marginTop: 6 }}>Morgen stehen keine Termine an.</div>}
      {inhalt.heute.length > 0 && <Liste titel="Heute noch" termine={inhalt.heute} />}
      {inhalt.morgen.length > 0 && <Liste titel="Morgen" termine={inhalt.morgen} />}
      <button
        type="button"
        onClick={schliessen}
        style={{ marginTop: 12, width: "100%", border: "none", borderRadius: 12, padding: "11px 10px", fontSize: 14.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: "#1B2350", color: "#fff" }}
      >
        Alles klar
      </button>
    </div>
  );
}
