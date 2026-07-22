import React from "react";
import { Shell, Card } from "../ui/primitives";
import { accent, accentSoft, blue, cardBorder, danger, shadow, success, textMuted } from "../ui/theme";
import { DASHBOARD_TIERS } from "../constants";
import { keyOf, sameDay, toLocalISODate } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";

export default function HomeView({ onOpenView, onNewProtocol }) {
  const { plan, peptide, dauer, erledigt, supplemente, supplementErledigt, hormonPlan, hormonErledigt } = useAppData();

  const today = new Date();
  const heuteDosen = plan.filter((d) => sameDay(d.date, today));

  const tagStr = toLocalISODate(today);
  const peptidHeute = heuteDosen.length;
  const peptidErledigt = heuteDosen.filter((d) => erledigt[keyOf(d.date, d.peptid)]).length;
  const supplementHeute = supplemente.reduce((s, sp) => s + sp.tageszeiten.length, 0);
  const supplementErledigtHeute = supplemente.reduce(
    (s, sp) => s + sp.tageszeiten.filter((z) => supplementErledigt[`${tagStr}__${sp.id}__${z}`]).length,
    0
  );
  const hormonHeute = hormonPlan.filter((d) => sameDay(d.date, today)).length;
  const hormonErledigtHeute = hormonPlan.filter(
    (d) => sameDay(d.date, today) && hormonErledigt[`${toLocalISODate(d.date)}__${d.name}`]
  ).length;
  const gesamt = peptidHeute + supplementHeute + hormonHeute;
  const erledigtGesamt = peptidErledigt + supplementErledigtHeute + hormonErledigtHeute;
  const score = gesamt > 0 ? Math.round((erledigtGesamt / gesamt) * 100) : null;

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}>Willkommen zurück 👋</div>
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
            boxShadow: "0 6px 14px rgba(15, 184, 163, 0.25)",
          }}
        >
          🧬
        </div>
      </div>

      <Card style={{ marginBottom: 18, background: `linear-gradient(135deg, ${accentSoft}, #fff)` }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0A9384" }}>{plan.length || "—"}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Injektionen gesamt</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0A9384" }}>{peptide.length}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Aktive Peptide</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0A9384" }}>{dauer}</div>
            <div style={{ fontSize: 11, color: textMuted }}>Wochen Dauer</div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 2 }}>Heute fällig</div>
            <div style={{ fontSize: 13 }}>
              {erledigtGesamt}/{gesamt} erledigt
            </div>
          </div>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              background: score === null ? cardBorder : score >= 80 ? success : score >= 50 ? "#F5A623" : danger,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 800,
            }}
          >
            {score !== null ? `${score}%` : "—"}
          </div>
        </div>
      </Card>

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
