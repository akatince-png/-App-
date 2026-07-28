import React, { useState } from "react";
import { Shell, Card, Label, TextInput, PrimaryButton } from "../../ui/primitives";
import { accentDark, cardBorder, textMuted } from "../../ui/theme";
import Logo from "../../ui/Logo";
import Icon from "../../ui/Icon";
import CoachOrb from "../../ui/CoachOrb";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import OnboardingCoachGuide from "./OnboardingCoachGuide";
import OnboardingCoachFreitext from "./OnboardingCoachFreitext";
import { getCoachName } from "../../utils/coachStorage";
import { useT } from "../../i18n/translate";

/**
 * OnboardingIntroView: Persönliche Begrüßung, danach die Wahl zwischen zwei
 * Coach-Begleitungs-Varianten oder dem bisherigen manuellen Formular:
 * - "begleitet-schritt" (Phase 1): Felder werden einzeln abgefragt, siehe
 *   OnboardingCoachGuide.jsx.
 * - "begleitet-frei" (Phase 2): freies Erzählen, der Coach ordnet danach
 *   automatisch zu, siehe OnboardingCoachFreitext.jsx.
 * Beide decken direkt auch die Ziele- und Profil-Schritte mit ab —
 * OnboardingFlow.jsx überspringt diese Phasen dann.
 */
export default function OnboardingIntroView({ onDone, onBack, onCancel }) {
  const { t, tLabel } = useT();
  const [modus, setModus] = useState(null); // null (Frage noch offen) | "manuell" | "begleitet-schritt" | "begleitet-frei"
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const coachName = getCoachName();

  const handleContinue = () => {
    if (!name.trim()) return;
    setLoading(true);

    // Speichere Namen in localStorage
    try {
      localStorage.setItem("user_name", name.trim());
    } catch (e) {
      console.warn("Konnte Namen nicht speichern:", e);
    }

    setLoading(false);
    onDone();
  };

  if (modus === "begleitet-schritt") {
    return <OnboardingCoachGuide onFertig={() => onDone({ guided: true })} onBack={() => setModus(null)} />;
  }

  if (modus === "begleitet-frei") {
    return <OnboardingCoachFreitext onFertig={() => onDone({ guided: true })} onBack={() => setModus(null)} />;
  }

  if (modus === null) {
    return (
      <Shell>
        <OnboardingNavArrows onBack={onBack} backLabel={tLabel("Zurück")} />
        <div style={{ marginBottom: 32, paddingTop: 20 }}>
          <Logo size={72} />
        </div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Hey! 👋</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: textMuted, lineHeight: 1.5 }}>
            Ich bin {coachName} — deine exekutive rechte Hand.
          </div>
        </div>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, marginBottom: 18 }}>
            <CoachOrb zustand="ruhe" size={64} />
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5 }}>
              Du musst deine Gesundheit und Routinen ab jetzt nicht mehr alleine im Kopf managen — ich übernehme die Logistik. Ich habe deine Protokolle, Tagesstrukturen und Rechner bereits griffbereit. Soll ich dich beim Einrichten begleiten, oder möchtest du das lieber allein machen?
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PrimaryButton onClick={() => setModus("begleitet-frei")}>Ja, ich erzähl einfach frei</PrimaryButton>
            <button
              type="button"
              onClick={() => setModus("begleitet-schritt")}
              style={{
                padding: "13px 16px",
                borderRadius: 12,
                border: `1px solid ${cardBorder}`,
                background: "#fff",
                color: textMuted,
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Lieber Frage für Frage
            </button>
            <button
              type="button"
              onClick={() => setModus("manuell")}
              style={{
                padding: "13px 16px",
                borderRadius: 12,
                border: `1px solid ${accentDark}`,
                background: "#fff",
                color: accentDark,
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Nein, ich mach's selbst
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                style={{
                  padding: "12px 20px",
                  borderRadius: 12,
                  border: `1px solid ${cardBorder}`,
                  background: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Abbrechen
              </button>
            )}
          </div>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <OnboardingNavArrows
        onBack={() => setModus(null)}
        backLabel={tLabel("Zurück")}
        onForward={handleContinue}
        forwardLabel={loading ? "Einen Moment..." : tLabel("Weiter")}
        forwardDisabled={loading || !name.trim()}
      />
      <div style={{ marginBottom: 32, paddingTop: 20 }}>
        <Logo size={72} />
      </div>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
          Hey! 👋
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: textMuted, lineHeight: 1.5 }}>
          Stell dich vor — wie heißt du?
        </div>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <Label>Dein Name</Label>
        <TextInput
          type="text"
          value={name}
          onChange={setName}
          placeholder="z. B. Anton Kaufmann"
          onKeyPress={(e) => {
            if (e.key === "Enter" && name.trim()) {
              handleContinue();
            }
          }}
        />
        <div style={{ fontSize: 12, color: textMuted, marginTop: 8 }}>
          Damit ich dich später mit deinem Namen begrüßen kann.
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <PrimaryButton 
            onClick={handleContinue} 
            disabled={loading || !name.trim()}
            style={{ flex: 1 }}
          >
            {loading ? "Einen Moment..." : "Weiter"}
          </PrimaryButton>
          {onCancel && (
            <button
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
              Abbrechen
            </button>
          )}
        </div>
      </Card>
    </Shell>
  );
}
