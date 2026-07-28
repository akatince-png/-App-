import React, { useMemo, useRef, useState } from "react";
import { Shell, PrimaryButton } from "../../ui/primitives";
import { accentDark, danger, textMain, textMuted } from "../../ui/theme";
import CoachOrb from "../../ui/CoachOrb";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import { MikrofonIcon, StopIcon } from "../../ui/MikrofonIcons";
import { getCoachName } from "../../utils/coachStorage";
import { spracherkennungVerfuegbar, starteSprachErkennung } from "../../utils/speech";
import { ZIELE } from "../../constants";
import { useAppData } from "../../context/AppDataContext";
import { AIService } from "../../services/aiService";
import { wissensBasisText } from "../../utils/wissensBasis";
import { trackingZusammenfassung } from "../../utils/trackingZusammenfassung";

// Phase 2 der Coach-Begleitung (Gegenstück zu OnboardingCoachGuide.jsx,
// Phase 1): statt Feld für Feld abzufragen, erzählt die Person frei und in
// beliebiger Reihenfolge — der Coach fragt nur nach, was noch fehlt. Am
// Ende ordnet AIService.onboardingAusChat() das Gesagte den Feldern zu; die
// Person sieht das Ergebnis und bestätigt es, bevor irgendetwas gespeichert
// wird (Nutzerinnen-Vorgabe: vor jedem Abspeichern nochmal rübersehen
// lassen) — gespeichert wird dann über dieselben Funktionen wie überall
// sonst (localStorage user_name, toggleZiel, setPersonal).
//
// Bewusst kein Kasten/Card um Mikrofon+Eingabe (wirkte "billig") — Aka
// selbst (großer, zentraler Orb) ist der visuelle Mittelpunkt des
// Bildschirms, die Eingabezeile darunter bleibt schlicht.
function systemPrompt(hintergrundKontext) {
  return `Du hilfst der Person beim Einrichten ihres Profils in einer bestehenden App. Du brauchst folgende Angaben, falls noch nicht genannt: Name, Ziele (aus: ${ZIELE.join(
    ", "
  )}), Geschlecht, Geburtsdatum, Größe in cm, aktuelles Gewicht in kg. Lass die Person frei erzählen, in beliebiger Reihenfolge, auch mehrere Angaben auf einmal — frag nur nach dem, was noch fehlt, nicht der Reihe nach jedes Feld einzeln ab. Gib bei Bedarf kurze, ADHS-gerechte Tipps zur jeweiligen Frage. Wenn alles beisammen ist, fasse kurz zusammen und sag ihr, dass sie unten auf "Fertig" tippen kann. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.\n\n${hintergrundKontext}`;
}

export default function OnboardingCoachFreitext({ onFertig, onBack }) {
  const appData = useAppData();
  const { toggleZiel, ziele, setPersonal } = appData;
  const [verlauf, setVerlauf] = useState([]);
  const [eingabe, setEingabe] = useState("");
  const [laden, setLaden] = useState(false);
  const [uebernehmenLaden, setUebernehmenLaden] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [streamText, setStreamText] = useState("");
  const [hoert, setHoert] = useState(false);
  const [vorschau, setVorschau] = useState(null);
  const stopErkennungRef = useRef(null);
  const coachName = getCoachName();

  // "Background Brain" wie im Rest der App (siehe KiChat.jsx) — Aka kennt
  // hier von Anfang an ADHS-Hintergrundwissen, nicht erst nach Abschluss
  // des Onboardings.
  const hintergrundKontext = useMemo(() => `${wissensBasisText()}\n\n${trackingZusammenfassung(appData)}`, [appData]);

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
        systemPrompt: systemPrompt(hintergrundKontext),
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

  // Erst die Angaben extrahieren und zur Bestätigung anzeigen — gespeichert
  // wird erst, wenn die Person das in fertig() explizit bestätigt.
  const vorschauLaden = async () => {
    setUebernehmenLaden(true);
    setFehler(null);
    try {
      const daten = await AIService.onboardingAusChat({ verlauf, coachName, zieleOptionen: ZIELE });
      setVorschau(daten);
    } catch (err) {
      setFehler(err.message || "Übernehmen fehlgeschlagen. Bitte nochmal versuchen.");
    } finally {
      setUebernehmenLaden(false);
    }
  };

  const fertig = () => {
    const daten = vorschau;
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
  };

  const letzteCoachNachricht = [...verlauf].reverse().find((n) => n.rolle === "coach");
  const letzteNutzerNachricht = [...verlauf].reverse().find((n) => n.rolle === "nutzer");
  const grosseAntwort = laden ? streamText || `${coachName} überlegt…` : letzteCoachNachricht?.text || einleitung;

  if (vorschau) {
    const zeilen = [
      vorschau.name && ["Name", vorschau.name],
      vorschau.ziele?.length && ["Ziele", vorschau.ziele.join(", ")],
      vorschau.geschlecht && ["Geschlecht", vorschau.geschlecht],
      vorschau.geburtsdatum && ["Geburtsdatum", vorschau.geburtsdatum],
      vorschau.groesse && ["Größe", `${vorschau.groesse} cm`],
      vorschau.gewichtStart && ["Gewicht", `${vorschau.gewichtStart} kg`],
    ].filter(Boolean);

    return (
      <Shell>
        <OnboardingNavArrows onBack={() => setVorschau(null)} backLabel="Zurück zum Gespräch" onForward={fertig} forwardLabel="Ja, so eintragen" />
        <FesterOrb zustand="ruhe" />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16, marginTop: 28, marginBottom: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Passt das so?</div>
          <div style={{ fontSize: 13, color: textMuted, maxWidth: "85%" }}>
            Bevor ich das eintrage, schau kurz drüber — du kannst danach jederzeit alles in deinem Profil ändern.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {zeilen.length === 0 && <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>Nichts Konkretes erkannt.</div>}
          {zeilen.map(([label, wert]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 4px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              <span style={{ fontSize: 13, color: textMuted, fontWeight: 700 }}>{label}</span>
              <span style={{ fontSize: 14, color: textMain, fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>{wert}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 130 }}>
          <PrimaryButton onClick={fertig}>Ja, so eintragen</PrimaryButton>
          <button
            type="button"
            onClick={() => setVorschau(null)}
            style={{ border: "none", background: "transparent", color: accentDark, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 8 }}
          >
            Zurück zum Gespräch
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <OnboardingNavArrows
        onBack={onBack}
        backLabel="Zurück"
        onForward={vorschauLaden}
        forwardLabel={uebernehmenLaden ? "Einen Moment…" : "Fertig, Daten übernehmen"}
        forwardDisabled={uebernehmenLaden || verlauf.length === 0}
      />
      <FesterOrb
        zustand={hoert ? "hoert" : laden ? (streamText ? "spricht" : "denkt") : "ruhe"}
        onClick={mikrofonUmschalten}
        title={hoert ? "Aufnahme stoppen" : "Sprechen statt tippen"}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16, marginTop: 28, marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: textMuted, fontWeight: 700 }}>{coachName} · Frei erzählen</div>
        {letzteNutzerNachricht && !laden && (
          <div style={{ fontSize: 12.5, color: textMuted, fontStyle: "italic", maxWidth: "90%" }}>„{letzteNutzerNachricht.text}"</div>
        )}
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5, maxWidth: "90%", color: textMain }}>{grosseAntwort}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        {spracherkennungVerfuegbar() && (
          <button
            type="button"
            onClick={mikrofonUmschalten}
            title={hoert ? "Aufnahme stoppen" : "Sprechen statt tippen"}
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              border: "none",
              background: hoert ? "#FDE9EC" : "rgba(0,0,0,0.05)",
              color: hoert ? danger : accentDark,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {hoert ? <StopIcon /> : <MikrofonIcon />}
          </button>
        )}
        <input
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          placeholder="Erzähl frei drauflos…"
          onKeyDown={(e) => e.key === "Enter" && senden()}
          style={{
            flex: 1,
            border: "none",
            borderBottom: `1.5px solid ${textMuted}55`,
            background: "transparent",
            padding: "8px 2px",
            fontSize: 15,
            color: textMain,
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={() => senden()}
          disabled={laden || !eingabe.trim()}
          style={{
            border: "none",
            background: "transparent",
            color: laden || !eingabe.trim() ? textMuted : accentDark,
            fontWeight: 700,
            fontSize: 14,
            cursor: laden || !eingabe.trim() ? "not-allowed" : "pointer",
            flexShrink: 0,
          }}
        >
          Senden
        </button>
      </div>

      {fehler && <div style={{ fontSize: 12, color: danger, marginBottom: 12, textAlign: "center" }}>{fehler}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 130 }}>
        <PrimaryButton onClick={vorschauLaden} disabled={uebernehmenLaden || verlauf.length === 0}>
          {uebernehmenLaden ? "Einen Moment…" : "Fertig, Daten übernehmen"}
        </PrimaryButton>
      </div>
    </Shell>
  );
}

// Fest positionierter, großer Coach-Orb unten mittig — dieselbe Position
// wie der Coach-Trigger überall sonst in der App (siehe KiChat.jsx),
// nur deutlich größer ("Home-Button auf Steroiden", Nutzerinnen-Vorgabe),
// weil er hier nicht nur ein Trigger, sondern der visuelle Mittelpunkt
// des gesamten Bildschirms ist.
function FesterOrb({ zustand, onClick, title }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "calc(22px + env(safe-area-inset-bottom, 0px))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 40,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        title={title}
        style={{
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: onClick ? "pointer" : "default",
          opacity: onClick ? 1 : 0.4,
          transition: "opacity 150ms ease",
          borderRadius: "50%",
        }}
      >
        <CoachOrb zustand={zustand} size={100} />
      </button>
    </div>
  );
}
