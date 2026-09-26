import React, { useState } from "react";
import { PrimaryButton } from "../../ui/primitives";
import { accentDark, cardBorder, danger, textMain, textMuted } from "../../ui/theme";
import { toLocalISODate } from "../../utils/dates";
import { BAUSTEINE, datumKurz, programmStand } from "../../utils/kernprogramm";
import { EINSTELLUNG, STATUS_TEXT, etappenVerschieben, kernStandMitProgramm, teilnahmenZaehlen, wiederholungAb } from "../../utils/programme";

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
// `aktionen`: { setzen, starten, pausieren, fortsetzen, wiederholen,
// zuruecknehmen, persoenlich } – jeweils async, liefern { ok, error }.
export function ProgrammePerson({ person, programme, teilnahmen, etappen = [], tabs, aktionen }) {
  const heute = toLocalISODate(new Date());
  const [start, setStart] = useState({});
  const [fehler, setFehler] = useState(null);
  const [einstellenOffen, setEinstellenOffen] = useState(null);
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
        const verschiebungen = t?.einstellungen?.verschiebungen || [];
        const stand = p.id === EINSTELLUNG && t ? kernStandMitProgramm(etappenVerschieben(etappen, verschiebungen, heute), heute, t, p) : null;
        const ab = stand?.aktiv ? wiederholungAb(stand) : null;
        const schonGeplant = ab && verschiebungen.some((v) => v.ab === ab);
        return (
          <div key={p.id} style={{ padding: "7px 0", borderTop: "1px solid #F0F1F5" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>
                {p.emoji} {p.name}
                {!p.aktiv && <span style={{ fontSize: 11.5, color: textMuted }}> (für alle aus)</span>}
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: status ? STATUS_FARBE[status] : textMuted }}>
                {status ? STATUS_TEXT[status] : "nicht freigeschaltet"}
                {status === "laufend" && stand?.aktiv ? ` · Woche ${stand.gesamtWoche}` : ""}
                {status === "pausiert" && t.einstellungen?.pauseSeit ? ` seit ${datumKurz(t.einstellungen.pauseSeit)}` : ""}
              </span>
            </div>
            {p.wochen && t && (
              <div style={{ fontSize: 11.5, color: textMuted, marginTop: 2 }}>
                Dauer: {p.wochen} Wochen{verschiebungen.length ? ` + ${verschiebungen.length} wiederholt = ${p.wochen + verschiebungen.length}` : ""}
                {t.notiz ? ` · 📝 ${t.notiz}` : ""}
              </div>
            )}
            {verschiebungen
              .filter((v) => v.ab > heute)
              .map((v) => (
                <div key={v.ab} style={{ fontSize: 12, marginTop: 4, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  🔁 Woche {v.woche} wird ab {datumKurz(v.ab)} wiederholt
                  <button type="button" style={knopf(false)} onClick={() => ausfuehren(() => aktionen.zuruecknehmen(person.id, t, v))}>
                    Zurücknehmen
                  </button>
                </div>
              ))}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
              {!status && (
                <button type="button" style={knopf(true)} onClick={() => ausfuehren(() => aktionen.setzen(person.id, p.id, { status: "wartet" }))}>
                  + Freischalten
                </button>
              )}
              {status === "wartet" && (
                <>
                  <input type="date" aria-label={`Start ${p.name}`} value={start[p.id] || heute} onChange={(e) => setStart((x) => ({ ...x, [p.id]: e.target.value }))} style={datumFeld} />
                  <button type="button" style={knopf(true)} onClick={() => ausfuehren(() => aktionen.starten([person.id], p.id, start[p.id] || heute))}>
                    ▶ Starten (abends)
                  </button>
                </>
              )}
              {status === "laufend" && (
                <>
                  {ab && !schonGeplant && (
                    <button type="button" style={knopf(false)} title={`Ab ${datumKurz(ab)} (Tag nach dem Ende dieser Woche)`} onClick={() => ausfuehren(() => aktionen.wiederholen(person.id, t, stand))}>
                      🔁 Woche {stand.gesamtWoche} wiederholen
                    </button>
                  )}
                  <button type="button" style={knopf(false)} onClick={() => ausfuehren(() => aktionen.pausieren(person.id, p.id, t))}>
                    ⏸ Pausieren
                  </button>
                  <button type="button" style={knopf(false)} onClick={() => ausfuehren(() => aktionen.setzen(person.id, p.id, { status: "beendet" }))}>
                    ⏹ Beenden
                  </button>
                </>
              )}
              {(status === "pausiert" || status === "beendet") && (
                <button type="button" style={knopf(true)} onClick={() => ausfuehren(() => aktionen.fortsetzen(person.id, p.id, t))}>
                  ▶ Fortsetzen
                </button>
              )}
              {t && (
                <button type="button" style={knopf(einstellenOffen === p.id)} aria-expanded={einstellenOffen === p.id} data-programme-toggle onClick={() => setEinstellenOffen((o) => (o === p.id ? null : p.id))}>
                  ⚙️ Persönlich einstellen
                </button>
              )}
            </div>
            {ab && !schonGeplant && status === "laufend" && <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>Wiederholen beginnt am Tag nach dem Ende dieser Woche ({datumKurz(ab)}); alles Weitere rückt 7 Tage nach hinten.</div>}
            {status === "pausiert" && <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>Beim Fortsetzen rückt alles um die Pausentage nach hinten – es geht in derselben Woche weiter.</div>}
            {einstellenOffen === p.id && t && <PersoenlichEinstellen key={t.id} teilnahme={t} mitBausteinen={p.id === EINSTELLUNG} onSpeichern={(werte) => ausfuehren(() => aktionen.persoenlich(person.id, p.id, t, werte))} />}
          </div>
        );
      })}
      {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
    </div>
  );
}

// Persönliche Einstellungen je Teilnahme: Bausteine auslassen + Notiz.
function PersoenlichEinstellen({ teilnahme, mitBausteinen, onSpeichern }) {
  const [aus, setAus] = useState(teilnahme.einstellungen?.ausgelassen || []);
  const [notiz, setNotiz] = useState(teilnahme.notiz || "");
  const [gespeichert, setGespeichert] = useState(false);
  return (
    <div style={{ marginTop: 8, borderRadius: 10, background: "#F7F8FB", padding: "10px 11px" }} data-persoenlich>
      {mitBausteinen && (
        <>
          <div style={{ fontSize: 12.5, fontWeight: 800 }}>Bausteine für diese Person</div>
          <div style={{ fontSize: 11.5, color: textMuted, margin: "2px 0 6px" }}>Durchgestrichen = fällt für diese Person weg (z. B. nach Absprache).</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {BAUSTEINE.map((b) => {
              const weg = aus.includes(b.key);
              return (
                <button
                  key={b.key}
                  type="button"
                  aria-pressed={!weg}
                  onClick={() => setAus((a) => (weg ? a.filter((k) => k !== b.key) : [...a, b.key]))}
                  style={{ border: `1px solid ${weg ? "#D5D8E2" : "#9CC9B0"}`, background: weg ? "#fff" : "#EAF6EF", color: weg ? textMuted : textMain, textDecoration: weg ? "line-through" : "none", borderRadius: 99, padding: "4px 9px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {b.icon} {b.name} · W{b.woche}
                </button>
              );
            })}
          </div>
        </>
      )}
      <div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 10 }}>Notiz (nur für dich)</div>
      <textarea aria-label="Notiz zum Programm" value={notiz} onChange={(e) => setNotiz(e.target.value)} rows={2} placeholder="z. B. Knie schonen, lieber Rad statt Laufen" style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "7px 9px", fontSize: 13, fontFamily: "inherit", marginTop: 4 }} />
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
        <button
          type="button"
          style={knopf(true)}
          onClick={async () => {
            await onSpeichern({ ausgelassen: aus, notiz: notiz.trim() });
            setGespeichert(true);
          }}
        >
          Speichern
        </button>
        {gespeichert && <span style={{ fontSize: 12, color: "#2E9C86", fontWeight: 700 }}>✓ gespeichert</span>}
      </div>
    </div>
  );
}
