import React, { useRef, useState } from "react";
import { Shell, Card, PrimaryButton, TextInput } from "../../ui/primitives";
import { accentDark, cardBorder, danger, textMain, textMuted } from "../../ui/theme";
import CoachOrb from "../../ui/CoachOrb";
import { MikrofonIcon, StopIcon } from "../../ui/MikrofonIcons";
import { getCoachName } from "../../utils/coachStorage";
import { spracherkennungVerfuegbar, starteSprachErkennung } from "../../utils/speech";
import { ZIELE } from "../../constants";
import { useAppData } from "../../context/AppDataContext";
import { AIService } from "../../services/aiService";

// Phase 2 der Coach-Begleitung (Gegenstück zu OnboardingCoachGuide.jsx,
// Phase 1): statt Feld für Feld abzufragen, erzählt die Person frei und in
// beliebiger Reihenfolge — der Coach fragt nur nach, was noch fehlt. Am
// Ende ordnet AIService.onboardingAusChat() das Gesagte den Feldern zu,
// gespeichert wird über dieselben Funktionen wie überall sonst
// (localStorage user_name, toggleZiel, setPersonal) — keine doppelte
// Speicherlogik.
function systemPrompt() {
  return `Du hilfst der Person beim Einrichten ihres Profils in einer bestehenden App. Du brauchst folgende Angaben, falls noch nicht genannt: Name, Ziele (aus: ${ZIELE.join(
    ", "
  )}), Geschlecht, Geburtsdatum, Größe in cm, aktuelles Gewicht in kg. Lass die Person frei erzählen, in beliebiger Reihenfolge, auch mehrere Angaben auf einmal — frag nur nach dem, was noch fehlt, nicht der Reihe nach jedes Feld einzeln ab. Wenn alles beisammen ist, fasse kurz zusammen und sag ihr, dass sie unten auf "Fertig" tippen kann. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.`;
}

export default function OnboardingCoachFreitext({ onFertig }) {
  const { toggleZiel, ziele, setPersonal } = useAppData();
  const [verlauf, setVerlauf] = useState([]);
  const [eingabe, setEingabe] = useState("");
  const [laden, setLaden] = useState(false);
  const [uebernehmenLaden, setUebernehmenLaden] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [streamText, setStreamText] = useState("");
  const [hoert, setHoert] = useState(false);
  const stopErkennungRef = useRef(null);
  const coachName = getCoachName();

  const einleitung = `Hi, ich bin ${coachName}! Erzähl mir einfach frei von dir — wie du heißt, was deine Ziele sind, und etwas zu dir (Geschlecht, Geburtsdatum, Größe, Gewicht). Du musst nicht alles auf einmal sagen.`;

  const mikrofonUmschalten = () => {
    if (hoert) {
      stopErkennungRef.current?.();
      setHoert(false);
      return;
    }
    setHoert(true);
    stopErkennungRef.current = starteSprachErkennung({
      onErgebnis: (text) => setEingabe((prev) => (prev ? `${prev} ${text}` : text)),
      onEnde: () => setHoert(false),
      onFehler: () => setHoert(false),
    });
  };

  const senden = async (text) => {
    const nachricht = (text ?? eingabe).trim();
    if (!nachricht || laden) return;
    const neuerVerlauf = [...verlauf, { rolle: "nutzer", text: nachricht }];
    setVerlauf(neuerVerlauf);
    setEingabe("");
    setLaden(true);
    setFehler(null);
    setStreamText("");
    try {
      const antwort = await AIService.coachChatStreamend({
        systemPrompt: systemPrompt(),
        verlauf: neuerVerlauf,
        coachName,
        onTeilantwort: setStreamText,
      });
      setVerlauf((prev) => [...prev, { rolle: "coach", text: antwort }]);
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLaden(false);
      setStreamText("");
    }
  };

  const fertig = async () => {
    setUebernehmenLaden(true);
    setFehler(null);
    try {
      const daten = await AIService.onboardingAusChat({ verlauf, coachName, zieleOptionen: ZIELE });
      const name = (daten.name || "").trim();
      if (name) {
        try {
          localStorage.setItem("user_name", name);
        } catch {
          // Browser-Storage nicht verfügbar — Name gilt dann nur für diese Sitzung.
        }
      }
      (daten.ziele || []).forEach((z) => {
        if (ZIELE.includes(z) && !ziele.includes(z)) toggleZiel(z);
      });
      if (daten.geschlecht) setPersonal("geschlecht", daten.geschlecht);
      if (daten.geburtsdatum) setPersonal("geburtsdatum", daten.geburtsdatum);
      if (daten.groesse) setPersonal("groesse", daten.groesse);
      if (daten.gewichtStart) setPersonal("gewichtStart", daten.gewichtStart);
      onFertig();
    } catch (err) {
      setFehler(err.message || "Übernehmen fehlgeschlagen. Bitte nochmal versuchen.");
    } finally {
      setUebernehmenLaden(false);
    }
  };

  const letzteCoachNachricht = [...verlauf].reverse().find((n) => n.rolle === "coach");
  const letzteNutzerNachricht = [...verlauf].reverse().find((n) => n.rolle === "nutzer");
  const grosseAntwort = laden ? streamText || `${coachName} überlegt…` : letzteCoachNachricht?.text || einleitung;

  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, marginTop: 32, marginBottom: 24 }}>
        <CoachOrb zustand={hoert ? "hoert" : laden ? (streamText ? "spricht" : "denkt") : "ruhe"} size={72} />
        <div style={{ fontSize: 12, color: textMuted, fontWeight: 700 }}>{coachName} · Frei erzählen</div>
        {letzteNutzerNachricht && !laden && (
          <div style={{ fontSize: 12.5, color: textMuted, fontStyle: "italic", maxWidth: "90%" }}>„{letzteNutzerNachricht.text}"</div>
        )}
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5, maxWidth: "90%", color: textMain }}>{grosseAntwort}</div>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {spracherkennungVerfuegbar() && (
            <button
              type="button"
              onClick={mikrofonUmschalten}
              title={hoert ? "Aufnahme stoppen" : "Sprechen statt tippen"}
              style={{
                width: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                border: `1px solid ${hoert ? danger : cardBorder}`,
                background: hoert ? "#FDE9EC" : "#fff",
                color: hoert ? danger : accentDark,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {hoert ? <StopIcon /> : <MikrofonIcon />}
            </button>
          )}
          <div style={{ flex: 1 }}>
            <TextInput value={eingabe} onChange={setEingabe} placeholder="Erzähl frei drauflos…" onKeyPress={(e) => e.key === "Enter" && senden()} />
          </div>
          <button
            type="button"
            onClick={() => senden()}
            disabled={laden || !eingabe.trim()}
            style={{
              padding: "0 16px",
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
      </Card>

      {fehler && <div style={{ fontSize: 12, color: danger, marginBottom: 12, textAlign: "center" }}>{fehler}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={fertig} disabled={uebernehmenLaden || verlauf.length === 0}>
          {uebernehmenLaden ? "Wird übernommen…" : "Fertig, Daten übernehmen"}
        </PrimaryButton>
      </div>
    </Shell>
  );
}
