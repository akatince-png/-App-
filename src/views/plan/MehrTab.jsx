import React, { useState } from "react";
import { Card } from "../../ui/primitives";
import { accentDark, cardBorder, danger, success, textMuted } from "../../ui/theme";
import { useAuth } from "../../context/AuthContext";
import { useAppData } from "../../context/AppDataContext";

const DATENSCHUTZ = ["Ende-zu-Ende Verschlüsselung", "DSGVO konform", "Daten gehören dir", "Du entscheidest, was geteilt wird", "Kein Verkauf deiner Daten"];

const ERWEITERUNGEN = [
  "Dunkelmodus & Design-Anpassung",
  "Wearable-Integration (Oura, Whoop)",
  "Siri / Google Assistant Shortcuts",
  "Offline-Modus",
  "Mehr Sprachen",
];

export default function MehrTab({ onOpenLexikon }) {
  const { signOut, user } = useAuth();
  const { resetOnboarding, pushUnterstuetzt, pushAktiv, pushLadend, pushFehler, pushAktivieren, pushDeaktivieren, pushTestSenden } = useAppData();
  const [resetMsg, setResetMsg] = useState(null);
  const [testMsg, setTestMsg] = useState(null);

  const handleResetOnboarding = async () => {
    setResetMsg(null);
    const result = await resetOnboarding();
    if (!result?.ok) {
      setResetMsg(result?.error || "Zurücksetzen fehlgeschlagen.");
      return;
    }
    // Setzt u. a. Peptid-Protokoll, Gewohnheiten, Mahlzeiten, Supplemente
    // und Medikamente serverseitig zurück — ein voller Reload lädt die App
    // komplett neu und landet dadurch direkt wieder im Willkommens-Flow,
    // statt dass der Nutzer sich extra ab- und wieder anmelden muss.
    window.location.reload();
  };

  const handleTestSenden = async () => {
    setTestMsg(null);
    const result = await pushTestSenden();
    setTestMsg(result?.ok ? "Gesendet — sollte gleich als Benachrichtigung ankommen." : result?.error || "Senden fehlgeschlagen.");
  };

  return (
    <>
      {onOpenLexikon && (
        <button
          onClick={onOpenLexikon}
          className="mp-tap"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "13px 16px",
            borderRadius: 14,
            border: `1px solid ${cardBorder}`,
            background: "#fff",
            marginBottom: 20,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700 }}>📚 Lexikon</span>
          <span style={{ color: textMuted, fontSize: 16 }}>›</span>
        </button>
      )}

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Erinnerungen</div>
      <Card style={{ marginBottom: 14 }}>
        {!pushUnterstuetzt ? (
          <div style={{ fontSize: 13, color: textMuted }}>
            Echte Erinnerungen werden auf diesem Gerät/Browser nicht unterstützt. Auf dem iPad: erst über „Teilen“ →
            „Zum Home-Bildschirm“ als App hinzufügen, dann von dort aus öffnen — hier funktioniert es dann.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>
              Erinnert dich per Benachrichtigung, auch wenn die App gerade nicht geöffnet ist — ganz ohne Mac oder
              Xcode, direkt über den Browser.
            </div>
            <button
              onClick={pushAktiv ? pushDeaktivieren : pushAktivieren}
              disabled={pushLadend}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                border: pushAktiv ? `1px solid ${danger}` : "none",
                fontSize: 15,
                fontWeight: 700,
                cursor: pushLadend ? "not-allowed" : "pointer",
                background: pushAktiv ? "#fff" : accentDark,
                color: pushAktiv ? danger : "#fff",
              }}
            >
              {pushLadend ? "Einen Moment..." : pushAktiv ? "Erinnerungen deaktivieren" : "Erinnerungen aktivieren"}
            </button>
            {pushFehler && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{pushFehler}</div>}
            {pushAktiv && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={handleTestSenden}
                  style={{ width: "100%", padding: "11px 16px", borderRadius: 12, border: `1px solid ${accentDark}`, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "#fff", color: accentDark }}
                >
                  Test-Erinnerung senden
                </button>
                {testMsg && <div style={{ fontSize: 12, color: textMuted, marginTop: 8 }}>{testMsg}</div>}
              </div>
            )}
          </>
        )}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Datenschutz & Sicherheit</div>
      <Card style={{ marginBottom: 14 }}>
        {DATENSCHUTZ.map((item) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
            <span style={{ color: success, fontWeight: 700 }}>✓</span>
            <span style={{ fontSize: 13 }}>{item}</span>
          </div>
        ))}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Zukünftige Erweiterungen</div>
      <Card style={{ marginBottom: 14 }}>
        {ERWEITERUNGEN.map((item) => (
          <div key={item} style={{ fontSize: 13, padding: "5px 0", color: textMuted }}>
            • {item}
          </div>
        ))}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Konto</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>Angemeldet als {user?.email}</div>
        <button
          onClick={signOut}
          style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", background: "#FDE9EC", color: danger }}
        >
          Abmelden
        </button>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Zum Testen</div>
      <Card>
        <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>
          Setzt diesen Account zurück in den Erstanmelde-Zustand — nützlich, um die Willkommens-Seiten und den
          Einrichtungs-Assistenten wiederholt mit demselben Konto durchzugehen.
        </div>
        <button
          onClick={handleResetOnboarding}
          style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: `1px solid ${accentDark}`, fontSize: 14, fontWeight: 700, cursor: "pointer", background: "#fff", color: accentDark }}
        >
          Onboarding erneut durchlaufen
        </button>
        {resetMsg && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{resetMsg}</div>}
      </Card>
    </>
  );
}
