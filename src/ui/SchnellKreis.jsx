import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import EssenEingabe from "./EssenEingabe";
import SchnellIcon from "./SchnellIcon";

// Kreis-Schnellmenü (30.09., Nutzerin: „die Sachen, die spontan passieren
// können, in einem Kreis – was ich anwähle, erscheint am größten“). Öffnet
// sich über „⚡ Schnell“ in der Leiste. Feste Abläufe (Morgen-/Abendroutine,
// geplante Medikamente/Supplemente) gehören bewusst nicht hierher.
// Kleine Sachen (Getränk, Snack, Nickerchen, Einnahme) werden direkt hier
// eingetragen; Training/Workflow/Spielen öffnen ihre Auswahl.
const KREIS = [
  { id: "trinken", titel: "Getränk", hell: "#6FB2FF", farbe: "#2D6FD6" },
  { id: "snack", titel: "Snack", hell: "#5FD39A", farbe: "#1F8A5B" },
  { id: "nickerchen", titel: "Nickerchen", hell: "#A99BFF", farbe: "#5A48D0" },
  { id: "training", titel: "Training", hell: "#FF8A73", farbe: "#D13A26" },
  {
    id: "einnahme",
    titel: "Pre-Workout & Co.",
    hell: "#FFC05C",
    farbe: "#DB7A00",
  },
  { id: "workflow", titel: "Workflow", hell: "#F07BC0", farbe: "#A12A74" },
  { id: "spielen", titel: "Spielen", hell: "#9D8BFF", farbe: "#5B47E0" },
];

// Plastischer Look (30.09., Nutzerin: „plastischer, räumlicher Abstand, mit
// leichtem Schatten, als wenn es aufliegen würde“): Farbverlauf mit
// Lichtkante oben links, weiche Innenschatten und ein farbiger Schatten
// darunter. Der gewählte Kreis hebt sich deutlich ab (größer, höher, Glanzring).
const kugel = (k, an) => ({
  background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 42%), linear-gradient(155deg, ${k.hell} 0%, ${k.farbe} 78%)`,
  boxShadow: an
    ? `0 22px 40px -8px ${k.farbe}aa, 0 8px 16px rgba(16,24,40,.28), inset 0 2px 1px rgba(255,255,255,.55), inset 0 -8px 16px rgba(0,0,0,.18), 0 0 0 5px rgba(255,255,255,.95), 0 0 0 11px ${k.hell}55`
    : `0 12px 22px -6px ${k.farbe}99, 0 4px 8px rgba(16,24,40,.18), inset 0 2px 1px rgba(255,255,255,.5), inset 0 -6px 12px rgba(0,0,0,.16)`,
});

const chip = (farbe) => ({
  border: "none",
  borderRadius: 99,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  background: farbe,
  color: "#fff",
});
const feld = {
  flex: 1,
  minWidth: 0,
  border: "1.5px solid var(--mp-rand)",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 15,
  fontFamily: "inherit",
  background: "var(--mp-karte)",
  color: "inherit",
};

export default function SchnellKreis({ onSchliessen, onOeffnen }) {
  const {
    hydrationHinzufuegen,
    spontanSpeichern,
    aenderungVermerken,
    supplemente = [],
  } = useAppData();
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
    aenderungVermerken?.({
      kategorie: "schlaf",
      itemName: "Nickerchen",
      aktion: "erledigt",
      detail: `${min} Min.`,
    });
    erledigt(`Nickerchen ${min} Min. festgehalten 😴`);
  };
  const einnahme = async (was) => {
    const r = await spontanSpeichern?.({ art: "einnahme", name: was });
    if (r && r.ok === false) return setFehler(r.error);
    aenderungVermerken?.({
      kategorie: "supplement",
      itemName: was,
      aktion: "erledigt",
      detail: "zusätzlich, außerhalb des Plans",
    });
    erledigt(`${was} festgehalten ⚡`);
  };

  // Sieben Kreise rund um die Mitte; der gewählte wird groß und wandert in die Mitte.
  const R = 132;
  return (
    <div
      data-schnell-kreis
      role="dialog"
      aria-label="Schnellzugriff"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: "calc(110px + env(safe-area-inset-bottom))",
        background: "rgba(16, 24, 40, 0.45)",
        backdropFilter: "blur(3px)",
        overflowY: "auto",
      }}
      onClick={(e) => e.target === e.currentTarget && onSchliessen()}
    >
      <div
        style={{ position: "relative", width: 344, height: 344, flexShrink: 0 }}
      >
        {KREIS.map((k, i) => {
          const winkel = (-90 + (360 / KREIS.length) * i) * (Math.PI / 180);
          const an = wahl === k.id;
          const gross = an ? 118 : 68;
          const x = an ? 172 : 172 + R * Math.cos(winkel);
          const y = an ? 172 : 172 + R * Math.sin(winkel);
          return (
            <button
              key={k.id}
              type="button"
              aria-pressed={an}
              aria-label={k.titel}
              onClick={() => {
                setFehler(null);
                if (an && ["training", "workflow", "spielen"].includes(k.id))
                  return onOeffnen(k.id);
                setWahl(an ? null : k.id);
              }}
              style={{
                position: "absolute",
                left: x - gross / 2,
                top: y - gross / 2,
                width: gross,
                height: gross,
                borderRadius: 99,
                border: "none",
                ...kugel(k, an),
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                cursor: "pointer",
                fontFamily: "inherit",
                opacity: wahl && !an ? 0.6 : 1,
                transform: wahl && !an ? "scale(.92)" : "scale(1)",
                transition: "all .3s cubic-bezier(.2,.9,.3,1.2)",
                zIndex: an ? 2 : 1,
              }}
            >
              <span
                style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,.25))" }}
              >
                <SchnellIcon
                  name={k.id}
                  size={an ? 40 : 26}
                  strich={an ? 2 : 2.2}
                />
              </span>
              <span
                style={{
                  fontSize: an ? 13 : 9.5,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  textAlign: "center",
                  padding: "0 4px",
                }}
              >
                {k.titel}
              </span>
            </button>
          );
        })}
        {!wahl && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 122,
              top: 137,
              width: 100,
              textAlign: "center",
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            Was machst du gerade spontan?
          </div>
        )}
      </div>

      {(aktiv || fertig) && (
        <div
          data-schnell-aktion
          style={{
            width: "min(92vw, 420px)",
            marginTop: 8,
            padding: 14,
            borderRadius: 22,
            background: "var(--mp-karte)",
            color: "var(--mp-text)",
            boxShadow: "0 12px 32px rgba(0,0,0,.25)",
          }}
        >
          {fertig ? (
            <div
              role="status"
              style={{ textAlign: "center", fontSize: 16, fontWeight: 800 }}
            >
              ✓ {fertig}
            </div>
          ) : wahl === "trinken" ? (
            <>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>
                Wie viel hast du getrunken?
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[200, 330, 500].map((ml) => (
                  <button
                    key={ml}
                    type="button"
                    onClick={() => trinken(ml)}
                    style={chip(aktiv.farbe)}
                  >
                    +{ml} ml
                  </button>
                ))}
              </div>
            </>
          ) : wahl === "snack" ? (
            <>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>
                Was hast du zwischendurch gegessen?
              </div>
              <EssenEingabe kompakt />
            </>
          ) : wahl === "nickerchen" ? (
            <>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>
                Wie lange hast du geschlafen?
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[10, 20, 30, 60, 90].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => nickerchen(m)}
                    style={chip(aktiv.farbe)}
                  >
                    {m} Min.
                  </button>
                ))}
              </div>
            </>
          ) : wahl === "einnahme" ? (
            <>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>
                Was hast du zusätzlich genommen?
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                {[
                  "Pre-Workout",
                  "Koffein",
                  "Kreatin",
                  ...supplemente.map((s) => s.name),
                ]
                  .filter((v, i, a) => v && a.indexOf(v) === i)
                  .slice(0, 8)
                  .map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => einnahme(v)}
                      style={{
                        ...chip(
                          "color-mix(in srgb, #FFF1CC var(--mp-flaeche), var(--mp-rand-dunkel))",
                        ),
                        color: "var(--mp-text)",
                        padding: "8px 12px",
                        fontSize: 13,
                      }}
                    >
                      {v}
                    </button>
                  ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Etwas anderes …"
                  aria-label="Was hast du genommen?"
                  style={feld}
                />
                <button
                  type="button"
                  onClick={() => einnahme(name.trim())}
                  disabled={!name.trim()}
                  style={{
                    ...chip(aktiv.farbe),
                    opacity: name.trim() ? 1 : 0.5,
                  }}
                >
                  Dazu
                </button>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--mp-text-muted)",
                  marginTop: 8,
                }}
              >
                Nur fürs Protokoll – geplante Supplemente und Medikamente hakst
                du wie gewohnt im Tagesplan ab.
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onOeffnen(wahl)}
              style={{
                ...chip(aktiv.farbe),
                width: "100%",
                padding: 14,
                fontSize: 16,
              }}
            >
              ▶ {aktiv.titel} öffnen
            </button>
          )}
          {fehler && (
            <div style={{ color: "#C0392B", fontSize: 13, marginTop: 8 }}>
              {fehler}
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={onSchliessen}
        style={{
          marginTop: 12,
          border: "none",
          background: "rgba(255,255,255,.9)",
          borderRadius: 99,
          padding: "8px 18px",
          fontWeight: 800,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        ✕ Schließen
      </button>
    </div>
  );
}
