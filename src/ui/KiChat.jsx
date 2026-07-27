import React, { useEffect, useRef, useState } from "react";
import { Card, Label, PrimaryButton, TextInput } from "./primitives";
import { accent, accentDark, accentSoft, cardBorder, danger, textMain, textMuted } from "./theme";
import { AIService } from "../services/aiService";
import { getCoachName, getVorlesenAktiv, saveVorlesenAktiv } from "../utils/coachStorage";
import { spracherkennungVerfuegbar, sprachausgabeVerfuegbar, sprachausgabeStoppen, sprich, starteSprachErkennung } from "../utils/speech";

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
  const [hoert, setHoert] = useState(false);
  const [vorlesenAktiv, setVorlesenAktiv] = useState(() => getVorlesenAktiv());
  const [streamText, setStreamText] = useState("");
  const stopErkennungRef = useRef(null);

  // Laufende Sprachausgabe/-erkennung beenden, wenn die Karte verschwindet
  // (z. B. Wechsel auf einen anderen Bildschirm), statt im Hintergrund
  // weiterzureden oder zuzuhören.
  useEffect(() => {
    return () => {
      sprachausgabeStoppen();
      stopErkennungRef.current?.();
    };
  }, []);

  const senden = async (text) => {
    const nachricht = (text ?? eingabe).trim();
    if (!nachricht || laden) return;
    const neuerVerlauf = [...verlauf, { rolle: "nutzer", text: nachricht }];
    setVerlauf(neuerVerlauf);
    setEingabe("");
    setErgebnis(null);
    setLaden(true);
    setFehler(null);
    setStreamText("");
    try {
      const antwort = await AIService.coachChatStreamend({
        systemPrompt,
        verlauf: neuerVerlauf,
        coachName: getCoachName(),
        onTeilantwort: setStreamText,
      });
      setVerlauf((prev) => [...prev, { rolle: "coach", text: antwort }]);
      if (vorlesenAktiv) sprich(antwort);
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLaden(false);
      setStreamText("");
    }
  };

  // Erkannter Text landet nur im Eingabefeld statt automatisch abgesendet
  // zu werden — Spracherkennung verhört sich, und die Nutzerin soll vor dem
  // Senden noch korrigieren können.
  const mikrofonUmschalten = () => {
    if (hoert) {
      stopErkennungRef.current?.();
      setHoert(false);
      return;
    }
    setFehler(null);
    setHoert(true);
    stopErkennungRef.current = starteSprachErkennung({
      onErgebnis: (text) => setEingabe((prev) => (prev ? `${prev} ${text}` : text)),
      onEnde: () => setHoert(false),
      onFehler: (msg) => {
        setFehler(msg);
        setHoert(false);
      },
    });
  };

  const vorlesenUmschalten = () => {
    setVorlesenAktiv((prev) => {
      const next = !prev;
      saveVorlesenAktiv(next);
      if (!next) sprachausgabeStoppen();
      return next;
    });
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
      {sprachausgabeVerfuegbar() && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button
            type="button"
            onClick={vorlesenUmschalten}
            title={vorlesenAktiv ? "Antworten vorlesen: an" : "Antworten vorlesen: aus"}
            style={{
              border: `1px solid ${vorlesenAktiv ? accentDark : cardBorder}`,
              background: vorlesenAktiv ? accentSoft : "#fff",
              color: vorlesenAktiv ? accentDark : textMuted,
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {vorlesenAktiv ? "🔊 Vorlesen an" : "🔈 Vorlesen aus"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12, maxHeight: 340, overflowY: "auto" }}>
        {alleNachrichten.map((n, i) => (
          <div
            key={i}
            style={{
              alignSelf: n.rolle === "coach" ? "flex-start" : "flex-end",
              maxWidth: "85%",
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
            }}
          >
            <div
              style={{
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
            {n.rolle === "coach" && sprachausgabeVerfuegbar() && (
              <button
                type="button"
                onClick={() => sprich(n.text)}
                title="Vorlesen"
                style={{ border: "none", background: "transparent", color: accentDark, fontSize: 15, cursor: "pointer", padding: 2, flexShrink: 0 }}
              >
                🔊
              </button>
            )}
          </div>
        ))}
        {laden &&
          (streamText ? (
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "85%",
                padding: "10px 13px",
                borderRadius: 14,
                background: accentSoft,
                color: textMain,
                fontSize: 13.5,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {streamText}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: textMuted, alignSelf: "flex-start" }}>Frage Ollama…</div>
          ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {spracherkennungVerfuegbar() && (
          <button
            type="button"
            onClick={mikrofonUmschalten}
            title={hoert ? "Aufnahme stoppen" : "Sprechen statt tippen"}
            style={{
              width: 44,
              borderRadius: 10,
              border: `1px solid ${hoert ? danger : cardBorder}`,
              background: hoert ? "#FDE9EC" : "#fff",
              color: hoert ? danger : accentDark,
              fontSize: 16,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {hoert ? "⏹" : "🎤"}
          </button>
        )}
        <div style={{ flex: 1 }}>
          <TextInput
            value={eingabe}
            onChange={setEingabe}
            placeholder={hoert ? "Höre zu…" : "Schreib deinem Coach…"}
            onKeyPress={(e) => e.key === "Enter" && senden()}
          />
        </div>
        <button
          type="button"
          onClick={() => senden()}
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
