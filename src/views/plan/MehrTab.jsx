import React from "react";
import { Card } from "../../ui/primitives";
import { danger, success, textMuted } from "../../ui/theme";
import { useAuth } from "../../context/AuthContext";

const DATENSCHUTZ = ["Ende-zu-Ende Verschlüsselung", "DSGVO konform", "Daten gehören dir", "Du entscheidest, was geteilt wird", "Kein Verkauf deiner Daten"];

const ERWEITERUNGEN = [
  "PDF-Export für Arzt / Therapiegespräch",
  "Dunkelmodus & Design-Anpassung",
  "Wearable-Integration (Oura, Whoop)",
  "Siri / Google Assistant Shortcuts",
  "Offline-Modus",
  "Mehr Sprachen",
];

export default function MehrTab() {
  const { signOut, user } = useAuth();

  return (
    <>
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
    </>
  );
}
