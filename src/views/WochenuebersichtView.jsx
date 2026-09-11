import React, { useMemo, useRef, useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, TextInput } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import TimeWheelField from "../ui/TimeWheelField";
import { accent, accentDark, accentSoft, cardBorder, danger, textMuted } from "../ui/theme";
import { buildDayItems, KATEGORIE_META, projektFarbe } from "../utils/dayItems";
import { exportElementAsPdf } from "../utils/pdfExport";
import { describeInterval, activeDoseDays } from "../utils/schedule";
import { addDays, fmtDate, sameDay, toLocalISODate } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";
import { useUniversellerCoach, BEREICH_LABELS } from "../data/useUniversellerCoach";
import { getCoachName } from "../utils/coachStorage";
import KiChat from "../ui/KiChat";

const WOCHENTAG_KURZ = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// Planungswerkzeug über alle Kategorien hinweg: Wochenraster + Dosier-
// intervalle + Statistik, mit Export als PDF. Auf dem Handy Tag-für-Tag,
// da ein 7-Spalten-Raster auf einem schmalen Bildschirm nicht nutzbar
// wäre — das volle Mo-So-Raster im Desktop-Stil wird nur für den PDF-
// Export unsichtbar off-screen gerendert (siehe unten).
export default function WochenuebersichtView({ embedded = false, onHome }) {
  const { handleBereitschaftPruefen, handleUniverselleUebernahme } = useUniversellerCoach();
  const appData = useAppData();
  const {
    peptide = [],
    dosierung = {},
    hormone = [],
    hormonDosierung = {},
    plan = [],
    erledigt = {},
    hormonPlan = [],
    hormonErledigt = {},
    startdatum,
    dauer,
    projekte,
    projektHinzufuegen,
    projektEntfernen,
    zeitbloecke,
    zeitblockHinzufuegen,
    zeitblockEntfernen,
    supplemente,
    supplementErledigt,
    mahlzeiten,
    mahlzeitErledigt,
    mealWochenplan,
    trainingEintraege,
    trainingWochenplan,
    gewohnheiten,
    gewohnheitErledigt,
    workflowPlaene,
    workflowPresets,
    hydrationEintraege,
    hydrationZielMl,
    tageslichtEintraege,
    tageslichtZielMinuten,
    schlafEintraege,
  } = appData;

  // Bug-Fix (Performance/Ruckeln): Diese View reichte bisher überall den
  // kompletten `appData`-Kontext (alle ~150 Felder aus allen Datenhooks)
  // an buildDayItems()/useMemo-Abhängigkeiten weiter. Da `appData` als
  // Objekt bei JEDER Zustandsänderung irgendwo in der App eine neue
  // Referenz bekommt (auch für völlig unbeteiligte Daten wie Coach-Chat
  // oder Quest-Fortschritt), liefen die teuren Berechnungen unten
  // (bereichsCompliance macht bis zu 180 buildDayItems()-Aufrufe!) bei
  // praktisch jeder Interaktion irgendwo in der App neu, solange diese
  // View offen war — spürbar als Ruckeln. Diese eine, schmal auf die
  // tatsächlich von buildDayItems() benötigten Felder gestützte
  // Zwischenablage sorgt dafür, dass sich ihre Referenz nur ändert, wenn
  // sich wirklich etwas Relevantes geändert hat (einzelne useState-Werte
  // aus den Datenhooks sind selbst schon stabil — nur die appData-
  // Sammelreferenz war das Problem).
  const dayItemsQuelldaten = useMemo(
    () => ({
      hormonPlan,
      hormonErledigt,
      hormonDosierung,
      supplemente,
      supplementErledigt,
      mahlzeiten,
      mahlzeitErledigt,
      mealWochenplan,
      trainingEintraege,
      trainingWochenplan,
      gewohnheiten,
      gewohnheitErledigt,
      workflowPlaene,
      workflowPresets,
      projekte,
      zeitbloecke,
    }),
    [
      hormonPlan,
      hormonErledigt,
      hormonDosierung,
      supplemente,
      supplementErledigt,
      mahlzeiten,
      mahlzeitErledigt,
      mealWochenplan,
      trainingEintraege,
      trainingWochenplan,
      gewohnheiten,
      gewohnheitErledigt,
      workflowPlaene,
      workflowPresets,
      projekte,
      zeitbloecke,
    ]
  );

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("day"); // "day" | "week" | "month"
  const [monthDate, setMonthDate] = useState(new Date());
  const [exportLaeuft, setExportLaeuft] = useState(false);
  const [vorschauUrl, setVorschauUrl] = useState(null);
  const exportRef = useRef(null);

  // Projekte & Zeitblöcke (14.08., Nutzerin-Vorgabe) — bewusst hier in der
  // Wochenübersicht statt einer neuen Plan-Seite, damit farbige Zeitblöcke
  // direkt in Tag/Woche/Monat auftauchen (siehe buildDayItems/dayItems.js).
  const [neuesProjekt, setNeuesProjekt] = useState("");
  const [projektFehler, setProjektFehler] = useState(null);
  const [neuerBlock, setNeuerBlock] = useState({
    projektId: "",
    titel: "",
    datum: toLocalISODate(new Date()),
    startUhrzeit: "09:00",
    endUhrzeit: "",
  });
  const [blockFehler, setBlockFehler] = useState(null);

  const projektAnlegen = async () => {
    setProjektFehler(null);
    const result = await projektHinzufuegen(neuesProjekt);
    if (!result?.ok) {
      setProjektFehler(result?.error || "Speichern fehlgeschlagen.");
      return;
    }
    if (!neuerBlock.projektId) setNeuerBlock((p) => ({ ...p, projektId: result.projekt.id }));
    setNeuesProjekt("");
  };

  const blockEintragen = async () => {
    setBlockFehler(null);
    const result = await zeitblockHinzufuegen(neuerBlock);
    if (!result?.ok) {
      setBlockFehler(result?.error || "Speichern fehlgeschlagen.");
      return;
    }
    setNeuerBlock((p) => ({ ...p, titel: "" }));
  };

  const today = new Date();
  // Bug-Fix: hing bisher an `today` statt an `selectedDate` — die
  // Wochentag-Leiste (Tag-Modus, Wochen-Raster, PDF-Export "Woche vom …")
  // zeigte dadurch IMMER nur die aktuelle Kalenderwoche und ließ sich (anders
  // als die Monatsansicht mit ‹/›) nie auf eine andere Woche verschieben —
  // wählte man z. B. in der Monatsansicht einen Tag aus einer anderen Woche,
  // passte sich diese Leiste nicht an. Jetzt wie in TagesplanView.jsx an
  // `selectedDate` gekoppelt (das bei jedem Datumswechsel mitgeht).
  // useMemo statt einer bei jedem Render neu erzeugten Liste: `wochentage`
  // ist unten selbst wieder Dependency eines useMemo (wochenItemsProTag) —
  // ohne diese Memoisierung hätte jene Liste jedes Mal eine neue Referenz
  // bekommen und wäre nie wirksam gecacht worden.
  const montag = useMemo(() => addDays(selectedDate, -((selectedDate.getDay() + 6) % 7)), [selectedDate]);
  const wochentage = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(montag, i)), [montag]);

  const tagesItems = useMemo(() => buildDayItems(selectedDate, dayItemsQuelldaten), [selectedDate, dayItemsQuelldaten]);

  // Vorberechnete Tages-Items für Wochenraster (Ansicht + PDF-Export teilen
  // sich dieselbe Woche) — siehe dayItemsQuelldaten-Kommentar oben: ohne
  // diese Memoisierung liefen bis zu 7 buildDayItems()-Aufrufe bei jedem
  // Render neu, auch wenn sich nichts an der Woche geändert hatte.
  const wochenItemsProTag = useMemo(() => wochentage.map((d) => buildDayItems(d, dayItemsQuelldaten)), [wochentage, dayItemsQuelldaten]);

  // Dasselbe fürs Monatsraster — Tage des sichtbaren Monats + je Tag die
  // vorberechneten Items, statt bis zu 31 buildDayItems()-Aufrufen direkt
  // im Render-Body bei jeder Interaktion.
  const monatsTageMitItems = useMemo(() => {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const tage = [];
    for (let i = 0; i < startOffset; i++) tage.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const datum = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
      tage.push({ datum, items: buildDayItems(datum, dayItemsQuelldaten) });
    }
    return tage;
  }, [monthDate, dayItemsQuelldaten]);

  const substanzen = useMemo(() => {
    const p = peptide.map((name) => ({ name, kategorie: "Peptid", d: dosierung[name] }));
    const h = hormone.map((name) => ({ name, kategorie: "Medikament", d: hormonDosierung[name] }));
    return [...p, ...h].filter((s) => s.d);
  }, [peptide, dosierung, hormone, hormonDosierung]);

  const dauerTage = Math.max(1, Math.round((Number(dauer) || 12) * 7));
  const startDatumObj = startdatum ? new Date(startdatum) : today;
  const endDatumObj = addDays(startDatumObj, dauerTage - 1);

  const statistikProSubstanz = useMemo(
    () =>
      substanzen.map((s) => ({
        ...s,
        anzahl: activeDoseDays(s.d, startdatum, dauerTage).length,
      })),
    [substanzen, startdatum, dauerTage]
  );

  const compliance = useMemo(() => {
    const gesamt = plan.length + hormonPlan.length;
    if (gesamt === 0) return null;
    const erledigtCount =
      plan.filter((d) => erledigt[`${toLocalISODate(d.date)}__${d.peptid}__${d.uhrzeit}`]).length +
      hormonPlan.filter((d) => hormonErledigt[`${toLocalISODate(d.date)}__${d.name}__${d.uhrzeit}`]).length;
    return Math.round((erledigtCount / gesamt) * 100);
  }, [plan, erledigt, hormonPlan, hormonErledigt]);

  // Compliance je Bereich für alle 6 Kategorien mit "geplant vs. erledigt"
  // (statt nur Peptide/Hormone wie oben): Tag für Tag über buildDayItems()
  // gezählt, von Protokollstart bis heute (nicht bis Protokollende — noch
  // nicht fällige Tage sollen die Quote nicht künstlich drücken). Auf 180
  // Tage gedeckelt, damit ein sehr altes Protokoll keine lange Schleife
  // auslöst.
  const bereichsCompliance = useMemo(() => {
    const heuteCap = today < endDatumObj ? today : endDatumObj;
    const zaehler = {};
    let cursor = new Date(startDatumObj);
    cursor.setHours(0, 0, 0, 0);
    const ende = new Date(heuteCap);
    ende.setHours(0, 0, 0, 0);
    let n = 0;
    while (cursor <= ende && n < 180) {
      const items = buildDayItems(cursor, dayItemsQuelldaten);
      for (const item of items) {
        // Zeitblöcke sind Kalenderblöcke, keine erledigbaren Aufgaben —
        // eine "0%"-Quote dafür wäre irreführend, daher ausgenommen.
        if (item.kategorie === "zeitblock") continue;
        if (!zaehler[item.kategorie]) zaehler[item.kategorie] = { geplant: 0, erledigt: 0 };
        zaehler[item.kategorie].geplant++;
        if (item.done) zaehler[item.kategorie].erledigt++;
      }
      cursor = addDays(cursor, 1);
      n++;
    }
    return Object.entries(zaehler)
      .map(([kategorie, z]) => ({
        kategorie,
        label: KATEGORIE_META[kategorie]?.label || kategorie,
        dot: KATEGORIE_META[kategorie]?.dot || textMuted,
        prozent: z.geplant > 0 ? Math.round((z.erledigt / z.geplant) * 100) : null,
        geplant: z.geplant,
        erledigt: z.erledigt,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayItemsQuelldaten, startdatum, dauer]);

  // Hydration/Tageslicht/Schlaf haben keinen einzelnen "geplant vs.
  // erledigt"-Termin (kumulative Tageswerte) — hier stattdessen "an wie
  // vielen Tagen im Zeitraum wurde das Tagesziel erreicht" bzw. bei Schlaf
  // (kein Zielwert hinterlegt) der Durchschnitt.
  const kumulativeCompliance = useMemo(() => {
    const heuteCap = today < endDatumObj ? today : endDatumObj;
    const startStr = toLocalISODate(startDatumObj);
    const endeStr = toLocalISODate(heuteCap);
    const imZeitraum = (datum) => datum >= startStr && datum <= endeStr;

    const hydrationTage = (hydrationEintraege || []).filter((e) => imZeitraum(e.datum));
    const hydrationZielErreicht = hydrationZielMl ? hydrationTage.filter((e) => (e.mengeMl || 0) >= hydrationZielMl).length : 0;

    const tageslichtTage = (tageslichtEintraege || []).filter((e) => imZeitraum(e.datum));
    const tageslichtZielErreicht = tageslichtZielMinuten
      ? tageslichtTage.filter((e) => (e.minuten || 0) >= tageslichtZielMinuten).length
      : 0;

    const schlafTage = (schlafEintraege || []).filter((e) => imZeitraum(e.datum));
    const schlafDurchschnitt =
      schlafTage.length > 0 ? (schlafTage.reduce((summe, e) => summe + (Number(e.stunden) || 0), 0) / schlafTage.length).toFixed(1) : null;

    return { hydrationTage, hydrationZielErreicht, tageslichtTage, tageslichtZielErreicht, schlafTage, schlafDurchschnitt };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrationEintraege, hydrationZielMl, tageslichtEintraege, tageslichtZielMinuten, schlafEintraege, startdatum, dauer]);

  const exportieren = async () => {
    if (!exportRef.current) return;
    setExportLaeuft(true);
    try {
      const { dataUrl } = await exportElementAsPdf(exportRef.current, `wochenuebersicht-${toLocalISODate(today)}.pdf`);
      setVorschauUrl(dataUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setExportLaeuft(false);
    }
  };

  const content = (
    <>
      {!embedded && (
        <ViewHeader title="🗓️ Wochenübersicht" onHome={onHome} />
      )}

      <KiChat
        systemPrompt="Du bist ein hilfsbereiter Assistent für eine App zur Selbstverwaltung von Gesundheitsprotokollen. Beantworte Fragen zur Wochenübersicht der Person. Wenn sich aus dem Gespräch ergibt, dass etwas Konkretes eingerichtet werden könnte (z. B. eine neue Gewohnheit, ein neues Supplement/Medikament, ein Trink- oder Tageslichtziel, ein Trainingsplan, neue Rezepte, ein Schlaf-Eintrag für die letzte Nacht, ein neues Workflow-Preset), frag von dir aus alle dafür nötigen Details ab und biete am Ende aktiv an, das jetzt einzurichten — antworte dabei immer auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code."
        einleitung={`Hi, ich bin ${getCoachName()}! Frag mich was zu deiner Woche, oder ich helf dir direkt bei jedem Bereich der App weiter.`}
        pruefeBereitschaft={handleBereitschaftPruefen}
        onUebernehmen={handleUniverselleUebernahme}
        uebernehmenLabels={BEREICH_LABELS}
      />

      <div style={{ display: "flex", gap: 5, marginBottom: 14, overflowX: "auto" }}>
        {wochentage.map((d, i) => {
          const active = sameDay(d, selectedDate);
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(d)}
              style={{
                flex: "1 0 42px",
                padding: "8px 4px",
                borderRadius: 10,
                border: `1px solid ${active ? accent : cardBorder}`,
                background: active ? accent : "#fff",
                color: active ? "#fff" : sameDay(d, today) ? accentDark : textMuted,
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700 }}>{WOCHENTAG_KURZ[i]}</div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{d.getDate()}</div>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>📁 Projekte & Zeitblöcke</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
          Blocke Zeit für Arbeit oder eigene Projekte — taucht farbig in Tag, Woche und Monat auf.
        </div>

        {projekte.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 10 }}>
            {projekte.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  marginRight: 6,
                  marginBottom: 6,
                  borderRadius: 20,
                  border: `1px solid ${cardBorder}`,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <div style={{ width: 9, height: 9, borderRadius: 5, background: projektFarbe(p), flexShrink: 0 }} />
                {p.name}
                <button
                  type="button"
                  onClick={() => projektEntfernen(p.id)}
                  title="Projekt löschen"
                  style={{ border: "none", background: "transparent", color: danger, fontSize: 14, cursor: "pointer", padding: 0, marginLeft: 2 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <TextInput value={neuesProjekt} onChange={setNeuesProjekt} placeholder="z. B. Arbeit, Coaching-Ausbildung" />
          </div>
          <button
            type="button"
            onClick={projektAnlegen}
            disabled={!neuesProjekt.trim()}
            style={{
              padding: "0 16px",
              borderRadius: 12,
              border: "none",
              background: neuesProjekt.trim() ? accentDark : "#B7D8D1",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: neuesProjekt.trim() ? "pointer" : "not-allowed",
            }}
          >
            + Projekt
          </button>
        </div>
        {projektFehler && <div style={{ fontSize: 12, color: danger, marginTop: 4 }}>{projektFehler}</div>}

        {projekte.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
            <Label>Zeitblock eintragen</Label>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {projekte.map((p) => (
                <Pill
                  key={p.id}
                  label={p.name}
                  selected={neuerBlock.projektId === p.id}
                  onClick={() => setNeuerBlock((prev) => ({ ...prev, projektId: p.id }))}
                />
              ))}
            </div>

            <TextInput value={neuerBlock.titel} onChange={(v) => setNeuerBlock((p) => ({ ...p, titel: v }))} placeholder="Titel (optional, sonst Projektname)" />

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <Label>Datum</Label>
                <TextInput type="date" value={neuerBlock.datum} onChange={(v) => setNeuerBlock((p) => ({ ...p, datum: v }))} />
              </div>
              <div style={{ flex: 1 }}>
                <Label>Von</Label>
                <TimeWheelField value={neuerBlock.startUhrzeit} onChange={(v) => setNeuerBlock((p) => ({ ...p, startUhrzeit: v }))} />
              </div>
              <div style={{ flex: 1 }}>
                <Label>Bis (optional)</Label>
                <TimeWheelField value={neuerBlock.endUhrzeit} onChange={(v) => setNeuerBlock((p) => ({ ...p, endUhrzeit: v }))} />
              </div>
            </div>

            {blockFehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{blockFehler}</div>}
            <div style={{ marginTop: 10 }}>
              <PrimaryButton onClick={blockEintragen} disabled={!neuerBlock.projektId}>
                Zeitblock eintragen
              </PrimaryButton>
            </div>
          </div>
        )}

        {zeitbloecke.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
            <Label>Eingetragene Zeitblöcke</Label>
            {zeitbloecke
              .slice()
              .sort((a, b) => (a.datum + a.startUhrzeit).localeCompare(b.datum + b.startUhrzeit))
              .map((z) => {
                const projekt = projekte.find((p) => p.id === z.projektId);
                return (
                  <div
                    key={z.id}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${cardBorder}` }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: projektFarbe(projekt), flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{z.titel || projekt?.name || "Zeitblock"}</div>
                      <div style={{ fontSize: 11, color: textMuted }}>
                        {fmtDate(new Date(z.datum))} · {z.startUhrzeit}
                        {z.endUhrzeit ? `–${z.endUhrzeit}` : ""} Uhr{z.titel && projekt ? ` · ${projekt.name}` : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => zeitblockEntfernen(z.id)}
                      style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer", padding: "0 4px" }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button
          onClick={() => setViewMode("day")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 10,
            border: `1px solid ${viewMode === "day" ? accent : cardBorder}`,
            background: viewMode === "day" ? accent : "#fff",
            color: viewMode === "day" ? "#fff" : textMuted,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Tag
        </button>
        <button
          onClick={() => setViewMode("week")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 10,
            border: `1px solid ${viewMode === "week" ? accent : cardBorder}`,
            background: viewMode === "week" ? accent : "#fff",
            color: viewMode === "week" ? "#fff" : textMuted,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Woche
        </button>
        <button
          onClick={() => setViewMode("month")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 10,
            border: `1px solid ${viewMode === "month" ? accent : cardBorder}`,
            background: viewMode === "month" ? accent : "#fff",
            color: viewMode === "month" ? "#fff" : textMuted,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Monat
        </button>
      </div>

      {viewMode === "day" && (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{fmtDate(selectedDate)}</div>
          <Card style={{ marginBottom: 16, padding: 8 }}>
            {tagesItems.length === 0 ? (
              <div style={{ fontSize: 13, color: textMuted, textAlign: "center", padding: 12 }}>Für diesen Tag steht nichts an.</div>
            ) : (
              tagesItems.map((item, i, arr) => {
                const k = KATEGORIE_META[item.kategorie];
                return (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 8px",
                      borderBottom: i < arr.length - 1 ? `1px solid ${cardBorder}` : "none",
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: item.farbe || k.dot, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                        {item.name} <span style={{ fontWeight: 600, color: textMuted, fontSize: 11.5 }}>· {item.uhrzeit}</span>
                      </div>
                      {item.detail && <div style={{ fontSize: 11, color: textMuted }}>{item.detail}</div>}
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </>
      )}

      {viewMode === "week" && (
        <div style={{ overflowX: "auto", marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, minWidth: 800 }}>
            {wochentage.map((d, i) => {
              const items = wochenItemsProTag[i];
              const k = KATEGORIE_META;
              return (
                <Card key={i} style={{ padding: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${cardBorder}`, textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: textMuted }}>{WOCHENTAG_KURZ[i]}</div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{d.getDate()}</div>
                  </div>
                  {items.length === 0 ? (
                    <div style={{ fontSize: 10, color: textMuted, textAlign: "center" }}>–</div>
                  ) : (
                    items.map((item) => {
                      const meta = k[item.kategorie];
                      return (
                        <div key={item.key} style={{ fontSize: 10, marginBottom: 6, paddingLeft: 6, borderLeft: `2px solid ${item.farbe || meta.dot}` }}>
                          <div style={{ fontWeight: 700 }}>{item.uhrzeit}</div>
                          <div style={{ fontSize: 9, color: textMuted }}>{item.name}</div>
                          {item.detail && <div style={{ fontSize: 8.5, color: textMuted, marginTop: 1 }}>{item.detail}</div>}
                        </div>
                      );
                    })
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === "month" && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <button
              onClick={() => setMonthDate(addDays(monthDate, -30))}
              style={{ border: "none", background: "transparent", color: accentDark, fontSize: 16, cursor: "pointer", padding: "4px 8px" }}
            >
              ‹
            </button>
            <div style={{ fontSize: 14, fontWeight: 800 }}>
              {monthDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
            </div>
            <button
              onClick={() => setMonthDate(addDays(monthDate, 30))}
              style={{ border: "none", background: "transparent", color: accentDark, fontSize: 16, cursor: "pointer", padding: "4px 8px" }}
            >
              ›
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
            {WOCHENTAG_KURZ.map((day) => (
              <div key={day} style={{ fontSize: 10, fontWeight: 700, textAlign: "center", color: textMuted, paddingBottom: 4 }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {monatsTageMitItems.map((eintrag, idx) => {
              if (!eintrag) return <div key={`empty-${idx}`}></div>;
              const { datum: d, items } = eintrag;
              // Alle geplanten Kategorien zeigen ihren Punkt, nicht nur
              // Substanzen — Nutzerinnen-Vorgabe (13.08.): auch Training
              // (und Schlaf/Hydration/... ) sollen im Monatsraster farblich
              // erkennbar sein, nicht nur in der Tages-/Wochenansicht.
              // "notfallmodus" bewusst ausgenommen, kein geplanter Termin.
              const dotsToShow = items.filter((item) => item.kategorie !== "notfallmodus").slice(0, 6);

              return (
                <div
                  key={d.toISOString()}
                    style={{
                      aspectRatio: "1 / 1",
                      borderRadius: 8,
                      border: `1px solid ${cardBorder}`,
                      padding: 4,
                      fontSize: 9,
                      fontWeight: 700,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      background: sameDay(d, today) ? accentSoft : "#fff",
                    }}
                  >
                    <div style={{ color: textMuted }}>{d.getDate()}</div>
                    <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      {dotsToShow.map((item) => {
                        const meta = KATEGORIE_META[item.kategorie];
                        return (
                          <div
                            key={item.key}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              background: item.farbe || meta.dot,
                            }}
                            title={item.name}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
            })}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${cardBorder}` }}>
            {Object.entries(KATEGORIE_META)
              .filter(([kat]) => kat !== "notfallmodus" && kat !== "zeitblock")
              .map(([kat, meta]) => (
                <div key={kat} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 4, background: meta.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, color: textMuted }}>{meta.label}</span>
                </div>
              ))}
            {projekte.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: 4, background: projektFarbe(p), flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, color: textMuted }}>{p.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Dosierintervalle</div>
      <Card style={{ marginBottom: 16 }}>
        {statistikProSubstanz.length === 0 ? (
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>Noch keine Substanzen im Protokoll.</div>
        ) : (
          statistikProSubstanz.map((s, i, arr) => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: textMuted }}>{describeInterval(s.d)}</div>
              </div>
              <div style={{ fontSize: 12, color: textMuted, fontWeight: 700, textAlign: "right" }}>{s.anzahl}× geplant</div>
            </div>
          ))
        )}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Protokoll-Statistik</div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: textMuted }}>Dauer</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{dauer || "–"} Wochen</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: textMuted }}>Zeitraum</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {fmtDate(startDatumObj)} – {fmtDate(endDatumObj)}
            </div>
          </div>
        </div>
        {compliance !== null && (
          <div>
            <div style={{ fontSize: 11, color: textMuted }}>Compliance (bisher)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: accentDark }}>{compliance}%</div>
          </div>
        )}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Compliance je Bereich</div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: textMuted, marginBottom: 12 }}>Vom Protokollstart bis heute — nicht mitgezählt werden Tage, die noch bevorstehen.</div>
        {bereichsCompliance.length === 0 && kumulativeCompliance.hydrationTage.length === 0 && kumulativeCompliance.tageslichtTage.length === 0 && kumulativeCompliance.schlafTage.length === 0 ? (
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>Noch keine Daten im Protokollzeitraum.</div>
        ) : (
          <>
            {bereichsCompliance.map((b) => (
              <div key={b.kategorie} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${cardBorder}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: b.dot, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{b.label}</div>
                </div>
                <div style={{ fontSize: 12, color: textMuted, fontWeight: 700 }}>
                  {b.prozent !== null ? `${b.prozent}%` : "–"} <span style={{ fontWeight: 500 }}>({b.erledigt}/{b.geplant})</span>
                </div>
              </div>
            ))}
            {kumulativeCompliance.hydrationTage.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${cardBorder}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: KATEGORIE_META.hydration.dot, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Hydration</div>
                </div>
                <div style={{ fontSize: 12, color: textMuted, fontWeight: 700 }}>
                  Ziel an {kumulativeCompliance.hydrationZielErreicht}/{kumulativeCompliance.hydrationTage.length} Tagen erreicht
                </div>
              </div>
            )}
            {kumulativeCompliance.tageslichtTage.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${cardBorder}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: KATEGORIE_META.tageslicht.dot, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Tageslicht</div>
                </div>
                <div style={{ fontSize: 12, color: textMuted, fontWeight: 700 }}>
                  Ziel an {kumulativeCompliance.tageslichtZielErreicht}/{kumulativeCompliance.tageslichtTage.length} Tagen erreicht
                </div>
              </div>
            )}
            {kumulativeCompliance.schlafDurchschnitt !== null && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: KATEGORIE_META.schlaf.dot, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Schlaf</div>
                </div>
                <div style={{ fontSize: 12, color: textMuted, fontWeight: 700 }}>Ø {kumulativeCompliance.schlafDurchschnitt} Std. ({kumulativeCompliance.schlafTage.length} Einträge)</div>
              </div>
            )}
          </>
        )}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Export & Druck</div>
      <Card>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>
          Erstellt eine PDF-Datei mit dem vollen Wochenraster — praktisch für den Ausdruck oder das Arztgespräch.
        </div>
        <PrimaryButton onClick={exportieren} disabled={exportLaeuft}>
          {exportLaeuft ? "Wird erstellt..." : "Als PDF exportieren"}
        </PrimaryButton>
        {vorschauUrl && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: textMuted, marginBottom: 6 }}>Vorschau:</div>
            <img src={vorschauUrl} alt="PDF-Vorschau" style={{ width: "100%", borderRadius: 10, border: `1px solid ${cardBorder}` }} />
          </div>
        )}
      </Card>

      {/* Unsichtbares Export-Raster: volles Mo-So-Raster im Desktop-Stil,
          nur für html2canvas fotografiert, nie direkt sichtbar. */}
      <div style={{ position: "absolute", left: -9999, top: 0, width: 900 }}>
        <div ref={exportRef} style={{ background: "#fff", padding: 24, fontFamily: "sans-serif" }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Wochenplan – Detaillierte Ansicht</div>
          <div style={{ fontSize: 12, color: "#6B7178", marginBottom: 16 }}>
            Zeitraum: {fmtDate(startDatumObj)} – {fmtDate(endDatumObj)} · Woche vom {fmtDate(montag)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 20 }}>
            {wochentage.map((d, i) => {
              const items = wochenItemsProTag[i];
              return (
                <div key={i} style={{ border: "1px solid #EAEAE5", borderRadius: 10, padding: 8, minHeight: 140 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
                    {WOCHENTAG_KURZ[i]} {fmtDate(d)}
                  </div>
                  {items.map((item) => {
                    const k = KATEGORIE_META[item.kategorie];
                    return (
                      <div key={item.key} style={{ fontSize: 10, marginBottom: 4, borderLeft: `3px solid ${item.farbe || k.dot}`, paddingLeft: 4 }}>
                        <div style={{ fontWeight: 700 }}>
                          {item.uhrzeit} {item.name}
                        </div>
                        {item.detail && <div style={{ color: "#6B7178" }}>{item.detail}</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Dosierintervalle</div>
          {statistikProSubstanz.map((s) => (
            <div key={s.name} style={{ fontSize: 12, marginBottom: 4 }}>
              <b>{s.name}</b> — {describeInterval(s.d)} ({s.anzahl}× im Zeitraum)
            </div>
          ))}

          <div style={{ fontSize: 16, fontWeight: 800, margin: "16px 0 8px" }}>Protokoll-Statistik</div>
          <div style={{ fontSize: 12 }}>Dauer: {dauer || "–"} Wochen</div>
          <div style={{ fontSize: 12 }}>
            Zeitraum: {fmtDate(startDatumObj)} – {fmtDate(endDatumObj)}
          </div>
          {compliance !== null && <div style={{ fontSize: 12 }}>Compliance: {compliance}%</div>}

          <div style={{ fontSize: 16, fontWeight: 800, margin: "16px 0 8px" }}>Compliance je Bereich</div>
          {bereichsCompliance.map((b) => (
            <div key={b.kategorie} style={{ fontSize: 12, marginBottom: 2 }}>
              {b.label}: {b.prozent !== null ? `${b.prozent}%` : "–"} ({b.erledigt}/{b.geplant})
            </div>
          ))}
          {kumulativeCompliance.hydrationTage.length > 0 && (
            <div style={{ fontSize: 12, marginBottom: 2 }}>
              Hydration: Ziel an {kumulativeCompliance.hydrationZielErreicht}/{kumulativeCompliance.hydrationTage.length} Tagen erreicht
            </div>
          )}
          {kumulativeCompliance.tageslichtTage.length > 0 && (
            <div style={{ fontSize: 12, marginBottom: 2 }}>
              Tageslicht: Ziel an {kumulativeCompliance.tageslichtZielErreicht}/{kumulativeCompliance.tageslichtTage.length} Tagen erreicht
            </div>
          )}
          {kumulativeCompliance.schlafDurchschnitt !== null && (
            <div style={{ fontSize: 12, marginBottom: 2 }}>
              Schlaf: Ø {kumulativeCompliance.schlafDurchschnitt} Std. ({kumulativeCompliance.schlafTage.length} Einträge)
            </div>
          )}
        </div>
      </div>
    </>
  );
  return embedded ? content : <Shell>{content}</Shell>;
}
