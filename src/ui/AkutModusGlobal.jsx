import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AkutModusPanel } from "./AkutModusKarte";
import { useAppData } from "../context/AppDataContext";
import { useAdmin } from "../context/AdminContext";
import { getCoachName } from "../utils/coachStorage";
import { useEscapeSchliesst } from "./useEscapeSchliesst";

// Akutmodus von jedem Bildschirm aus erreichbar (14.09., Nutzerinnen-
// Vorgabe aus dem App-Bauplan): bisher saß der Akutmodus nur auf Home
// (HomeView.jsx, eigene Nutzerinnen-Vorgabe von dort, bleibt dort
// unverändert stehen) — ausgerechnet der Moment, in dem jemand ihn
// braucht, passiert aber oft nicht auf der Startseite. Dieser schwebende
// Zugang ergänzt Home, ersetzt es nicht: auf Home bewusst ausgeblendet
// (siehe `sichtbar`-Prop in AuthenticatedApp.jsx), damit dort nicht zwei
// Akutmodus-Zugänge gleichzeitig sichtbar sind.
//
// Per createPortal direkt an document.body gerendert (gleicher Grund wie
// beim KiChat-Fix): sonst könnte eine transformierende Vorfahren-
// Animation irgendeines Bildschirms den schwebenden Knopf oder das
// Panel unbemerkt beschneiden.
export default function AkutModusGlobal({ sichtbar }) {
  const [offen, setOffen] = useState(false);
  const { proband } = useAdmin();
  const { isAdmin, gewohnheiten, coacheeNachrichtSenden } = useAppData();
  const istAdminModus = proband !== null || isAdmin;

  useEscapeSchliesst(() => setOffen(false), offen);

  if (!sichtbar) return null;

  return createPortal(
    <>
      {!offen && (
        <button
          type="button"
          onClick={() => setOffen(true)}
          aria-label="Akutmodus — grad nicht gut?"
          title="Akutmodus — grad nicht gut?"
          className="mp-tap"
          style={{
            position: "fixed",
            bottom: "calc(22px + env(safe-area-inset-bottom, 0px))",
            left: 20,
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "none",
            background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
            boxShadow: "0 8px 20px rgba(245, 158, 11, 0.35)",
            fontSize: 24,
            cursor: "pointer",
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          💡
        </button>
      )}
      {offen && (
        <div
          onClick={() => setOffen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(21, 24, 26, 0.55)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 460, maxHeight: "88vh", overflowY: "auto", padding: "16px 16px calc(16px + env(safe-area-inset-bottom, 0px))" }}
          >
            <AkutModusPanel
              onClose={() => setOffen(false)}
              onSendenAnCoach={!istAdminModus ? coacheeNachrichtSenden : undefined}
              coachName={getCoachName()}
              zeigeCoachOption={!istAdminModus}
              akutUebungen={(gewohnheiten || []).filter((g) => g.akutFavorit)}
            />
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
