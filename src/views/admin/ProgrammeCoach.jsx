import React, { useState } from "react";
import { PrimaryButton } from "../../ui/primitives";
import { accentDark, cardBorder, danger, textMain, textMuted } from "../../ui/theme";
import { toLocalISODate } from "../../utils/dates";
import { datumKurz, programmStand } from "../../utils/kernprogramm";
import { EINSTELLUNG, STATUS_TEXT, teilnahmenZaehlen } from "../../utils/programme";

// Programme als eigenständige Module (26.09., Nutzerinnen-Vorgabe) – die
// Coach-Seite: oben die Programme für alle (an/aus, automatisch für neue,
// "wartet auf Start" für mehrere auf einmal starten), in der aufgeklappten
// Person die Programme dieser Person (freischalten, starten, pausieren,
// beenden) und was sie in der Vorstellung angetippt hat.

const knopf = (aktiv) => ({
  border: "none",
  borderRadius: 99,
  padding: "6px 11px",
  fontSize: 12.5,
  fontWeight: 800,
  cursor: "pointer",
  fontFamily: "inherit",
  background: aktiv ? accentDark : "#EEF0F5",
  color: aktiv ? "#fff" : textMain,
});
const datumFeld = { border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "7px 9px", fontSize: 13.5, fontFamily: "inherit" };
const STATUS_FARBE = { wartet: "#B7791F", laufend: "#2E9C86", pausiert: textMuted, abgeschlossen: accentDark, beendet: textMuted };

function Umschalter({ an, label, onClick }) {
  return (
    <button type="button" role="switch" aria-checked={an} onClick={onClick} className="mp-tap" style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, color: textMain, padding: "2px 0" }}>
      <span style={{ width: 34, height: 20, borderRadius: 99, background: an ? "#2E9C86" : "#D5D8E2", position: "relative", transition: "background .2s" }}>
        <span style={{ position: "absolute", top: 2, left: an ? 16 : 2, width: 16, height: 16, borderRadius: 99, background: "#fff", transition: "left .2s" }} />
      </span>
      {label}
    </button>
  );
}

// Leiste über der Coachee-Liste.
export function ProgrammeLeiste({ personen, etappenByUser, programme, teilnahmen, hinweis, onStarten, onEinstellen }) {
  const heute = toLocalISODate(new Date());
  const [start, setStart] = useState(heute);
  const [offen, setOffen] = useState(false);
  const einstellung = programme.find((p) => p.id === EINSTELLUNG);
  const teilnahme = (id) => teilnahmen.find((t) => t.userId === id && t.programmId === EINSTELLUNG);
  // Wartet auf Start: Teilnahme "wartet" (oder noch keine Zeile) und noch keine Etappe.
  const wartend = einstellung?.aktiv
    ? personen.filter((p) => !(etappenByUser[p.id] || []).length && ["wartet", undefined].includes(teilnahme(p.id)?.status))
    : [];
  const faellig = personen.filter((p) => programmStand(etappenByUser[p.id] || [], heute).gespraechFaellig);
  return (
    <div style={{ borderRadius: 14, border: `1.5px solid ${cardBorder}`, background: "#fff", padding: "10px 12px", marginBottom: 10 }} data-programme-leiste>
      <button type="button" data-programme-toggle onClick={() => setOffen((o) => !o)} aria-expanded={offen} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", border: "none", background: "transparent", padding: 0, cursor: "pointer", fontFamily: "inherit", color: textMain }}>
        <span style={{ fontSize: 13.5, fontWeight: 800 }}>🧭 Programme</span>
        <span style={{ fontSize: 12, color: textMuted }}>
          {programme.map((p) => `${p.emoji} ${p.aktiv ? "an" : "aus"}`).join(" · ")} {offen ? "▾" : "›"}
        </span>
      </button>
      {offen &&
        programme.map((p) => {
          const z = teilnahmenZaehlen(teilnahmen, p.id);
          return (
            <div key={p.id} style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #F0F1F5" }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>
                {p.emoji} {p.name}
                {p.wochen ? <span style={{ fontWeight: 600, color: textMuted, fontSize: 12 }}> · ca. {p.wochen} Wochen</span> : null}
              </div>
              {p.beschreibung && <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{p.beschreibung}</div>}
              <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>
                {z.laufend} laufen · {z.wartet} warten auf Start{z.pausiert ? ` · ${z.pausiert} pausiert` : ""}
                {z.beendet ? ` · ${z.beendet} beendet` : ""}
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 6 }}>
                <Umschalter an={p.aktiv} label="Für alle an" onClick={() => onEinstellen(p.id, { aktiv: !p.aktiv })} />
                <Umschalter an={p.fuerNeue} label="Neue bekommen es automatisch" onClick={() => onEinstellen(p.id, { fuerNeue: !p.fuerNeue })} />
              </div>
            </div>
          );
        })}
      {faellig.length > 0 && <div style={{ fontSize: 13, fontWeight: 800, marginTop: 10 }}>💬 Etappen-Gespräch fällig: {faellig.map((p) => p.vorname || p.email).join(", ")}</div>}
      {wartend.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13 }}>
            ⏳ <b>{wartend.length}</b> {wartend.length === 1 ? "wartet" : "warten"} auf den Start der Einstellungsphase: {wartend.map((p) => p.vorname || p.email).join(", ")}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
            <input type="date" aria-label="Start für alle" value={start} onChange={(e) => setStart(e.target.value)} style={datumFeld} />
            <div style={{ flex: 1, minWidth: 160 }}>
              <PrimaryButton onClick={() => onStarten(wartend.map((p) => p.id), EINSTELLUNG, start)}>Für alle {wartend.length} starten</PrimaryButton>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: textMuted, marginTop: 4 }}>Oder einzeln: Person aufklappen → Programme. Los geht&apos;s am Abend des Starttags.</div>
        </div>
      )}
      {hinweis && <div style={{ fontSize: 12.5, marginTop: 8, color: textMuted }}>{hinweis}</div>}
    </div>
  );
}

// Programme einer Person (in der aufgeklappten Coachee-Zeile).
export function ProgrammePerson({ person, programme, teilnahmen, tabs, onSetzen, onStarten }) {
  const heute = toLocalISODate(new Date());
  const [start, setStart] = useState({});
  const [fehler, setFehler] = useState(null);
  const eigene = teilnahmen.filter((t) => t.userId === person.id);
  const ausfuehren = async (fn) => {
    setFehler(null);
    const r = await fn();
    if (r && !r.ok) setFehler(r.error || "Hat nicht geklappt.");
  };
  return (
    <div style={{ borderRadius: 12, border: `1.5px solid ${cardBorder}`, background: "#fff", padding: "10px 12px", marginBottom: 10 }} data-programme-person>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>🧭 Programme von {person.vorname || "dieser Person"}</div>
      {tabs?.length > 0 && (
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>
          In der Vorstellung angetippt: <span style={{ color: textMain }}>{tabs.join(" · ")}</span>
        </div>
      )}
      {programme.map((p) => {
        const t = eigene.find((x) => x.programmId === p.id);
        const status = t?.status;
        return (
          <div key={p.id} style={{ padding: "7px 0", borderTop: "1px solid #F0F1F5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>
                {p.emoji} {p.name}
                {!p.aktiv && <span style={{ fontSize: 11.5, color: textMuted }}> (für alle aus)</span>}
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: status ? STATUS_FARBE[status] : textMuted }}>
                {status ? STATUS_TEXT[status] : "nicht freigeschaltet"}
                {status === "laufend" && t.start ? ` · seit ${datumKurz(t.start)}` : ""}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
              {!status && (
                <button type="button" style={knopf(true)} onClick={() => ausfuehren(() => onSetzen(person.id, p.id, { status: "wartet" }))}>
                  + Freischalten
                </button>
              )}
              {status === "wartet" && (
                <>
                  <input type="date" aria-label={`Start ${p.name}`} value={start[p.id] || heute} onChange={(e) => setStart((s) => ({ ...s, [p.id]: e.target.value }))} style={datumFeld} />
                  <button type="button" style={knopf(true)} onClick={() => ausfuehren(() => onStarten([person.id], p.id, start[p.id] || heute))}>
                    ▶ Starten (abends)
                  </button>
                </>
              )}
              {status === "laufend" && (
                <>
                  <button type="button" style={knopf(false)} onClick={() => ausfuehren(() => onSetzen(person.id, p.id, { status: "pausiert" }))}>
                    ⏸ Pausieren
                  </button>
                  <button type="button" style={knopf(false)} onClick={() => ausfuehren(() => onSetzen(person.id, p.id, { status: "beendet" }))}>
                    ⏹ Beenden
                  </button>
                </>
              )}
              {(status === "pausiert" || status === "beendet") && (
                <button type="button" style={knopf(true)} onClick={() => ausfuehren(() => onSetzen(person.id, p.id, { status: "laufend" }))}>
                  ▶ Fortsetzen
                </button>
              )}
            </div>
          </div>
        );
      })}
      {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
    </div>
  );
}
