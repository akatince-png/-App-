import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { toLocalISODate } from "../utils/dates";
import { MIT_GRENZE, QUADRANT, mitsAm } from "../utils/matrix";
import { FREIWILLIG_GRENZE, aufgabeFuerTag, kandidatenFuer, stand } from "../utils/tagesabschluss";
import { istSession } from "../utils/projekt";

// ⭐ MITs wählen (24.10.): in der Abendroutine (Tagesabschluss → für morgen)
// und morgens bei „Top 3“ (für heute). Höchstens drei.
// 25.10. (Nutzerin): Priorität gut sichtbar, jedes Projekt nur einmal statt
// jeder Session, und 1–2 freiwillige Aufgaben dazu – die nie MIT sind.

function Prioritaet({ quadrant }) {
  const q = QUADRANT[quadrant] || QUADRANT.planen;
  return (
    <span data-prioritaet={q.id} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 99, fontSize: 10.5, fontWeight: 900, letterSpacing: 0.3, background: `color-mix(in srgb, ${q.bg} var(--mp-flaeche), var(--mp-rand-dunkel))`, color: `color-mix(in srgb, ${q.schrift} var(--mp-schrift), var(--mp-schrift-hell))` }}>
      <i style={{ width: 11, height: 11, borderRadius: 99, background: q.farbe }} />
      {q.titel}
    </span>
  );
}

export default function MitWahl({ datum, titel, mitFreiwillig = true }) {
  const { matrixAufgaben = [], projekte = [], matrixAufgabeSpeichern } = useAppData();
  const [hinweis, setHinweis] = useState(null);
  const [alle, setAlle] = useState(false);
  const [neu, setNeu] = useState("");
  const tag = toLocalISODate(datum);
  const kandidaten = kandidatenFuer(matrixAufgaben, projekte, datum).map((k) => ({ ...k, stand: stand(k, matrixAufgaben, datum) }));
  const mits = kandidaten.filter((k) => k.stand === "mit");
  const freiwillig = kandidaten.filter((k) => k.stand === "geplant");
  const rest = kandidaten.filter((k) => !k.stand);
  const anzahlMits = mitsAm(matrixAufgaben, tag).filter((a) => !a.erledigtAm).length;

  // Die gespeicherte(n) Aufgabe(n) eines Kandidaten an diesem Tag.
  const passende = (k) => (k.projektId ? matrixAufgaben.filter((a) => istSession(a, k.projektId) && !a.erledigtAm && (a.mitAm === tag || a.geplantAm === tag)) : matrixAufgaben.filter((a) => a.id === k.key));
  const speichern = (a) => matrixAufgabeSpeichern?.(a);

  const mitUmschalten = async (k) => {
    setHinweis(null);
    if (k.stand === "mit") return Promise.all(passende(k).filter((a) => a.mitAm === tag).map((a) => speichern({ ...a, mitAm: null })));
    if (anzahlMits >= MIT_GRENZE) return setHinweis(`Schon ${MIT_GRENZE} MITs – erst eine abwählen. Weniger ist mehr.`);
    const a = passende(k)[0] || aufgabeFuerTag(k, datum);
    await speichern({ ...a, mitAm: tag });
  };
  const freiwilligUmschalten = async (k) => {
    setHinweis(null);
    if (k.stand === "geplant") return Promise.all(passende(k).map((a) => speichern({ ...a, geplantAm: null })));
    if (freiwillig.length >= FREIWILLIG_GRENZE) return setHinweis(`${FREIWILLIG_GRENZE} freiwillige reichen völlig – kein Druck.`);
    const a = passende(k)[0] || aufgabeFuerTag(k, datum);
    await speichern({ ...a, mitAm: null, geplantAm: tag });
  };
  const neueFreiwillige = async () => {
    const t = neu.trim();
    if (!t) return;
    if (freiwillig.length >= FREIWILLIG_GRENZE) return setHinweis(`${FREIWILLIG_GRENZE} freiwillige reichen völlig – kein Druck.`);
    const r = await speichern({ titel: t, art: "aufgabe", wichtig: false, frist: null, geplantAm: tag });
    if (r?.ok !== false) setNeu("");
  };

  const zeile = (k, art) => {
    const an = art === "mit";
    const fw = art === "geplant";
    return (
      <div key={k.key} data-mit-kandidat={k.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 8px 6px", marginBottom: 6, borderRadius: 14, border: `1.5px solid ${an ? "#E0A21B" : "var(--mp-rand)"}`, background: an ? "color-mix(in srgb, #FFF1CC var(--mp-flaeche), var(--mp-karte))" : "var(--mp-karte)" }}>
        <button type="button" aria-pressed={an} aria-label={an ? `${k.titel}: MIT abwählen` : `${k.titel} als MIT wählen`} onClick={() => mitUmschalten(k)} style={{ border: "none", background: "transparent", fontSize: 22, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}>
          {an ? "⭐" : "☆"}
        </button>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700 }}>
          {k.projektId ? "🗂️ " : ""}
          {k.titel}
          {fw && <span style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--mp-text-muted)" }}>freiwillig – kein Muss</span>}
        </span>
        <Prioritaet quadrant={k.quadrant} />
        {mitFreiwillig && !an && (
          <button type="button" aria-pressed={fw} aria-label={fw ? `${k.titel}: nicht mehr freiwillig einplanen` : `${k.titel} freiwillig einplanen`} onClick={() => freiwilligUmschalten(k)} style={{ border: "none", borderRadius: 99, width: 30, height: 30, flexShrink: 0, cursor: "pointer", fontSize: 15, fontWeight: 900, background: fw ? "var(--mp-accent)" : "color-mix(in srgb, #EEF1F6 var(--mp-flaeche), var(--mp-rand-dunkel))", color: fw ? "#fff" : "var(--mp-text)" }}>
            {fw ? "✓" : "＋"}
          </button>
        )}
      </div>
    );
  };

  const sichtbar = alle ? rest : rest.slice(0, 8);
  return (
    <div data-mit-wahl style={{ textAlign: "left", marginTop: 14 }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{titel}</div>
      <div style={{ fontSize: 12, color: "var(--mp-text-muted)", marginBottom: 8 }}>
        ☆ antippen = eine deiner 1–{MIT_GRENZE} wichtigsten Aufgaben (MIT). {anzahlMits} von {MIT_GRENZE} gewählt.
        {mitFreiwillig ? ` ＋ = freiwillig dazu (höchstens ${FREIWILLIG_GRENZE}, nie MIT).` : ""}
      </div>
      {mits.map((k) => zeile(k, "mit"))}
      {freiwillig.length > 0 && (
        <div data-freiwillig style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mp-text-muted)", margin: "0 2px 6px" }}>FREIWILLIG DAZU</div>
          {freiwillig.map((k) => zeile(k, "geplant"))}
        </div>
      )}
      {rest.length > 0 && <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mp-text-muted)", margin: "10px 2px 6px" }}>ZUR AUSWAHL</div>}
      {sichtbar.map((k) => zeile(k, null))}
      {!alle && rest.length > 8 && (
        <button type="button" onClick={() => setAlle(true)} style={{ border: "none", background: "transparent", padding: "2px", fontSize: 12.5, fontWeight: 800, color: "var(--mp-accent-dark-text)", cursor: "pointer", fontFamily: "inherit" }}>
          + {rest.length - 8} weitere anzeigen
        </button>
      )}
      {!kandidaten.length && <div style={{ fontSize: 12.5, color: "var(--mp-text-muted)" }}>Noch keine offenen Aufgaben in deiner Matrix.</div>}
      {mitFreiwillig && freiwillig.length < FREIWILLIG_GRENZE && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input value={neu} onChange={(e) => setNeu(e.target.value)} onKeyDown={(e) => e.key === "Enter" && neueFreiwillige()} placeholder="Neue freiwillige Aufgabe …" aria-label="Neue freiwillige Aufgabe" style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--mp-rand)", borderRadius: 12, padding: "8px 10px", fontSize: 14, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" }} />
          <button type="button" onClick={neueFreiwillige} disabled={!neu.trim()} style={{ border: "none", borderRadius: 12, padding: "8px 12px", fontWeight: 800, fontFamily: "inherit", cursor: "pointer", background: "var(--mp-accent)", color: "#fff", opacity: neu.trim() ? 1 : 0.5 }}>
            ＋
          </button>
        </div>
      )}
      {hinweis && <div role="status" style={{ fontSize: 12.5, color: "color-mix(in srgb, #8A5A00 var(--mp-schrift), var(--mp-schrift-hell))", marginTop: 6 }}>{hinweis}</div>}
    </div>
  );
}
