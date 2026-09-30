import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import EssenEingabe from "./EssenEingabe";

// Kreis-Schnellmenü (30.09., Nutzerin: „die Sachen, die spontan passieren
// können, in einem Kreis – was ich anwähle, erscheint am größten“). Öffnet
// sich über „⚡ Schnell“ in der Leiste. Feste Abläufe (Morgen-/Abendroutine,
// geplante Medikamente/Supplemente) gehören bewusst nicht hierher.
// Kleine Sachen (Getränk, Snack, Nickerchen, Einnahme) werden direkt hier
// eingetragen; Training/Workflow/Spielen öffnen ihre Auswahl.
const KREIS = [
  { id: "trinken", emoji: "💧", titel: "Getränk", farbe: "#2D6FD6" },
  { id: "snack", emoji: "🍎", titel: "Snack", farbe: "#2E9C6E" },
  { id: "nickerchen", emoji: "😴", titel: "Nickerchen", farbe: "#7A6CE0" },
  { id: "training", emoji: "🏋️", titel: "Training", farbe: "#D9432F" },
  { id: "einnahme", emoji: "⚡", titel: "Pre-Workout & Co.", farbe: "#E0850B" },
  { id: "workflow", emoji: "⏱️", titel: "Workflow", farbe: "#A8327D" },
  { id: "spielen", emoji: "🎮", titel: "Spielen", farbe: "#6C5CE7" },
];

const chip = (farbe) => ({ border: "none", borderRadius: 99, padding: "10px 14px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: farbe, color: "#fff" });
const feld = { flex: 1, minWidth: 0, border: "1.5px solid var(--mp-rand)", borderRadius: 12, padding: "10px 12px", fontSize: 15, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" };

export default function SchnellKreis({ onSchliessen, onOeffnen }) {
  const { hydrationHinzufuegen, spontanSpeichern, aenderungVermerken, supplemente = [] } = useAppData();
  const [wahl, setWahl] = useState(null);
  const [fertig, setFertig] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [name, setName] = useState("");
  const aktiv = KREIS.find((k) => k.id === wahl);

  const erledigt = (text) => {
    setFertig(text);
    setTimeout(onSchliessen, 1100);
  };
  const trinken = async (ml) => {
    await hydrationHinzufuegen?.(ml);
    erledigt(`+${ml} ml eingetragen 💧`);
  };
  const nickerchen = async (min) => {
    const r = await spontanSpeichern?.({ art: "nickerchen", dauerMin: min });
    if (r && r.ok === false) return setFehler(r.error);
    aenderungVermerken?.({ kategorie: "schlaf", itemName: "Nickerchen", aktion: "erledigt", detail: `${min} Min.` });
    erledigt(`Nickerchen ${min} Min. festgehalten 😴`);
  };
  const einnahme = async (was) => {
    const r = await spontanSpeichern?.({ art: "einnahme", name: was });
    if (r && r.ok === false) return setFehler(r.error);
    aenderungVermerken?.({ kategorie: "supplement", itemName: was, aktion: "erledigt", detail: "zusätzlich, außerhalb des Plans" });
    erledigt(`${was} festgehalten ⚡`);
  };

  // Sieben Kreise rund um die Mitte; der gewählte wird groß und wandert in die Mitte.
  const R = 118;
  return (
    <div data-schnell-kreis role="dialog" aria-label="Schnellzugriff" style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: "calc(110px + env(safe-area-inset-bottom))", background: "rgba(16, 24, 40, 0.45)", backdropFilter: "blur(3px)", overflowY: "auto" }} onClick={(e) => e.target === e.currentTarget && onSchliessen()}>
      <div style={{ position: "relative", width: 320, height: 320, flexShrink: 0 }}>
        {KREIS.map((k, i) => {
          const winkel = (-90 + (360 / KREIS.length) * i) * (Math.PI / 180);
          const an = wahl === k.id;
          const gross = an ? 116 : 70;
          const x = an ? 160 : 160 + R * Math.cos(winkel);
          const y = an ? 160 : 160 + R * Math.sin(winkel);
          return (
            <button
              key={k.id}
              type="button"
              aria-pressed={an}
              aria-label={k.titel}
              onClick={() => {
                setFehler(null);
                if (an && ["training", "workflow", "spielen"].includes(k.id)) return onOeffnen(k.id);
                setWahl(an ? null : k.id);
              }}
              style={{
                position: "absolute",
                left: x - gross / 2,
                top: y - gross / 2,
                width: gross,
                height: gross,
                borderRadius: 99,
                border: an ? "4px solid #fff" : "none",
                background: k.farbe,
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: an ? "0 10px 28px rgba(0,0,0,.35)" : "0 6px 14px rgba(0,0,0,.22)",
                opacity: wahl && !an ? 0.55 : 1,
                transition: "all .25s ease",
                zIndex: an ? 2 : 1,
              }}
            >
              <span style={{ fontSize: an ? 40 : 26, lineHeight: 1 }}>{k.emoji}</span>
              <span style={{ fontSize: an ? 13 : 9.5, fontWeight: 800, lineHeight: 1.1, textAlign: "center", padding: "0 4px" }}>{k.titel}</span>
            </button>
          );
        })}
        {!wahl && (
          <div aria-hidden="true" style={{ position: "absolute", left: 110, top: 125, width: 100, textAlign: "center", color: "#fff", fontSize: 12.5, fontWeight: 700, lineHeight: 1.3 }}>
            Was machst du gerade spontan?
          </div>
        )}
      </div>

      {(aktiv || fertig) && (
        <div data-schnell-aktion style={{ width: "min(92vw, 420px)", marginTop: 8, padding: 14, borderRadius: 22, background: "var(--mp-karte)", color: "var(--mp-text)", boxShadow: "0 12px 32px rgba(0,0,0,.25)" }}>
          {fertig ? (
            <div role="status" style={{ textAlign: "center", fontSize: 16, fontWeight: 800 }}>✓ {fertig}</div>
          ) : wahl === "trinken" ? (
            <>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Wie viel hast du getrunken?</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[200, 330, 500].map((ml) => (
                  <button key={ml} type="button" onClick={() => trinken(ml)} style={chip(aktiv.farbe)}>+{ml} ml</button>
                ))}
              </div>
            </>
          ) : wahl === "snack" ? (
            <>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Was hast du zwischendurch gegessen?</div>
              <EssenEingabe kompakt />
            </>
          ) : wahl === "nickerchen" ? (
            <>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Wie lange hast du geschlafen?</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[10, 20, 30, 60, 90].map((m) => (
                  <button key={m} type="button" onClick={() => nickerchen(m)} style={chip(aktiv.farbe)}>{m} Min.</button>
                ))}
              </div>
            </>
          ) : wahl === "einnahme" ? (
            <>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Was hast du zusätzlich genommen?</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {["Pre-Workout", "Koffein", "Kreatin", ...supplemente.map((s) => s.name)].filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 8).map((v) => (
                  <button key={v} type="button" onClick={() => einnahme(v)} style={{ ...chip("color-mix(in srgb, #FFF1CC var(--mp-flaeche), var(--mp-rand-dunkel))"), color: "var(--mp-text)", padding: "8px 12px", fontSize: 13 }}>{v}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Etwas anderes …" aria-label="Was hast du genommen?" style={feld} />
                <button type="button" onClick={() => einnahme(name.trim())} disabled={!name.trim()} style={{ ...chip(aktiv.farbe), opacity: name.trim() ? 1 : 0.5 }}>Dazu</button>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--mp-text-muted)", marginTop: 8 }}>Nur fürs Protokoll – geplante Supplemente und Medikamente hakst du wie gewohnt im Tagesplan ab.</div>
            </>
          ) : (
            <button type="button" onClick={() => onOeffnen(wahl)} style={{ ...chip(aktiv.farbe), width: "100%", padding: 14, fontSize: 16 }}>
              ▶ {aktiv.titel} öffnen
            </button>
          )}
          {fehler && <div style={{ color: "#C0392B", fontSize: 13, marginTop: 8 }}>{fehler}</div>}
        </div>
      )}
      <button type="button" onClick={onSchliessen} style={{ marginTop: 12, border: "none", background: "rgba(255,255,255,.9)", borderRadius: 99, padding: "8px 18px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
        ✕ Schließen
      </button>
    </div>
  );
}
