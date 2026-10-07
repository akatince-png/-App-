import React, { useMemo, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { PrimaryButton } from "./primitives";
import { cardBorder, danger, textMuted } from "./theme";
import { useDiktat } from "./useDiktat";
import { OPTIONEN, STICHWORTE, STIMMUNGEN, autoWerte, autoZeilen, tagebuchZeile } from "../utils/tagebuch";

// Tagebuch-Eintrag für einen Tag (25.09., Vorschau freigegeben): Stimmung,
// Ort, Personen – optional Essen, Tagesart, Körper, freie Notiz (Diktat
// möglich). Die freie Notiz ist privat, außer man teilt sie ausdrücklich
// mit dem Coach. Automatische Tageswerte trägt die App selbst ein.
// Stichworte (07.10., Nutzerin): grüne und rote Wörter zum Antippen, je Wort
// ein freiwilliges „weil …“. Ort, Menschen, Essen, Körper stehen in der
// kompakten Abend-Variante zugeklappt unter „Mehr dazu“.
const chip = (an) => ({
  border: "none",
  borderRadius: 99,
  padding: "7px 11px",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  background: an ? "#1B2350" : "color-mix(in srgb, #EEF4FF var(--mp-flaeche), var(--mp-karte))",
  color: an ? "#fff" : "#2D6FD6",
});

const WORT_FARBE = {
  gut: { an: "#2FA36B", aus: "color-mix(in srgb, #E3F5EC var(--mp-flaeche), var(--mp-karte))", text: "color-mix(in srgb, #1E7A50 var(--mp-schrift), var(--mp-schrift-hell))" },
  schwer: { an: "#D9483B", aus: "color-mix(in srgb, #FBE6E3 var(--mp-flaeche), var(--mp-karte))", text: "color-mix(in srgb, #B4382A var(--mp-schrift), var(--mp-schrift-hell))" },
};

const TITEL = { orte: "Wo warst du vor allem?", personen: "Mit wem?", essen: "Essen heute", tagesart: "Der Tag war …", koerper: "Körper / Sonstiges" };

export default function TagebuchFormular({ datum, vorhanden, kompakt = false, onGespeichert }) {
  const appData = useAppData();
  const { tagebuchSpeichern, aenderungVermerken } = appData;
  const [e, setE] = useState(() => ({ stichworte: [], ...(vorhanden || { datum, stimmung: null, orte: [], personen: [], essen: [], tagesart: [], koerper: [], notiz: "", notizTeilen: false }) }));
  const [eigenesWort, setEigenesWort] = useState("");
  const [mehr, setMehr] = useState(!kompakt);
  const [fehler, setFehler] = useState(null);
  const [speichert, setSpeichert] = useState(false);
  const diktat = useDiktat({ value: e.notiz, onChange: (v) => setE((x) => ({ ...x, notiz: v })) });
  const auto = useMemo(() => autoWerte(datum, appData), [datum, appData]);

  // Eigene Einträge (29.09., Nutzerin: „bei Mit wem und Wo auch selber
  // eintragen, falls jemand nicht in der Liste steht“): werden als
  // zusätzliche, ausgewählte Chips gespeichert.
  const [eigen, setEigen] = useState({ orte: "", personen: "" });
  const eigenesHinzufuegen = (feld) => {
    const wert = (eigen[feld] || "").trim();
    if (!wert) return;
    setE((x) => ({ ...x, [feld]: x[feld].includes(wert) ? x[feld] : [...x[feld], wert] }));
    setEigen((x) => ({ ...x, [feld]: "" }));
  };

  const wortAn = (wort) => e.stichworte.some((x) => x.wort === wort);
  const wortUmschalten = (wort, art) =>
    setE((x) => ({ ...x, stichworte: x.stichworte.some((w) => w.wort === wort) ? x.stichworte.filter((w) => w.wort !== wort) : [...x.stichworte, { wort, art, weil: "" }] }));
  const weilSetzen = (wort, weil) => setE((x) => ({ ...x, stichworte: x.stichworte.map((w) => (w.wort === wort ? { ...w, weil } : w)) }));
  const eigenesWortDazu = (art) => {
    const wort = eigenesWort.trim();
    if (!wort) return;
    if (!wortAn(wort)) wortUmschalten(wort, art);
    setEigenesWort("");
  };

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
        {[...OPTIONEN[feld], ...e[feld].filter((w) => !OPTIONEN[feld].includes(w))].map((w) => (
          <button key={w} type="button" aria-pressed={e[feld].includes(w)} className="mp-tap" style={chip(e[feld].includes(w))} onClick={() => umschalten(feld, w)}>
            {w}
          </button>
        ))}
      </div>
      {feld in eigen && (
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <input
            value={eigen[feld]}
            onChange={(ev) => setEigen((x) => ({ ...x, [feld]: ev.target.value }))}
            onKeyDown={(ev) => ev.key === "Enter" && (ev.preventDefault(), eigenesHinzufuegen(feld))}
            aria-label={feld === "personen" ? "Andere Person eintragen" : "Anderen Ort eintragen"}
            placeholder={feld === "personen" ? "Jemand anderes? z. B. Tante Rosi" : "Woanders? z. B. Fitnessstudio"}
            style={{ flex: 1, minWidth: 0, border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "7px 10px", fontSize: 13.5, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" }}
          />
          <button type="button" onClick={() => eigenesHinzufuegen(feld)} disabled={!eigen[feld].trim()} style={{ ...chip(false), opacity: eigen[feld].trim() ? 1 : 0.5 }}>
            + Dazu
          </button>
        </div>
      )}
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
            style={{ fontSize: 30, border: "none", borderRadius: 14, padding: 6, cursor: "pointer", background: e.stimmung === s.wert ? "color-mix(in srgb, #FFF1D6 var(--mp-flaeche), var(--mp-karte))" : "transparent", outline: e.stimmung === s.wert ? "2px solid #E0A21B" : "none" }}
          >
            {s.emoji}
          </button>
        ))}
      </div>
      <div data-stichworte>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>IN STICHWORTEN – TIPP AN, WAS PASST</div>
        {["gut", "schwer"].map((art) => (
          <div key={art} role="group" aria-label={art === "gut" ? "Gute Stichworte" : "Schwere Stichworte"} style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
            {[...STICHWORTE[art], ...e.stichworte.filter((w) => w.art === art && !STICHWORTE[art].includes(w.wort)).map((w) => w.wort)].map((wort) => {
              const an = wortAn(wort);
              const f = WORT_FARBE[art];
              return (
                <button key={wort} type="button" aria-pressed={an} data-wort-art={art} className="mp-tap" onClick={() => wortUmschalten(wort, art)} style={{ ...chip(an), background: an ? f.an : f.aus, color: an ? "#fff" : f.text, fontWeight: 800 }}>
                  {wort}
                </button>
              );
            })}
          </div>
        ))}
        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
          <input
            value={eigenesWort}
            onChange={(ev) => setEigenesWort(ev.target.value)}
            aria-label="Eigenes Stichwort"
            placeholder="Eigenes Wort …"
            style={{ flex: 1, minWidth: 0, border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "7px 10px", fontSize: 13.5, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" }}
          />
          <button type="button" onClick={() => eigenesWortDazu("gut")} disabled={!eigenesWort.trim()} style={{ ...chip(false), background: WORT_FARBE.gut.aus, color: WORT_FARBE.gut.text, opacity: eigenesWort.trim() ? 1 : 0.5 }}>
            + grün
          </button>
          <button type="button" onClick={() => eigenesWortDazu("schwer")} disabled={!eigenesWort.trim()} style={{ ...chip(false), background: WORT_FARBE.schwer.aus, color: WORT_FARBE.schwer.text, opacity: eigenesWort.trim() ? 1 : 0.5 }}>
            + rot
          </button>
        </div>
        {e.stichworte.length > 0 && (
          <>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>WEIL … (FREIWILLIG)</div>
            {e.stichworte.map((w) => (
              <label key={w.wort} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, fontSize: 13 }}>
                <b style={{ flexShrink: 0, color: WORT_FARBE[w.art]?.text }}>{w.wort},</b>
                <input
                  value={w.weil || ""}
                  onChange={(ev) => weilSetzen(w.wort, ev.target.value)}
                  aria-label={`${w.wort}, weil`}
                  placeholder="weil …"
                  style={{ flex: 1, minWidth: 0, border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "7px 10px", fontSize: 13.5, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" }}
                />
              </label>
            ))}
          </>
        )}
      </div>
      {mehr && gruppe("orte")}
      {mehr && gruppe("personen")}
      {mehr && zeilen.length > 0 && (
        <>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>WEISS DIE APP SCHON</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {zeilen.map((z) => (
              <div key={z} style={{ background: "color-mix(in srgb, #F4F6FA var(--mp-flaeche), var(--mp-karte))", borderRadius: 10, padding: "6px 8px", fontSize: 12 }}>
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
        </>
      ) : (
        <button type="button" onClick={() => setMehr(true)} style={{ ...chip(false), marginTop: 12, background: "transparent", color: textMuted, padding: "6px 0" }}>
          + Mehr dazu: Ort, Menschen, Essen, Körper (optional)
        </button>
      )}
      {/* Freitext immer sichtbar und größer (29.09., Nutzerin: „mehr Textbereich, ein Fenster zum Reinschreiben“). */}
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>WAS WAR BESONDERS? (OPTIONAL)</div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
        <textarea
          value={diktat.interim ? `${e.notiz} ${diktat.interim}`.trim() : e.notiz}
          onChange={(ev) => setE((x) => ({ ...x, notiz: ev.target.value }))}
          rows={5}
          aria-label="Was war besonders?"
          placeholder="z. B. Spaziergang mit Lena, danach richtig klarer Kopf"
          style={{ flex: 1, border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "9px 11px", fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
        />
        {diktat.verfuegbar && (
          <button type="button" onClick={diktat.umschalten} aria-label={diktat.hoert ? "Aufnahme stoppen" : "Diktieren"} style={{ border: "none", background: diktat.hoert ? "color-mix(in srgb, #FBEAE7 var(--mp-flaeche), var(--mp-karte))" : "color-mix(in srgb, #EEF4FF var(--mp-flaeche), var(--mp-karte))", borderRadius: 12, width: 44, height: 44, fontSize: 20, cursor: "pointer" }}>
            {diktat.hoert ? "⏹" : "🎤"}
          </button>
        )}
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, marginTop: 8 }}>
        <input type="checkbox" checked={e.notizTeilen} onChange={(ev) => setE((x) => ({ ...x, notizTeilen: ev.target.checked }))} />
        <span>
          🔒 Notiz und „weil …“ auch für meinen Coach sichtbar <span style={{ color: textMuted }}>(sonst nur für dich)</span>
        </span>
      </label>
      {(fehler || diktat.fehler) && <div style={{ color: danger, fontSize: 12.5, marginTop: 8 }}>{fehler || diktat.fehler}</div>}
      <div style={{ marginTop: 12 }}>
        <PrimaryButton onClick={speichern} disabled={!e.stimmung || speichert}>
          {vorhanden ? "Änderung speichern" : "Fertig"}
        </PrimaryButton>
      </div>
    </div>
  );
}
