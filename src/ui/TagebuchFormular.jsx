import React, { useMemo, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { PrimaryButton } from "./primitives";
import { cardBorder, danger, textMuted } from "./theme";
import { useDiktat } from "./useDiktat";
import { OPTIONEN, STIMMUNGEN, autoWerte, autoZeilen, tagebuchZeile } from "../utils/tagebuch";

// Tagebuch-Eintrag für einen Tag (25.09., Vorschau freigegeben): Stimmung,
// Ort, Personen – optional Essen, Tagesart, Körper, freie Notiz (Diktat
// möglich). Die freie Notiz ist privat, außer man teilt sie ausdrücklich
// mit dem Coach. Automatische Tageswerte trägt die App selbst ein.
const chip = (an) => ({
  border: "none",
  borderRadius: 99,
  padding: "7px 11px",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  background: an ? "#1B2350" : "#EEF4FF",
  color: an ? "#fff" : "#2D6FD6",
});

const TITEL = { orte: "Wo warst du vor allem?", personen: "Mit wem?", essen: "Essen heute", tagesart: "Der Tag war …", koerper: "Körper / Sonstiges" };

export default function TagebuchFormular({ datum, vorhanden, kompakt = false, onGespeichert }) {
  const appData = useAppData();
  const { tagebuchSpeichern, aenderungVermerken } = appData;
  const [e, setE] = useState(() => vorhanden || { datum, stimmung: null, orte: [], personen: [], essen: [], tagesart: [], koerper: [], notiz: "", notizTeilen: false });
  const [mehr, setMehr] = useState(!kompakt);
  const [fehler, setFehler] = useState(null);
  const [speichert, setSpeichert] = useState(false);
  const diktat = useDiktat({ value: e.notiz, onChange: (v) => setE((x) => ({ ...x, notiz: v })) });
  const auto = useMemo(() => autoWerte(datum, appData), [datum, appData]);

  const umschalten = (feld, wert) => setE((x) => ({ ...x, [feld]: x[feld].includes(wert) ? x[feld].filter((w) => w !== wert) : [...x[feld], wert] }));

  const speichern = async () => {
    setFehler(null);
    setSpeichert(true);
    const r = await tagebuchSpeichern({ ...e, datum, auto });
    setSpeichert(false);
    if (!r?.ok) return setFehler(r?.error || "Speichern fehlgeschlagen.");
    aenderungVermerken?.({ kategorie: "tagebuch", itemName: "Tagebuch", aktion: vorhanden ? "geändert" : "hinzugefügt", detail: tagebuchZeile(r.eintrag) });
    onGespeichert?.(r.eintrag);
  };

  const gruppe = (feld) => (
    <div key={feld}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>{TITEL[feld].toUpperCase()}</div>
      <div role="group" aria-label={TITEL[feld]} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {OPTIONEN[feld].map((w) => (
          <button key={w} type="button" aria-pressed={e[feld].includes(w)} className="mp-tap" style={chip(e[feld].includes(w))} onClick={() => umschalten(feld, w)}>
            {w}
          </button>
        ))}
      </div>
    </div>
  );

  const zeilen = autoZeilen(auto);
  return (
    <div>
      <div role="group" aria-label="Wie war dein Tag?" style={{ display: "flex", gap: 4, justifyContent: "space-between" }}>
        {STIMMUNGEN.map((s) => (
          <button
            key={s.wert}
            type="button"
            aria-label={s.label}
            aria-pressed={e.stimmung === s.wert}
            className="mp-tap"
            onClick={() => setE((x) => ({ ...x, stimmung: s.wert }))}
            style={{ fontSize: 30, border: "none", borderRadius: 14, padding: 6, cursor: "pointer", background: e.stimmung === s.wert ? "#FFF1D6" : "transparent", outline: e.stimmung === s.wert ? "2px solid #E0A21B" : "none" }}
          >
            {s.emoji}
          </button>
        ))}
      </div>
      {gruppe("orte")}
      {gruppe("personen")}
      {zeilen.length > 0 && (
        <>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>WEISS DIE APP SCHON</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {zeilen.map((z) => (
              <div key={z} style={{ background: "#F4F6FA", borderRadius: 10, padding: "6px 8px", fontSize: 12 }}>
                {z}
              </div>
            ))}
          </div>
        </>
      )}
      {mehr ? (
        <>
          {gruppe("essen")}
          {gruppe("tagesart")}
          {gruppe("koerper")}
          <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>WAS WAR BESONDERS? (OPTIONAL)</div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <textarea
              value={diktat.interim ? `${e.notiz} ${diktat.interim}`.trim() : e.notiz}
              onChange={(ev) => setE((x) => ({ ...x, notiz: ev.target.value }))}
              rows={3}
              aria-label="Was war besonders?"
              placeholder="z. B. Spaziergang mit Lena, danach richtig klarer Kopf"
              style={{ flex: 1, border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "9px 11px", fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
            />
            {diktat.verfuegbar && (
              <button type="button" onClick={diktat.umschalten} aria-label={diktat.hoert ? "Aufnahme stoppen" : "Diktieren"} style={{ border: "none", background: diktat.hoert ? "#FBEAE7" : "#EEF4FF", borderRadius: 12, width: 44, height: 44, fontSize: 20, cursor: "pointer" }}>
                {diktat.hoert ? "⏹" : "🎤"}
              </button>
            )}
          </div>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, marginTop: 8 }}>
            <input type="checkbox" checked={e.notizTeilen} onChange={(ev) => setE((x) => ({ ...x, notizTeilen: ev.target.checked }))} />
            <span>
              🔒 Notiz auch für meinen Coach sichtbar <span style={{ color: textMuted }}>(sonst nur für dich)</span>
            </span>
          </label>
        </>
      ) : (
        <button type="button" onClick={() => setMehr(true)} style={{ ...chip(false), marginTop: 12, background: "transparent", color: textMuted, padding: "6px 0" }}>
          + Essen, Tagesart, Notiz (optional)
        </button>
      )}
      {(fehler || diktat.fehler) && <div style={{ color: danger, fontSize: 12.5, marginTop: 8 }}>{fehler || diktat.fehler}</div>}
      <div style={{ marginTop: 12 }}>
        <PrimaryButton onClick={speichern} disabled={!e.stimmung || speichert}>
          {vorhanden ? "Änderung speichern" : "Fertig"}
        </PrimaryButton>
      </div>
    </div>
  );
}
