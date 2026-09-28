import React, { useMemo, useState } from "react";
import { Shell, Card, Pill, TextInput, Label } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import { cardBorder, danger, textMain, textMuted } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { buildDayItems } from "../utils/dayItems";
import { addDays, sameDay, toLocalISODate } from "../utils/dates";
import { ALLTAG_BEREICHE, ICON_VORSCHLAEGE, WOCHENTAGE, bloeckeFuerTag, eigeneBereichMeta, hhmm, konflikte, konflikteFuerEintrag, monatsRaster, spaltenVerteilen } from "../utils/kalender";

// Kalender „Mein Alltag“ (28.09., Vorschau freigegeben). Tag als Zeitleiste,
// Woche als Stundenplan, Monat als Kalenderblatt. Alles aus der App erscheint
// automatisch (Routinen, Training, Essen, Supplemente, Zeitblöcke …), dazu
// Alltags-Einträge (Arbeit, Haushalt, Hobby, Me-Time, Termine, Freunde &
// Familie, eigene Bereiche) – wöchentlich oder einmalig, abhakbar.
// Seit 28.09. für alle von Anfang an verfügbar (Nutzerin: „man muss es ja
// nicht gleich nutzen“).

const VON = 5 * 60;
const BIS = 24 * 60;
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const startOfWeek = (d) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));

function useTagesBloecke() {
  const a = useAppData();
  return (date) => {
    const items = buildDayItems(date, {
      hormonPlan: a.hormonPlan || [],
      hormonErledigt: a.hormonErledigt || {},
      hormonDosierung: a.hormonDosierung || {},
      supplemente: a.supplemente || [],
      supplementErledigt: a.supplementErledigt || {},
      mahlzeiten: a.mahlzeiten || [],
      mahlzeitErledigt: a.mahlzeitErledigt || {},
      mealWochenplan: a.mealWochenplan || [],
      trainingEintraege: a.trainingEintraege || [],
      trainingNachDatum: a.trainingNachDatum || null,
      trainingWochenplan: a.trainingWochenplan || [],
      trainingTemplates: a.trainingTemplates || [],
      gewohnheiten: a.gewohnheiten || [],
      gewohnheitErledigt: a.gewohnheitErledigt || {},
      workflowPlaene: a.workflowPlaene || [],
      workflowPresets: a.workflowPresets || [],
      projekte: a.projekte || [],
      zeitbloecke: a.zeitbloecke || [],
      ausnahmenNachSchluessel: a.ausnahmenNachSchluessel || null,
    });
    return bloeckeFuerTag(date, {
      items,
      routineEinstellungen: a.routineEinstellungen || {},
      alltagEintraege: a.alltagEintraege || [],
      alltagBereiche: a.alltagBereiche || [],
      alltagErledigt: a.alltagErledigt || {},
    });
  };
}

function Block({ b, pxProMin, klein, onClick, konflikt = false }) {
  const top = (Math.max(b.start, VON) - VON) * pxProMin;
  const hoehe = Math.max((Math.min(b.ende, BIS) - Math.max(b.start, VON)) * pxProMin, klein ? 12 : 20);
  const breite = 100 / b.spalten;
  const Tag = b.alltag ? "button" : "div";
  return (
    <Tag
      type={b.alltag ? "button" : undefined}
      onClick={b.alltag ? () => onClick?.(b) : undefined}
      data-block={b.alltag ? "alltag" : b.art}
      data-konflikt={konflikt ? "ja" : undefined}
      title={`${hhmm(b.start)}–${hhmm(b.ende)} ${b.titel}`}
      style={{
        position: "absolute",
        top,
        height: hoehe - 2,
        left: `calc(${b.spalte * breite}% + 1px)`,
        width: `calc(${breite}% - 2px)`,
        background: b.farbe.bg,
        border: "none",
        borderLeft: `3px solid ${b.farbe.dot}`,
        color: b.farbe.text,
        borderRadius: klein ? 4 : 8,
        padding: klein ? "1px 3px" : "3px 6px",
        overflow: "hidden",
        fontSize: klein ? 9 : 12,
        lineHeight: 1.25,
        fontWeight: 700,
        opacity: b.done ? 0.55 : 1,
        boxSizing: "border-box",
        outline: konflikt ? "2px solid #E8A33B" : "none",
        outlineOffset: -1,
        textAlign: "left",
        fontFamily: "inherit",
        cursor: b.alltag ? "pointer" : "default",
        display: "block",
      }}
    >
      {klein ? (
        <span>
          {konflikt ? "⚠️ " : b.done ? "✓ " : b.icon ? `${b.icon} ` : ""}
          {b.titel}
        </span>
      ) : (
        <>
          <span style={{ display: "block", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
            {konflikt ? "⚠️ " : b.icon ? `${b.icon} ` : ""}
            {b.titel}
            {b.done ? " ✓" : ""}
          </span>
          {hoehe > 30 && <span style={{ display: "block", fontWeight: 500, opacity: 0.8 }}>{hhmm(b.start)}–{hhmm(b.ende)}</span>}
        </>
      )}
    </Tag>
  );
}

function Zeitachse({ pxProMin, schritt = 60 }) {
  const marken = [];
  for (let m = VON; m < BIS; m += schritt) marken.push(m);
  return (
    <div style={{ position: "relative", width: 34, flexShrink: 0 }}>
      {marken.map((m) => (
        <div key={m} style={{ position: "absolute", top: (m - VON) * pxProMin - 6, right: 4, fontSize: 10, color: textMuted }}>
          {String(m / 60).padStart(2, "0")}
        </div>
      ))}
    </div>
  );
}

function Linien({ pxProMin }) {
  const marken = [];
  for (let m = VON; m < BIS; m += 60) marken.push(m);
  return marken.map((m) => <div key={m} style={{ position: "absolute", left: 0, right: 0, top: (m - VON) * pxProMin, borderTop: `1px solid ${cardBorder}` }} />);
}

function JetztLinie({ pxProMin }) {
  const n = new Date();
  const m = n.getHours() * 60 + n.getMinutes();
  if (m < VON || m > BIS) return null;
  return <div style={{ position: "absolute", left: 0, right: 0, top: (m - VON) * pxProMin, borderTop: "2px solid #E0352B", zIndex: 2, pointerEvents: "none" }} />;
}

function TagAnsicht({ datum, bloecke, onBlock }) {
  const px = 0.9;
  return (
    <div style={{ display: "flex", height: (BIS - VON) * px, position: "relative" }}>
      <Zeitachse pxProMin={px} />
      <div style={{ position: "relative", flex: 1 }}>
        <Linien pxProMin={px} />
        {sameDay(datum, new Date()) && <JetztLinie pxProMin={px} />}
        {(() => {
          const k = konflikte(bloecke);
          return spaltenVerteilen(bloecke).map((b) => <Block key={b.key} b={b} pxProMin={px} onClick={onBlock} konflikt={k.has(b.key)} />);
        })()}
      </div>
    </div>
  );
}

function WochenAnsicht({ tage, bloeckeFuer, onTag, onBlock }) {
  const px = 0.55;
  return (
    <div>
      <div style={{ display: "flex", marginLeft: 34 }}>
        {tage.map((d, i) => {
          const heute = sameDay(d, new Date());
          return (
            <button key={i} type="button" onClick={() => onTag(d)} style={{ flex: 1, border: "none", background: "transparent", cursor: "pointer", padding: "2px 0 6px", fontFamily: "inherit" }}>
              <span style={{ display: "block", fontSize: 10.5, color: textMuted, fontWeight: 700 }}>{WOCHENTAGE[i]}</span>
              <span style={{ display: "inline-flex", width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 800, background: heute ? "#1B2350" : "transparent", color: heute ? "#fff" : textMain }}>{d.getDate()}</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", height: (BIS - VON) * px }}>
        <Zeitachse pxProMin={px} schritt={120} />
        <div style={{ position: "relative", flex: 1, display: "flex" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <Linien pxProMin={px} />
          </div>
          {tage.map((d, i) => (
            <div key={i} style={{ position: "relative", flex: 1, borderLeft: `1px solid ${cardBorder}`, background: sameDay(d, new Date()) ? "rgba(27,35,80,.04)" : "transparent" }}>
              {(() => {
                const bl = bloeckeFuer(d);
                const k = konflikte(bl);
                return spaltenVerteilen(bl).map((b) => <Block key={b.key} b={b} pxProMin={px} klein onClick={(x) => onBlock(x, d)} konflikt={k.has(b.key)} />);
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonatsAnsicht({ jahr, monat, bloeckeFuer, onTag }) {
  const raster = monatsRaster(jahr, monat);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 4 }}>
        {WOCHENTAGE.map((w) => (
          <div key={w} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 700, color: textMuted }}>
            {w}
          </div>
        ))}
      </div>
      {raster.map((woche, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
          {woche.map((d, i) => {
            if (!d) return <div key={i} />;
            // Im Monat nur, was den Tag unterscheidet: tägliche Routinen, Supplemente und Medikamente stehen im Tag und in der Woche.
            const b = bloeckeFuer(d).filter((x) => !["supplement", "hormon", "routine"].includes(x.art));
            const heute = sameDay(d, new Date());
            return (
              <button
                key={i}
                type="button"
                onClick={() => onTag(d)}
                style={{ minHeight: 64, border: `1px solid ${heute ? "#1B2350" : cardBorder}`, borderRadius: 8, background: "#fff", padding: 3, textAlign: "left", cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: heute ? "#1B2350" : textMain }}>{d.getDate()}</span>
                {b.slice(0, 3).map((x) => (
                  <span key={x.key} style={{ display: "block", fontSize: 8.5, fontWeight: 700, background: x.farbe.bg, color: x.farbe.text, borderRadius: 3, padding: "0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {x.icon || ""}
                    {x.titel}
                  </span>
                ))}
                {b.length > 3 && <span style={{ fontSize: 8.5, color: textMuted, fontWeight: 700 }}>+{b.length - 3}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const leer = (datum) => ({ bereich: "haushalt", bereichId: null, titel: "", start: "10:00", ende: "10:45", wochentage: [WOCHENTAGE[(datum.getDay() + 6) % 7]], datum: null, erinnerung: true });

function EintragFormular({ start, datum, onFertig, bloeckeFuer }) {
  const { alltagBereiche = [], alltagSpeichern, alltagLoeschen, alltagBereichAnlegen } = useAppData();
  const [e, setE] = useState(start);
  const [fehler, setFehler] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const [neuerBereich, setNeuerBereich] = useState(null); // { name, icon } | null
  const [warnung, setWarnung] = useState(null); // Überschneidungen vor dem Speichern
  const einmalig = !!e.datum;
  const setze = (felder) => setE((x) => ({ ...x, ...felder }));

  const speichern = async (trotzdem = false) => {
    setFehler(null);
    if (!trotzdem && bloeckeFuer) {
      const t = konflikteFuerEintrag(e, bloeckeFuer, datum);
      if (t.length) return setWarnung(t);
    }
    setWarnung(null);
    setLaeuft(true);
    const r = await alltagSpeichern?.(e);
    setLaeuft(false);
    if (!r?.ok) return setFehler(r?.error || "Speichern fehlgeschlagen.");
    onFertig();
  };
  const bereichSpeichern = async () => {
    const r = await alltagBereichAnlegen?.(neuerBereich);
    if (!r?.ok) return setFehler(r?.error || "Bereich konnte nicht angelegt werden.");
    setNeuerBereich(null);
    setze({ bereichId: r.bereich.id, bereich: "eigen" });
  };

  return (
    <Card style={{ marginBottom: 12, border: "1.5px solid #1B2350" }}>
      <div data-eintrag-formular style={{ display: "flex", alignItems: "center" }}>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 900, color: textMain }}>{e.id ? "Eintrag ändern" : "Neuer Eintrag"}</span>
        <button type="button" onClick={onFertig} aria-label="Schließen" style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer", color: textMuted }}>
          ✕
        </button>
      </div>
      <Label>Bereich</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {Object.entries(ALLTAG_BEREICHE).map(([k, m]) => (
          <Pill key={k} label={`${m.icon} ${m.label}`} selected={!e.bereichId && e.bereich === k} onClick={() => setze({ bereich: k, bereichId: null })} />
        ))}
        {alltagBereiche.map((b) => {
          const m = eigeneBereichMeta(b);
          return <Pill key={b.id} label={`${m.icon} ${m.label}`} selected={e.bereichId === b.id} onClick={() => setze({ bereich: "eigen", bereichId: b.id })} />;
        })}
        {!neuerBereich && <Pill label="+ Eigener Bereich" selected={false} onClick={() => setNeuerBereich({ name: "", icon: "⭐" })} />}
      </div>
      {neuerBereich && (
        <div style={{ border: `1px dashed ${cardBorder}`, borderRadius: 12, padding: 10, margin: "6px 0" }}>
          <TextInput value={neuerBereich.name} onChange={(v) => setNeuerBereich((n) => ({ ...n, name: v }))} placeholder="Name, z. B. Kinder, Ehrenamt, Garten" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: "8px 0" }}>
            {ICON_VORSCHLAEGE.map((i) => (
              <button key={i} type="button" onClick={() => setNeuerBereich((n) => ({ ...n, icon: i }))} aria-label={`Symbol ${i}`} style={{ width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${neuerBereich.icon === i ? "#1B2350" : cardBorder}`, background: "#fff", fontSize: 17, cursor: "pointer" }}>
                {i}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={bereichSpeichern} style={knopf(true)}>
              Bereich anlegen
            </button>
            <button type="button" onClick={() => setNeuerBereich(null)} style={knopf(false)}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
      <Label>Was?</Label>
      <TextInput value={e.titel} onChange={(v) => setze({ titel: v })} placeholder="z. B. Staubsaugen, Gitarre, Arzttermin" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label>Von</Label>
          <TextInput type="time" value={e.start} onChange={(v) => setze({ start: v })} />
        </div>
        <div>
          <Label>Bis</Label>
          <TextInput type="time" value={e.ende} onChange={(v) => setze({ ende: v })} />
        </div>
      </div>
      <Label>Wann?</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {WOCHENTAGE.map((w) => (
          <Pill key={w} label={w} selected={!einmalig && e.wochentage.includes(w)} onClick={() => setze({ datum: null, wochentage: e.wochentage.includes(w) && !einmalig ? e.wochentage.filter((x) => x !== w) : [...(einmalig ? [] : e.wochentage), w] })} />
        ))}
        <Pill label="Einmalig" selected={einmalig} onClick={() => setze({ datum: einmalig ? null : toLocalISODate(datum) })} />
      </div>
      {einmalig && (
        <div style={{ marginTop: 6 }}>
          <TextInput type="date" value={e.datum} onChange={(v) => setze({ datum: v })} />
        </div>
      )}
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: textMain, margin: "10px 0 4px" }}>
        <input type="checkbox" checked={e.erinnerung} onChange={(ev) => setze({ erinnerung: ev.target.checked })} /> Erinnerung zur Startzeit
      </label>
      <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>Tipp: Auch per Aka, z. B. „Samstags 10 Uhr Staubsaugen“.</div>
      {warnung && (
        <div data-konflikt-warnung style={{ background: "#FFF6E5", border: "1.5px solid #E8B04A", borderRadius: 12, padding: "10px 12px", fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>
          ⚠️ Zu dieser Zeit ist schon etwas geplant:{" "}
          {warnung.map((t) => `${t.icon ? `${t.icon} ` : ""}${t.titel} (${t.tag} ${hhmm(t.start)}–${hhmm(t.ende)})`).join(", ")}.
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={() => setWarnung(null)} style={knopf(true)}>
              Zeit ändern
            </button>
            <button type="button" onClick={() => speichern(true)} style={knopf(false)}>
              Trotzdem eintragen
            </button>
          </div>
        </div>
      )}
      {fehler && <div style={{ color: danger, fontSize: 12.5, marginBottom: 8 }}>{fehler}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" disabled={laeuft} onClick={() => speichern()} style={{ ...knopf(true), flex: 1, padding: 11, fontSize: 14 }}>
          {laeuft ? "…" : "Speichern"}
        </button>
        {e.id && (
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm(`„${e.titel}“ wirklich löschen?`)) return;
              const r = await alltagLoeschen?.(e.id);
              if (r?.ok) onFertig();
            }}
            style={{ ...knopf(false), color: danger, borderColor: danger }}
          >
            Löschen
          </button>
        )}
      </div>
    </Card>
  );
}

function BlockDetails({ b, datum, onAendern, onSchliessen, bloeckeFuer }) {
  const { alltagAbhaken } = useAppData();
  const mit = bloeckeFuer ? konflikte(bloeckeFuer(datum)).get(b.key) || [] : [];
  return (
    <Card style={{ marginBottom: 12, border: `1.5px solid ${b.farbe.dot}` }}>
      <div data-block-details style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 24 }}>{b.icon}</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontSize: 15.5, fontWeight: 900, color: textMain }}>{b.titel}</span>
          <span style={{ display: "block", fontSize: 12.5, color: textMuted }}>
            {datum.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })} · {hhmm(b.start)}–{hhmm(b.ende)}
          </span>
        </span>
        <button type="button" onClick={onSchliessen} aria-label="Schließen" style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer", color: textMuted }}>
          ✕
        </button>
      </div>
      {mit.length > 0 && (
        <div data-konflikt-details style={{ marginTop: 8, fontSize: 12.5, color: "#7A5200", background: "#FFF6E5", borderRadius: 10, padding: "6px 10px" }}>
          ⚠️ Überschneidet sich mit {mit.map((x) => `${x.titel} (${hhmm(x.start)}–${hhmm(x.ende)})`).join(", ")}. Über „Ändern“ eine andere Zeit wählen.
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button type="button" onClick={async () => (await alltagAbhaken?.(b.alltag.id, toLocalISODate(datum)))?.ok && onSchliessen()} style={{ ...knopf(true), flex: 1, padding: 10 }}>
          {b.done ? "↩︎ Nicht erledigt" : "✓ Erledigt"}
        </button>
        <button type="button" onClick={onAendern} style={knopf(false)}>
          ✎ Ändern
        </button>
      </div>
    </Card>
  );
}

export default function KalenderView({ onHome }) {
  const appData = useAppData();
  const bloeckeFuer = useTagesBloecke();
  const [ansicht, setAnsicht] = useState(() => new URLSearchParams(window.location.search).get("kal") || "woche");
  const [datum, setDatum] = useState(() => new Date());
  const [formular, setFormular] = useState(null); // Eintrag-Entwurf | null
  const [details, setDetails] = useState(null); // { b, datum } | null
  const montag = useMemo(() => startOfWeek(datum), [datum]);
  const tage = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(montag, i)), [montag]);

  const zumTag = (d) => {
    setDatum(d);
    setAnsicht("tag");
  };
  const blaettern = (richtung) => {
    setDetails(null);
    if (ansicht === "tag") setDatum((d) => addDays(d, richtung));
    else if (ansicht === "woche") setDatum((d) => addDays(d, 7 * richtung));
    else setDatum((d) => new Date(d.getFullYear(), d.getMonth() + richtung, 1));
  };
  const titel =
    ansicht === "tag"
      ? datum.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })
      : ansicht === "woche"
        ? `${tage[0].toLocaleDateString("de-DE", { day: "numeric", month: "short" })} – ${tage[6].toLocaleDateString("de-DE", { day: "numeric", month: "short" })}`
        : `${MONATE[datum.getMonth()]} ${datum.getFullYear()}`;
  const tagesBloecke = ansicht === "tag" ? bloeckeFuer(datum) : [];
  const blockOeffnen = (b, d = datum) => {
    setFormular(null);
    setDetails({ b, datum: d });
  };

  return (
    <Shell>
      <ViewHeader title="🗓️ Mein Alltag" onHome={onHome} />
      <div data-kalender={ansicht} style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {[
          ["tag", "Tag"],
          ["woche", "Woche"],
          ["monat", "Monat"],
        ].map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setAnsicht(k)}
            style={{ flex: 1, border: `1px solid ${ansicht === k ? "#1B2350" : cardBorder}`, background: ansicht === k ? "#1B2350" : "#fff", color: ansicht === k ? "#fff" : textMain, borderRadius: 12, padding: "8px 0", fontSize: 13.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
          >
            {l}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <button type="button" aria-label="Zurück blättern" onClick={() => blaettern(-1)} style={pfeil}>
          ‹
        </button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 900, color: textMain }}>{titel}</div>
        <button type="button" aria-label="Weiter blättern" onClick={() => blaettern(1)} style={pfeil}>
          ›
        </button>
      </div>
      {details && !formular && (
        <BlockDetails
          bloeckeFuer={bloeckeFuer}
          b={details.b}
          datum={details.datum}
          onSchliessen={() => setDetails(null)}
          onAendern={() => {
            setFormular({ ...details.b.alltag });
            setDetails(null);
          }}
        />
      )}
      {formular ? (
        <EintragFormular key={formular.id || "neu"} start={formular} datum={datum} bloeckeFuer={bloeckeFuer} onFertig={() => setFormular(null)} />
      ) : (
        !details && (
          <button type="button" className="mp-tap" onClick={() => setFormular(leer(datum))} style={{ width: "100%", marginBottom: 10, border: "1.5px dashed #1B2350", background: "#fff", color: "#1B2350", borderRadius: 12, padding: 9, fontSize: 13.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
            + Eintrag: Arbeit, Haushalt, Hobby, Me-Time, Termin …
          </button>
        )
      )}
      {!formular && !details && (
        <button type="button" className="mp-tap" data-dienstplan-link onClick={() => (window.location.hash = "#/dienstplan-foto")} style={{ width: "100%", marginBottom: 10, border: "none", background: "#EEF4FF", color: "#2D6FD6", borderRadius: 12, padding: 9, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
          📷 Dienstplan abfotografieren
        </button>
      )}
      <Card style={{ padding: 10 }}>
        {ansicht === "tag" && <TagAnsicht datum={datum} bloecke={tagesBloecke} onBlock={(b) => blockOeffnen(b, datum)} />}
        {ansicht === "woche" && <WochenAnsicht tage={tage} bloeckeFuer={bloeckeFuer} onTag={zumTag} onBlock={blockOeffnen} />}
        {ansicht === "monat" && <MonatsAnsicht jahr={datum.getFullYear()} monat={datum.getMonth()} bloeckeFuer={bloeckeFuer} onTag={zumTag} />}
      </Card>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {[...Object.values(ALLTAG_BEREICHE), ...(appData.alltagBereiche || []).map(eigeneBereichMeta)].map((m) => (
          <span key={m.label} style={{ fontSize: 11, fontWeight: 700, background: m.bg, color: m.text, borderRadius: 99, padding: "3px 8px" }}>
            {m.icon} {m.label}
          </span>
        ))}
        <span style={{ fontSize: 11, color: textMuted, padding: "3px 4px" }}>+ alles aus deinen Plänen in den gewohnten Farben. Tipp auf einen Alltags-Eintrag: abhaken oder ändern.</span>
      </div>
    </Shell>
  );
}

const pfeil = { width: 36, height: 36, borderRadius: 18, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 18, cursor: "pointer", color: textMain };
const knopf = (voll) => ({ border: voll ? "none" : `1.5px solid #1B2350`, background: voll ? "#1B2350" : "#fff", color: voll ? "#fff" : "#1B2350", borderRadius: 12, padding: "8px 12px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" });
