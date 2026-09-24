import React, { useState } from "react";
import { Shell, Card, Label, TextInput, PrimaryButton } from "../../ui/primitives";
import { accentDark, cardBorder, textMuted } from "../../ui/theme";
import Logo from "../../ui/Logo";
import CoachOrb from "../../ui/CoachOrb";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import OnboardingCoachGuide from "./OnboardingCoachGuide";
import OnboardingCoachFreitext from "./OnboardingCoachFreitext";
import { getCoachName, saveKiAutoStartUnterdrueckt } from "../../utils/coachStorage";
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
 *
 * `nurManuell` (Coach-verwaltetes Modell, 13.08.): Coachees bekommen den
 * KI-Assistenten gar nicht erst zu sehen (siehe KiChat.jsx), deshalb macht
 * hier auch die Auswahl zwischen den beiden Coach-Begleitungs-Varianten
 * keinen Sinn — die Namens-Eingabe erscheint dann direkt ohne Zwischenfrage.
 */
export default function OnboardingIntroView({ onDone, onBack, onCancel, nurManuell = false }) {
  const { tLabel } = useT();
  const [modus, setModus] = useState(() => (nurManuell ? "manuell" : null)); // null (Frage noch offen) | "manuell" | "begleitet-schritt" | "begleitet-frei"
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const coachName = getCoachName();

  // Kürzeres Onboarding (24.09.): Name steht jetzt mit auf der Auswahl-
  // Seite — wird hier für alle drei Wege gespeichert, falls ausgefüllt.
  const nameSpeichern = () => {
    if (!name.trim()) return;
    try {
      localStorage.setItem("user_name", name.trim());
    } catch (e) {
      console.warn("Konnte Namen nicht speichern:", e);
    }
  };

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
        <div style={{ marginBottom: 18, paddingTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <Logo size={52} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>Hey! 👋</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: textMuted }}>Ich bin {coachName} — deine exekutive rechte Hand.</div>
          </div>
        </div>
        <Card style={{ marginBottom: 14 }}>
          <Label>Wie heißt du?</Label>
          <TextInput type="text" value={name} onChange={setName} placeholder="z. B. Anton Kaufmann" diktierbar />
          <div style={{ fontSize: 12, color: textMuted, marginTop: 6 }}>Damit ich dich mit deinem Namen begrüßen kann.</div>
        </Card>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <CoachOrb zustand="ruhe" size={44} />
            <div style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.4 }}>Wie willst du einrichten?</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PrimaryButton onClick={() => { nameSpeichern(); saveKiAutoStartUnterdrueckt(false); setModus("begleitet-frei"); }}>🗣️ Ich erzähl Aka einfach frei</PrimaryButton>
            <button
              type="button"
              onClick={() => { nameSpeichern(); saveKiAutoStartUnterdrueckt(false); setModus("begleitet-schritt"); }}
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
              💬 Aka fragt mich Schritt für Schritt
            </button>
            <button
              type="button"
              onClick={() => {
                saveKiAutoStartUnterdrueckt(true);
                // Name schon eingetragen → direkt weiter, sonst die
                // bisherige Namens-Seite als Rückfall.
                if (name.trim()) return handleContinue();
                setModus("manuell");
              }}
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
              🙋 Ich klick mich selbst durch
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
        onBack={() => (nurManuell ? onBack?.() : setModus(null))}
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
          diktierbar
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
