import React, { useMemo, useState } from "react";
import { Shell, Card, PrimaryButton } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import TimeWheelField from "../ui/TimeWheelField";
import { cardBorder, danger, textMuted } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { toLocalISODate } from "../utils/dates";
import { NACHT_VORLAGE, RHYTHMEN, VORLAGEN, planErzeugen, plusTage, rollenZuordnung, wochenBeginn } from "../utils/schichtplan";

// "Routine-Zeiten & Schichtplan" (25.09., Nutzerinnen-Freigabe der
// Vorschau): ① Zeit-Varianten je Schichtart, ② Schichtplan per Rhythmus
// in wenigen Tipps plus Tag-für-Tag-Korrektur im Kalender, ③ Schritte nur
// für bestimmte Schichten oder ab einem Datum. Ohne Varianten/Plan gilt
// überall die normale Zeit wie bisher. Jede Änderung wird protokolliert.
// Aka kann denselben Plan aus dem Gespräch anlegen (useUniversellerCoach).

const FARBEN = ["#FFF1D6", "#E7E3FF", "#E6F5EC", "#DDE7FA", "#FBE3EC"];
const ICONS = ["🌅", "🌆", "🌙", "🌿", "🕐", "💼"];
const DAUER = [
  { wochen: 2, label: "2 Wo." },
  { wochen: 4, label: "4 Wo." },
  { wochen: 8, label: "8 Wo." },
  { wochen: 26, label: "bis auf Weiteres" },
];

const chip = (an) => ({
  border: "none",
  borderRadius: 99,
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  background: an ? "#1B2350" : "#EEF4FF",
  color: an ? "#fff" : "#2D6FD6",
});

function naechsterMontag(heute) {
  const wb = wochenBeginn(heute);
  return wb === heute ? heute : plusTage(wb, 7);
}
function datumKurz(iso) {
  const [, m, t] = iso.split("-");
  return `${Number(t)}.${Number(m)}.`;
}

export default function SchichtplanView({ onHome }) {
  const {
    routineVarianten = [],
    routineSchichtplan = {},
    routineEinstellungenStandard = {},
    routineSchritteAlle = [],
    routineVarianteSpeichern,
    routineVarianteEntfernen,
    routineSchichtplanSpeichern,
    routineSchrittHinzufuegen,
    routineSchrittEntfernen,
    aenderungVermerken,
  } = useAppData();
  const heute = toLocalISODate(new Date());
  const vermerken = (detail) => aenderungVermerken?.({ kategorie: "morgenroutine", itemName: "Schichtplan", aktion: "geändert", detail });

  return (
    <Shell>
      <ViewHeader title="📅 Routine-Zeiten & Schichtplan" onHome={onHome} />
      <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.45, marginBottom: 14 }}>
        Für Schichtarbeit oder wechselnde Wochen: Die Schritte deiner Routinen bleiben gleich, nur die Startzeiten richten sich nach der Schicht des Tages. Tage ohne Schicht nutzen die normale Zeit
        {routineEinstellungenStandard.morgen?.startZeit ? ` (☀ ${routineEinstellungenStandard.morgen.startZeit}` : " ("}
        {routineEinstellungenStandard.abend?.startZeit ? ` · 🌙 ${routineEinstellungenStandard.abend.startZeit})` : ")"}.
      </div>

      <Varianten varianten={routineVarianten} onSpeichern={routineVarianteSpeichern} onEntfernen={routineVarianteEntfernen} vermerken={vermerken} />
      {routineVarianten.length > 0 && (
        <PlanEditor heute={heute} varianten={routineVarianten} plan={routineSchichtplan} onSpeichern={routineSchichtplanSpeichern} vermerken={vermerken} />
      )}
      {routineVarianten.length > 0 && (
        <SchritteJeVariante
          heute={heute}
          varianten={routineVarianten}
          schritte={routineSchritteAlle}
          onHinzufuegen={routineSchrittHinzufuegen}
          onEntfernen={routineSchrittEntfernen}
          aenderungVermerken={aenderungVermerken}
        />
      )}
      <div style={{ fontSize: 12.5, color: textMuted, lineHeight: 1.45, margin: "4px 2px 24px" }}>
        🤖 Geht auch per Aka, z. B.: „Ab Montag vier Wochen abwechselnd Früh- und Spätschicht, Frühschicht Morgenroutine um halb fünf.“
        <br />
        💡 Eine Kernschlafzeit, die in jeder Schicht gleich bleibt (z. B. 01:00–05:00), hilft dem Körper beim Umstellen.
      </div>
    </Shell>
  );
}

// ① Zeit-Varianten
function Varianten({ varianten, onSpeichern, onEntfernen, vermerken }) {
  const [offen, setOffen] = useState(null);
  const [fehler, setFehler] = useState(null);
  const vorlagenAnlegen = async (liste) => {
    setFehler(null);
    for (const [i, v] of liste.entries()) {
      const r = await onSpeichern({ ...v, reihenfolge: varianten.length + i });
      if (!r?.ok) return setFehler(r?.error || "Speichern fehlgeschlagen.");
    }
    vermerken(`Zeit-Varianten angelegt: ${liste.map((v) => v.name).join(", ")}`);
  };
  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 4 }}>🕐 Zeit-Varianten</div>
      <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>Wann starten Morgen- und Abendroutine in welcher Schicht?</div>
      {varianten.length === 0 && (
        <>
          <PrimaryButton onClick={() => vorlagenAnlegen(VORLAGEN)}>Früh · Spät · Frei anlegen</PrimaryButton>
          <div style={{ fontSize: 11.5, color: textMuted, margin: "6px 2px 8px" }}>Mit Beispielzeiten – danach einfach antippen und anpassen.</div>
        </>
      )}
      {varianten.map((v, i) =>
        offen === v.id ? (
          <VarianteBearbeiten
            key={v.id}
            variante={v}
            farbe={FARBEN[i % FARBEN.length]}
            onFertig={async (neu) => {
              const r = await onSpeichern({ ...v, ...neu });
              if (!r?.ok) return setFehler(r?.error || "Speichern fehlgeschlagen.");
              vermerken(`${neu.name}: Morgen ${neu.morgenStart || "–"}, Abend ${neu.abendStart || "–"}`);
              setOffen(null);
            }}
            onEntfernen={async () => {
              const r = await onEntfernen(v.id);
              if (!r?.ok) return setFehler(r?.error || "Löschen fehlgeschlagen.");
              vermerken(`Zeit-Variante ${v.name} entfernt`);
              setOffen(null);
            }}
            onAbbrechen={() => setOffen(null)}
          />
        ) : (
          <button
            key={v.id}
            type="button"
            className="mp-tap"
            onClick={() => setOffen(v.id)}
            aria-label={`${v.name} bearbeiten`}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, border: "none", borderRadius: 14, padding: "10px 12px", marginBottom: 8, background: FARBEN[i % FARBEN.length], cursor: "pointer", fontFamily: "inherit", color: "inherit", textAlign: "left" }}
          >
            <span style={{ fontSize: 22 }}>{v.icon}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 800, fontSize: 14 }}>{v.name}</span>
              <span style={{ display: "block", fontSize: 12, color: "#4A5170" }}>{v.arbeitVon && v.arbeitBis ? `Arbeit ${v.arbeitVon}–${v.arbeitBis}` : "kein Dienst"}</span>
            </span>
            <span style={{ fontWeight: 800, fontSize: 12.5, background: "#fff", borderRadius: 10, padding: "5px 8px", whiteSpace: "nowrap" }}>
              ☀ {v.morgenStart || "–"} · 🌙 {v.abendStart || "–"}
            </span>
          </button>
        )
      )}
      {varianten.length > 0 && offen === null && (
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {!varianten.some((v) => /nacht/i.test(v.name)) && (
            <button type="button" className="mp-tap" style={{ ...chip(false), flex: 1 }} onClick={() => vorlagenAnlegen([NACHT_VORLAGE])}>
              + Nachtschicht
            </button>
          )}
          <button type="button" className="mp-tap" style={{ ...chip(false), flex: 1 }} onClick={() => vorlagenAnlegen([{ name: "Eigene Variante", icon: "🕐", morgenStart: "07:00", abendStart: "22:00" }])}>
            + Eigene Variante
          </button>
        </div>
      )}
      {fehler && <div style={{ color: danger, fontSize: 12.5, marginTop: 8 }}>{fehler}</div>}
    </Card>
  );
}

function Zeitfeld({ label, value, onChange }) {
  return (
    <label style={{ display: "block", flex: 1, fontSize: 11.5, fontWeight: 700, color: textMuted }}>
      {label}
      <TimeWheelField value={value} onChange={onChange} />
    </label>
  );
}

function VarianteBearbeiten({ variante, farbe, onFertig, onEntfernen, onAbbrechen }) {
  const [v, setV] = useState(variante);
  const setze = (k) => (wert) => setV((x) => ({ ...x, [k]: wert }));
  return (
    <div style={{ borderRadius: 14, padding: 12, marginBottom: 8, background: farbe }}>
      <input
        value={v.name}
        onChange={(e) => setze("name")(e.target.value)}
        aria-label="Name der Variante"
        style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "10px 12px", fontSize: 15, fontWeight: 700, fontFamily: "inherit" }}
      />
      <div style={{ display: "flex", gap: 6, margin: "8px 0" }}>
        {ICONS.map((ic) => (
          <button key={ic} type="button" onClick={() => setze("icon")(ic)} aria-pressed={v.icon === ic} style={{ ...chip(v.icon === ic), padding: "6px 9px", fontSize: 16 }}>
            {ic}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Zeitfeld label="☀ Morgenroutine" value={v.morgenStart} onChange={setze("morgenStart")} />
        <Zeitfeld label="🌙 Abendroutine" value={v.abendStart} onChange={setze("abendStart")} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
        <Zeitfeld label="Arbeit von (optional)" value={v.arbeitVon} onChange={setze("arbeitVon")} />
        <Zeitfeld label="bis" value={v.arbeitBis} onChange={setze("arbeitBis")} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <div style={{ flex: 2 }}>
          <PrimaryButton onClick={() => onFertig(v)}>Speichern</PrimaryButton>
        </div>
        <div style={{ flex: 1 }}>
          <PrimaryButton variant="ghost" onClick={onAbbrechen}>
            Abbrechen
          </PrimaryButton>
        </div>
      </div>
      <button type="button" onClick={onEntfernen} style={{ marginTop: 8, border: "none", background: "transparent", color: danger, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
        🗑 Variante löschen (auch aus dem Plan)
      </button>
    </div>
  );
}

// ② Schichtplan: Rhythmus + Start + Dauer → Entwurf im Kalender, Tage per
// Tipp umschalten, dann speichern.
function PlanEditor({ heute, varianten, plan, onSpeichern, vermerken }) {
  const rollen = useMemo(() => rollenZuordnung(varianten), [varianten]);
  const [rhythmus, setRhythmus] = useState(null);
  const [start, setStart] = useState(naechsterMontag(heute));
  const [wochen, setWochen] = useState(4);
  const [muster, setMuster] = useState([]);
  const [aenderungen, setAenderungen] = useState({});
  const [meldung, setMeldung] = useState(null);

  const von = wochenBeginn(start);
  const bis = plusTage(von, wochen * 7 - 1);
  const entwurf = useMemo(() => {
    const basis = rhythmus
      ? planErzeugen({ rhythmus, start: von, wochen, rollen, eigenesMuster: muster })
      : Array.from({ length: wochen * 7 }, (_, i) => {
          const datum = plusTage(von, i);
          return { datum, varianteId: plan[datum]?.varianteId || null, art: plan[datum]?.art };
        });
    return basis.map((t) => (t.datum in aenderungen ? { ...t, varianteId: aenderungen[t.datum], art: "variante" } : t));
  }, [rhythmus, von, wochen, rollen, muster, plan, aenderungen]);

  const variante = (id) => varianten.find((v) => v.id === id);
  const farbe = (id) => FARBEN[Math.max(0, varianten.findIndex((v) => v.id === id)) % FARBEN.length];
  const umschalten = (t) => {
    const reihe = [...varianten.map((v) => v.id), null];
    const i = reihe.indexOf(t.varianteId || null);
    setAenderungen((a) => ({ ...a, [t.datum]: reihe[(i + 1) % reihe.length] }));
  };
  const fehlendeRollen = rhythmus && rhythmus !== "eigen" ? (rhythmus === "fsnx" ? ["F", "S", "N", "X"] : ["F", "S", "X"]).filter((r) => !rollen[r]) : [];
  const zukunftGeplant = Object.keys(plan).some((d) => d >= heute);

  const speichern = async () => {
    setMeldung(null);
    const r = await onSpeichern(entwurf, von, bis);
    if (!r?.ok) return setMeldung({ fehler: true, text: r?.error || "Speichern fehlgeschlagen." });
    const art = RHYTHMEN.find((x) => x.id === rhythmus)?.label || "Tage einzeln";
    vermerken(`Schichtplan ${datumKurz(von)}–${datumKurz(bis)}: ${art}${Object.keys(aenderungen).length ? `, ${Object.keys(aenderungen).length} Tag(e) angepasst` : ""}`);
    setAenderungen({});
    setMeldung({ text: `✓ Plan gespeichert (${datumKurz(von)}–${datumKurz(bis)}).` });
  };
  const beenden = async () => {
    const letzter = Object.keys(plan).sort().at(-1);
    const r = await onSpeichern([], heute, letzter);
    if (!r?.ok) return setMeldung({ fehler: true, text: r?.error || "Beenden fehlgeschlagen." });
    vermerken(`Schichtplan ab ${datumKurz(heute)} beendet – wieder normale Zeiten`);
    setMeldung({ text: "✓ Ab heute gelten wieder die normalen Zeiten." });
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>📅 Schichtplan</div>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "4px 0 6px" }}>RHYTHMUS</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {RHYTHMEN.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={rhythmus === r.id}
            onClick={() => {
              setRhythmus(r.id);
              setAenderungen({});
            }}
            style={chip(rhythmus === r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>
      {fehlendeRollen.length > 0 && (
        <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>
          Für diesen Rhythmus fehlt: {fehlendeRollen.map((r) => ({ F: "Frühschicht", S: "Spätschicht", N: "Nachtschicht", X: "Frei" })[r]).join(", ")} – leere Tage nutzen die normale Zeit.
        </div>
      )}
      {rhythmus === "eigen" && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 6 }}>Muster Tag für Tag antippen (wiederholt sich):</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {varianten.map((v) => (
              <button key={v.id} type="button" style={chip(false)} onClick={() => setMuster((m) => [...m, v.id])}>
                + {v.icon} {v.name}
              </button>
            ))}
            <button type="button" style={chip(false)} onClick={() => setMuster((m) => [...m, null])}>
              + normal
            </button>
            {muster.length > 0 && (
              <button type="button" style={{ ...chip(false), color: danger }} onClick={() => setMuster([])}>
                ↺ neu
              </button>
            )}
          </div>
          {muster.length > 0 && <div style={{ fontSize: 12.5, marginTop: 6 }}>{muster.map((id) => (id ? variante(id)?.icon : "–")).join(" ")}</div>}
        </div>
      )}
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>AB · DAUER</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <input
          type="date"
          value={start}
          aria-label="Startdatum"
          onChange={(e) => e.target.value && setStart(e.target.value)}
          style={{ border: `1.5px solid ${cardBorder}`, borderRadius: 99, padding: "6px 10px", fontSize: 13, fontFamily: "inherit" }}
        />
        {DAUER.map((d) => (
          <button key={d.wochen} type="button" aria-pressed={wochen === d.wochen} style={chip(wochen === d.wochen)} onClick={() => setWochen(d.wochen)}>
            {d.label}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "12px 0 6px" }}>VORSCHAU – Tag antippen zum Ändern</div>
      <div role="grid" aria-label="Schichtplan-Vorschau" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((w) => (
          <div key={w} style={{ textAlign: "center", fontSize: 10.5, color: textMuted, fontWeight: 700 }}>
            {w}
          </div>
        ))}
        {entwurf.slice(0, 8 * 7).map((t) => {
          const v = variante(t.varianteId);
          const text = t.art === "krank" ? "🤒" : t.art === "eigen" ? "eig." : v ? v.name.replace(/schicht$/i, "").slice(0, 5) : "–";
          return (
            <button
              key={t.datum}
              type="button"
              data-plan-tag={t.datum}
              aria-label={`${datumKurz(t.datum)} ${v ? v.name : "normal"}`}
              onClick={() => umschalten(t)}
              style={{
                border: t.datum in aenderungen ? "2px solid #2D6FD6" : "none",
                borderRadius: 8,
                height: 38,
                padding: 0,
                background: v ? farbe(v.id) : "#F1F2F6",
                opacity: t.datum < heute ? 0.5 : 1,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 10.5,
                fontWeight: 800,
                color: "#15181A",
              }}
            >
              {text}
              <span style={{ display: "block", fontSize: 9, fontWeight: 600, opacity: 0.7 }}>{datumKurz(t.datum)}</span>
            </button>
          );
        })}
      </div>
      {wochen > 8 && <div style={{ fontSize: 11.5, color: textMuted, marginTop: 4 }}>… und so weiter bis {datumKurz(bis)}</div>}
      <div style={{ marginTop: 12 }}>
        <PrimaryButton onClick={speichern}>Plan speichern</PrimaryButton>
      </div>
      {zukunftGeplant && (
        <button type="button" onClick={beenden} style={{ marginTop: 10, border: "none", background: "transparent", color: textMuted, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Schichtplan ab heute beenden
        </button>
      )}
      {meldung && (
        <div role="status" style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: meldung.fehler ? danger : "#1E8E5A" }}>
          {meldung.text}
        </div>
      )}
    </Card>
  );
}

// ③ Schritte nur für bestimmte Schichten oder ab einem Datum
function SchritteJeVariante({ heute, varianten, schritte, onHinzufuegen, onEntfernen, aenderungVermerken }) {
  const [routine, setRoutine] = useState("morgen");
  const [name, setName] = useState("");
  const [nur, setNur] = useState([]);
  const [ab, setAb] = useState("");
  const [fehler, setFehler] = useState(null);
  const besondere = schritte.filter((s) => s.nurVarianten?.length || s.gueltigAb);
  const vName = (id) => varianten.find((v) => v.id === id)?.name || "?";
  const kategorie = (r) => (r === "morgen" ? "morgenroutine" : "abendroutine");
  const beschreibung = (s) => [s.nurVarianten?.length ? `nur ${s.nurVarianten.map(vName).join(", ")}` : null, s.gueltigAb ? `ab ${datumKurz(s.gueltigAb)}` : null].filter(Boolean).join(" · ");

  const hinzufuegen = async () => {
    setFehler(null);
    if (!nur.length && !ab) return setFehler("Bitte eine Schicht oder ein Startdatum wählen – sonst gilt der Schritt immer (dann einfach normal in der Routine anlegen).");
    const r = await onHinzufuegen(routine, name, 5, { nurVarianten: nur, gueltigAb: ab || null });
    if (!r?.ok) return setFehler(r?.error || "Speichern fehlgeschlagen.");
    aenderungVermerken?.({ kategorie: kategorie(routine), itemName: name.trim(), aktion: "hinzugefügt", detail: beschreibung(r.schritt) });
    setName("");
    setNur([]);
    setAb("");
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 4 }}>➕ Schritte je Schicht oder ab Datum</div>
      <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>Alle anderen Schritte gelten immer. Z. B. „Brotdose packen“ nur bei Frühschicht, oder ein neuer Schritt ab nächster Woche.</div>
      {besondere.map((s) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${cardBorder}`, fontSize: 13 }}>
          <span>{s.routine === "morgen" ? "☀" : "🌙"}</span>
          <span style={{ flex: 1 }}>
            <b>{s.name}</b> <span style={{ color: textMuted }}>· {beschreibung(s)}</span>
          </span>
          <button
            type="button"
            aria-label={`${s.name} entfernen`}
            onClick={() => {
              onEntfernen(s.id);
              aenderungVermerken?.({ kategorie: kategorie(s.routine), itemName: s.name, aktion: "entfernt", detail: beschreibung(s) });
            }}
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 15 }}
          >
            🗑
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, margin: "10px 0 6px" }}>
        {["morgen", "abend"].map((r) => (
          <button key={r} type="button" aria-pressed={routine === r} style={chip(routine === r)} onClick={() => setRoutine(r)}>
            {r === "morgen" ? "☀ Morgen" : "🌙 Abend"}
          </button>
        ))}
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Neuer Schritt, z. B. Brotdose packen"
        aria-label="Neuer Schritt"
        style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "10px 12px", fontSize: 14, fontFamily: "inherit" }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {varianten.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={nur.includes(v.id)}
            style={chip(nur.includes(v.id))}
            onClick={() => setNur((n) => (n.includes(v.id) ? n.filter((x) => x !== v.id) : [...n, v.id]))}
          >
            nur {v.icon} {v.name}
          </button>
        ))}
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: textMuted, marginTop: 8 }}>
        ab Datum (optional)
        <input type="date" min={heute} value={ab} onChange={(e) => setAb(e.target.value)} style={{ border: `1.5px solid ${cardBorder}`, borderRadius: 99, padding: "5px 10px", fontSize: 13, fontFamily: "inherit" }} />
      </label>
      {fehler && <div style={{ color: danger, fontSize: 12.5, marginTop: 6 }}>{fehler}</div>}
      <div style={{ marginTop: 10 }}>
        <PrimaryButton onClick={hinzufuegen} disabled={!name.trim()}>
          Schritt hinzufügen
        </PrimaryButton>
      </div>
    </Card>
  );
}
