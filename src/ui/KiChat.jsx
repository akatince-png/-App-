import React, { useEffect, useRef, useState } from "react";
import { Label, PrimaryButton, TextInput } from "./primitives";
import { accent, accentDark, accentSoft, cardBorder, danger, textMain, textMuted } from "./theme";
import CoachOrb from "./CoachOrb";
import { AIService } from "../services/aiService";
import { useAppData } from "../context/AppDataContext";
import { getCoachName, getVorlesenAktiv, saveVorlesenAktiv } from "../utils/coachStorage";
import { spracherkennungVerfuegbar, sprachausgabeVerfuegbar, sprachausgabeStoppen, sprich, starteSprachErkennung } from "../utils/speech";

// Wie viele Nachrichten aus dem (potenziell über Wochen gewachsenen)
// gespeicherten Verlauf maximal als Kontext an die KI mitgeschickt werden —
// begrenzt Kosten/Tempo. Der volle Verlauf bleibt trotzdem gespeichert und
// im aufklappbaren Verlauf sichtbar, nur die KI-Anfrage selbst wird
// gekappt.
const KI_KONTEXT_LIMIT = 24;

// Wiederverwendbare Chat-Oberfläche für den KI-Coach — echtes Hin-und-Her
// statt nur "einmal fragen, einmal Antwort" (siehe AIService.coachChat()).
// Zwei Phasen: 1) frei mit dem Coach reden/nachjustieren, 2) per eigenem
// Knopf den aktuellen Gesprächsstand strukturiert "übernehmen" (z. B. als
// Trainingsplan). Bewusst getrennt, damit das Modell mitten im Gespräch
// nicht zwischen Fließtext und JSON hin- und herspringen muss.
//
// Trigger + Modal statt dauerhaft sichtbarer Karte: geschlossen zeigt die
// Komponente nur den animierten Coach-Orb als schwebenden Rundknopf; ein
// Tap öffnet den Chat als Bottom-Sheet UND startet direkt die
// Spracherkennung (falls verfügbar), damit man sofort losreden kann statt
// erst noch das Mikrofon suchen zu müssen — Tippen bleibt jederzeit als
// Alternative möglich.
//
// Anzeige bewusst minimal statt als klassisches Chatfenster gehalten (wie
// der Sprachmodus von ChatGPT/Gemini): nur die jeweils aktuelle Frage und
// Antwort stehen groß da, der ältere Verlauf ist standardmäßig eingeklappt.
//
// Persistenz: jede Nachricht wird über coachVerlaufLaden/-Speichern (siehe
// src/data/useCoachVerlauf.js) unter der Kennung `bereich` in Supabase
// gespeichert — einerseits, damit die Nutzerin frühere Gespräche wieder
// einsehen kann, andererseits damit der geladene Verlauf automatisch als
// Gedächtnis in jede neue KI-Anfrage einfließt (der Coach kennt die
// Nutzerin über die Zeit immer besser).
//
// Props:
// - bereich: Kennung für die Persistenz (z. B. "training", "ernaehrung") —
//   ohne diese Angabe läuft der Chat weiter, aber ohne gespeicherten Verlauf
// - systemPrompt: Rollenbeschreibung für den Coach in diesem Kontext
// - einleitung: erste Coach-Nachricht, ohne extra Anfrage angezeigt
// - onUebernehmen: optional, async (verlauf) => Ergebnis-Array — wenn
//   gesetzt, erscheint nach der ersten Antwort ein "Übernehmen"-Knopf
// - uebernehmenLabel: Beschriftung dieses Knopfes
// - renderErgebnis: optional (ergebnis) => Node, für die Erfolgs-Anzeige
export default function KiChat({ bereich, systemPrompt, einleitung, onUebernehmen, uebernehmenLabel = "Übernehmen", renderErgebnis }) {
  const { coachVerlaufLaden, coachNachrichtSpeichern } = useAppData();
  const [offen, setOffen] = useState(false);
  const [verlauf, setVerlauf] = useState([]);
  const [verlaufSichtbar, setVerlaufSichtbar] = useState(false);
  const [eingabe, setEingabe] = useState("");
  const [laden, setLaden] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);
  const [hoert, setHoert] = useState(false);
  const [vorlesenAktiv, setVorlesenAktiv] = useState(() => getVorlesenAktiv());
  const [streamText, setStreamText] = useState("");
  const stopErkennungRef = useRef(null);
  const verlaufGeladenRef = useRef(false);

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
    if (bereich) coachNachrichtSpeichern(bereich, "nutzer", nachricht);
    try {
      const antwort = await AIService.coachChatStreamend({
        systemPrompt,
        verlauf: neuerVerlauf.slice(-KI_KONTEXT_LIMIT),
        coachName: getCoachName(),
        onTeilantwort: setStreamText,
      });
      setVerlauf((prev) => [...prev, { rolle: "coach", text: antwort }]);
      if (bereich) coachNachrichtSpeichern(bereich, "coach", antwort);
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
  const mikrofonStarten = () => {
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

  const mikrofonUmschalten = () => {
    if (hoert) {
      stopErkennungRef.current?.();
      setHoert(false);
      return;
    }
    mikrofonStarten();
  };

  const oeffnen = async () => {
    setOffen(true);
    if (spracherkennungVerfuegbar()) mikrofonStarten();
    if (bereich && !verlaufGeladenRef.current) {
      verlaufGeladenRef.current = true;
      const gespeichert = await coachVerlaufLaden(bereich);
      if (gespeichert.length) setVerlauf(gespeichert);
    }
  };

  const schliessen = () => {
    stopErkennungRef.current?.();
    setHoert(false);
    sprachausgabeStoppen();
    setOffen(false);
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
  const orbZustand = hoert ? "hoert" : laden ? (streamText ? "spricht" : "denkt") : "ruhe";
  const letzteNutzerNachricht = [...verlauf].reverse().find((n) => n.rolle === "nutzer");
  const letzteCoachNachricht = [...verlauf].reverse().find((n) => n.rolle === "coach");
  const grosseAntwort = laden ? streamText || `${getCoachName()} überlegt…` : letzteCoachNachricht?.text || einleitung || "";

  if (!offen) {
    return (
      <button
        type="button"
        className="mp-tap"
        onClick={oeffnen}
        aria-label={`${getCoachName()} fragen`}
        title={`${getCoachName()} fragen`}
        style={{
          position: "fixed",
          bottom: "calc(22px + env(safe-area-inset-bottom, 0px))",
          left: "50%",
          transform: "translateX(-50%)",
          width: 68,
          height: 68,
          borderRadius: "50%",
          border: "none",
          padding: 0,
          cursor: "pointer",
          boxShadow: "0 10px 26px rgba(14, 124, 102, 0.4)",
          zIndex: 40,
        }}
      >
        <CoachOrb zustand="ruhe" size={68} />
      </button>
    );
  }

  return (
    <div
      onClick={schliessen}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(21, 24, 26, 0.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          maxHeight: "88vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "22px 22px 0 0",
          padding: "18px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>{getCoachName()}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sprachausgabeVerfuegbar() && (
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
                {vorlesenAktiv ? "🔊" : "🔈"}
              </button>
            )}
            <button
              type="button"
              onClick={schliessen}
              aria-label="Schließen"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: `1px solid ${cardBorder}`,
                background: "#fff",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Minimale Sprachmodus-Anzeige: nur die aktuelle Frage/Antwort groß,
            statt einer langen Sprechblasen-Liste — der volle Verlauf bleibt
            über den Aufklapp-Link darunter erreichbar. */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12, padding: "10px 4px 16px" }}>
          <CoachOrb zustand={orbZustand} size={76} />
          {letzteNutzerNachricht && !laden && (
            <div style={{ fontSize: 12.5, color: textMuted, fontStyle: "italic", maxWidth: "90%" }}>„{letzteNutzerNachricht.text}"</div>
          )}
          <div style={{ fontSize: 16, lineHeight: 1.6, color: textMain, whiteSpace: "pre-wrap", maxWidth: "95%" }}>{grosseAntwort}</div>
          {!laden && letzteCoachNachricht && sprachausgabeVerfuegbar() && (
            <button
              type="button"
              onClick={() => sprich(letzteCoachNachricht.text)}
              style={{ border: "none", background: "transparent", color: accentDark, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 2 }}
            >
              🔊 Vorlesen
            </button>
          )}
        </div>

        {verlauf.length > 0 && (
          <button
            type="button"
            onClick={() => setVerlaufSichtbar((v) => !v)}
            style={{ display: "block", margin: "0 auto 10px", border: "none", background: "transparent", color: textMuted, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
          >
            {verlaufSichtbar ? "Verlauf ausblenden ▲" : `Bisheriger Verlauf (${verlauf.length}) ▾`}
          </button>
        )}

        {verlaufSichtbar && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12, maxHeight: "40vh", overflowY: "auto" }}>
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
          </div>
        )}

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
      </div>
    </div>
  );
}
