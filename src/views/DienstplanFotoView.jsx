import React, { useMemo, useRef, useState } from "react";
import { Shell, Card, PrimaryButton } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import TimeWheelField from "../ui/TimeWheelField";
import { cardBorder, danger, textMuted } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { toLocalISODate } from "../utils/dates";
import { plusTage, rollenZuordnung } from "../utils/schichtplan";
import { NOTIZ_MARKER, diensteAusZellen, zelleEindeutig, gueltigeZeit, kalenderEintragFuerTag, standardWochenStart, tageAusDiensten, varianteFuerTag } from "../utils/dienstplanFoto";
import { ausschnittVorbereiten, zellenErkennen } from "../utils/ocr";

// Dienstplan eintragen (28.09., Nutzerin): zwei gleichwertige Wege –
// selbst eintragen (Tage einzeln oder mehrere auf einmal, Zeit-Rad) oder
// abfotografieren: Foto → eigene Zeile mit
// dem Finger markieren → Texterkennung auf dem Gerät (kein Gemini) →
// Tabelle prüfen und korrigieren → Schichtplan (Routine-Zeiten je Tag) und
// Kalender „Mein Alltag“ (Arbeit). Geht genauso ohne Foto (manuell), und der
// Coach kann es im Verwalten-Modus für jede Woche nachträglich ändern.

const TAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const ARTEN = [
  { id: "arbeit", label: "Dienst" },
  { id: "frei", label: "Frei" },
  { id: "urlaub", label: "Urlaub" },
  { id: "krank", label: "Krank" },
  { id: "leer", label: "–" },
];

function tagLabel(iso) {
  const [j, m, d] = iso.split("-").map(Number);
  return `${TAGE[new Date(j, m - 1, d).getDay()]} ${d}.${m}.`;
}

const chip = (an) => ({
  border: "none",
  borderRadius: 99,
  padding: "6px 10px",
  fontSize: 12.5,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  background: an ? "#1B2350" : "#EEF4FF",
  color: an ? "#fff" : "#2D6FD6",
});
const zeitFeld = { border: `1px solid ${cardBorder}`, borderRadius: 10, padding: "6px 6px", fontSize: 14, fontFamily: "inherit", width: 112 };

export default function DienstplanFotoView({ onHome }) {
  const {
    routineVarianten = [],
    routineSchichtplan = {},
    routineEinstellungenStandard = {},
    routineVarianteSpeichern,
    routineSchichtplanSpeichern,
    alltagEintraege = [],
    alltagSpeichern,
    alltagLoeschen,
    aenderungVermerken,
  } = useAppData();
  const heute = toLocalISODate(new Date());
  const [start, setStart] = useState(() => standardWochenStart(heute));
  const [schritt, setSchritt] = useState("start"); // start | markieren | erkennen | pruefen | fertig
  const [bildUrl, setBildUrl] = useState(null);
  const [rahmen, setRahmen] = useState(null);
  const [fortschritt, setFortschritt] = useState(0);
  const [erkannt, setErkannt] = useState("");
  const [tage, setTage] = useState([]);
  const [anzahl, setAnzahl] = useState(7);
  const [inKalender, setInKalender] = useState(true);
  const [fehler, setFehler] = useState(null);
  const [ausFoto, setAusFoto] = useState(false);
  const [markiert, setMarkiert] = useState([]); // Datums-Liste für „mehrere Tage auf einmal“
  const [sammel, setSammel] = useState({ art: "arbeit", von: "", bis: "" });
  const [speichert, setSpeichert] = useState(false);
  const [ergebnis, setErgebnis] = useState(null);
  const bildRef = useRef(null);
  const ziehen = useRef(null);
  const rollen = useMemo(() => rollenZuordnung(routineVarianten), [routineVarianten]);

  const leereWoche = () => tageAusDiensten([], start, 7);

  const fotoGewaehlt = (e) => {
    const datei = e.target.files?.[0];
    e.target.value = "";
    if (!datei) return;
    if (bildUrl) URL.revokeObjectURL(bildUrl);
    setBildUrl(URL.createObjectURL(datei));
    setRahmen(null);
    setFehler(null);
    setSchritt("markieren");
  };

  const punkt = (e) => {
    const r = bildRef.current.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  const zugStart = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = punkt(e);
    ziehen.current = p;
    setRahmen({ x: p.x, y: p.y, w: 0, h: 0 });
  };
  const zugBewegen = (e) => {
    if (!ziehen.current) return;
    const a = ziehen.current;
    const p = punkt(e);
    setRahmen({ x: Math.min(a.x, p.x), y: Math.min(a.y, p.y), w: Math.abs(p.x - a.x), h: Math.abs(p.y - a.y) });
  };
  const zugEnde = () => (ziehen.current = null);

  const erkennen = async () => {
    setFehler(null);
    setSchritt("erkennen");
    setFortschritt(0);
    try {
      const canvas = ausschnittVorbereiten(bildRef.current, rahmen);
      const zellen = await zellenErkennen(canvas, anzahl, setFortschritt, zelleEindeutig);
      setErkannt(zellen.map((z, i) => `${tagLabel(plusTage(start, i))}: ${z || "–"}`).join("\n"));
      const dienste = diensteAusZellen(zellen);
      setAusFoto(true);
      setTage(tageAusDiensten(dienste, start, anzahl, rollen, routineVarianten));
      if (!dienste.some(Boolean)) setFehler("Ich konnte keine Zeiten lesen. Trag sie unten einfach ein oder markiere die Zeile neu.");
      setSchritt("pruefen");
    } catch (err) {
      console.error(err);
      setFehler("Die Erkennung hat nicht geklappt (Internet für den ersten Start nötig). Du kannst die Zeiten unten von Hand eintragen.");
      setTage(leereWoche());
      setSchritt("pruefen");
    }
  };

  const tagAendern = (i, feld, wert) => setTage((alt) => alt.map((t, k) => (k === i ? { ...t, [feld]: wert } : t)));
  const startAendern = (neu) => {
    setStart(neu);
    setTage((alt) => alt.map((t, i) => ({ ...t, datum: plusTage(neu, i) })));
  };

  const unvollstaendig = tage.some((t) => t.art === "arbeit" && (!gueltigeZeit(t.von) || !gueltigeZeit(t.bis)));

  const uebernehmen = async () => {
    setSpeichert(true);
    setFehler(null);
    try {
      const varianten = [...routineVarianten];
      const neuAngelegt = [];
      const planTage = [];
      for (const t of tage) {
        if (t.art === "leer") {
          const alt = routineSchichtplan[t.datum];
          if (alt) planTage.push({ datum: t.datum, ...alt });
          continue;
        }
        if (t.art === "krank") {
          planTage.push({ datum: t.datum, art: "krank" });
          continue;
        }
        const z = varianteFuerTag(t, varianten, routineEinstellungenStandard);
        let v = z.variante;
        if (z.neu) {
          const r = await routineVarianteSpeichern({ ...z.neu, reihenfolge: varianten.length });
          if (!r?.ok) throw new Error(r?.error || "Schicht-Zeit konnte nicht angelegt werden.");
          v = r.variante;
          varianten.push(v);
          neuAngelegt.push(v.name);
        }
        planTage.push({ datum: t.datum, varianteId: v?.id || null, art: "variante" });
      }
      const von = tage[0].datum;
      const bis = tage.at(-1).datum;
      const r = await routineSchichtplanSpeichern(planTage, von, bis);
      if (!r?.ok) throw new Error(r?.error || "Schichtplan konnte nicht gespeichert werden.");

      let kalender = 0;
      if (inKalender && alltagSpeichern) {
        // Frühere Foto-Einträge dieser Tage ersetzen (keine doppelten Dienste).
        for (const e of alltagEintraege) {
          if (e.notiz === NOTIZ_MARKER && e.datum && e.datum >= von && e.datum <= bis) await alltagLoeschen?.(e.id);
        }
        for (const t of tage) {
          const eintrag = kalenderEintragFuerTag(t);
          if (!eintrag) continue;
          const k = await alltagSpeichern(eintrag);
          if (k?.ok) kalender++;
        }
      }
      const dienste = tage.filter((t) => t.art === "arbeit").length;
      aenderungVermerken?.({
        kategorie: "morgenroutine",
        itemName: "Schichtplan",
        aktion: "geändert",
        detail: `Dienstplan ${tagLabel(von)}–${tagLabel(bis)} übernommen: ${dienste} Dienste${neuAngelegt.length ? `, neu: ${neuAngelegt.join(", ")}` : ""}`,
      });
      setErgebnis({ dienste, kalender, neuAngelegt });
      setSchritt("fertig");
    } catch (err) {
      setFehler(err.message || "Speichern fehlgeschlagen.");
    } finally {
      setSpeichert(false);
    }
  };

  return (
    <Shell>
      <ViewHeader title="🗓️ Dienstplan eintragen" onHome={onHome} />
      <div data-dienstplan-foto={schritt}>
        {schritt === "start" && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.45, marginBottom: 12 }}>
              Trag deine Dienste für die Woche ein – selbst oder per Foto. Deine Morgen- und Abendroutine richten sich dann an jedem Tag nach dem Dienst.
            </div>
            <WocheWahl start={start} onChange={setStart} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <button
                type="button"
                data-dienstplan-selbst
                onClick={() => {
                  setTage(leereWoche());
                  setAusFoto(false);
                  setMarkiert([]);
                  setSchritt("pruefen");
                }}
                className="mp-btn"
                style={{ border: "none", borderRadius: 16, padding: "16px 10px", background: "#1B2350", color: "#fff", fontWeight: 800, fontSize: 14.5, cursor: "pointer", fontFamily: "inherit" }}
              >
                ✍️ Selbst eintragen
              </button>
              <label style={{ display: "block" }}>
                <input type="file" accept="image/*" capture="environment" onChange={fotoGewaehlt} style={{ display: "none" }} data-dienstplan-datei />
                <span className="mp-btn" style={{ display: "block", textAlign: "center", borderRadius: 16, padding: "16px 10px", background: "#1B2350", color: "#fff", fontWeight: 800, fontSize: 14.5, cursor: "pointer" }}>
                  📷 Foto machen
                </span>
              </label>
            </div>
            <div style={{ fontSize: 12, color: textMuted, background: "#F4F7FC", borderRadius: 10, padding: "8px 10px", marginTop: 12, lineHeight: 1.45 }}>
              📷 Beim Foto liest die App die Zeiten auf deinem Handy (ohne KI, nichts wird hochgeladen), du prüfst alles vor dem Speichern. Am besten gerade von oben, gutes Licht, nah genug.
            </div>
          </Card>
        )}

        {schritt === "markieren" && bildUrl && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Zieh einen Rahmen um deine Dienste</div>
            <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 8 }}>Vom ersten bis zum letzten Tag deiner Zeile, ohne deinen Namen. Die App teilt den Rahmen in gleich breite Tage.</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, marginBottom: 10 }}>
              <span style={{ fontWeight: 700 }}>Tage im Rahmen:</span>
              {[7, 14].map((n) => (
                <button key={n} type="button" onClick={() => setAnzahl(n)} style={chip(anzahl === n)}>
                  {n}
                </button>
              ))}
            </div>
            <div onPointerDown={zugStart} onPointerMove={zugBewegen} onPointerUp={zugEnde} style={{ position: "relative", touchAction: "none", userSelect: "none", borderRadius: 10, overflow: "hidden" }} data-dienstplan-bild>
              <img ref={bildRef} src={bildUrl} alt="Dienstplan" draggable={false} style={{ width: "100%", display: "block" }} />
              {rahmen && (
                <div
                  style={{
                    position: "absolute",
                    left: `${rahmen.x * 100}%`,
                    top: `${rahmen.y * 100}%`,
                    width: `${rahmen.w * 100}%`,
                    height: `${rahmen.h * 100}%`,
                    border: "3px solid #2D6FD6",
                    background: "rgba(45,111,214,0.15)",
                    borderRadius: 4,
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="button" onClick={() => setSchritt("start")} style={{ ...chip(false), flex: 1, padding: "12px" }}>
                Zurück
              </button>
              <div style={{ flex: 2 }}>
                <PrimaryButton onClick={erkennen} disabled={!rahmen || rahmen.w < 0.03 || rahmen.h < 0.01}>
                  Zeiten lesen
                </PrimaryButton>
              </div>
            </div>
          </Card>
        )}

        {schritt === "erkennen" && (
          <Card style={{ marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 28 }}>🔎</div>
            <div style={{ fontWeight: 800, marginTop: 6 }}>Lese deine Zeile … {fortschritt ? `${fortschritt} %` : ""}</div>
            <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>Beim ersten Mal lädt die App kurz die Sprachdaten.</div>
          </Card>
        )}

        {schritt === "pruefen" && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>{ausFoto ? "Passt das so?" : "Deine Woche"}</div>
            <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 10 }}>Je Tag antippen: Dienst mit Uhrzeit, Frei, Urlaub oder Krank. „–“ lässt den Tag, wie er ist. Mit ☐ markierst du mehrere Tage und trägst sie auf einmal ein.</div>
            <WocheWahl start={start} onChange={startAendern} />
            {ausFoto && tage.some((t) => t.art === "leer") && (
              <div data-dienstplan-offen style={{ background: "#FFF6DC", color: "#7A5200", borderRadius: 10, padding: "8px 10px", fontSize: 12.5, margin: "10px 0 0" }}>
                {tage.filter((t) => t.art === "leer").length} Tage konnte ich nicht sicher lesen (gelb). Bitte antippen, oder „–“ lassen, wenn sich dort nichts ändert.
              </div>
            )}
            <SammelEingabe
              tage={tage}
              markiert={markiert}
              setMarkiert={setMarkiert}
              sammel={sammel}
              setSammel={setSammel}
              onAnwenden={() => {
                setTage((alt) => alt.map((t) => (markiert.includes(t.datum) ? { ...t, art: sammel.art, von: sammel.art === "arbeit" ? sammel.von : "", bis: sammel.art === "arbeit" ? sammel.bis : "" } : t)));
                setMarkiert([]);
              }}
            />
            <div style={{ marginTop: 10 }} data-dienstplan-tabelle>
              {tage.map((t, i) => {
                const z = varianteFuerTag(t, routineVarianten, routineEinstellungenStandard);
                const routine = z.variante || z.neu;
                return (
                  <div key={t.datum} data-dienstplan-tag={t.datum} style={{ borderTop: i ? `1px solid ${cardBorder}` : "none", padding: "10px 6px", margin: "0 -6px", borderRadius: 8, background: ausFoto && t.art === "leer" ? "#FFF6DC" : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        aria-pressed={markiert.includes(t.datum)}
                        aria-label={`${tagLabel(t.datum)} markieren`}
                        onClick={() => setMarkiert((m) => (m.includes(t.datum) ? m.filter((x) => x !== t.datum) : [...m, t.datum]))}
                        style={{ width: 74, display: "flex", alignItems: "center", gap: 5, border: "none", background: "none", padding: 0, fontWeight: 800, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit", color: "inherit" }}
                      >
                        <span style={{ fontSize: 15 }}>{markiert.includes(t.datum) ? "☑" : "☐"}</span>
                        {tagLabel(t.datum)}
                      </button>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {ARTEN.map((a) => (
                          <button key={a.id} type="button" onClick={() => tagAendern(i, "art", a.id)} style={chip(t.art === a.id)}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {t.art === "arbeit" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6, marginTop: 8 }}>
                        <div style={{ minWidth: 0 }}><TimeWheelField value={t.von} onChange={(v) => tagAendern(i, "von", v)} ariaLabel="Dienst von" /></div>
                        <span>–</span>
                        <div style={{ minWidth: 0 }}><TimeWheelField value={t.bis} onChange={(v) => tagAendern(i, "bis", v)} ariaLabel="Dienst bis" /></div>
                      </div>
                    )}
                    {routine && (t.art === "arbeit" || t.art === "frei" || t.art === "urlaub") && (
                      <div style={{ fontSize: 11.5, color: textMuted, marginTop: 5 }}>
                        {z.neu ? "neu: " : "→ "}
                        {routine.name}
                        {routine.morgenStart ? ` · ☀ ${routine.morgenStart}` : ""}
                        {routine.abendStart ? ` · 🌙 ${routine.abendStart}` : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, margin: "10px 0 12px" }}>
              <input type="checkbox" checked={inKalender} onChange={(e) => setInKalender(e.target.checked)} />
              Dienste auch in „Mein Alltag“ (Kalender) eintragen
            </label>
            {erkannt && (
              <details style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
                <summary>Gelesener Text</summary>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{erkannt}</pre>
              </details>
            )}
            {fehler && <div style={{ color: danger, fontSize: 13, marginBottom: 10 }}>{fehler}</div>}
            <PrimaryButton onClick={uebernehmen} disabled={speichert || unvollstaendig || !tage.some((t) => t.art !== "leer")}>
              {speichert ? "Speichere …" : "Übernehmen"}
            </PrimaryButton>
            {bildUrl && (
              <button type="button" onClick={() => setSchritt("markieren")} style={{ ...chip(false), marginTop: 8, width: "100%", padding: "10px 12px" }}>
                Zeile neu markieren
              </button>
            )}
          </Card>
        )}

        {schritt === "fertig" && ergebnis && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 28 }}>✅</div>
            <div style={{ fontWeight: 900, fontSize: 16, margin: "6px 0" }}>Dienstplan übernommen</div>
            <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.5 }}>
              {ergebnis.dienste} Dienste. Deine Routine-Zeiten richten sich an diesen Tagen nach dem Dienst.
              {ergebnis.kalender ? ` ${ergebnis.kalender} Einträge stehen im Kalender.` : ""}
              {ergebnis.neuAngelegt.length ? ` Neue Schicht-Zeiten: ${ergebnis.neuAngelegt.join(", ")} – anpassen unter „Routine-Zeiten & Schichtplan“.` : ""}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button type="button" onClick={() => (window.location.hash = "#/schichtplan")} style={{ ...chip(false), flex: 1, padding: "12px" }}>
                Schichtplan ansehen
              </button>
              <button
                type="button"
                onClick={() => {
                  setStart(plusTage(start, 7));
                  setSchritt("start");
                  setErgebnis(null);
                  setErkannt("");
                }}
                style={{ ...chip(true), flex: 1, padding: "12px" }}
              >
                Nächste Woche
              </button>
            </div>
          </Card>
        )}
      </div>
    </Shell>
  );
}

function WocheWahl({ start, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      <span style={{ fontWeight: 700 }}>Erster Tag:</span>
      <button type="button" onClick={() => onChange(plusTage(start, -7))} style={chip(false)} aria-label="Eine Woche früher">
        ‹
      </button>
      <input type="date" value={start} onChange={(e) => e.target.value && onChange(e.target.value)} style={{ ...zeitFeld, width: 140 }} data-dienstplan-start />
      <button type="button" onClick={() => onChange(plusTage(start, 7))} style={chip(false)} aria-label="Eine Woche später">
        ›
      </button>
    </div>
  );
}

// Mehrere Tage auf einmal (Nutzerin 28.09.: „für die ganze Woche einzeln den
// Tag wählen oder alle Tage auswählen“): Tage markieren, einmal Dienst und
// Zeit wählen, auf alle markierten Tage anwenden.
function SammelEingabe({ tage, markiert, setMarkiert, sammel, setSammel, onAnwenden }) {
  const wt = (iso) => {
    const [j, m, d] = iso.split("-").map(Number);
    return new Date(j, m - 1, d).getDay();
  };
  const schnell = [
    { label: "Alle", tage: tage.map((t) => t.datum) },
    { label: "Mo–Fr", tage: tage.filter((t) => wt(t.datum) >= 1 && wt(t.datum) <= 5).map((t) => t.datum) },
    { label: "Sa + So", tage: tage.filter((t) => wt(t.datum) === 0 || wt(t.datum) === 6).map((t) => t.datum) },
  ];
  const zeitFehlt = sammel.art === "arbeit" && (!gueltigeZeit(sammel.von) || !gueltigeZeit(sammel.bis));
  return (
    <div data-dienstplan-sammel style={{ background: "#F4F7FC", borderRadius: 12, padding: "10px 10px", marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 13 }}>
        <span style={{ fontWeight: 800 }}>Mehrere Tage:</span>
        {schnell.map((q) => (
          <button key={q.label} type="button" onClick={() => setMarkiert(q.tage)} style={chip(q.tage.length > 0 && q.tage.length === markiert.length && q.tage.every((d) => markiert.includes(d)))}>
            {q.label}
          </button>
        ))}
        {markiert.length > 0 && (
          <button type="button" onClick={() => setMarkiert([])} style={chip(false)}>
            keine
          </button>
        )}
      </div>
      {markiert.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {ARTEN.filter((a) => a.id !== "leer").map((a) => (
              <button key={a.id} type="button" onClick={() => setSammel((x) => ({ ...x, art: a.id }))} style={chip(sammel.art === a.id)}>
                {a.label}
              </button>
            ))}
          </div>
          {sammel.art === "arbeit" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 6, marginTop: 8 }}>
              <div style={{ minWidth: 0 }}><TimeWheelField value={sammel.von} onChange={(v) => setSammel((x) => ({ ...x, von: v }))} ariaLabel="Sammel von" /></div>
              <span>–</span>
              <div style={{ minWidth: 0 }}><TimeWheelField value={sammel.bis} onChange={(v) => setSammel((x) => ({ ...x, bis: v }))} ariaLabel="Sammel bis" /></div>
            </div>
          )}
          <button type="button" onClick={onAnwenden} disabled={zeitFehlt} style={{ ...chip(true), width: "100%", padding: "11px 12px", marginTop: 8, opacity: zeitFehlt ? 0.5 : 1 }}>
            Für {markiert.length} {markiert.length === 1 ? "Tag" : "Tage"} eintragen
          </button>
        </div>
      )}
    </div>
  );
}
