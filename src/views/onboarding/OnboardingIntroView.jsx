import React, { useState } from "react";
import { Shell, Card, Label, TextInput, PrimaryButton } from "../../ui/primitives";
import { textMuted } from "../../ui/theme";
import Logo from "../../ui/Logo";
import Icon from "../../ui/Icon";
import { useT } from "../../i18n/translate";

/**
 * OnboardingIntroView: Persönliche Begrüßung mit Namenseingabe
 * Zeigt nach HauptprotokollErstellen: "Hey, stell dich vor!"
 * Der Name wird in localStorage gespeichert und auf der Homepage angezeigt
 */
export default function OnboardingIntroView({ onDone, onCancel }) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <Shell>
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
                border: "1px solid #E5E7EB",
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
