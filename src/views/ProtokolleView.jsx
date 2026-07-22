import React, { useMemo } from "react";
import { Shell, Card } from "../ui/primitives";
import ProgressRing from "../ui/ProgressRing";
import { accent, accentDark, accentSoft, cardBorder, textMain, textMuted } from "../ui/theme";
import { describeInterval } from "../utils/schedule";
import { keyOf, toLocalISODate } from "../utils/dates";
import { buildDayItems, KATEGORIE_META } from "../utils/dayItems";
import { useAppData } from "../context/AppDataContext";

function hourLabel(hour) {
  return hour ? `${hour}:00` : "Ohne festen Zeitpunkt";
}

function Platzhalter({ text }) {
  return <div style={{ fontSize: 12, color: textMuted, fontStyle: "italic" }}>{text}</div>;
}

function SectionCard({ icon, titel, children }) {
  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{icon}</span> {titel}
      </div>
      <Card style={{ marginBottom: 14 }}>{children}</Card>
    </>
  );
}

// Baut die reine Zeitleiste (chronologisch über alle Bereiche) — dieselbe
// Grundlage wie Tagesplan/Home nutzen, damit hier nichts doppelt gepflegt
// werden muss, nur ohne Bestätigen-Aktionen (reines Nachschlagewerk).
function buildWochenzeitleiste({ dosierung, einnahmeart, hormonDosierung, supplemente, mahlzeiten }) {
  // Ein repräsentativer Tag reicht für die wiederkehrenden Uhrzeiten — echte
  // Tagesdaten (peptide/hormone) werden zusätzlich direkt aus der Dosierung
  // gelesen, damit auch Einträge ohne heutige Dosis auftauchen.
  const items = [];
  Object.entries(dosierung).forEach(([name, d]) => {
    const zusatz = [d.bacWasser ? `${d.bacWasser} ml BAC-Wasser` : null, d.spruehstoesse ? `${d.spruehstoesse} Sprühstöße` : null].filter(Boolean);
    (d.uhrzeiten || []).forEach((zeit) => {
      items.push({
        hour: zeit.slice(0, 2),
        zeit,
        kategorie: "peptid",
        name,
        detail: [`${d.menge || "—"} · ${einnahmeart?.[name] || "—"} · ${describeInterval(d)}`, ...zusatz].join(" · "),
      });
    });
  });
  Object.entries(hormonDosierung).forEach(([name, d]) => {
    (d.uhrzeiten || []).forEach((zeit) => {
      items.push({
        hour: zeit.slice(0, 2),
        zeit,
        kategorie: "hormon",
        name,
        detail: `${d.menge || "—"} · ${d.einnahmeart || "Injektion"} · ${describeInterval(d)}`,
      });
    });
  });
  supplemente.forEach((s) => {
    s.tageszeiten.forEach((zeit) => {
      items.push({ hour: null, zeit, kategorie: "supplement", name: s.name, detail: s.hinweis || null });
    });
  });
  mahlzeiten.forEach((m) => {
    m.tageszeiten.forEach((zeit) => {
      const zutatenText = m.zutaten.map((z) => `${z.name}${z.menge ? ` (${z.menge})` : ""}`).join(" · ");
      items.push({ hour: null, zeit, kategorie: "mahlzeit", name: m.name, detail: [zutatenText, m.hinweis].filter(Boolean).join(" · ") || null });
    });
  });
  return items;
}

export default function ProtokolleView({ onHome }) {
  const {
    ziele,
    startdatum,
    dauer,
    notizen,
    peptide,
    dosierung,
    einnahmeart,
    plan,
    erledigt,
    hormone,
    hormonDosierung,
    hormonPlan,
    hormonErledigt,
    supplemente,
    mahlzeiten,
    schlafEintraege,
    schlafDurchschnitt7Tage,
    hydrationHeuteMl,
    hydrationZielMl,
    trainingEintraege,
  } = useAppData();

  const heute = new Date();

  const wochenInfo = useMemo(() => {
    const gesamt = parseInt(dauer, 10) || 0;
    if (!startdatum || !gesamt) return { aktuell: null, gesamt };
    const start = new Date(startdatum);
    const diffTage = Math.floor((heute - start) / 86400000);
    const aktuell = Math.min(gesamt, Math.max(1, Math.floor(diffTage / 7) + 1));
    return { aktuell, gesamt };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startdatum, dauer]);

  const compliance = useMemo(() => {
    const peptidFaellig = plan.filter((d) => d.date <= heute);
    const peptidErledigt = peptidFaellig.filter((d) => erledigt[keyOf(d.date, d.peptid, d.uhrzeit)]).length;
    const hormonFaellig = hormonPlan.filter((d) => d.date <= heute);
    const hormonErledigtCount = hormonFaellig.filter((d) => hormonErledigt[`${toLocalISODate(d.date)}__${d.name}__${d.uhrzeit}`]).length;
    const faellig = peptidFaellig.length + hormonFaellig.length;
    const erledigtGesamt = peptidErledigt + hormonErledigtCount;
    return { faellig, erledigt: erledigtGesamt, prozent: faellig > 0 ? Math.round((erledigtGesamt / faellig) * 100) : null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, erledigt, hormonPlan, hormonErledigt]);

  const naechsteGabe = useMemo(() => {
    for (let i = 0; i < 8; i++) {
      const tag = new Date(heute);
      tag.setDate(tag.getDate() + i);
      const items = buildDayItems(tag, {
        plan,
        erledigt,
        dosierung,
        hormonPlan,
        hormonErledigt,
        hormonDosierung,
        supplemente,
        supplementErledigt: {},
        mahlzeiten,
        mahlzeitErledigt: {},
        trainingEintraege,
      })
        .filter((it) => !it.done && (it.kategorie === "peptid" || it.kategorie === "hormon"))
        .sort((a, b) => (a.hour ?? "99").localeCompare(b.hour ?? "99"));
      if (items.length > 0) return { tag, item: items[0], heute: i === 0 };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, erledigt, dosierung, hormonPlan, hormonErledigt, hormonDosierung, supplemente, mahlzeiten, trainingEintraege]);

  const zeitleiste = useMemo(
    () =>
      buildWochenzeitleiste({ dosierung, einnahmeart, hormonDosierung, supplemente, mahlzeiten }),
    [dosierung, einnahmeart, hormonDosierung, supplemente, mahlzeiten]
  );

  const buckets = useMemo(() => {
    const map = new Map();
    zeitleiste.forEach((item) => {
      const key = item.hour || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a || "99").localeCompare(b || "99"));
  }, [zeitleiste]);

  const istLeer = zeitleiste.length === 0;
  const dosierintervalle = [
    ...peptide.map((p) => ({ name: p, text: describeInterval(dosierung[p]) })),
    ...hormone.map((h) => ({ name: h, text: describeInterval(hormonDosierung[h]) })),
  ];

  return (
    <Shell>
      <style>{"@media print { .no-print { display: none !important; } }"}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>🗂️ Pläne</div>
        <div className="no-print" style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => window.print()}
            style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
            title="Plan drucken"
          >
            🖨️
          </button>
          <button
            onClick={onHome}
            style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
            title="Zum Dashboard"
          >
            ⌂
          </button>
        </div>
      </div>
      <div className="no-print" style={{ fontSize: 12, color: textMuted, marginBottom: 20 }}>
        Dein wiederkehrender Rhythmus, zum Nachschauen — was du wirklich gemacht hast, steht unter Protokolle.
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          {wochenInfo.aktuell != null ? (
            <ProgressRing done={wochenInfo.aktuell} total={wochenInfo.gesamt} size={72} stroke={7} />
          ) : (
            <div style={{ fontSize: 30 }}>🗂️</div>
          )}
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{ziele.length ? ziele.join(", ") : "Kein Ziel hinterlegt"}</div>
            <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
              {wochenInfo.aktuell != null ? `Woche ${wochenInfo.aktuell} von ${wochenInfo.gesamt}` : `Dauer: ${dauer || "—"} Wochen`}
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: accentDark,
                background: accentSoft,
                padding: "2px 8px",
                borderRadius: 8,
                marginTop: 4,
                display: "inline-block",
              }}
            >
              {wochenInfo.aktuell != null && wochenInfo.aktuell >= wochenInfo.gesamt ? "Abschlusswoche" : "Aktiv"}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: textMuted }}>
          Start: {startdatum || "—"} · Dauer: {dauer || "—"} Wochen
        </div>
        {notizen && <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>Notizen: {notizen}</div>}
      </Card>

      {naechsteGabe && (
        <Card style={{ marginBottom: 14, border: `1.5px solid ${accent}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: accentDark, marginBottom: 4 }}>NÄCHSTE GABE</div>
          <div style={{ fontSize: 15, fontWeight: 800 }}>
            {naechsteGabe.heute ? "Heute" : naechsteGabe.tag.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}
            {naechsteGabe.item.uhrzeit && `, ${naechsteGabe.item.uhrzeit}`}
          </div>
          <div style={{ fontSize: 13, color: textMuted, marginTop: 2 }}>
            {naechsteGabe.item.name} {naechsteGabe.item.detail && `· ${naechsteGabe.item.detail}`}
          </div>
        </Card>
      )}

      {compliance.faellig > 0 && (
        <SectionCard icon="📈" titel="Compliance (Peptide & Medikamente)">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ProgressRing done={compliance.erledigt} total={compliance.faellig} size={64} stroke={7} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>
                {compliance.erledigt} von {compliance.faellig} fälligen Gaben bestätigt
              </div>
              <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
                {compliance.prozent >= 90
                  ? "Sehr gut! 🎉"
                  : compliance.prozent >= 70
                  ? "Solide — weiter so."
                  : "Da geht noch was — schau im Tagesplan vorbei."}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {dosierintervalle.length > 0 && (
        <SectionCard icon="💉" titel="Dosierintervalle">
          {dosierintervalle.map((d, i) => (
            <div
              key={d.name}
              style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < dosierintervalle.length - 1 ? `1px solid ${cardBorder}` : "none" }}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>{d.name}</span>
              <span style={{ fontSize: 12, color: textMuted }}>{d.text}</span>
            </div>
          ))}
        </SectionCard>
      )}

      <SectionCard icon="🗓️" titel="Wochenrhythmus">
        {istLeer ? (
          <Platzhalter text="Noch nichts hinterlegt — leg Peptide, Medikamente, Supplemente, Mahlzeiten in den jeweiligen Bereichen an, dann erscheinen sie hier chronologisch." />
        ) : (
          buckets.map(([hour, items], bi) => (
            <div key={hour || "sonstige"} style={{ marginBottom: bi < buckets.length - 1 ? 20 : 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: textMain, marginBottom: 8 }}>{hourLabel(hour)}</div>
              {items.map((item, i) => {
                const k = KATEGORIE_META[item.kategorie];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: k.dot, marginTop: 6, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: textMain }}>
                        {item.name} {item.zeit && !hour && <span style={{ fontWeight: 500, color: textMuted, fontSize: 11 }}>· {item.zeit}</span>}
                      </div>
                      {item.detail && <div style={{ fontSize: 12, color: textMuted, marginTop: 1 }}>{item.detail}</div>}
                      <div style={{ fontSize: 10, fontWeight: 700, color: k.text, background: k.bg, display: "inline-block", padding: "1px 7px", borderRadius: 8, marginTop: 3 }}>
                        {k.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </SectionCard>

      <SectionCard icon="😴" titel="Schlaf">
        {schlafEintraege.length > 0 ? (
          <div style={{ fontSize: 13 }}>
            <b>{schlafDurchschnitt7Tage ?? "—"} h</b> Ø letzte 7 Tage · {schlafEintraege.length} Einträge insgesamt
          </div>
        ) : (
          <Platzhalter text="Noch keine Schlafeinträge — trag sie im Schlaf-Bereich ein." />
        )}
      </SectionCard>

      <SectionCard icon="💧" titel="Hydration">
        <div style={{ fontSize: 13 }}>
          Heute: <b>{hydrationHeuteMl ?? 0} ml</b> von {hydrationZielMl ?? 2500} ml Ziel
        </div>
      </SectionCard>

      <SectionCard icon="🏋️" titel="Training">
        {trainingEintraege.length > 0 ? (
          <div style={{ fontSize: 13 }}>
            Letzte Einheit: <b>{trainingEintraege[0].art}</b>
            {trainingEintraege[0].name && ` · ${trainingEintraege[0].name}`} ({trainingEintraege[0].datum})
          </div>
        ) : (
          <Platzhalter text="Noch kein Training eingetragen — leg im Training-Bereich los, auch mit Wochenplan." />
        )}
      </SectionCard>

      <SectionCard icon="🩸" titel="Blutzucker / CGM">
        <Platzhalter text="Blutzucker/CGM ist in Vorbereitung." />
      </SectionCard>
    </Shell>
  );
}
