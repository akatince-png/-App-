import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { PrimaryButton } from "./primitives";
import { cardBorder, danger, textMuted } from "./theme";
import { useDiktat } from "./useDiktat";
import { MOMENT_GEFUEHLE, MOMENT_HILFE, OPTIONEN } from "../utils/tagebuch";

// "Moment festhalten" (25.09., Nutzerinnen-Vorgabe) im gelben 💡-Panel:
// was gerade los ist, wie stark, der Auslöser (auch per Sprache), wer
// dabei war, wo – und was geholfen hat. Freitext privat, außer geteilt.
const chip = (an) => ({
  border: "none",
  borderRadius: 99,
  padding: "7px 11px",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  background: an ? "#B45309" : "#fff",
  color: an ? "#fff" : "#B45309",
  boxShadow: "inset 0 0 0 1px rgba(217,119,6,.35)",
});

function Gruppe({ titel, werte, gewaehlt, onUmschalten }) {
  return (
    <>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "10px 0 6px" }}>{titel}</div>
      <div role="group" aria-label={titel} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {werte.map((w) => (
          <button key={w} type="button" aria-pressed={gewaehlt.includes(w)} style={chip(gewaehlt.includes(w))} onClick={() => onUmschalten(w)}>
            {w}
          </button>
        ))}
      </div>
    </>
  );
}

export default function MomentFesthalten({ onFertig, onAtmen }) {
  const { momentSpeichern } = useAppData();
  const [m, setM] = useState({ gefuehle: [], staerke: null, ausloeser: "", personen: [], orte: [], hilfe: [], notizTeilen: false });
  const [fehler, setFehler] = useState(null);
  const [gespeichert, setGespeichert] = useState(false);
  const diktat = useDiktat({ value: m.ausloeser, onChange: (v) => setM((x) => ({ ...x, ausloeser: v })) });
  const umschalten = (feld) => (w) => setM((x) => ({ ...x, [feld]: x[feld].includes(w) ? x[feld].filter((y) => y !== w) : [...x[feld], w] }));

  if (gespeichert) {
    return (
      <div>
        <div role="status" style={{ padding: 12, borderRadius: 12, background: "#fff", fontSize: 13.5, fontWeight: 700, color: "#B45309" }}>
          📝 Festgehalten. Das hilft später zu sehen, was solche Momente auslöst.
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {onAtmen && (
            <PrimaryButton onClick={onAtmen}>🌬️ Jetzt eine Atemübung</PrimaryButton>
          )}
          <PrimaryButton variant="ghost" onClick={onFertig}>
            Fertig
          </PrimaryButton>
        </div>
      </div>
    );
  }

  const speichern = async () => {
    setFehler(null);
    const r = await momentSpeichern?.(m);
    if (!r?.ok) return setFehler(r?.error || "Speichern fehlgeschlagen.");
    setGespeichert(true);
  };

  return (
    <section aria-label="Moment festhalten">
      <div style={{ fontSize: 14, fontWeight: 800, color: "#B45309" }}>📝 Moment festhalten</div>
      <Gruppe titel="WAS IST GERADE LOS?" werte={MOMENT_GEFUEHLE} gewaehlt={m.gefuehle} onUmschalten={umschalten("gefuehle")} />
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "10px 0 6px" }}>WIE STARK? (1 = LEICHT, 5 = SEHR)</div>
      <div role="group" aria-label="Wie stark?" style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-pressed={m.staerke === n} style={{ ...chip(m.staerke === n), minWidth: 40 }} onClick={() => setM((x) => ({ ...x, staerke: n }))}>
            {n}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "10px 0 6px" }}>WAS WAR DER AUSLÖSER? (OPTIONAL)</div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
        <textarea
          aria-label="Auslöser"
          rows={2}
          value={diktat.interim ? `${m.ausloeser} ${diktat.interim}`.trim() : m.ausloeser}
          onChange={(e) => setM((x) => ({ ...x, ausloeser: e.target.value }))}
          placeholder="z. B. Streit wegen Termin, zu viel Lärm im Büro"
          style={{ flex: 1, border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "8px 10px", fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
        />
        {diktat.verfuegbar && (
          <button type="button" onClick={diktat.umschalten} aria-label={diktat.hoert ? "Aufnahme stoppen" : "Diktieren"} style={{ border: "none", background: "#fff", borderRadius: 12, width: 44, height: 44, fontSize: 20, cursor: "pointer" }}>
            {diktat.hoert ? "⏹" : "🎤"}
          </button>
        )}
      </div>
      <Gruppe titel="WER WAR DABEI?" werte={OPTIONEN.personen} gewaehlt={m.personen} onUmschalten={umschalten("personen")} />
      <Gruppe titel="WO?" werte={OPTIONEN.orte} gewaehlt={m.orte} onUmschalten={umschalten("orte")} />
      <Gruppe titel="WAS HAT GEHOLFEN? (OPTIONAL)" werte={MOMENT_HILFE} gewaehlt={m.hilfe} onUmschalten={umschalten("hilfe")} />
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, marginTop: 10 }}>
        <input type="checkbox" checked={m.notizTeilen} onChange={(e) => setM((x) => ({ ...x, notizTeilen: e.target.checked }))} />
        <span>
          🔒 Auslöser auch für meinen Coach sichtbar <span style={{ color: textMuted }}>(sonst nur für dich)</span>
        </span>
      </label>
      {(fehler || diktat.fehler) && <div style={{ color: danger, fontSize: 12.5, marginTop: 6 }}>{fehler || diktat.fehler}</div>}
      <div style={{ marginTop: 10 }}>
        <PrimaryButton onClick={speichern}>Festhalten</PrimaryButton>
      </div>
    </section>
  );
}
