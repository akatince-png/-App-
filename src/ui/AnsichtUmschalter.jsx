import React from "react";
import { accentDark, accentSoft, cardBorder, textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { useAdmin } from "../context/AdminContext";

// Umschalter Admin-Ansicht ⇄ Coachee-Ansicht (Nutzerinnen-Wunsch 23.09.)
// unter "Mehr" — nur für echte Admin-Konten sichtbar, auch dann, wenn die
// Coachee-Ansicht gerade an ist (sonst gäbe es keinen Weg zurück).
// Logik: useProfileData.js (istAdminKonto / coacheeAnsicht).
export default function AnsichtUmschalter() {
  const { istAdminKonto, coacheeAnsicht, setCoacheeAnsicht } = useAppData();
  const { verlasseVerwaltung } = useAdmin();
  if (!istAdminKonto) return null;

  const umschalten = () => {
    verlasseVerwaltung();
    setCoacheeAnsicht(!coacheeAnsicht);
  };

  return (
    <button
      type="button"
      onClick={umschalten}
      className="mp-tap"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        padding: "13px 16px",
        borderRadius: 14,
        border: coacheeAnsicht ? `2px solid ${accentDark}` : `1px solid ${cardBorder}`,
        background: coacheeAnsicht ? accentSoft : "#fff",
        marginBottom: 20,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <span style={{ fontSize: 22 }}>{coacheeAnsicht ? "🛠️" : "👤"}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: coacheeAnsicht ? accentDark : "inherit" }}>
          {coacheeAnsicht ? "Zurück zur Admin-Ansicht" : "Als Coachee nutzen"}
        </span>
        <span style={{ display: "block", fontSize: 12, color: textMuted, marginTop: 2 }}>
          {coacheeAnsicht
            ? "Du siehst die App gerade genau wie eine Coachee."
            : "Die App mit deinen eigenen Daten genau so sehen und nutzen wie jede Coachee."}
        </span>
      </span>
    </button>
  );
}
