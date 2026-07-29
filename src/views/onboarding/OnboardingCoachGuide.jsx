import React, { useEffect, useRef, useState } from "react";
import { Shell, Card, PrimaryButton, TextInput, Pill } from "../../ui/primitives";
import { accentDark, danger, textMain, textMuted } from "../../ui/theme";
import CoachOrb from "../../ui/CoachOrb";
import OnboardingNavArrows from "../../ui/OnboardingNavArrows";
import VorlesenToggle from "../../ui/VorlesenToggle";
import { getCoachName, getVorlesenAktiv } from "../../utils/coachStorage";
import { spracherkennungVerfuegbar, sprachausgabeStoppen, sprich, starteSprachErkennung } from "../../utils/speech";
import { ZIELE } from "../../constants";
import { useAppData } from "../../context/AppDataContext";
import { AIService } from "../../services/aiService";

// Schritt-für-Schritt-Begleitung durch den ADHS Coach für die "einfachen"
// Onboarding-Felder (Name, Ziele, persönliche Daten) — deckt die Phasen
// intro/ziele/profil in einem durchgehenden geführten Ablauf ab, danach
// geht es normal bei "laborwerte" weiter (siehe OnboardingFlow.jsx).
//
// Dies ist Phase 1 der von der Nutzerin gewünschten Coach-Begleitung:
// Felder werden einzeln nacheinander abgefragt und sofort über dieselben
// Funktionen gespeichert, die auch die manuellen Formulare nutzen
// (toggleZiel, setPersonal) — keine doppelte Speicherlogik. Freies
// Erzählen + automatische Zuordnung zu Feldern (Variante 2 aus dem
// Auftrag) läuft parallel in OnboardingCoachFreitext.jsx.
//
// Die Fragen selbst sind bewusst NICHT KI-generiert (kein sendeAnfrage()
// hier) — welches Feld als nächstes drankommt ist fest bekannt, ein
// KI-Zwischenschritt würde in diesem kritischen Ersteinrichtungs-Pfad nur
// Latenz und eine neue Fehlerquelle hinzufügen, ohne echten Nutzen. Die
// gegebene ANTWORT läuft bei Text-/Zahlenfeldern aber durch
// AIService.feldAntwortInterpretieren() (z. B. "ich wiege ungefähr 75
// Kilo" → "75") — die Person bestätigt das Ergebnis, bevor es gespeichert
// wird (Nutzerinnen-Vorgabe: vor jedem Abspeichern nochmal rübersehen).
const SCHRITTE = [
  { key: "name", frage: "Wie heißt du?", typ: "text", placeholder: "z. B. Anton Kaufmann" },
  { key: "ziele", frage: "Was sind deine Ziele? Du kannst mehrere auswählen.", typ: "pillMulti", optionen: ZIELE },
  { key: "geschlecht", frage: "Welches Geschlecht hast du?", typ: "pillSingle", optionen: ["Weiblich", "Männlich", "Divers"] },
  { key: "geburtsdatum", frage: "Wann ist dein Geburtsdatum?", typ: "date" },
  { key: "groesse", frage: "Wie groß bist du, in cm?", typ: "number", placeholder: "175" },
  { key: "gewichtStart", frage: "Was ist dein aktuelles Gewicht, in kg?", typ: "number", placeholder: "85" },
];

// Feldtypen, bei denen eine freie Antwort erst noch von der KI zum reinen
// Feldwert bereinigt und bestätigt wird, statt sie 1:1 zu übernehmen.
const INTERPRETATION_TYPEN = ["text", "number"];

export default function OnboardingCoachGuide({ onFertig, onBack }) {
  const { toggleZiel, ziele, setPersonal } = useAppData();
  const [index, setIndex] = useState(0);
  const [wert, setWert] = useState("");
  const [zieleAuswahl, setZieleAuswahl] = useState([]);
  const [hoert, setHoert] = useState(false);
  const [interpretiert, setInterpretiert] = useState(null);
  const [interpretationLaden, setInterpretationLaden] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [vorlesenAktiv, setVorlesenAktiv] = useState(() => getVorlesenAktiv());
  const stopErkennungRef = useRef(null);

  const schritt = SCHRITTE[index];
  const istLetzter = index === SCHRITTE.length - 1;
  const coachName = getCoachName();

  // Für Text-/Zahlenfelder das Mikrofon direkt starten (ohne erneutes
  // Antippen) — die Wahl "Frage für Frage" auf dem vorherigen Bildschirm
  // gilt als durchgehende Zustimmung fürs ganze Gespräch, nicht nur für die
  // erste Frage.
  const mikrofonStarten = () => {
    setHoert(true);
    stopErkennungRef.current = starteSprachErkennung({
      onErgebnis: (text) => setWert((prev) => (prev ? `${prev} ${text}` : text)),
      onEnde: () => setHoert(false),
      onFehler: () => setHoert(false),
    });
  };

  // Jede neue Frage vorlesen, sobald sie erscheint — inkl. der ersten beim
  // Öffnen des Bildschirms — und direkt danach automatisch zuhören, statt
  // darauf zu warten, dass extra angetippt wird. Bei Feldtypen ohne
  // Spracheingabe (Pillen/Datum) wird nur gefragt, nicht zugehört. Beim
  // Wechsel zur Bestätigungs-Ansicht (interpretiert !== null) wird bewusst
  // nichts vorgelesen, das steht schon direkt lesbar in der Karte.
  useEffect(() => {
    if (interpretiert !== null) return;
    const kannHoeren = INTERPRETATION_TYPEN.includes(schritt.typ) && spracherkennungVerfuegbar();
    if (vorlesenAktiv) {
      sprich(schritt.frage, { onEnde: () => kannHoeren && mikrofonStarten() });
    } else if (kannHoeren) {
      mikrofonStarten();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schritt, interpretiert]);

  useEffect(() => () => sprachausgabeStoppen(), []);

  const orbUmschalten = () => {
    if (schritt.typ === "pillMulti" || schritt.typ === "pillSingle" || schritt.typ === "date") return;
    if (hoert) {
      stopErkennungRef.current?.();
      setHoert(false);
      return;
    }
    sprachausgabeStoppen();
    mikrofonStarten();
  };

  const naechsterSchritt = () => {
    stopErkennungRef.current?.();
    setHoert(false);
    setWert("");
    setInterpretiert(null);
    setFehler(null);
    if (istLetzter) {
      onFertig();
      return;
    }
    setIndex((i) => i + 1);
  };

  const vorherigerSchritt = () => {
    stopErkennungRef.current?.();
    setHoert(false);
    setWert("");
    setInterpretiert(null);
    setFehler(null);
    setIndex((i) => Math.max(0, i - 1));
  };

  const wertSpeichern = (finalerWert) => {
    if (schritt.typ === "pillMulti") {
      zieleAuswahl.forEach((z) => {
        if (!ziele.includes(z)) toggleZiel(z);
      });
    } else if (schritt.key === "name") {
      const name = finalerWert.trim();
      if (name) {
        try {
          localStorage.setItem("user_name", name);
        } catch {
          // Browser-Storage nicht verfügbar — Name gilt dann nur für diese Sitzung.
        }
      }
    } else if (finalerWert.trim()) {
      setPersonal(schritt.key, finalerWert.trim());
    }
    naechsterSchritt();
  };

  // Bei Text-/Zahlenfeldern erst die KI die Antwort bereinigen lassen und
  // der Person zur Bestätigung zeigen, statt direkt zu speichern.
  const antwortAbschicken = async () => {
    if (!INTERPRETATION_TYPEN.includes(schritt.typ)) {
      wertSpeichern(wert);
      return;
    }
    setInterpretationLaden(true);
    setFehler(null);
    try {
      const { wert: bereinigt } = await AIService.feldAntwortInterpretieren({
        frage: schritt.frage,
        antwort: wert,
        feldTyp: schritt.typ,
        coachName,
      });
      setInterpretiert(bereinigt);
    } catch (err) {
      setFehler(err.message || "Antwort konnte nicht verarbeitet werden.");
      setInterpretiert(wert);
    } finally {
      setInterpretationLaden(false);
    }
  };

  const bestaetigen = () => wertSpeichern(interpretiert);
  const korrigieren = () => {
    setInterpretiert(null);
    setFehler(null);
  };

  const kannWeiter = schritt.typ === "pillMulti" ? true : schritt.typ === "pillSingle" ? !!wert : !!wert.trim();
  const orbZustand = hoert ? "hoert" : interpretationLaden ? "denkt" : "ruhe";
  const orbKlickbar = INTERPRETATION_TYPEN.includes(schritt.typ) && spracherkennungVerfuegbar();
  const zeigeOrb = interpretiert === null;

  return (
    <Shell>
      <OnboardingNavArrows
        onBack={interpretiert !== null ? korrigieren : index === 0 ? onBack : vorherigerSchritt}
        backLabel="Zurück"
        onForward={interpretiert !== null ? bestaetigen : antwortAbschicken}
        forwardLabel={
          interpretiert !== null
            ? istLetzter
              ? "Ja, fertig"
              : "Ja, passt"
            : interpretationLaden
            ? "Einen Moment…"
            : istLetzter && !INTERPRETATION_TYPEN.includes(schritt.typ)
            ? "Fertig"
            : "Weiter"
        }
        forwardDisabled={interpretiert === null && (!kannWeiter || interpretationLaden)}
      />
      {/* Fester Coach-Orb unten mittig — exakt dieselbe Position/Größe wie
          der Coach-Trigger überall sonst in der App (siehe KiChat.jsx),
          statt oben im Inhalt zu stehen (Nutzerinnen-Feedback: einheitlich
          wie auf der Startseite). */}
      {zeigeOrb && (
        <div
          style={{
            position: "fixed",
            bottom: "calc(22px + env(safe-area-inset-bottom, 0px))",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          {orbKlickbar && (
            <div style={{ fontSize: 11.5, color: textMuted, fontWeight: 700, background: "#fff", padding: "3px 12px", borderRadius: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              {hoert ? "Ich höre zu…" : "Tippen zum Sprechen"}
            </div>
          )}
          <button
            type="button"
            onClick={orbUmschalten}
            disabled={!orbKlickbar}
            title={orbKlickbar ? (hoert ? "Aufnahme stoppen" : "Sprechen statt tippen") : "Für dieses Feld bitte auswählen/eingeben"}
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              border: "none",
              padding: 0,
              cursor: orbKlickbar ? "pointer" : "default",
              opacity: orbKlickbar ? 1 : 0.4,
              boxShadow: orbKlickbar ? "0 10px 26px rgba(14, 124, 102, 0.4)" : "none",
              transition: "opacity 150ms ease",
            }}
          >
            <CoachOrb zustand={orbZustand} size={68} />
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, marginTop: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 12, color: textMuted, fontWeight: 700 }}>
            {coachName} · Schritt {index + 1} von {SCHRITTE.length}
          </div>
          <VorlesenToggle aktiv={vorlesenAktiv} onChange={setVorlesenAktiv} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, maxWidth: "90%" }}>{schritt.frage}</div>
      </div>

      {interpretiert !== null ? (
        <>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: textMuted, marginBottom: 6 }}>Du hast gesagt:</div>
            <div style={{ fontSize: 13, color: textMuted, fontStyle: "italic", marginBottom: 14 }}>„{wert}"</div>
            <div style={{ fontSize: 12, color: textMuted, marginBottom: 6 }}>Ich trage ein:</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: textMain }}>{interpretiert}</div>
            {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{fehler}</div>}
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PrimaryButton onClick={bestaetigen}>{istLetzter ? "Ja, fertig" : "Ja, passt"}</PrimaryButton>
            <button
              type="button"
              onClick={korrigieren}
              style={{ border: "none", background: "transparent", color: accentDark, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 8 }}
            >
              Korrigieren
            </button>
          </div>
        </>
      ) : (
        <>
          <Card style={{ marginBottom: 20 }}>
            {schritt.typ === "pillMulti" && (
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {schritt.optionen.map((opt) => (
                  <Pill
                    key={opt}
                    label={opt}
                    selected={zieleAuswahl.includes(opt)}
                    onClick={() => setZieleAuswahl((prev) => (prev.includes(opt) ? prev.filter((z) => z !== opt) : [...prev, opt]))}
                  />
                ))}
              </div>
            )}

            {schritt.typ === "pillSingle" && (
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {schritt.optionen.map((opt) => (
                  <Pill key={opt} label={opt} selected={wert === opt} onClick={() => setWert(opt)} />
                ))}
              </div>
            )}

            {(schritt.typ === "text" || schritt.typ === "number" || schritt.typ === "date") && (
              <TextInput
                type={schritt.typ === "date" ? "date" : schritt.typ === "number" ? "number" : "text"}
                value={wert}
                onChange={setWert}
                placeholder={schritt.placeholder}
                onKeyPress={(e) => e.key === "Enter" && kannWeiter && !interpretationLaden && antwortAbschicken()}
              />
            )}
          </Card>

          {/* Platz für den fest positionierten Orb unten, damit er die
              Buttons nicht überdeckt. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 110 }}>
            <PrimaryButton onClick={antwortAbschicken} disabled={!kannWeiter || interpretationLaden}>
              {interpretationLaden ? "Einen Moment…" : istLetzter && !INTERPRETATION_TYPEN.includes(schritt.typ) ? "Fertig" : "Weiter"}
            </PrimaryButton>
            <button
              type="button"
              onClick={naechsterSchritt}
              style={{ border: "none", background: "transparent", color: textMuted, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 8 }}
            >
              Diese Frage überspringen
            </button>
          </div>
        </>
      )}
    </Shell>
  );
}
