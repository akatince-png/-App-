import React, { useEffect, useMemo, useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { useTagesBloecke } from "../data/useTagesBloecke";
import { addDays, toLocalISODate } from "../utils/dates";
import { hhmm } from "../utils/kalender";
import { ART, FRISTEN, MIT_GRENZE, QUADRANT, QUADRANTEN, fristAus, mitsAm, nachQuadrant } from "../utils/matrix";
import { bg, textMain, textMuted } from "../ui/theme";

// Tafel fürs Tablet (24.10., Nutzerin: „wenn ich morgens an mein Tablet gehe
// … ein größeres Widget, wo meine To-dos, mein Tagesplan und mein
// Wochenplan drinstehen, ohne immer die App direkt öffnen zu müssen“). Echte
// Widgets gehen als Web-App nicht – die Tafel ist eine ruhige Übersicht mit
// eigenem Symbol, die neben anderen Apps (geteilter Bildschirm) offen bleiben
// kann. Drei Spalten: To-dos (Matrix) · Heute · Woche. Abhaken geht für
// Matrix-Aufgaben und „Mein Alltag“-Einträge direkt hier.

const spalte = { background: "var(--mp-karte)", borderRadius: 22, padding: "16px 16px 10px", boxShadow: "var(--mp-schatten)", minWidth: 0 };
const kopf = { fontSize: 17, fontWeight: 900, color: textMain, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" };
const haken = (an, farbe) => ({ width: 32, height: 32, borderRadius: 99, border: an ? "none" : `2px solid ${farbe}`, background: an ? farbe : "transparent", color: an ? "#fff" : farbe, fontWeight: 900, cursor: "pointer", flexShrink: 0, fontFamily: "inherit" });
const zeile = { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--mp-rand)" };

export default function TafelView({ onHome }) {
  const { matrixAufgaben = [], matrixAufgabeSpeichern, alltagAbhaken } = useAppData();
  const bloeckeFuer = useTagesBloecke();
  const [jetzt, setJetzt] = useState(() => new Date());
  const [neu, setNeu] = useState("");
  // Deadline wie in der Matrix immer abfragen (24.10.).
  const [frist, setFrist] = useState(null);
  const [fristDatum, setFristDatum] = useState("");
  const fristFehlt = frist === null || (frist === "datum" && !fristDatum);
  useEffect(() => {
    const id = setInterval(() => setJetzt(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const heute = useMemo(() => new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate()), [jetzt]);
  const heuteStr = toLocalISODate(heute);
  const jetztMin = jetzt.getHours() * 60 + jetzt.getMinutes();
  const quadranten = nachQuadrant(matrixAufgaben, jetzt);
  const offen = QUADRANTEN.reduce((n, q) => n + quadranten[q.id].length, 0);
  const heuteBloecke = bloeckeFuer(heute);
  const ohneUhrzeit = matrixAufgaben.filter((a) => a.geplantAm === heuteStr && !a.uhrzeit && !a.erledigtAm && a.mitAm !== heuteStr);
  const woche = Array.from({ length: 6 }, (_, i) => addDays(heute, i + 1));
  const mits = mitsAm(matrixAufgaben, heuteStr);

  const matrixHaken = (a) => matrixAufgabeSpeichern?.({ ...a, erledigtAm: a.erledigtAm ? null : new Date().toISOString() });
  const blockHaken = (b) => {
    if (b.matrix) return matrixHaken(b.matrix);
    if (b.alltag) return alltagAbhaken?.(b.alltag.id, heuteStr);
  };
  const hinzufuegen = async () => {
    const titel = neu.trim();
    if (!titel || fristFehlt) return;
    const r = await matrixAufgabeSpeichern?.({ titel, wichtig: true, art: "aufgabe", frist: fristAus(frist, fristDatum) });
    if (r?.ok !== false) {
      setNeu("");
      setFrist(null);
      setFristDatum("");
    }
  };

  return (
    <div data-tafel style={{ minHeight: "100vh", background: bg, color: textMain, fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "calc(20px + env(safe-area-inset-top, 0px)) 16px 110px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button type="button" onClick={onHome} aria-label="Zur Startseite" style={{ width: 40, height: 40, borderRadius: 20, border: "1px solid var(--mp-rand)", background: "var(--mp-karte)", color: textMain, fontSize: 18, cursor: "pointer" }}>
            ‹
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: textMuted }}>{jetzt.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>🖥️ Meine Tafel</div>
          </div>
          <div aria-label="Uhrzeit" style={{ fontSize: 34, fontWeight: 300, letterSpacing: -1 }}>{hhmm(jetztMin)}</div>
        </div>

        <div className="mp-tafel-raster">
          {/* To-dos aus der Matrix */}
          <section data-tafel-todos style={spalte} aria-label="To-dos">
            <div style={kopf}>
              <span>✅ To-dos</span>
              <a href="#/matrix" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mp-accent-dark-text)", textDecoration: "none" }}>Matrix ›</a>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                hinzufuegen();
              }}
              style={{ display: "flex", gap: 6, marginBottom: 6 }}
            >
              <input value={neu} onChange={(e) => setNeu(e.target.value)} placeholder="Neue Aufgabe …" aria-label="Neue Aufgabe" style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--mp-rand)", borderRadius: 12, padding: "8px 10px", fontSize: 14, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" }} />
              <button type="submit" disabled={!neu.trim() || fristFehlt} style={{ border: "none", borderRadius: 12, padding: "0 12px", fontWeight: 800, background: "var(--mp-accent)", color: "#fff", cursor: "pointer", opacity: neu.trim() && !fristFehlt ? 1 : 0.5, fontFamily: "inherit" }}>
                ＋
              </button>
            </form>
            {neu.trim() && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: textMuted, marginBottom: 4 }}>⏰ Deadline – bis wann?</div>
                <div role="group" aria-label="Bis wann?" style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {FRISTEN.map(([id, l]) => (
                    <button key={id} type="button" aria-pressed={frist === id} onClick={() => setFrist(id)} style={{ border: "none", borderRadius: 99, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: frist === id ? "var(--mp-accent)" : "color-mix(in srgb, #EEF1F6 var(--mp-flaeche), var(--mp-rand-dunkel))", color: frist === id ? "#fff" : "var(--mp-text)" }}>
                      {l}
                    </button>
                  ))}
                </div>
                {frist === "datum" && <input type="date" value={fristDatum} onChange={(e) => setFristDatum(e.target.value)} aria-label="Deadline-Datum" style={{ marginTop: 6, border: "1.5px solid var(--mp-rand)", borderRadius: 10, padding: "5px 8px", fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" }} />}
              </div>
            )}
            {!offen && <div style={{ fontSize: 13, color: textMuted, padding: "8px 0" }}>Keine offenen Aufgaben. 🎉</div>}
            {QUADRANTEN.map((q) =>
              quadranten[q.id].length ? (
                <div key={q.id} data-tafel-quadrant={q.id} style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: q.farbe, letterSpacing: 0.3 }}>
                    {q.icon} {q.titel}
                  </div>
                  {quadranten[q.id].map((a) => (
                    <div key={a.id} style={zeile}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontWeight: 700, fontSize: 14 }}>
                          {a.mitAm === heuteStr ? "⭐ " : ""}
                          {a.art && a.art !== "aufgabe" ? `${ART[a.art]?.icon || ""} ` : ""}
                          {a.titel}
                        </span>
                        <span style={{ display: "block", fontSize: 11.5, color: textMuted }}>
                          {[a.geplantAm && `📅 ${new Date(`${a.geplantAm}T12:00:00`).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric" })}${a.uhrzeit ? ` ${a.uhrzeit}` : ""}`, a.frist && `bis ${new Date(`${a.frist}T12:00:00`).toLocaleDateString("de-DE", { day: "numeric", month: "numeric" })}`, a.erinnerung && "🔔"].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <button type="button" aria-label={`${a.titel} erledigt`} onClick={() => matrixHaken(a)} style={haken(false, q.farbe)}>
                        ✓
                      </button>
                    </div>
                  ))}
                </div>
              ) : null
            )}
          </section>

          {/* Heute */}
          <section data-tafel-heute style={spalte} aria-label="Heute">
            <div style={kopf}>
              <span>📅 Heute</span>
              <a href="#/tagesplan" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mp-accent-dark-text)", textDecoration: "none" }}>Tagesplan ›</a>
            </div>
            {/* ⭐ MITs ganz oben (24.10.) */}
            <div data-tafel-mits style={{ borderRadius: 14, padding: "8px 10px", marginBottom: 8, background: "color-mix(in srgb, #FFF1CC var(--mp-flaeche), var(--mp-karte))" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "color-mix(in srgb, #8A5A00 var(--mp-schrift), var(--mp-schrift-hell))" }}>⭐ DEINE MITs HEUTE · {mits.length}/{MIT_GRENZE}</div>
              {!mits.length && <div style={{ fontSize: 12.5, color: textMuted, padding: "4px 0" }}>Noch keine gewählt – in der Matrix ☆ antippen oder abends im Tagesabschluss.</div>}
              {mits.map((a) => (
                <div key={a.id} style={{ ...zeile, borderTop: "none", padding: "5px 0" }}>
                  <span style={{ flex: 1, fontSize: 14.5, fontWeight: 800, textDecoration: a.erledigtAm ? "line-through" : "none", opacity: a.erledigtAm ? 0.55 : 1 }}>
                    ⭐ {a.titel}
                    {a.uhrzeit ? <span style={{ fontSize: 12, fontWeight: 600, color: textMuted }}> · {a.uhrzeit}</span> : null}
                  </span>
                  <button type="button" aria-label={`${a.titel} ${a.erledigtAm ? "wieder öffnen" : "erledigt"}`} onClick={() => matrixHaken(a)} style={haken(!!a.erledigtAm, "#E0A21B")}>
                    ✓
                  </button>
                </div>
              ))}
            </div>
            {!heuteBloecke.length && !ohneUhrzeit.length && <div style={{ fontSize: 13, color: textMuted, padding: "8px 0" }}>Für heute ist nichts geplant.</div>}
            {heuteBloecke.map((b) => {
              const vorbei = b.ende <= jetztMin;
              const laeuft = b.start <= jetztMin && jetztMin < b.ende;
              const tippbar = !!(b.alltag || b.matrix);
              return (
                <div key={b.key} data-tafel-block={b.art} style={{ ...zeile, opacity: b.done || (vorbei && !tippbar) ? 0.55 : 1, background: laeuft ? "color-mix(in srgb, var(--mp-accent) 10%, transparent)" : "transparent", borderRadius: laeuft ? 10 : 0, paddingLeft: laeuft ? 6 : 0 }}>
                  <span style={{ width: 92, flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: laeuft ? "var(--mp-accent-dark-text)" : textMuted }}>
                    {hhmm(b.start)}–{hhmm(b.ende)}
                  </span>
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 8, background: b.farbe?.dot || "var(--mp-accent)", flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, textDecoration: b.done ? "line-through" : "none" }}>
                    {b.icon ? `${b.icon} ` : ""}
                    {b.titel}
                    {laeuft && <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mp-accent-dark-text)", marginLeft: 6 }}>JETZT</span>}
                  </span>
                  {tippbar && (
                    <button type="button" aria-label={`${b.titel} ${b.done ? "wieder öffnen" : "erledigt"}`} onClick={() => blockHaken(b)} style={haken(b.done, b.farbe?.dot || "var(--mp-accent)")}>
                      ✓
                    </button>
                  )}
                </div>
              );
            })}
            {ohneUhrzeit.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted }}>OHNE UHRZEIT</div>
                {ohneUhrzeit.map((a) => (
                  <div key={a.id} style={zeile}>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>🗂️ {a.titel}</span>
                    <button type="button" aria-label={`${a.titel} erledigt`} onClick={() => matrixHaken(a)} style={haken(false, QUADRANT.planen.farbe)}>
                      ✓
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Woche */}
          <section data-tafel-woche style={spalte} aria-label="Woche">
            <div style={kopf}>
              <span>🗓️ Die nächsten Tage</span>
              <a href="#/kalender" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mp-accent-dark-text)", textDecoration: "none" }}>Kalender ›</a>
            </div>
            {woche.map((d) => {
              const bl = bloeckeFuer(d).filter((b) => b.art !== "routine");
              return (
                <div key={toLocalISODate(d)} style={{ padding: "8px 0", borderTop: "1px solid var(--mp-rand)" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: textMuted, marginBottom: 2 }}>{d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "numeric" })}</div>
                  {!bl.length && <div style={{ fontSize: 12.5, color: textMuted }}>–</div>}
                  {bl.slice(0, 6).map((b) => (
                    <div key={b.key} style={{ display: "flex", gap: 8, fontSize: 13, padding: "2px 0" }}>
                      <span style={{ width: 42, flexShrink: 0, color: textMuted }}>{hhmm(b.start)}</span>
                      <span aria-hidden="true" style={{ width: 7, height: 7, marginTop: 6, borderRadius: 7, background: b.farbe?.dot || "var(--mp-accent)", flexShrink: 0 }} />
                      <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
                        {b.icon ? `${b.icon} ` : ""}
                        {b.titel}
                      </span>
                    </div>
                  ))}
                  {bl.length > 6 && <div style={{ fontSize: 12, color: textMuted }}>+ {bl.length - 6} weitere</div>}
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
}
