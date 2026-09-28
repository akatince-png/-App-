import React, { useMemo, useState } from "react";
import { Shell, Card, Pill, TextInput, Label } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import { cardBorder, textMain, textMuted } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { buildDayItems } from "../utils/dayItems";
import { addDays, sameDay } from "../utils/dates";

const startOfWeek = (d) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
import { ALLTAG_BEREICHE, WOCHENTAGE, bloeckeFuerTag, hhmm, monatsRaster, spaltenVerteilen } from "../utils/kalender";

// Kalender „Mein Alltag“ (28.09., VORSCHAU auf dem Branch). Tag als
// Zeitleiste, Woche als Stundenplan, Monat als Kalenderblatt. Alles aus der
// App erscheint automatisch (Routinen, Training, Essen, Supplemente,
// Zeitblöcke …), dazu Alltags-Einträge (Arbeit, Haushalt, Hobby, Termine,
// Freunde & Familie) – wiederkehrend nach Wochentagen oder einmalig.

const VON = 5 * 60;
const BIS = 24 * 60;
const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

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
    return bloeckeFuerTag(date, { items, routineEinstellungen: a.routineEinstellungen || {}, alltagEintraege: a.alltagEintraege || [] });
  };
}

function Block({ b, pxProMin, klein }) {
  const top = (Math.max(b.start, VON) - VON) * pxProMin;
  const hoehe = Math.max((Math.min(b.ende, BIS) - Math.max(b.start, VON)) * pxProMin, klein ? 12 : 20);
  const breite = 100 / b.spalten;
  return (
    <div
      title={`${hhmm(b.start)}–${hhmm(b.ende)} ${b.titel}`}
      style={{
        position: "absolute",
        top,
        height: hoehe - 2,
        left: `calc(${b.spalte * breite}% + 1px)`,
        width: `calc(${breite}% - 2px)`,
        background: b.farbe.bg,
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
      }}
    >
      {klein ? (
        <span>{b.icon || ""}{b.icon ? " " : ""}{b.titel}</span>
      ) : (
        <>
          <span style={{ display: "block", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
            {b.icon ? `${b.icon} ` : ""}
            {b.titel}
            {b.done ? " ✓" : ""}
          </span>
          {hoehe > 30 && <span style={{ display: "block", fontWeight: 500, opacity: 0.8 }}>{hhmm(b.start)}–{hhmm(b.ende)}</span>}
        </>
      )}
    </div>
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
  return <div style={{ position: "absolute", left: 0, right: 0, top: (m - VON) * pxProMin, borderTop: "2px solid #E0352B", zIndex: 2 }} />;
}

function TagAnsicht({ datum, bloecke }) {
  const px = 0.9;
  const heute = sameDay(datum, new Date());
  return (
    <div style={{ display: "flex", height: (BIS - VON) * px, position: "relative" }}>
      <Zeitachse pxProMin={px} />
      <div style={{ position: "relative", flex: 1 }}>
        <Linien pxProMin={px} />
        {heute && <JetztLinie pxProMin={px} />}
        {spaltenVerteilen(bloecke).map((b) => (
          <Block key={b.key} b={b} pxProMin={px} />
        ))}
      </div>
    </div>
  );
}

function WochenAnsicht({ tage, bloeckeFuer, onTag }) {
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
              {spaltenVerteilen(bloeckeFuer(d)).map((b) => (
                <Block key={b.key} b={b} pxProMin={px} klein />
              ))}
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

function NeuerEintrag({ onSchliessen }) {
  const [bereich, setBereich] = useState("haushalt");
  const [titel, setTitel] = useState("");
  const [tage, setTage] = useState(["Sa"]);
  return (
    <Card style={{ marginBottom: 12, border: "1.5px solid #1B2350" }}>
      <div data-neuer-eintrag style={{ fontSize: 15, fontWeight: 900, color: textMain }}>Neuer Eintrag</div>
      <Label>Bereich</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {Object.entries(ALLTAG_BEREICHE).map(([k, m]) => (
          <Pill key={k} label={`${m.icon} ${m.label}`} selected={bereich === k} onClick={() => setBereich(k)} />
        ))}
      </div>
      <Label>Was?</Label>
      <TextInput value={titel} onChange={setTitel} placeholder="z. B. Staubsaugen, Gitarre, Arzttermin" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <Label>Von</Label>
          <TextInput type="time" value="10:00" onChange={() => {}} />
        </div>
        <div>
          <Label>Bis</Label>
          <TextInput type="time" value="10:45" onChange={() => {}} />
        </div>
      </div>
      <Label>Wiederholen an</Label>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {WOCHENTAGE.map((w) => (
          <Pill key={w} label={w} selected={tage.includes(w)} onClick={() => setTage((t) => (t.includes(w) ? t.filter((x) => x !== w) : [...t, w]))} />
        ))}
        <Pill label="Einmalig" selected={tage.length === 0} onClick={() => setTage([])} />
      </div>
      <div style={{ fontSize: 12, color: textMuted, margin: "8px 0" }}>Mit Erinnerung, abhakbar wie alles andere. Auch per Aka: „Samstags 10 Uhr Staubsaugen“.</div>
      <button type="button" onClick={onSchliessen} style={{ width: "100%", border: "none", background: "#1B2350", color: "#fff", borderRadius: 12, padding: 11, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
        Speichern (Vorschau)
      </button>
    </Card>
  );
}

export default function KalenderView({ onHome }) {
  const bloeckeFuer = useTagesBloecke();
  const [ansicht, setAnsicht] = useState(() => new URLSearchParams(window.location.search).get("kal") || "woche");
  const [datum, setDatum] = useState(() => new Date());
  const [neu, setNeu] = useState(false);
  const montag = useMemo(() => startOfWeek(datum), [datum]);
  const tage = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(montag, i)), [montag]);
  const zumTag = (d) => {
    setDatum(d);
    setAnsicht("tag");
  };
  const blaettern = (richtung) => {
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
      {neu ? (
        <NeuerEintrag onSchliessen={() => setNeu(false)} />
      ) : (
        <button type="button" className="mp-tap" onClick={() => setNeu(true)} style={{ width: "100%", marginBottom: 10, border: "1.5px dashed #1B2350", background: "#fff", color: "#1B2350", borderRadius: 12, padding: 9, fontSize: 13.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
          + Eintrag: Arbeit, Haushalt, Hobby, Termin …
        </button>
      )}
      <Card style={{ padding: 10 }}>
        {ansicht === "tag" && <TagAnsicht datum={datum} bloecke={tagesBloecke} />}
        {ansicht === "woche" && <WochenAnsicht tage={tage} bloeckeFuer={bloeckeFuer} onTag={zumTag} />}
        {ansicht === "monat" && <MonatsAnsicht jahr={datum.getFullYear()} monat={datum.getMonth()} bloeckeFuer={bloeckeFuer} onTag={zumTag} />}
      </Card>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {Object.values(ALLTAG_BEREICHE).map((m) => (
          <span key={m.label} style={{ fontSize: 11, fontWeight: 700, background: m.bg, color: m.text, borderRadius: 99, padding: "3px 8px" }}>
            {m.icon} {m.label}
          </span>
        ))}
        <span style={{ fontSize: 11, color: textMuted, padding: "3px 4px" }}>+ alles aus deinen Plänen in den gewohnten Farben</span>
      </div>
    </Shell>
  );
}

const pfeil = { width: 36, height: 36, borderRadius: 18, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 18, cursor: "pointer", color: textMain };
