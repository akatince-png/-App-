import React, { useState } from "react";
import { Card, Label, PrimaryButton, TextInput } from "./primitives";
import { accent, accentDark, accentSoft, cardBorder, danger, textMain, textMuted } from "./theme";
import { AIService } from "../services/aiService";
import { getCoachName } from "../utils/coachStorage";

// Wiederverwendbare Chat-Oberfläche für den KI-Coach — echtes Hin-und-Her
// statt nur "einmal fragen, einmal Antwort" (siehe AIService.coachChat()).
// Zwei Phasen: 1) frei mit dem Coach reden/nachjustieren, 2) per eigenem
// Knopf den aktuellen Gesprächsstand strukturiert "übernehmen" (z. B. als
// Trainingsplan). Bewusst getrennt, damit das Modell mitten im Gespräch
// nicht zwischen Fließtext und JSON hin- und herspringen muss.
//
// Props:
// - systemPrompt: Rollenbeschreibung für den Coach in diesem Kontext
// - einleitung: erste Coach-Nachricht, ohne extra Anfrage angezeigt
// - onUebernehmen: optional, async (verlauf) => Ergebnis-Array — wenn
//   gesetzt, erscheint nach der ersten Antwort ein "Übernehmen"-Knopf
// - uebernehmenLabel: Beschriftung dieses Knopfes
// - renderErgebnis: optional (ergebnis) => Node, für die Erfolgs-Anzeige
export default function KiChat({ systemPrompt, einleitung, onUebernehmen, uebernehmenLabel = "Übernehmen", renderErgebnis }) {
  const [verlauf, setVerlauf] = useState([]);
  const [eingabe, setEingabe] = useState("");
  const [laden, setLaden] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);

  const senden = async () => {
    const text = eingabe.trim();
    if (!text || laden) return;
    const neuerVerlauf = [...verlauf, { rolle: "nutzer", text }];
    setVerlauf(neuerVerlauf);
    setEingabe("");
    setErgebnis(null);
    setLaden(true);
    setFehler(null);
    try {
      const antwort = await AIService.coachChat({ systemPrompt, verlauf: neuerVerlauf, coachName: getCoachName() });
      setVerlauf((prev) => [...prev, { rolle: "coach", text: antwort }]);
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLaden(false);
    }
  };

  const uebernehmen = async () => {
    setLaden(true);
    setFehler(null);
    setErgebnis(null);
    try {
      const result = await onUebernehmen(verlauf);
      setErgebnis(result);
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLaden(false);
    }
  };

  const alleNachrichten = einleitung ? [{ rolle: "coach", text: einleitung }, ...verlauf] : verlauf;

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12, maxHeight: 340, overflowY: "auto" }}>
        {alleNachrichten.map((n, i) => (
          <div
            key={i}
            style={{
              alignSelf: n.rolle === "coach" ? "flex-start" : "flex-end",
              maxWidth: "85%",
              padding: "10px 13px",
              borderRadius: 14,
              background: n.rolle === "coach" ? accentSoft : accent,
              color: n.rolle === "coach" ? textMain : "#fff",
              fontSize: 13.5,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {n.text}
          </div>
        ))}
        {laden && <div style={{ fontSize: 12.5, color: textMuted, alignSelf: "flex-start" }}>Frage Ollama…</div>}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <TextInput
            value={eingabe}
            onChange={setEingabe}
            placeholder="Schreib deinem Coach…"
            onKeyPress={(e) => e.key === "Enter" && senden()}
          />
        </div>
        <button
          type="button"
          onClick={senden}
          disabled={laden || !eingabe.trim()}
          style={{
            padding: "0 18px",
            borderRadius: 10,
            border: "none",
            background: accentDark,
            color: "#fff",
            fontWeight: 700,
            cursor: laden || !eingabe.trim() ? "not-allowed" : "pointer",
            opacity: laden || !eingabe.trim() ? 0.6 : 1,
          }}
        >
          Senden
        </button>
      </div>

      {onUebernehmen && verlauf.some((n) => n.rolle === "coach") && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
          <PrimaryButton onClick={uebernehmen} disabled={laden}>
            {laden ? "Wird übernommen…" : uebernehmenLabel}
          </PrimaryButton>
        </div>
      )}

      {ergebnis && (
        <div style={{ marginTop: 12 }}>
          {renderErgebnis ? (
            renderErgebnis(ergebnis)
          ) : (
            <Label>{Array.isArray(ergebnis) ? `${ergebnis.length} Einträge übernommen.` : "Übernommen."}</Label>
          )}
        </div>
      )}
      {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{fehler}</div>}
    </Card>
  );
}
