/**
 * === ADHS-OPTIMIERTE HOMEVIEW INTEGRATION EXAMPLE ===
 *
 * Zeigt, wie du die ADHS-Komponenten in deine bestehende HomeView einfügst.
 * KEIN Breaking Change — nur neue Features oben dazugefügt!
 *
 * Dieser Code ist nur ein BEISPIEL. Copy-paste die Relevant Teile in deine HomeView.
 * Ändere NICHTS an bestehenden Props/Logik!
 */

import React, { useState } from "react";
import { Shell, Card } from "../ui/primitives";
import ProgressRing from "../ui/ProgressRing";
import Logo from "../ui/Logo";
import Icon from "../ui/Icon";
import { accentDark, accentSoft, blue, blueSoft, cardBorder, shadow, textMuted } from "../ui/theme";
import { buildDayItems, KATEGORIE_META } from "../utils/dayItems";
import { statusText } from "../utils/motivation";
import { toLocalISODate } from "../utils/dates";
import { useAppData } from "../context/AppDataContext";
import { useT } from "../i18n/translate";

// ===== NEW: ADHS-KOMPONENTEN IMPORTIEREN =====
import ADHSModeToggle from "../ui/ADHSModeToggle";
import QuickTaskList from "../ui/QuickTaskList";
import { getADHSMode, saveADHSMode, getSoundEnabled, saveSoundEnabled } from "../utils/adhsStorage";

// ... (Rest der bestehenden Hilfsfunktionen wie gruppiereFuerAlsNaechstes, ORDNER, etc.)

export default function HomeView({ onOpenView }) {
  const { t, tLabel, lang } = useT();
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

  // ===== NEW: ADHS-STATE =====
  const [isEmergencyMode, setIsEmergencyMode] = useState(() => getADHSMode());
  const [soundEnabled, setSoundEnabled] = useState(() => getSoundEnabled());

  const handleToggleEmergencyMode = (newState) => {
    setIsEmergencyMode(newState);
    saveADHSMode(newState);
  };

  const handleToggleSoundEnabled = (newState) => {
    setSoundEnabled(newState);
    saveSoundEnabled(newState);
  };

  // ===== EXISTING CODE =====
  const today = new Date();
  const stunde = today.getHours();
  const gruss = stunde < 12 ? t("home.greeting.morgen") : stunde < 18 ? t("home.greeting.tag") : t("home.greeting.abend");

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
  const gewohnheitHeuteItems = heuteItems.filter((i) => i.kategorie === "gewohnheit");
  const gewohnheitErledigtHeute = gewohnheitHeuteItems.filter((i) => i.done).length;
  const offeneItems = heuteItems.filter((i) => !i.done);
  const angezeigteItems = gruppiereFuerAlsNaechstes(offeneItems, t, tLabel);
  const tagStr = toLocalISODate(today);

  // ===== NEW: Filtere Items basierend auf Emergency Mode =====
  // Im Notfallmodus: NUR Medikamente, Wasser, essentiellste Tasks
  const displayItems = isEmergencyMode
    ? angezeigteItems.filter((item) => {
        // Definiere was "essentiell" ist
        const essentialCategories = ["medikament", "hormon", "hydration"];
        return essentialCategories.includes(item.kategorie);
      })
    : angezeigteItems;

  // ===== NEW: Konvertiere Items ins QuickTaskList-Format =====
  const quickTasksFormatted = displayItems.map((item) => ({
    key: item.key,
    name: item.name,
    detail: item.detail || "",
    done: item.done || false,
    kategorie: item.kategorie,
    onToggle: () => {
      // Bestehende Toggle-Logik aufrufen
      if (item.bundleIds) {
        confirmAlleTageszeit(tagStr, item.uhrzeit, item.bundleIds);
      } else {
        onOpenView("tagesplan");
      }
    },
  }));

  return (
    <Shell>
      {/* ===== EXISTING: GREETING & LOGO ===== */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: textMuted, fontWeight: 600 }}>{gruss}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "'Poppins', 'Inter', sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: -0.2 }}>
            MyProtocols
          </div>
          <Logo size={56} />
        </div>
      </div>

      {/* ===== NEW: ADHS MODE TOGGLE ===== */}
      <ADHSModeToggle isEmergencyMode={isEmergencyMode} onToggle={handleToggleEmergencyMode} />

      {/* ===== NEW: NOTFALL-INFO BANNER ===== */}
      {isEmergencyMode && (
        <div
          style={{
            padding: "12px 14px",
            marginBottom: "14px",
            background: "rgba(217, 119, 6, 0.08)",
            border: "1px solid rgba(217, 119, 6, 0.3)",
            borderRadius: "10px",
            fontSize: "12px",
            color: "#D97706",
            lineHeight: "1.5",
            fontWeight: "500",
          }}
        >
          💛 <strong>Heute nur Basics:</strong> Medikamente + Wasser. Alles andere ist Bonus. Kein Druck!
        </div>
      )}

      {/* ===== EXISTING: PROGRESS RINGS ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: textMuted, marginBottom: 14 }}>
            {t("home.tagesfortschritt")}
          </div>
          <ProgressRing done={erledigtCount} total={heuteItems.length} size={84} stroke={10} color={accentDark} />
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, marginTop: 14 }}>
            {statusText(erledigtCount, heuteItems.length, lang)}
          </div>
        </Card>
        <Card
          className="mp-tap"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            cursor: "pointer",
            background: blueSoft,
            border: "none",
          }}
          onClick={() => onOpenView("routinen")}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: blue, marginBottom: 14 }}>
            {tLabel("Gewohnheiten")}
          </div>
          <ProgressRing
            done={gewohnheitErledigtHeute}
            total={gewohnheitHeuteItems.length}
            size={84}
            stroke={10}
            color={blue}
          />
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, marginTop: 14, color: blue }}>
            {gewohnheitHeuteItems.length === 0
              ? t("home.gewohnheiten.leer")
              : statusText(gewohnheitErledigtHeute, gewohnheitHeuteItems.length, lang)}
          </div>
        </Card>
      </div>

      {/* ===== EXISTING: SCHNELLZUGRIFF TAGESPLAN ===== */}
      <button
        className="mp-tap"
        onClick={() => onOpenView("tagesplan")}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "0 0 10px 0",
          textAlign: "left",
        }}
      >
        <Icon name="calendarCheck" size={18} color={accentDark} />
        <span style={{ fontSize: 13, fontWeight: 800, color: accentDark }}>{t("home.tagesplan")}</span>
        <span style={{ marginLeft: "auto", color: textMuted, fontSize: 14 }}>›</span>
      </button>

      {/* ===== NEW: QUICK TASK LIST (ersetzt alte Task-Liste) ===== */}
      {displayItems.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 800, color: textMuted, marginBottom: 10 }}>
            {t("home.alsNaechstes")}
          </div>
          <Card style={{ marginBottom: 20, padding: 8 }}>
            <QuickTaskList items={quickTasksFormatted} maxItems={4} soundEnabled={soundEnabled} />
          </Card>
        </>
      )}

      {/* ===== EXISTING: GEWOHNHEITEN CTA ===== */}
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
            <div style={{ fontSize: 14, fontWeight: 800, color: accentDark }}>
              {tLabel("Gewohnheiten")}
            </div>
            <div style={{ fontSize: 12, color: accentDark, opacity: 0.8 }}>
              {t("home.gewohnheiten.cta.desc")}
            </div>
          </div>
        </div>
        <span style={{ color: accentDark, fontSize: 18 }}>›</span>
      </button>

      {/* ===== EXISTING: FOLDER GRID ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {ORDNER.map((o) => (
          <button
            key={o.id}
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
            {/* ... Rest der Folder-Logik ... */}
          </button>
        ))}
      </div>
    </Shell>
  );
}
