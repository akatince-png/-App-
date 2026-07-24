import React from "react";
import { Shell, Card } from "../ui/primitives";
import ProgressRing from "../ui/ProgressRing";
import Logo from "../ui/Logo";
import Icon from "../ui/Icon";
import { accentDark, accentSoft, blue, blueSoft, cardBorder, shadow, textMuted } from "../ui/theme";
import { buildDayItems, KATEGORIE_META } from "../utils/dayItems";
import { statusText } from "../utils/motivation";
import { toLocalISODate } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";

// Fasst mehrere Supplemente derselben Tageszeit ("Morgens-Supplemente")
// bzw. mehrere Trainingseinheiten desselben Tages ("Trainingseinheit") zu
// einer Zeile zusammen — Einzeleinträge bleiben unverändert, sobald nur
// ein Eintrag der jeweiligen Gruppe angehört.
function gruppiereFuerAlsNaechstes(items) {
  const angezeigt = [];
  const supplementSlots = {};
  let trainingSlot = null;

  items.forEach((item) => {
    if (item.kategorie === "supplement") {
      let slot = supplementSlots[item.uhrzeit];
      if (!slot) {
        slot = { ...item, _ids: [item.refId], _namen: [item.name] };
        supplementSlots[item.uhrzeit] = slot;
        angezeigt.push(slot);
      } else {
        slot._ids.push(item.refId);
        slot._namen.push(item.name);
      }
    } else if (item.kategorie === "training") {
      if (!trainingSlot) {
        trainingSlot = { ...item, _traininganzahl: 1 };
        angezeigt.push(trainingSlot);
      } else {
        trainingSlot._traininganzahl += 1;
      }
    } else {
      angezeigt.push(item);
    }
  });

  return angezeigt.map((it) => {
    if (it.kategorie === "supplement" && it._ids.length > 1) {
      return { ...it, name: `${it.uhrzeit}-Supplemente`, detail: it._namen.join(", "), bundleIds: it._ids };
    }
    if (it.kategorie === "training" && it._traininganzahl > 1) {
      return { ...it, name: "Trainingseinheit" };
    }
    return it;
  });
}

// Konzept 4B: die Startseite ist ein knapper Tagesassistent + drei
// Ordner-Kacheln (Alle Pläne / Archiv / Mehr) statt einer langen Liste
// aus 17 Einzelkacheln — jede Kategorie liegt jetzt hinter einem Reiter
// innerhalb dieser Ordner (siehe PlaeneView.jsx / PlanView.jsx).
const ORDNER = [
  { id: "schlaf", label: "Alle Pläne", desc: "Deine Bereiche", icon: "folder" },
  { id: "archiv", label: "Archiv", desc: "Vergangene Daten", icon: "archive" },
  { id: "mehr", label: "Mehr", desc: "Einstellungen & mehr", icon: "sliders" },
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
    mealWochenplan,
    trainingEintraege,
    trainingWochenplan,
    trainingTemplates,
    gewohnheiten,
    gewohnheitErledigt,
    confirmAlleTageszeit,
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
    mealWochenplan,
    trainingEintraege,
    trainingWochenplan,
    trainingTemplates,
    gewohnheiten,
    gewohnheitErledigt,
  });
  const erledigtCount = heuteItems.filter((i) => i.done).length;
  const offeneItems = heuteItems.filter((i) => !i.done);
  const angezeigteItems = gruppiereFuerAlsNaechstes(offeneItems);
  const tagStr = toLocalISODate(today);

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}>{gruss}</div>
          <div style={{ fontFamily: "'Poppins', 'Inter', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: -0.2 }}>MyProtocols</div>
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
            <Icon name="target" size={24} color={blue} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{gewohnheiten.length}</div>
              <div style={{ fontSize: 11, color: textMuted, fontWeight: 700 }}>{gewohnheiten.length === 1 ? "aktiv" : "aktiv"}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Dann die heute offenen Aufgaben — erst danach die Ordner. */}
      {angezeigteItems.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 800, color: textMuted, marginBottom: 10 }}>Als Nächstes</div>
          <Card style={{ marginBottom: 20, padding: 8 }}>
            {angezeigteItems.slice(0, 4).map((item, i, arr) => {
              const k = KATEGORIE_META[item.kategorie];
              return (
                <div
                  key={item.key}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "12px 12px",
                    borderBottom: i < arr.length - 1 ? `1px solid ${cardBorder}` : "none",
                  }}
                >
                  <button
                    className="mp-tap"
                    onClick={() => onOpenView("tagesplan")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      padding: 0,
                      minWidth: 0,
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: k.dot, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {item.name} <span style={{ fontWeight: 600, color: textMuted, fontSize: 12 }}>· {item.uhrzeit}</span>
                      </div>
                      {item.detail && <div style={{ fontSize: 11.5, color: textMuted, marginTop: 1 }}>{item.detail}</div>}
                    </div>
                  </button>
                  {item.bundleIds ? (
                    <button
                      className="mp-tap"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmAlleTageszeit(tagStr, item.uhrzeit, item.bundleIds);
                      }}
                      style={{
                        flexShrink: 0,
                        padding: "7px 12px",
                        borderRadius: 10,
                        border: "none",
                        background: accentSoft,
                        color: accentDark,
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ✓ Alle
                    </button>
                  ) : (
                    <button
                      className="mp-tap"
                      onClick={() => onOpenView("tagesplan")}
                      style={{ color: textMuted, fontSize: 16, flexShrink: 0, background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      ›
                    </button>
                  )}
                </div>
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
          <Icon name="target" size={22} color={accentDark} />
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
            <div style={{ marginBottom: 8 }}>
              <Icon name={o.icon} size={22} color={accentDark} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{o.label}</div>
            <div style={{ fontSize: 10.5, color: textMuted }}>{o.desc}</div>
          </button>
        ))}
      </div>
    </Shell>
  );
}
