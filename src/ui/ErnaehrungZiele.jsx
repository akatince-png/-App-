import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { PrimaryButton } from "./primitives";
import { cardBorder, textMuted } from "./theme";
import { berechneGrundumsatz } from "../utils/kalorien";
import { QUELLEN, ZIELARTEN, ZIEL_STANDARD, aktuellesGewicht, makroZiele } from "../utils/essenRechner";

// Ernährungsziel (25.09., Vorschau freigegeben): Ziel, Kalorien, Eiweiß in
// g pro kg, Fett-Anteil (Kohlenhydrate = Rest), Omega-3, Omega-6 : 3,
// Fisch pro Woche und bevorzugte Quellen. Die App rechnet die Gramm aus
// und zeigt sie vor dem Speichern ("Passt das so?").
const chip = (an) => ({
  border: "none",
  borderRadius: 99,
  padding: "7px 11px",
  fontSize: 12.5,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  background: an ? "#1B2350" : "#EEF4FF",
  color: an ? "#fff" : "#2D6FD6",
});

function Auswahl({ label, werte, wert, onWahl, anzeige = (v) => String(v).replace(".", ",") }) {
  return (
    <>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>{label}</div>
      <div role="group" aria-label={label} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {werte.map((v) => (
          <button key={v} type="button" aria-pressed={Number(wert) === v} style={chip(Number(wert) === v)} onClick={() => onWahl(v)}>
            {anzeige(v)}
          </button>
        ))}
      </div>
    </>
  );
}

export default function ErnaehrungZiele({ onGespeichert }) {
  const { categoryZiele = {}, setCategoryZiel, personalData = {}, gewichtsEintraege = [] } = useAppData();
  const alt = categoryZiele.ernaehrung || {};
  const gewicht = aktuellesGewicht(gewichtsEintraege, personalData);
  // Tagesbedarf grob = Grundumsatz × 1,4 (leicht aktiv); Ziel davon ±.
  const grundumsatz = berechneGrundumsatz({ geschlecht: personalData.geschlecht, geburtsdatum: personalData.geburtsdatum, groesse: personalData.groesse, gewicht });
  const bedarf = grundumsatz ? Math.round((grundumsatz * 1.4) / 10) * 10 : null;
  const [e, setE] = useState(() => ({ ...ZIEL_STANDARD, ziel: "halten", quellen: { eiweiss: [], fett: [], kh: [], vermeiden: [] }, ...alt }));
  const [gespeichert, setGespeichert] = useState(false);
  const setze = (k, v) => {
    setGespeichert(false);
    setE((x) => ({ ...x, [k]: v }));
  };
  const zielWaehlen = (id, prozent) => {
    setGespeichert(false);
    setE((x) => ({ ...x, ziel: id, kalorienZiel: bedarf ? Math.round((bedarf * (100 + prozent)) / 100 / 10) * 10 : x.kalorienZiel }));
  };
  const quelleUmschalten = (gruppe, q) =>
    setE((x) => {
      const liste = x.quellen?.[gruppe] || [];
      return { ...x, quellen: { ...x.quellen, [gruppe]: liste.includes(q) ? liste.filter((y) => y !== q) : [...liste, q] } };
    });
  const z = makroZiele(e, gewicht, e.kalorienZiel);

  return (
    <div>
      {alt.vomCoach && <div style={{ fontSize: 12, background: "#FFF6E0", borderRadius: 10, padding: "6px 9px", marginBottom: 6 }}>🧑‍🏫 Von deinem Coach empfohlen – Änderungen am besten gemeinsam besprechen.</div>}
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "4px 0 6px" }}>ZIEL</div>
      <div role="group" aria-label="Ziel" style={{ display: "flex", gap: 6 }}>
        {ZIELARTEN.map(([id, label, p]) => (
          <button key={id} type="button" aria-pressed={e.ziel === id} style={chip(e.ziel === id)} onClick={() => zielWaehlen(id, p)}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13 }}>
        <span>Kalorien am Tag</span>
        <input
          aria-label="Kalorienziel"
          type="number"
          value={e.kalorienZiel ?? ""}
          onChange={(ev) => setze("kalorienZiel", ev.target.value === "" ? null : Number(ev.target.value))}
          placeholder={bedarf ? String(bedarf) : "z. B. 2000"}
          style={{ width: 90, border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "6px 8px", fontSize: 14, fontFamily: "inherit" }}
        />
        {bedarf && <span style={{ color: textMuted, fontSize: 12 }}>Bedarf ≈ {bedarf} (leicht aktiv)</span>}
      </div>
      <Auswahl label="EIWEISS PRO KG KÖRPERGEWICHT" werte={[1.2, 1.5, 1.6, 1.8, 2.0, 2.2]} wert={e.eiweissGProKg} onWahl={(v) => setze("eiweissGProKg", v)} anzeige={(v) => `${String(v).replace(".", ",")} g`} />
      <Auswahl label="FETT-ANTEIL (KOHLENHYDRATE = REST)" werte={[20, 25, 30, 35, 40]} wert={e.fettProzent} onWahl={(v) => setze("fettProzent", v)} anzeige={(v) => `${v} %`} />
      <Auswahl label="OMEGA-3 (EPA + DHA) AM TAG" werte={[250, 500, 1000]} wert={e.omega3Mg} onWahl={(v) => setze("omega3Mg", v)} anzeige={(v) => `${v} mg`} />
      <Auswahl label="OMEGA-6 : OMEGA-3 HÖCHSTENS" werte={[4, 5, 6, 8]} wert={e.omega6zu3Max} onWahl={(v) => setze("omega6zu3Max", v)} anzeige={(v) => `${v} : 1`} />
      <Auswahl label="FETTER FISCH PRO WOCHE" werte={[0, 1, 2, 3]} wert={e.fischProWoche} onWahl={(v) => setze("fischProWoche", v)} anzeige={(v) => `${v}×`} />

      {[
        ["eiweiss", "BEVORZUGTE EIWEISSQUELLEN"],
        ["fett", "FETT / OMEGA-3"],
        ["kh", "KOHLENHYDRATE"],
        ["vermeiden", "VERMEIDE / VERTRAGE NICHT"],
      ].map(([g, label]) => (
        <div key={g}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>{label}</div>
          <div role="group" aria-label={label} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {QUELLEN[g].map((q) => (
              <button key={q} type="button" aria-pressed={(e.quellen?.[g] || []).includes(q)} style={chip((e.quellen?.[g] || []).includes(q))} onClick={() => quelleUmschalten(g, q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div style={{ fontSize: 13, background: "#F4F6FA", borderRadius: 12, padding: "10px 12px", marginTop: 14, lineHeight: 1.6 }} data-makro-ziele>
        <b>So rechnet die App{gewicht ? ` (${String(gewicht).replace(".", ",")} kg)` : ""}:</b>
        <br />
        🥚 Eiweiß {z.eiweiss != null ? `${z.eiweiss} g` : "– (Gewicht fehlt)"} · 🥑 Fett {z.fett != null ? `${z.fett} g` : "–"} · 🍞 Kohlenhydrate {z.kh != null ? `${z.kh} g` : "–"}
        <br />
        🐟 Omega-3 ≥ {z.omega3Mg} mg EPA/DHA · Omega-6 : 3 ≤ {z.omega6zu3Max} : 1 · Fisch {z.fischProWoche}× pro Woche
        <div style={{ fontSize: 11.5, color: textMuted }}>Richtwerte zum Einstellen, keine Therapie. Bei Erkrankungen ärztlich abklären.</div>
      </div>
      <div style={{ marginTop: 10 }}>
        <PrimaryButton
          onClick={() => {
            setCategoryZiel("ernaehrung", { ...alt, ...e });
            setGespeichert(true);
            onGespeichert?.();
          }}
        >
          {gespeichert ? "✓ Gespeichert" : "Passt – so speichern"}
        </PrimaryButton>
      </div>
    </div>
  );
}
