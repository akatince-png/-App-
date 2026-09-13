import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { PrimaryButton } from "./primitives";
import { MikrofonIcon, StopIcon } from "./MikrofonIcons";
import { cardBorder, textMain, textMuted, danger, accentDark, accentSoft } from "./theme";
import { spracherkennungVerfuegbar, starteSprachErkennung } from "../utils/speech";
import { getCoachName } from "../utils/coachStorage";
import { AIService } from "../services/aiService";
import { tagebuchEintragSpeichern } from "../utils/tagebuchStorage";

// Tagebuch (13.09., Nutzerinnen-Vorgabe): einfaches Fenster mit
// Diktierfunktion + geräteeigener Rechtschreibhilfe (spellCheck) und
// optional Aka zum sprachlichen Überarbeiten. WICHTIG (Datenschutz,
// wörtliche Vorgabe): "man diese Daten nur auf seinem Handy abspeichern
// kann... und nicht auch auf irgendeinem anderen Speicher" — der Text
// selbst geht deshalb NIE über useAppData()/Supabase, sondern nur über
// tagebuchStorage.js (localStorage). Der einzige Moment, in dem der Text
// das Gerät kurz verlässt, ist ein aktiv angetippter "Mit Aka
// überarbeiten"-Knopf — auch dessen Ergebnis wird nur als Vorschlag
// angezeigt, nie automatisch gespeichert.
//
// Nachbesserung (13.09., Nutzerinnen-Vorgabe): "wenn ich etwas
// abgespeichert habe, will ich das nächste Mal, wenn ich das Feld Tagebuch
// aufrufe, nicht unten sehen, was ich zuletzt abgespeichert hatte... im
// Archivbereich einen Button, wo Tagebuch steht... als PDF herunterladen."
// Dieses Fenster ist deshalb jetzt NUR noch zum Schreiben da — keine
// Liste bisheriger Einträge mehr. Nachlesen/PDF-Export leben stattdessen
// im neuen Archiv-Reiter "Tagebuch" (siehe TagebuchTab.jsx), zu dem der
// "Zum Tagebuch-Archiv"-Knopf nach dem Speichern direkt springt.

// Datumszeile oben auf der "Seite" (Nutzerinnen-Vorgabe, 13.09.: "soll
// natürlich oben dann das aktuelle Datum und die Uhrzeit stehen... so wie
// es halt in einem Tagebuch wäre") — voller Wochentag/Datum wie auf einer
// handschriftlichen Tagebuchseite, nicht die knappe "Mi, 13.09."-Kurzform
// von fmtDate() (dates.js), die anderswo in der App für Listenzeilen reicht.
function kopfdatumFormatieren(d) {
  const datum = d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const uhrzeit = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return `${datum}, ${uhrzeit} Uhr`;
}

export default function TagebuchModal({ onClose, onOpenArchiv }) {
  const coachName = getCoachName();
  const [text, setText] = useState("");
  const [hoert, setHoert] = useState(false);
  const [ueberarbeitenLaden, setUeberarbeitenLaden] = useState(false);
  const [vorschau, setVorschau] = useState(null);
  const [speichern, setSpeichern] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [gespeichertHinweis, setGespeichertHinweis] = useState(false);
  const [jetzt, setJetzt] = useState(() => new Date());
  const stopErkennungRef = useRef(null);

  useEffect(() => () => stopErkennungRef.current?.(), []);

  // Kopfzeile tickt mit, solange das Fenster offen ist (Minutenauflösung
  // reicht, siehe kopfdatumFormatieren) — beim tatsächlichen Speichern
  // zählt ohnehin der echte Zeitpunkt aus tagebuchStorage.js, nicht dieser
  // Anzeigewert.
  useEffect(() => {
    const intervall = setInterval(() => setJetzt(new Date()), 30000);
    return () => clearInterval(intervall);
  }, []);

  const schliessen = () => {
    stopErkennungRef.current?.();
    onClose();
  };

  const mikrofonUmschalten = () => {
    if (hoert) {
      stopErkennungRef.current?.();
      setHoert(false);
      return;
    }
    setFehler(null);
    setHoert(true);
    stopErkennungRef.current = starteSprachErkennung({
      onErgebnis: (stueck) => setText((prev) => (prev ? `${prev} ${stueck}` : stueck)),
      onEnde: () => setHoert(false),
      onFehler: (msg) => {
        setFehler(msg);
        setHoert(false);
      },
    });
  };

  const ueberarbeiten = async () => {
    if (!text.trim() || ueberarbeitenLaden) return;
    setUeberarbeitenLaden(true);
    setFehler(null);
    try {
      const ergebnis = await AIService.tagebuchUeberarbeiten({ text: text.trim() });
      setVorschau(ergebnis);
    } catch (err) {
      setFehler(err.message || "Konnte nicht überarbeitet werden. Bitte nochmal versuchen.");
    } finally {
      setUeberarbeitenLaden(false);
    }
  };

  const eintragSpeichern = () => {
    const inhalt = text.trim();
    if (!inhalt || speichern) return;
    setSpeichern(true);
    setFehler(null);
    const result = tagebuchEintragSpeichern(inhalt);
    setSpeichern(false);
    if (!result.ok) {
      setFehler(result.error);
      return;
    }
    setText("");
    setVorschau(null);
    setGespeichertHinweis(true);
  };

  return (
    <div
      onClick={schliessen}
      style={{ position: "fixed", inset: 0, background: "rgba(21, 24, 26, 0.55)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          maxHeight: "85vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "22px 22px 0 0",
          padding: "18px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="book" size={20} color={accentDark} />
            <div style={{ fontSize: 16, fontWeight: 800, color: textMain }}>Tagebuch</div>
          </div>
          <button type="button" onClick={schliessen} style={{ border: "none", background: "transparent", fontSize: 20, color: textMuted, cursor: "pointer", padding: 4 }}>
            ×
          </button>
        </div>

        <div style={{ fontSize: 11.5, color: accentDark, background: accentSoft, borderRadius: 10, padding: "6px 10px", marginBottom: 12 }}>
          🔒 Wird nur auf diesem Gerät gespeichert, nie in der Cloud.
        </div>

        {gespeichertHinweis ? (
          // Nach dem Speichern (Nutzerinnen-Vorgabe, 13.09.): keine Liste
          // mehr hier im Schreibfenster — stattdessen direkt der Weg zum
          // neuen Archiv-Reiter, wo die Seite zum Nachlesen/als PDF steht.
          <div style={{ textAlign: "center", padding: "24px 8px" }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: textMain, marginBottom: 4 }}>Seite gespeichert</div>
            <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 18 }}>Nur auf diesem Gerät — zu finden im Archiv unter „Tagebuch".</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {onOpenArchiv && (
                <PrimaryButton
                  onClick={() => {
                    onClose();
                    onOpenArchiv();
                  }}
                >
                  Zum Tagebuch-Archiv
                </PrimaryButton>
              )}
              <button
                type="button"
                onClick={() => setGespeichertHinweis(false)}
                style={{ border: "none", background: "transparent", color: accentDark, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 8 }}
              >
                Noch eine Seite schreiben
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                fontSize: 12.5,
                color: textMuted,
                marginBottom: 8,
                paddingBottom: 8,
                borderBottom: `1px solid ${cardBorder}`,
              }}
            >
              {kopfdatumFormatieren(jetzt)}
            </div>

            {/* Kein maxLength (Nutzerinnen-Vorgabe, 13.09.: "Zeichen sollen
                unbegrenzt sein") — weder hier noch beim Speichern
                (tagebuchStorage.js) oder bei der Aka-Überarbeitung
                (aiService.js) gibt es eine Längenbeschränkung. */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Schreib frei drauflos, oder tippe auf das Mikrofon…"
              spellCheck="true"
              lang="de"
              rows={7}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                borderRadius: 14,
                border: `1px solid ${cardBorder}`,
                background: "#FFFDF8",
                color: textMain,
                fontSize: 14.5,
                lineHeight: 1.6,
                fontFamily: "Georgia, 'Times New Roman', serif",
                outline: "none",
                resize: "vertical",
              }}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              {spracherkennungVerfuegbar() && (
                <button
                  type="button"
                  onClick={mikrofonUmschalten}
                  title={hoert ? "Aufnahme stoppen" : "Diktieren"}
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
              <button
                type="button"
                onClick={ueberarbeiten}
                disabled={!text.trim() || ueberarbeitenLaden}
                style={{
                  border: "none",
                  background: "transparent",
                  color: !text.trim() || ueberarbeitenLaden ? textMuted : accentDark,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: !text.trim() || ueberarbeitenLaden ? "not-allowed" : "pointer",
                  padding: "8px 0",
                }}
              >
                {ueberarbeitenLaden ? `${coachName} überarbeitet…` : `Mit ${coachName} überarbeiten`}
              </button>
            </div>

            {vorschau && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: `1px solid ${accentSoft}`, background: accentSoft }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: accentDark, marginBottom: 6 }}>Vorschlag von {coachName} — noch nicht gespeichert:</div>
                <div style={{ fontSize: 13.5, color: textMain, lineHeight: 1.55, whiteSpace: "pre-wrap", marginBottom: 10 }}>{vorschau}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setText(vorschau);
                      setVorschau(null);
                    }}
                    style={{ border: "none", borderRadius: 10, background: accentDark, color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", cursor: "pointer" }}
                  >
                    Übernehmen
                  </button>
                  <button
                    type="button"
                    onClick={() => setVorschau(null)}
                    style={{ border: "none", background: "transparent", color: textMuted, fontWeight: 700, fontSize: 12.5, padding: "8px 6px", cursor: "pointer" }}
                  >
                    Verwerfen
                  </button>
                </div>
              </div>
            )}

            {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{fehler}</div>}

            <div style={{ marginTop: 14 }}>
              <PrimaryButton onClick={eintragSpeichern} disabled={!text.trim() || speichern}>
                {speichern ? "Speichert…" : "Eintrag speichern"}
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
