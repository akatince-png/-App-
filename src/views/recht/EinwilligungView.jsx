import React, { useState } from "react";
import { Shell, Card, PrimaryButton } from "../../ui/primitives";
import { danger, textMuted } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";
import { DATENSCHUTZ } from "../../utils/rechtstexte";
import { RechtstextInhalt } from "./RechtstextView";

// Einwilligung beim ersten Start (28.09., Apple + DSGVO Art. 9):
// ① Datenschutz/Gesundheitsdaten – Pflicht, ohne geht es nicht weiter.
// ② KI-Funktionen – freiwillig, jederzeit unter Mehr → Datenschutz änderbar.
export default function EinwilligungView({ onAbmelden }) {
  const { einwilligungSetzen } = useAppData();
  const [datenschutz, setDatenschutz] = useState(false);
  const [ki, setKi] = useState(false);
  const [zeigeText, setZeigeText] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [speichert, setSpeichert] = useState(false);

  const weiter = async () => {
    setSpeichert(true);
    setFehler(null);
    const r = await einwilligungSetzen({ datenschutz: true, ki });
    setSpeichert(false);
    if (!r?.ok) setFehler(r?.error || "Speichern hat nicht geklappt. Bitte nochmal versuchen.");
  };

  const box = { display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.5, cursor: "pointer" };
  return (
    <Shell>
      <div data-einwilligung style={{ paddingTop: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Bevor es losgeht</div>
        <div style={{ fontSize: 13.5, color: textMuted, lineHeight: 1.5, marginBottom: 14 }}>
          AKA speichert, was du einträgst – auch Angaben zu deiner Gesundheit. Dafür brauchen wir einmal dein Okay.
        </div>

        <Card style={{ marginBottom: 12 }}>
          <label style={box}>
            <input type="checkbox" checked={datenschutz} onChange={(e) => setDatenschutz(e.target.checked)} style={{ marginTop: 4, width: 20, height: 20 }} data-einwilligung-datenschutz />
            <span>
              <b>Ich willige ein</b>, dass AKA meine Angaben zu Gesundheit und Alltag (z. B. Medikation, Schlaf, Stimmung, Training) speichert, damit die App und mein Coach mich unterstützen können. Ich habe die{" "}
              <button type="button" onClick={() => setZeigeText((x) => !x)} style={{ border: "none", background: "none", padding: 0, color: "#2D6FD6", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" }}>
                Datenschutzerklärung
              </button>{" "}
              gelesen. Widerruf jederzeit möglich, indem ich mein Konto lösche. <span style={{ color: textMuted }}>(Pflicht)</span>
            </span>
          </label>
          {zeigeText && (
            <div style={{ maxHeight: 320, overflowY: "auto", marginTop: 12, borderTop: "1px solid #EAEAE5", paddingTop: 10 }} data-einwilligung-text>
              <RechtstextInhalt abschnitte={DATENSCHUTZ} />
            </div>
          )}
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <label style={box}>
            <input type="checkbox" checked={ki} onChange={(e) => setKi(e.target.checked)} style={{ marginTop: 4, width: 20, height: 20 }} data-einwilligung-ki />
            <span>
              <b>KI-Funktionen erlauben</b> <span style={{ color: textMuted }}>(freiwillig)</span>
              <br />
              Für den Aka-Chat, das Lexikon, das Auslesen von Fotos (z. B. Laborwerte, Nährwerttabellen) und die Vorlese-Stimme gehen die dafür nötigen Texte oder Fotos an KI-Dienste von Google (Gemini, Text-to-Speech) und Groq – auch in die USA. Ohne dieses Häkchen funktioniert alles andere ganz normal per Hand. Du kannst es jederzeit unter Mehr → Datenschutz ändern.
            </span>
          </label>
        </Card>

        {fehler && <div style={{ color: danger, fontSize: 13, marginBottom: 10 }}>{fehler}</div>}
        <PrimaryButton onClick={weiter} disabled={!datenschutz || speichert}>
          {speichert ? "Speichere …" : "Weiter"}
        </PrimaryButton>
        {onAbmelden && (
          <button type="button" onClick={onAbmelden} style={{ display: "block", margin: "14px auto 30px", border: "none", background: "none", color: textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Abmelden
          </button>
        )}
      </div>
    </Shell>
  );
}
