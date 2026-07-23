import React from "react";
import { Shell, Card } from "../ui/primitives";
import ProgressRing from "../ui/ProgressRing";
import Logo from "../ui/Logo";
import { accentDark, accentSoft, blue, blueSoft, cardBorder, shadow, textMuted } from "../ui/theme";
import { buildDayItems, KATEGORIE_META } from "../utils/dayItems";
import { statusText } from "../utils/motivation";
import { useAppData } from "../context/AppDataContext";

// Konzept 4B: die Startseite ist ein knapper Tagesassistent + drei
// Ordner-Kacheln (Alle Pläne / Archiv / Mehr) statt einer langen Liste
// aus 17 Einzelkacheln — jede Kategorie liegt jetzt hinter einem Reiter
// innerhalb dieser Ordner (siehe PlaeneView.jsx / PlanView.jsx).
const ORDNER = [
  { id: "schlaf", label: "Alle Pläne", desc: "Deine Bereiche", icon: "📂" },
  { id: "archiv", label: "Archiv", desc: "Vergangene Daten", icon: "🗂️" },
  { id: "mehr", label: "Mehr", desc: "Einstellungen & mehr", icon: "⚙️" },
];

export default function HomeView({ onOpenView }) {
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
    gewohnheiten,
    gewohnheitErledigt,
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
    gewohnheiten,
    gewohnheitErledigt,
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
        <Logo size={42} />
      </div>

      {/* Fortschritt zuerst — die Startseite ist ein Tagesassistent, kein Menü. */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card>
          <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 10 }}>Tagesfortschritt</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ProgressRing done={erledigtCount} total={heuteItems.length} size={54} />
            <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.3 }}>{statusText(erledigtCount, heuteItems.length)}</div>
          </div>
        </Card>
        <Card
          className="mp-tap"
          style={{ cursor: "pointer", background: blueSoft, border: "none" }}
          onClick={() => onOpenView("routinen")}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: blue, marginBottom: 10 }}>Gewohnheiten</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 26 }}>🌱</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{gewohnheiten.length}</div>
              <div style={{ fontSize: 11, color: textMuted, fontWeight: 700 }}>{gewohnheiten.length === 1 ? "aktiv" : "aktiv"}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Dann die heute offenen Aufgaben — erst danach die Ordner. */}
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

      <button
        className="mp-tap"
        onClick={() => onOpenView("routinen")}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "16px 18px",
          borderRadius: 18,
          border: "none",
          background: accentSoft,
          cursor: "pointer",
          marginBottom: 20,
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 22 }}>🌱</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: accentDark }}>Gewohnheiten</div>
            <div style={{ fontSize: 12, color: accentDark, opacity: 0.8 }}>Neue Routinen aufbauen</div>
          </div>
        </div>
        <span style={{ color: accentDark, fontSize: 18 }}>›</span>
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {ORDNER.map((o) => (
          <button
            key={o.label}
            className="mp-tap"
            onClick={() => onOpenView(o.id)}
            style={{
              textAlign: "left",
              borderRadius: 18,
              padding: "14px 10px",
              cursor: "pointer",
              background: "#fff",
              boxShadow: shadow,
              border: `1px solid ${cardBorder}`,
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>{o.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{o.label}</div>
            <div style={{ fontSize: 10.5, color: textMuted }}>{o.desc}</div>
          </button>
        ))}
      </div>
    </Shell>
  );
}
