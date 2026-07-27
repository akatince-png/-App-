import React, { useMemo, useRef, useState } from "react";
import { Shell, Card, PrimaryButton } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import { accent, accentDark, accentSoft, cardBorder, textMuted } from "../ui/theme";
import { buildDayItems, KATEGORIE_META } from "../utils/dayItems";
import { exportElementAsPdf } from "../utils/pdfExport";
import { describeInterval, activeDoseDays } from "../utils/schedule";
import { addDays, fmtDate, sameDay, toLocalISODate } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";

const WOCHENTAG_KURZ = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// Planungswerkzeug über alle Kategorien hinweg: Wochenraster + Dosier-
// intervalle + Statistik, mit Export als PDF. Auf dem Handy Tag-für-Tag,
// da ein 7-Spalten-Raster auf einem schmalen Bildschirm nicht nutzbar
// wäre — das volle Mo-So-Raster im Desktop-Stil wird nur für den PDF-
// Export unsichtbar off-screen gerendert (siehe unten).
export default function WochenuebersichtView({ embedded = false, onHome }) {
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
  } = appData;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("day"); // "day" | "week" | "month"
  const [monthDate, setMonthDate] = useState(new Date());
  const [exportLaeuft, setExportLaeuft] = useState(false);
  const [vorschauUrl, setVorschauUrl] = useState(null);
  const exportRef = useRef(null);

  const today = new Date();
  const montag = addDays(today, -((today.getDay() + 6) % 7));
  const wochentage = Array.from({ length: 7 }, (_, i) => addDays(montag, i));

  const tagesItems = useMemo(() => buildDayItems(selectedDate, appData), [selectedDate, appData]);

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
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: k.dot, flexShrink: 0 }} />
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
              const items = buildDayItems(d, appData);
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
                        <div key={item.key} style={{ fontSize: 10, marginBottom: 6, paddingLeft: 6, borderLeft: `2px solid ${meta.dot}` }}>
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
            {(() => {
              const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
              const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
              const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
              const days = [];

              for (let i = 0; i < startOffset; i++) {
                days.push(null);
              }
              for (let d = 1; d <= lastDay.getDate(); d++) {
                days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), d));
              }

              return days.map((d, idx) => {
                if (!d) return <div key={`empty-${idx}`}></div>;

                const items = buildDayItems(d, appData);
                const dotsToShow = items
                  .filter((item) => ["peptide", "hormon", "supplement", "medikament"].includes(item.kategorie))
                  .slice(0, 5);

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
                      {dotsToShow.map((item, i) => {
                        const meta = KATEGORIE_META[item.kategorie];
                        return (
                          <div
                            key={item.key}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              background: meta.dot,
                              title: item.name,
                            }}
                            title={item.name}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
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
              const items = buildDayItems(d, appData);
              return (
                <div key={i} style={{ border: "1px solid #EAEAE5", borderRadius: 10, padding: 8, minHeight: 140 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
                    {WOCHENTAG_KURZ[i]} {fmtDate(d)}
                  </div>
                  {items.map((item) => {
                    const k = KATEGORIE_META[item.kategorie];
                    return (
                      <div key={item.key} style={{ fontSize: 10, marginBottom: 4, borderLeft: `3px solid ${k.dot}`, paddingLeft: 4 }}>
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
        </div>
      </div>
    </>
  );
  return embedded ? content : <Shell>{content}</Shell>;
}
