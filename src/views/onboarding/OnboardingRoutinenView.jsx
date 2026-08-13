import React from "react";
import { Shell, PrimaryButton, Card } from "../../ui/primitives";
import { cardBorder, textMuted } from "../../ui/theme";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import RoutineSchritteEditor from "../../ui/RoutineSchritteEditor";
import { useAppData } from "../../context/AppDataContext";
import { useT } from "../../i18n/translate";

// Morgen-/Abendroutine bewusst direkt nach Ziel/Profil/Laborwerte und VOR
// den 9 Kategorie-Plänen (Schlaf, Peptide, Supplemente, ...) — Nutzerinnen-
// Vorgabe (13.08.): der eigentliche Ursprungsgedanke der App (ADHS-gerechte
// Tagesstruktur) ist im Onboarding bisher untergegangen, weil alles aus der
// Peptid-Idee herausgewachsen ist. Alle anderen Kategorien sind aus dieser
// Sicht nur noch Zusatz-Bausteine, die sich später der Routine zuordnen
// lassen — deshalb kommt die Routine-Einrichtung jetzt zuerst.
export default function OnboardingRoutinenView({ onDone, onBack, onCancel }) {
  const { t, tLabel } = useT();
  const { routineSchritte, routineSchrittHinzufuegen, routineSchrittEntfernen, routineSchrittVerschieben } = useAppData();

  return (
    <Shell>
      <OnboardingNavArrows onBack={onBack} backLabel={t("onboarding.zurueck")} onForward={onDone} forwardLabel={tLabel("Überspringen")} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 28 }}>🌅🌙</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>Morgen- & Abendroutine</div>
      </div>
      <div style={{ fontSize: 13, color: textMuted, marginBottom: 18, lineHeight: 1.5 }}>
        Kein guter Morgen ohne einen guten Abend davor — und ein guter Tag beginnt schon beim Aufwachen. Alles andere in dieser App
        (Schlaf, Training, Supplemente, ...) sind Bausteine, die sich später in diese beiden Routinen einordnen. Leg jetzt schon fest,
        welche Schritte für dich zu einem guten Start bzw. Abschluss des Tages gehören — kannst du jederzeit später anpassen.
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>🌅 Morgenroutine</div>
        <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 4 }}>
          Was gehört für dich zu einem guten Start in den Tag? Z. B. "15 Min. Tageslicht", "Kaffee/Shake machen", "Duschen", "20 Min.
          Training".
        </div>
        <RoutineSchritteEditor
          schritte={routineSchritte.filter((s) => s.routine === "morgen")}
          onHinzufuegen={(name, dauerMin) => routineSchrittHinzufuegen("morgen", name, dauerMin)}
          onEntfernen={routineSchrittEntfernen}
          onVerschieben={routineSchrittVerschieben}
        />
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>🌙 Abendroutine</div>
        <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 4 }}>
          Was hilft dir, den Tag mental abzuschließen und gut einzuschlafen? Z. B. "Tag reflektieren", "Supplemente nehmen", "Bildschirm
          aus".
        </div>
        <RoutineSchritteEditor
          schritte={routineSchritte.filter((s) => s.routine === "abend")}
          onHinzufuegen={(name, dauerMin) => routineSchrittHinzufuegen("abend", name, dauerMin)}
          onEntfernen={routineSchrittEntfernen}
          onVerschieben={routineSchrittVerschieben}
        />
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <PrimaryButton onClick={onDone}>{tLabel("Weiter")}</PrimaryButton>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              border: `1px solid ${cardBorder}`,
              background: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 150ms ease-out",
            }}
          >
            {tLabel("Abbrechen")}
          </button>
        )}
      </div>
    </Shell>
  );
}
