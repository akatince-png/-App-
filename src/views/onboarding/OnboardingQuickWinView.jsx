import React from "react";
import { Shell, Card, PrimaryButton } from "../../ui/primitives";
import { accent, blue, textMuted } from "../../ui/theme";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import { useT } from "../../i18n/translate";
import { useAppData } from "../../context/AppDataContext";

// App-Bauplan-Punkt (ADHS-Perspektive): bisher kam der einzige echte
// Erfolgsmoment im Onboarding erst ganz am Ende (OnboardingCompletionView),
// nach Ziel & Grund, Profil, Laborwerten, Morgen-/Abendroutine UND allen
// Kategorien — bei ADHS ist gerade diese lange Durststrecke ohne
// Zwischen-Belohnung der Punkt, an dem Motivation/Aufgabeninitiierung am
// ehesten abreißt (vgl. Task-Switching-/Belohnungsaufschub-Problematik).
// Direkt nach dem allerersten, kleinsten Schritt (Hauptprotokoll anlegen —
// zwei Felder, wenige Sekunden) bekommt die Person hier schon eine echte,
// sichtbare Bestätigung, BEVOR der lange Fragebogen-Teil überhaupt
// losgeht — bewusst dasselbe visuelle Muster (Farbverlauf-Icon,
// Glückwunsch-Ton) wie der Abschluss-Screen, damit sich Anfang und Ende
// des Onboardings wie zusammengehörige Erfolgsmomente anfühlen, nicht nur
// das Ende.
export default function OnboardingQuickWinView({ onDone, onBack }) {
  const { t, tLabel } = useT();
  const { aktivesHauptprotokoll } = useAppData();
  const name = aktivesHauptprotokoll?.name;

  return (
    <Shell>
      <OnboardingNavArrows onBack={onBack} backLabel={tLabel("Zurück")} onForward={onDone} forwardLabel={t("onboarding.quickwin.weiter")} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 32, marginBottom: 28 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${accent}, ${blue})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            marginBottom: 18,
            boxShadow: "0 8px 20px rgba(15, 184, 163, 0.25)",
          }}
        >
          ✓
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, textAlign: "center", marginBottom: 10 }}>
          {name ? t("onboarding.quickwin.title.named", { name }) : t("onboarding.quickwin.title")}
        </div>
        <div style={{ fontSize: 14, color: textMuted, textAlign: "center", lineHeight: 1.6, maxWidth: 300 }}>
          {t("onboarding.quickwin.subtitle")}
        </div>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <PrimaryButton onClick={onDone} variant="success">
          {t("onboarding.quickwin.weiter")}
        </PrimaryButton>
      </Card>
    </Shell>
  );
}
