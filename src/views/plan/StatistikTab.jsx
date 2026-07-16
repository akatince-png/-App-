import React, { useMemo } from "react";
import { Card } from "../../ui/primitives";
import { SimpleLineChart, NebenwirkungenPie } from "../../ui/charts";
import { accent, blue, danger, success, textMuted } from "../../ui/theme";
import { PIE_COLORS } from "../../constants";
import { keyOf, sameDay } from "../../utils/dates";
import { useAppData } from "../../context/AppDataContext";

export default function StatistikTab() {
  const { plan, erledigt, feedback, gewichtsEintraege, aktiveMesswerte, combinedMesswertDefs, schlafEintraege } = useAppData();

  const today = new Date();
  const statusOf = (dose) => {
    const k = keyOf(dose.date, dose.peptid);
    if (erledigt[k]) return "erledigt";
    if (dose.date < today && !sameDay(dose.date, today)) return "verpasst";
    return "geplant";
  };
  const statusCounts = plan.reduce(
    (acc, dose) => {
      const s = statusOf(dose);
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    { erledigt: 0, geplant: 0, verpasst: 0 }
  );

  const nebenwirkungCounts = useMemo(() => {
    const counts = {};
    let keine = 0;
    Object.values(feedback).forEach((fb) => {
      if (!fb.staerke || fb.staerke === "Keine" || fb.nebenwirkungen.length === 0) {
        keine += 1;
      } else {
        fb.nebenwirkungen.forEach((n) => {
          counts[n] = (counts[n] || 0) + 1;
        });
      }
    });
    const arr = Object.entries(counts).map(([name, value]) => ({ name, value }));
    if (keine > 0) arr.unshift({ name: "Keine", value: keine });
    return arr;
  }, [feedback]);

  const gewichtChange =
    gewichtsEintraege.length >= 2 && gewichtsEintraege[0].gewicht !== undefined && gewichtsEintraege[gewichtsEintraege.length - 1].gewicht !== undefined
      ? (gewichtsEintraege[gewichtsEintraege.length - 1].gewicht - gewichtsEintraege[0].gewicht).toFixed(1)
      : null;

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Injektionen</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: success }}>{statusCounts.erledigt}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Erledigt</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: blue }}>{statusCounts.geplant}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Geplant</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: danger }}>{statusCounts.verpasst}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Verpasst</div>
          </div>
        </div>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Gewichtsverlauf</div>
      <Card style={{ marginBottom: 14 }}>
        {gewichtsEintraege.length < 2 ? (
          <div style={{ fontSize: 13, color: textMuted }}>Trag mindestens 2 Check-ins im Profil-Tab ein, um einen Verlauf zu sehen.</div>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: gewichtChange <= 0 ? success : "#1E2B29" }}>
              {gewichtChange > 0 ? "+" : ""}
              {gewichtChange} kg seit Start
            </div>
            <SimpleLineChart data={gewichtsEintraege} dataKey="gewicht" stroke={accent} height={150} />
          </>
        )}
      </Card>

      {aktiveMesswerte
        .filter((id) => id !== "gewicht")
        .map((id) => {
          const def = combinedMesswertDefs.find((d) => d.id === id);
          if (!def?.numeric) return null;
          const daten = gewichtsEintraege.filter((e) => e[id] !== "" && e[id] !== undefined);
          return (
            <React.Fragment key={id}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{def.label}-Verlauf</div>
              <Card style={{ marginBottom: 14 }}>
                {daten.length < 2 ? (
                  <div style={{ fontSize: 13, color: textMuted }}>Mindestens 2 Check-ins mit {def.label} nötig, um einen Verlauf zu sehen.</div>
                ) : (
                  <SimpleLineChart data={daten} dataKey={id} stroke={blue} />
                )}
              </Card>
            </React.Fragment>
          );
        })}

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Schlafverlauf</div>
      <Card style={{ marginBottom: 14 }}>
        {schlafEintraege.length < 2 ? (
          <div style={{ fontSize: 13, color: textMuted }}>Trag mindestens 2 Schlaf-Einträge ein (Protokolle → Schlaf).</div>
        ) : (
          <SimpleLineChart data={schlafEintraege.slice(-14)} dataKey="stunden" stroke="#9B7EDE" />
        )}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Nebenwirkungen (Häufigkeit)</div>
      <Card style={{ marginBottom: 14 }}>
        {nebenwirkungCounts.length === 0 ? (
          <div style={{ fontSize: 13, color: textMuted }}>Noch kein Feedback erfasst — bestätige Injektionen im Plan-Tab.</div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <NebenwirkungenPie data={nebenwirkungCounts} colors={PIE_COLORS} />
            <div style={{ flex: 1 }}>
              {nebenwirkungCounts.map((n, i) => (
                <div key={n.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span style={{ fontSize: 12 }}>
                    {n.name} ({n.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
