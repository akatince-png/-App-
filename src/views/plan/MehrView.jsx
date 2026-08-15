import React from "react";
import { Shell } from "../../ui/primitives";
import { cardBorder } from "../../ui/theme";
import MehrTab from "./MehrTab";
import { useT } from "../../i18n/translate";

// Dünner Shell/Header-Wrapper um MehrTab.jsx — "Mehr" ist eine der
// Ordner-Kacheln auf der Startseite (siehe HomeView.jsx), kein Reiter
// innerhalb des Archiv-Hubs (PlanView.jsx).
export default function MehrView({ onHome, onOpenLexikon, onOpenFragebogen }) {
  const { t } = useT();
  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{t("mehrView.titel")}</div>
        <button
          onClick={onHome}
          style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${cardBorder}`, background: "#fff", fontSize: 15, cursor: "pointer" }}
          title={t("mehrView.zumDashboard")}
        >
          ⌂
        </button>
      </div>
      <MehrTab onOpenLexikon={onOpenLexikon} onOpenFragebogen={onOpenFragebogen} />
    </Shell>
  );
}
