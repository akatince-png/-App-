import React from "react";
import { Shell, Card } from "../ui/primitives";
import ProgressRing from "../ui/ProgressRing";
import { accent, blue, cardBorder, shadow, textMuted } from "../ui/theme";
import { DASHBOARD_TIERS } from "../constants";
import { buildDayItems, KATEGORIE_META } from "../utils/dayItems";
import { statusText } from "../utils/motivation";
import { useAppData } from "../context/AppDataContext";

export default function HomeView({ onOpenView, onNewProtocol }) {
  const {
    plan,
    erledigt,
    hormonPlan,
    hormonErledigt,
    supplemente,
    supplementErledigt,
    mahlzeiten,
    mahlzeitErledigt,
    trainingEintraege,
    trainingWochenplan,
    trainingTemplates,
  } = useAppData();

  const today = new Date();
  const stunde = today.getHours();
  const gruss = stunde < 12 ? "Guten Morgen" : stunde < 18 ? "Guten Tag" : "Guten Abend";

  const heuteItems = buildDayItems(today, {
    plan,
    erledigt,
    hormonPlan,
    hormonErledigt,
    supplemente,
    supplementErledigt,
    mahlzeiten,
    mahlzeitErledigt,
    trainingEintraege,
    trainingWochenplan,
    trainingTemplates,
  });
  const erledigtCount = heuteItems.filter((i) => i.done).length;
  const offeneItems = heuteItems.filter((i) => !i.done);

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}>{gruss} 👋</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>MyProtocols</div>
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${accent}, ${blue})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            boxShadow: "0 6px 14px rgba(14, 124, 102, 0.25)",
          }}
        >
          🧬
        </div>
      </div>

      {/* Fortschritt zuerst — die Startseite ist ein Tagesassistent, kein Menü. */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ProgressRing done={erledigtCount} total={heuteItems.length} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: textMuted, marginBottom: 3 }}>Heute</div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{statusText(erledigtCount, heuteItems.length)}</div>
          </div>
        </div>
      </Card>

      {/* Dann die heute offenen Aufgaben — erst danach die Module. */}
      {offeneItems.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 800, color: textMuted, marginBottom: 10 }}>Als Nächstes</div>
          <Card style={{ marginBottom: 20, padding: 8 }}>
            {offeneItems.slice(0, 4).map((item, i, arr) => {
              const k = KATEGORIE_META[item.kategorie];
              return (
                <button
                  key={item.key}
                  className="mp-tap"
                  onClick={() => onOpenView("tagesplan")}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "12px 12px",
                    background: "transparent",
                    border: "none",
                    borderBottom: i < arr.length - 1 ? `1px solid ${cardBorder}` : "none",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: k.dot, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {item.name} <span style={{ fontWeight: 600, color: textMuted, fontSize: 12 }}>· {item.uhrzeit}</span>
                      </div>
                      {item.detail && <div style={{ fontSize: 11.5, color: textMuted, marginTop: 1 }}>{item.detail}</div>}
                    </div>
                  </div>
                  <span style={{ color: textMuted, fontSize: 16, flexShrink: 0 }}>›</span>
                </button>
              );
            })}
          </Card>
        </>
      )}

      {DASHBOARD_TIERS.map((tier, tierIdx) => (
        <div
          key={tier.id}
          style={{
            marginBottom: tierIdx === DASHBOARD_TIERS.length - 1 ? 0 : 26,
            paddingBottom: tierIdx === DASHBOARD_TIERS.length - 1 ? 0 : 22,
            borderBottom: tierIdx === DASHBOARD_TIERS.length - 1 ? "none" : `1px solid ${cardBorder}`,
          }}
        >
          {tier.title && (
            <div style={{ fontSize: 12, fontWeight: 800, color: textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>
              {tier.title}
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: tier.id === "haupt" ? "1fr" : "1fr 1fr",
              gap: tier.id === "haupt" ? 10 : 12,
            }}
          >
            {tier.kacheln.map((k) =>
              tier.id === "haupt" ? (
                <button
                  key={k.id}
                  className="mp-tap"
                  onClick={() => onOpenView(k.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    textAlign: "left",
                    borderRadius: 22,
                    padding: "14px 16px",
                    cursor: "pointer",
                    background: "#fff",
                    boxShadow: shadow,
                    border: `1px solid ${cardBorder}`,
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      flexShrink: 0,
                      borderRadius: 16,
                      background: `linear-gradient(135deg, ${k.grad[0]}, ${k.grad[1]})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                    }}
                  >
                    {k.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{k.label}</div>
                    <div style={{ fontSize: 12, color: textMuted }}>{k.desc}</div>
                  </div>
                </button>
              ) : (
                <button
                  key={k.id}
                  className="mp-tap"
                  onClick={() => onOpenView(k.id)}
                  style={{
                    textAlign: "left",
                    borderRadius: 20,
                    padding: 16,
                    cursor: "pointer",
                    background: "#fff",
                    boxShadow: shadow,
                    border: `1px solid ${cardBorder}`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 13,
                      background: `linear-gradient(135deg, ${k.grad[0]}, ${k.grad[1]})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 17,
                      marginBottom: 10,
                    }}
                  >
                    {k.icon}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>{k.label}</div>
                  <div style={{ fontSize: 11, color: textMuted }}>{k.desc}</div>
                </button>
              )
            )}
          </div>
        </div>
      ))}

      <button
        className="mp-tap"
        onClick={onNewProtocol}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 16,
          border: `1px dashed ${cardBorder}`,
          background: "transparent",
          color: textMuted,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          marginTop: 4,
        }}
      >
        + Neues Protokoll erstellen
      </button>
    </Shell>
  );
}
