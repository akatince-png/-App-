import React, { useRef, useState } from "react";
import { Shell, Card, PrimaryButton, TextInput, Pill } from "../../ui/primitives";
import { accentDark, cardBorder, textMuted } from "../../ui/theme";
import CoachOrb from "../../ui/CoachOrb";
import { MikrofonIcon, StopIcon } from "../../ui/MikrofonIcons";
import { getCoachName } from "../../utils/coachStorage";
import { spracherkennungVerfuegbar, starteSprachErkennung } from "../../utils/speech";
import { ZIELE } from "../../constants";
import { useAppData } from "../../context/AppDataContext";

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
// Auftrag) ist bewusst noch nicht gebaut, siehe UEBERGABEPROTOKOLL.md.
//
// Die Fragen selbst sind bewusst NICHT KI-generiert (kein sendeAnfrage()
// hier) — welches Feld als nächstes drankommt ist fest bekannt, ein
// KI-Zwischenschritt würde in diesem kritischen Ersteinrichtungs-Pfad nur
// Latenz und eine neue Fehlerquelle hinzufügen, ohne echten Nutzen.
const SCHRITTE = [
  { key: "name", frage: "Wie heißt du?", typ: "text", placeholder: "z. B. Anton Kaufmann" },
  { key: "ziele", frage: "Was sind deine Ziele? Du kannst mehrere auswählen.", typ: "pillMulti", optionen: ZIELE },
  { key: "geschlecht", frage: "Welches Geschlecht hast du?", typ: "pillSingle", optionen: ["Weiblich", "Männlich", "Divers"] },
  { key: "geburtsdatum", frage: "Wann ist dein Geburtsdatum?", typ: "date" },
  { key: "groesse", frage: "Wie groß bist du, in cm?", typ: "number", placeholder: "175" },
  { key: "gewichtStart", frage: "Was ist dein aktuelles Gewicht, in kg?", typ: "number", placeholder: "85" },
];

export default function OnboardingCoachGuide({ onFertig }) {
  const { toggleZiel, ziele, setPersonal } = useAppData();
  const [index, setIndex] = useState(0);
  const [wert, setWert] = useState("");
  const [zieleAuswahl, setZieleAuswahl] = useState([]);
  const [hoert, setHoert] = useState(false);
  const stopErkennungRef = useRef(null);

  const schritt = SCHRITTE[index];
  const istLetzter = index === SCHRITTE.length - 1;
  const coachName = getCoachName();

  const mikrofonUmschalten = () => {
    if (hoert) {
      stopErkennungRef.current?.();
      setHoert(false);
      return;
    }
    setHoert(true);
    stopErkennungRef.current = starteSprachErkennung({
      onErgebnis: (text) => setWert((prev) => (prev ? `${prev} ${text}` : text)),
      onEnde: () => setHoert(false),
      onFehler: () => setHoert(false),
    });
  };

  const naechsterSchritt = () => {
    stopErkennungRef.current?.();
    setHoert(false);
    setWert("");
    if (istLetzter) {
      onFertig();
      return;
    }
    setIndex((i) => i + 1);
  };

  const antwortSpeichern = () => {
    if (schritt.typ === "pillMulti") {
      zieleAuswahl.forEach((z) => {
        if (!ziele.includes(z)) toggleZiel(z);
      });
    } else if (schritt.key === "name") {
      const name = wert.trim();
      if (name) {
        try {
          localStorage.setItem("user_name", name);
        } catch {
          // Browser-Storage nicht verfügbar — Name gilt dann nur für diese Sitzung.
        }
      }
    } else if (wert.trim()) {
      setPersonal(schritt.key, wert.trim());
    }
    naechsterSchritt();
  };

  const kannWeiter = schritt.typ === "pillMulti" ? true : schritt.typ === "pillSingle" ? !!wert : !!wert.trim();

  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, marginTop: 32, marginBottom: 24 }}>
        <CoachOrb zustand="ruhe" size={72} />
        <div style={{ fontSize: 12, color: textMuted, fontWeight: 700 }}>
          {coachName} · Schritt {index + 1} von {SCHRITTE.length}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.5, maxWidth: "90%" }}>{schritt.frage}</div>
      </div>

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
          <div style={{ display: "flex", gap: 8 }}>
            {schritt.typ !== "date" && spracherkennungVerfuegbar() && (
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
                  border: `1px solid ${cardBorder}`,
                  background: "#fff",
                  color: accentDark,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {hoert ? <StopIcon /> : <MikrofonIcon />}
              </button>
            )}
            <div style={{ flex: 1 }}>
              <TextInput
                type={schritt.typ === "date" ? "date" : schritt.typ === "number" ? "number" : "text"}
                value={wert}
                onChange={setWert}
                placeholder={schritt.placeholder}
                onKeyPress={(e) => e.key === "Enter" && kannWeiter && antwortSpeichern()}
              />
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={antwortSpeichern} disabled={!kannWeiter}>
          {istLetzter ? "Fertig" : "Weiter"}
        </PrimaryButton>
        <button
          type="button"
          onClick={naechsterSchritt}
          style={{ border: "none", background: "transparent", color: textMuted, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 8 }}
        >
          Diese Frage überspringen
        </button>
      </div>
    </Shell>
  );
}
