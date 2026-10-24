import React, { useMemo, useState } from "react";
import { Shell, Card, PrimaryButton } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import Umschalter, { ChipReihe } from "../ui/Umschalter";
import { useAppData } from "../context/AppDataContext";
import { useFokusTimer } from "../data/useFokusTimer";
import { addDays, toLocalISODate } from "../utils/dates";
import { ARTEN, ART, FRISTEN, QUADRANTEN, QUADRANT, JETZT_GRENZE, MIT_GRENZE, VERSCHOBEN_HINWEIS, fristAus, fristText, mitUmschalten, nachQuadrant, quadrantVon, warum } from "../utils/matrix";

// Aufgaben-Matrix im Workflow-Bereich (30.09., Vorschau, Nutzerin: „eine
// Matrix für die vielen Aufgaben eines Projekts … das soll sich im Alltag
// widerspiegeln“). Eintippen, „wichtig?“ + „bis wann?“ – die Farbe ergibt
// sich von selbst (utils/matrix.js). Antippen öffnet die Karte: nächster
// Schritt, anderes Feld, einplanen, Fokus-Timer, erledigt, verschieben.
// Rot und heute eingeplantes Grün erscheinen im Tagesplan (TagesHinweise).

const feld = { width: "100%", boxSizing: "border-box", border: "1.5px solid var(--mp-rand)", borderRadius: 12, padding: "10px 12px", fontSize: 15, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" };
// Erinnerungs-Wahl: [Wert, Text, braucht Uhrzeit].
const ERINNERUNGEN = [
  [null, "Aus", false],
  ["zeit", "Zur Uhrzeit", true],
  ["15", "15 Min. vorher", true],
  ["60", "1 Std. vorher", true],
  ["morgens", "Morgens um 8", false],
];
const bisUhrzeit = (hhmm, dauer) => {
  const [h, m] = hhmm.split(":").map(Number);
  const ende = (h * 60 + m + Number(dauer || 30)) % (24 * 60);
  return `${String(Math.floor(ende / 60)).padStart(2, "0")}:${String(ende % 60).padStart(2, "0")}`;
};
const kleinKnopf = (an, farbe = "var(--mp-accent)") => ({ border: "none", borderRadius: 99, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: an ? farbe : "color-mix(in srgb, #EEF1F6 var(--mp-flaeche), var(--mp-rand-dunkel))", color: an ? "#fff" : "var(--mp-text)" });

export default function MatrixView({ onHome }) {
  const { matrixAufgaben = [], matrixAufgabeSpeichern, matrixAufgabeLoeschen, projekte = [], projektHinzufuegen } = useAppData();
  const { starten } = useFokusTimer();
  const [projekt, setProjekt] = useState("alle");
  const [titel, setTitel] = useState("");
  const [wichtig, setWichtig] = useState("ja");
  const [frist, setFrist] = useState(null);
  const [fristDatum, setFristDatum] = useState("");
  // Was ist es? Termin mit Tag + Uhrzeit (07.10.).
  const [art, setArt] = useState("aufgabe");
  const [terminTag, setTerminTag] = useState(toLocalISODate(new Date()));
  const [terminZeit, setTerminZeit] = useState("");
  const [offen, setOffen] = useState(null); // id der geöffneten Aufgabe
  const [fehler, setFehler] = useState(null);
  const [neuesProjekt, setNeuesProjekt] = useState(null);

  const sichtbar = useMemo(() => matrixAufgaben.filter((a) => projekt === "alle" || (a.projektId || "ohne") === projekt), [matrixAufgaben, projekt]);
  const felder = nachQuadrant(sichtbar);
  const projektName = (id) => projekte.find((p) => p.id === id)?.name;
  const vorschau = quadrantVon({ wichtig: wichtig === "ja", frist: art === "termin" ? terminTag || null : fristAus(frist, fristDatum) });
  const fristFehlt = art !== "termin" && (frist === null || (frist === "datum" && !fristDatum));

  const speichern = async (a) => {
    setFehler(null);
    const r = await matrixAufgabeSpeichern(a);
    if (r && r.ok === false) setFehler(r.error);
    return r;
  };
  const hinzufuegen = async () => {
    if (!titel.trim() || fristFehlt) return;
    const termin = art === "termin";
    const r = await speichern({
      titel,
      art,
      wichtig: wichtig === "ja",
      // Ein Termin hat seinen Tag als Frist und ist an dem Tag eingeplant.
      frist: termin ? terminTag || null : fristAus(frist, fristDatum),
      geplantAm: termin ? terminTag || null : null,
      uhrzeit: termin ? terminZeit || null : null,
      projektId: projekt === "alle" || projekt === "ohne" ? null : projekt,
    });
    if (r?.ok !== false) {
      setTitel("");
      setTerminZeit("");
      setFrist(null);
      setFristDatum("");
    }
  };

  const aufgabe = matrixAufgaben.find((a) => a.id === offen);
  // Verschieben (05.10., Nutzerin: „Dinge von Feld zu Feld verschieben, wenn
  // sich Prioritäten ändern“): Aufgabe antippen → in jedem anderen Feld
  // erscheint „Hierher“; am Computer geht auch Ziehen und Ablegen.
  const [ziehen, setZiehen] = useState(null);
  const verschieben = async (id, ziel) => {
    const a = matrixAufgaben.find((x) => x.id === id);
    if (!a || quadrantVon(a) === ziel) return;
    await speichern({ ...a, quadrantManuell: ziel });
  };

  return (
    <Shell>
      <ViewHeader title="🗂️ Aufgaben-Matrix" onHome={onHome} />
      <div style={{ fontSize: 13, color: "var(--mp-text-muted)", margin: "-4px 2px 12px", lineHeight: 1.45 }}>
        Die Farbe entsteht von selbst aus „wichtig?“ und „bis wann?“. Rot und heute Eingeplantes erscheint automatisch in deinem Tagesplan.
      </div>

      <ChipReihe
        name="Projekt"
        wert={projekt}
        onWahl={(id) => (id === "neu" ? setNeuesProjekt("") : setProjekt(id))}
        optionen={[{ id: "alle", label: "Alle" }, ...projekte.map((p) => ({ id: p.id, label: p.name })), { id: "ohne", label: "Ohne Projekt" }, { id: "neu", label: "＋ Projekt" }]}
      />
      {neuesProjekt !== null && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <input value={neuesProjekt} onChange={(e) => setNeuesProjekt(e.target.value)} placeholder="z. B. Steuer 2025" aria-label="Neues Projekt" style={feld} />
          <button
            type="button"
            style={kleinKnopf(true)}
            onClick={async () => {
              const r = await projektHinzufuegen?.(neuesProjekt);
              if (r?.ok === false) return setFehler(r.error);
              setNeuesProjekt(null);
            }}
          >
            Anlegen
          </button>
        </div>
      )}

      <Card style={{ marginBottom: 12 }}>
        <input
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && hinzufuegen()}
          placeholder="Was ist zu tun? z. B. Belege fotografieren"
          aria-label="Neue Aufgabe"
          style={feld}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }} role="group" aria-label="Was ist es?">
          {ARTEN.map((x) => (
            <button key={x.id} type="button" aria-pressed={art === x.id} onClick={() => setArt(x.id)} style={kleinKnopf(art === x.id)}>
              {x.icon} {x.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mp-text-muted)", width: 62 }}>Wichtig?</span>
          <Umschalter name="Wichtig?" wert={wichtig} onWahl={setWichtig} style={{ flex: 1, marginBottom: 0 }} optionen={[["ja", "Ja"], ["nein", "Eher nicht"]]} />
        </div>
        {art === "termin" ? (
          <div data-matrix-termin style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--mp-text-muted)" }}>Wann?</span>
            <input type="date" value={terminTag} onChange={(e) => setTerminTag(e.target.value)} aria-label="Termin-Tag" style={{ ...feld, width: "auto", padding: "7px 8px", fontSize: 14 }} />
            <input type="time" value={terminZeit} onChange={(e) => setTerminZeit(e.target.value)} aria-label="Termin-Uhrzeit" style={{ ...feld, width: "auto", padding: "7px 8px", fontSize: 14 }} />
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: titel.trim() && fristFehlt ? "var(--mp-accent-dark-text)" : "var(--mp-text-muted)", marginBottom: 6 }}>
              ⏰ Deadline – bis wann?{titel.trim() && fristFehlt ? " Bitte wählen" : ""}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} role="group" aria-label="Bis wann?">
              {FRISTEN.map(([id, l]) => (
                <button key={id} type="button" aria-pressed={frist === id} onClick={() => setFrist(id)} style={kleinKnopf(frist === id)}>
                  {l}
                </button>
              ))}
            </div>
            {frist === "datum" && (
              <input type="date" value={fristDatum} onChange={(e) => setFristDatum(e.target.value)} aria-label="Deadline-Datum" style={{ ...feld, width: "auto", marginTop: 8, padding: "7px 8px", fontSize: 14 }} />
            )}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
          <span data-matrix-vorschau={vorschau} style={{ fontSize: 12.5, fontWeight: 700, color: QUADRANT[vorschau].schrift }}>
            → landet in {QUADRANT[vorschau].icon} {QUADRANT[vorschau].titel}
          </span>
          <button type="button" onClick={hinzufuegen} disabled={!titel.trim() || fristFehlt} style={{ ...kleinKnopf(true), padding: "9px 16px", opacity: titel.trim() && !fristFehlt ? 1 : 0.5 }}>
            ＋ Dazu
          </button>
        </div>
      </Card>

      {fehler && <div style={{ color: "var(--mp-danger, #C0392B)", fontSize: 13, marginBottom: 10 }}>{fehler}</div>}

      {felder.jetzt.length > JETZT_GRENZE && (
        <div data-matrix-ueberlast style={{ fontSize: 13, lineHeight: 1.45, padding: "10px 12px", borderRadius: 14, marginBottom: 10, background: "color-mix(in srgb, #FFF1CC var(--mp-flaeche), var(--mp-rand-dunkel))" }}>
          Gerade sind {felder.jetzt.length} Dinge rot – mehr, als an einem Tag gut geht. Magst du eins kleiner machen, verschieben oder streichen?
        </div>
      )}

      <div data-matrix style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {QUADRANTEN.map((q) => (
          <section
            key={q.id}
            data-quadrant={q.id}
            aria-label={q.titel}
            onDragOver={(e) => ziehen && e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (ziehen) verschieben(ziehen, q.id);
              setZiehen(null);
            }}
            style={{ borderRadius: 18, padding: 10, minHeight: 120, background: `color-mix(in srgb, ${q.bg} var(--mp-flaeche), var(--mp-rand-dunkel))`, outline: ziehen ? `2px dashed ${q.farbe}88` : "none", outlineOffset: -4 }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.3, color: `color-mix(in srgb, ${q.schrift} var(--mp-schrift), var(--mp-schrift-hell))` }}>
              {q.icon} {q.titel} <span style={{ opacity: 0.7 }}>{felder[q.id].length || ""}</span>
            </div>
            <div style={{ fontSize: 10.5, opacity: 0.75, marginBottom: 8, color: `color-mix(in srgb, ${q.schrift} var(--mp-schrift), var(--mp-schrift-hell))` }}>{q.text}</div>
            {aufgabe && quadrantVon(aufgabe) !== q.id && (
              <button
                type="button"
                data-matrix-hierher={q.id}
                onClick={() => verschieben(aufgabe.id, q.id)}
                style={{ display: "block", width: "100%", border: `2px dashed ${q.farbe}`, borderRadius: 10, padding: "6px 8px", marginBottom: 6, background: "transparent", color: `color-mix(in srgb, ${q.schrift} var(--mp-schrift), var(--mp-schrift-hell))`, fontFamily: "inherit", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
              >
                ➜ „{aufgabe.titel.length > 18 ? `${aufgabe.titel.slice(0, 17)}…` : aufgabe.titel}“ hierher
              </button>
            )}
            {felder[q.id].map((a) => (
              <button
                key={a.id}
                type="button"
                draggable
                onDragStart={() => setZiehen(a.id)}
                onDragEnd={() => setZiehen(null)}
                onClick={() => setOffen(offen === a.id ? null : a.id)}
                aria-expanded={offen === a.id}
                style={{ display: "block", width: "100%", textAlign: "left", border: offen === a.id ? `2px solid ${q.farbe}` : "none", borderRadius: 10, padding: "6px 8px", marginBottom: 5, background: "var(--mp-karte)", color: "var(--mp-text)", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,.06)" }}
              >
                {a.mitAm && a.mitAm >= toLocalISODate(new Date()) ? "⭐ " : ""}
                {a.art && a.art !== "aufgabe" ? `${ART[a.art]?.icon || ""} ` : ""}
                {a.titel}
                <span style={{ display: "block", fontSize: 10.5, fontWeight: 500, color: "var(--mp-text-muted)" }}>
                  {[a.frist && a.art !== "termin" && fristText(a.frist), a.geplantAm && `📅 ${fristText(a.geplantAm)}${a.uhrzeit ? ` ${a.uhrzeit}` : ""}`, a.dauerMin && `${a.dauerMin} Min`, projekt === "alle" && projektName(a.projektId)].filter(Boolean).join(" · ") || "ohne Frist"}
                </span>
              </button>
            ))}
          </section>
        ))}
      </div>

      {aufgabe && <AufgabeKarte key={aufgabe.id} a={aufgabe} onSpeichern={speichern} onLoeschen={async () => { await matrixAufgabeLoeschen(aufgabe.id); setOffen(null); }} onFokus={() => starten({ key: `matrix-${aufgabe.id}`, name: aufgabe.naechsterSchritt || aufgabe.titel, symbol: "🗂️", minuten: aufgabe.dauerMin || 10 })} onSchliessen={() => setOffen(null)} />}
    </Shell>
  );
}

function AufgabeKarte({ a, onSpeichern, onLoeschen, onFokus, onSchliessen }) {
  const [schritt, setSchritt] = useState(a.naechsterSchritt || "");
  const [dauer, setDauer] = useState(a.dauerMin ? String(a.dauerMin) : "");
  const q = quadrantVon(a);
  const heute = toLocalISODate(new Date());
  const aendern = (teil) => onSpeichern({ ...a, naechsterSchritt: schritt, dauerMin: dauer ? Number(dauer) : null, ...teil });
  // ⭐ MIT (24.10.): für den eingeplanten Tag, sonst für heute; höchstens 3.
  const { matrixAufgaben = [] } = useAppData();
  const mitTag = a.geplantAm && a.geplantAm >= heute ? a.geplantAm : heute;
  const [mitHinweis, setMitHinweis] = useState(null);
  const mitKnopf = () => {
    const r = mitUmschalten(a, mitTag, matrixAufgaben);
    if (r.voll) return setMitHinweis(`Für ${fristText(mitTag)} sind schon ${MIT_GRENZE} MITs gewählt – erst eine abwählen.`);
    setMitHinweis(null);
    aendern({ mitAm: r.aufgabe.mitAm });
  };
  return (
    <Card style={{ marginTop: 12, borderLeft: `5px solid ${QUADRANT[q].farbe}` }}>
      <div data-matrix-karte style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{a.titel}</div>
        <button type="button" onClick={onSchliessen} aria-label="Schließen" style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "var(--mp-text-muted)" }}>
          ✕
        </button>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--mp-text-muted)", margin: "2px 0 10px" }}>Warum hier? {warum(a)}</div>

      {a.verschoben >= VERSCHOBEN_HINWEIS && (
        <div data-matrix-verschoben style={{ fontSize: 13, lineHeight: 1.45, padding: "8px 10px", borderRadius: 12, marginBottom: 10, background: "color-mix(in srgb, #FFF1CC var(--mp-flaeche), var(--mp-rand-dunkel))" }}>
          Das wurde schon {a.verschoben}× verschoben. Vielleicht ist es zu groß? Schreib unten einen ganz kleinen ersten Schritt – oder streich es, wenn es nicht mehr wichtig ist.
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }} role="group" aria-label="Art ändern">
        {ARTEN.map((x) => (
          <button key={x.id} type="button" aria-pressed={(a.art || "aufgabe") === x.id} onClick={() => aendern({ art: x.id })} style={kleinKnopf((a.art || "aufgabe") === x.id)}>
            {x.icon} {x.label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mp-text-muted)", marginBottom: 4 }}>NÄCHSTER KLEINER SCHRITT</div>
      <input value={schritt} onChange={(e) => setSchritt(e.target.value)} onBlur={() => schritt !== (a.naechsterSchritt || "") && aendern({})} placeholder="z. B. Ordner aus dem Schrank holen" aria-label="Nächster Schritt" style={feld} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }} role="group" aria-label="Dauer">
        {["5", "15", "30", "60"].map((m) => (
          <button key={m} type="button" aria-pressed={dauer === m} onClick={() => { setDauer(m); onSpeichern({ ...a, naechsterSchritt: schritt, dauerMin: Number(m) }); }} style={kleinKnopf(dauer === m)}>
            {m} Min
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mp-text-muted)", margin: "12px 0 4px" }}>FELD</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }} role="group" aria-label="Feld wählen">
        {QUADRANTEN.map((f) => (
          <button key={f.id} type="button" aria-pressed={q === f.id} onClick={() => aendern({ quadrantManuell: f.id })} style={{ ...kleinKnopf(q === f.id, f.farbe), borderRadius: 12 }}>
            {f.icon} {f.titel}
          </button>
        ))}
      </div>
      {a.quadrantManuell && (
        <button type="button" onClick={() => aendern({ quadrantManuell: null })} style={{ border: "none", background: "none", padding: "6px 0 0", fontSize: 12, color: "var(--mp-text-muted)", textDecoration: "underline", cursor: "pointer", fontFamily: "inherit" }}>
          Farbe wieder automatisch bestimmen
        </button>
      )}

      {a.art !== "termin" && (
        <>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mp-text-muted)", margin: "12px 0 4px" }}>⏰ DEADLINE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <input type="date" value={a.frist || ""} onChange={(e) => aendern({ frist: e.target.value || null })} aria-label="Deadline ändern" style={{ ...feld, width: "auto", padding: "5px 8px", fontSize: 13 }} />
            <button type="button" aria-pressed={!a.frist} onClick={() => aendern({ frist: null })} style={kleinKnopf(!a.frist)}>
              Ohne Deadline
            </button>
          </div>
        </>
      )}
      <div style={{ marginTop: 12 }}>
        <button type="button" data-matrix-mit aria-pressed={a.mitAm === mitTag} onClick={mitKnopf} style={{ ...kleinKnopf(a.mitAm === mitTag, "#E0A21B"), padding: "8px 14px" }}>
          {a.mitAm === mitTag ? "⭐" : "☆"} MIT für {fristText(mitTag)}
        </button>
        <span style={{ fontSize: 11.5, color: "var(--mp-text-muted)", marginLeft: 8 }}>Most Important Task – höchstens {MIT_GRENZE} am Tag</span>
        {mitHinweis && <div role="status" style={{ fontSize: 12, marginTop: 4, color: "color-mix(in srgb, #8A5A00 var(--mp-schrift), var(--mp-schrift-hell))" }}>{mitHinweis}</div>}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mp-text-muted)", margin: "12px 0 4px" }}>IN DEN TAGESPLAN</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <button type="button" aria-pressed={a.geplantAm === heute} onClick={() => aendern({ geplantAm: heute })} style={kleinKnopf(a.geplantAm === heute)}>
          Heute
        </button>
        <button type="button" onClick={() => aendern({ geplantAm: toLocalISODate(addDays(new Date(), 1)) })} style={kleinKnopf(a.geplantAm === toLocalISODate(addDays(new Date(), 1)))}>
          Morgen
        </button>
        <input type="date" value={a.geplantAm || ""} onChange={(e) => aendern({ geplantAm: e.target.value || null })} aria-label="Tag wählen" style={{ ...feld, width: "auto", padding: "5px 8px", fontSize: 13 }} />
      </div>
      {/* Uhrzeit gut sichtbar (24.10.: auf dem iPad war das Feld nur ein leeres
          Kästchen). Mit Dauer ergibt sich der Zeitraum im Kalender. */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700 }}>
          🕐 Uhrzeit
          <input type="time" data-matrix-uhrzeit value={a.uhrzeit || ""} onChange={(e) => aendern({ uhrzeit: e.target.value || null })} aria-label="Uhrzeit wählen" style={{ ...feld, width: 120, minWidth: 120, padding: "6px 8px", fontSize: 14 }} />
        </label>
        {a.uhrzeit && (
          <>
            <span style={{ fontSize: 12.5, color: "var(--mp-text-muted)" }}>
              {a.uhrzeit}–{bisUhrzeit(a.uhrzeit, dauer || a.dauerMin || 30)} Uhr{!a.geplantAm ? " · bitte noch einen Tag wählen" : ""}
            </span>
            <button type="button" onClick={() => aendern({ uhrzeit: null, erinnerung: a.erinnerung === "morgens" ? "morgens" : null })} style={{ border: "none", background: "none", fontSize: 12, color: "var(--mp-text-muted)", textDecoration: "underline", cursor: "pointer", fontFamily: "inherit" }}>
              Uhrzeit entfernen
            </button>
          </>
        )}
      </div>

      {/* Erinnerung (24.10., Migration 0132) – Push wie bei „Mein Alltag“. */}
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mp-text-muted)", margin: "12px 0 4px" }}>🔔 ERINNERN</div>
      <div role="group" aria-label="Erinnerung" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {ERINNERUNGEN.map(([wert, text, brauchtZeit]) => {
          const moeglich = brauchtZeit ? !!a.uhrzeit && !!a.geplantAm : wert === null || !!(a.geplantAm || a.frist);
          return (
            <button key={text} type="button" data-matrix-erinnerung={wert || "aus"} aria-pressed={(a.erinnerung || null) === wert} disabled={!moeglich} onClick={() => aendern({ erinnerung: wert })} style={{ ...kleinKnopf((a.erinnerung || null) === wert), opacity: moeglich ? 1 : 0.4, cursor: moeglich ? "pointer" : "default" }}>
              {text}
            </button>
          );
        })}
      </div>
      {!a.geplantAm && !a.frist && <div style={{ fontSize: 12, color: "var(--mp-text-muted)", marginTop: 4 }}>Für eine Erinnerung zuerst einen Tag wählen.</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
        <PrimaryButton onClick={onFokus}>⏱️ Fokus starten</PrimaryButton>
        <PrimaryButton variant="success" onClick={() => { aendern({ erledigtAm: new Date().toISOString() }); onSchliessen(); }}>
          ✓ Erledigt
        </PrimaryButton>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        <button
          type="button"
          onClick={() => aendern({ geplantAm: toLocalISODate(addDays(new Date(), 1)), verschoben: (a.verschoben || 0) + 1 })}
          style={{ border: "none", background: "none", fontSize: 13, fontWeight: 700, color: "var(--mp-accent-dark-text)", cursor: "pointer", fontFamily: "inherit" }}
        >
          ↪ Auf morgen
        </button>
        <button type="button" onClick={onLoeschen} style={{ border: "none", background: "none", fontSize: 13, color: "var(--mp-text-muted)", cursor: "pointer", fontFamily: "inherit" }}>
          Streichen
        </button>
      </div>
    </Card>
  );
}
