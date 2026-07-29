import React, { useEffect, useMemo, useRef, useState } from "react";
import { Label, PrimaryButton, TextInput } from "./primitives";
import { accent, accentDark, accentSoft, cardBorder, danger, textMain, textMuted } from "./theme";
import CoachOrb from "./CoachOrb";
import { AIService } from "../services/aiService";
import { useAppData } from "../context/AppDataContext";
import { getCoachName, getVorlesenAktiv, getKiAktiv } from "../utils/coachStorage";
import { spracherkennungVerfuegbar, sprachausgabeVerfuegbar, sprachausgabeStoppen, sprich, starteSprachErkennung } from "../utils/speech";
import { wissensBasisText } from "../utils/wissensBasis";
import { trackingZusammenfassung } from "../utils/trackingZusammenfassung";
import { MikrofonIcon, StopIcon } from "./MikrofonIcons";
import VorlesenToggle from "./VorlesenToggle";

// Wie viele Nachrichten aus dem (potenziell über Wochen gewachsenen)
// gespeicherten Verlauf maximal als Kontext an die KI mitgeschickt werden —
// begrenzt Kosten/Tempo. Der volle Verlauf bleibt trotzdem gespeichert und
// im aufklappbaren Verlauf sichtbar, nur die KI-Anfrage selbst wird
// gekappt.
const KI_KONTEXT_LIMIT = 24;

// Wiederverwendbare Chat-Oberfläche für den ADHS Coach — echtes Hin-und-Her
// statt nur "einmal fragen, einmal Antwort" (siehe AIService.coachChat()).
// Zwei Phasen: 1) frei mit dem Coach reden/nachjustieren, 2) per eigenem
// Knopf den aktuellen Gesprächsstand strukturiert "übernehmen" (z. B. als
// Trainingsplan). Bewusst getrennt, damit das Modell mitten im Gespräch
// nicht zwischen Fließtext und JSON hin- und herspringen muss.
//
// Trigger + Modal statt dauerhaft sichtbarer Karte: geschlossen zeigt die
// Komponente nur den animierten Coach-Orb als schwebenden Rundknopf; ein
// Tap öffnet den Chat als Bottom-Sheet, spricht die Begrüßung (bzw. beim
// Wiedereinstieg die letzte Nachricht) vor und startet direkt danach
// automatisch die Spracherkennung (falls verfügbar) — kein erneutes
// Antippen pro Antwort nötig, das Gespräch bleibt fortlaufend
// zuhörbereit. Tippen bleibt jederzeit als Alternative möglich.
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
// - onUebernehmen: optional, async (verlauf, erkannterBereich) => Ergebnis —
//   wenn gesetzt, erscheint nach der ersten Antwort ein "Übernehmen"-Knopf
//   (bzw. erst, sobald pruefeBereitschaft grünes Licht gibt, siehe unten)
// - uebernehmenLabel: Beschriftung dieses Knopfes (Fallback ohne pruefeBereitschaft)
// - renderErgebnis: optional (ergebnis) => Node, für die Erfolgs-Anzeige
// - pruefeBereitschaft: optional, async (verlauf) => bereich|null — für
//   Chats, die (anders als die meisten Bereichs-Chats) mehrere mögliche
//   Aktionen kennen, z. B. der globale Coach auf der Startseite. Läuft
//   automatisch im Hintergrund nach jeder Coach-Antwort; der
//   "Übernehmen"-Knopf erscheint erst, wenn eine Funktion einen Bereich
//   zurückliefert (nicht null) — verhindert, dass der Knopf schon nach
//   belanglosem Small Talk auftaucht. Das Ergebnis wird als zweites
//   Argument an onUebernehmen durchgereicht, damit dort nicht nochmal
//   klassifiziert werden muss.
// - uebernehmenLabels: optional, { [bereich]: string } — Beschriftung je
//   nach von pruefeBereitschaft erkanntem Bereich
// - autoStart: optional, Standard false — startet direkt offen (kein
//   Tap auf den Orb nötig) UND spricht sofort die Begrüßung/letzte
//   Nachricht vor, danach automatisch zuhörend. Für Stellen gedacht, an
//   denen der Chat schon direkt sichtbar eingebettet ist statt als
//   schwebender Trigger (z. B. Onboarding-Kategorie-Schritte) — die Wahl,
//   dorthin zu navigieren, gilt dort bereits als Zustimmung zum Gespräch.
export default function KiChat({
  bereich,
  systemPrompt,
  einleitung,
  onUebernehmen,
  uebernehmenLabel,
  renderErgebnis,
  pruefeBereitschaft,
  uebernehmenLabels,
  autoStart = false,
}) {
  const appData = useAppData();
  const { coachVerlaufLaden, coachNachrichtSpeichern, adminNotizenKontext } = appData;
  // "Background Brain" für den ADHS Coach — statische Wissens-Basis (siehe
  // src/wissen/) + aktuelle Trackingdaten-Zusammenfassung, automatisch an
  // JEDE Coach-Anfrage angehängt, in allen Bereichen (nicht nur Home) —
  // damit der Coach unabhängig vom Gesprächsthema echten Hintergrund über
  // die Nutzerin hat, statt bei jeder Anfrage bei null anzufangen. Zusätzlich
  // offene "Kontext"-Hinweise vom Admin-Dashboard (0036_admin_notizen.sql) —
  // z. B. "beim nächsten Mal Übung X genauer erklären" — der Coach baut sie
  // von sich aus ein, es wird NIE wörtlich als "Nachricht vom Admin" gezeigt
  // (Nutzerin-Vorgabe: der Assistent soll wie ihr Mitarbeiter wirken).
  const hintergrundKontext = useMemo(() => {
    const hinweise = (adminNotizenKontext || []).filter((n) => !n.bereich || n.bereich === bereich);
    const hinweiseText = hinweise.length
      ? `\n\nHINWEISE FÜR DICH ALS ASSISTENT (nicht wörtlich vorlesen oder als "Hinweis" ankündigen, einfach natürlich ins Gespräch einbauen):\n${hinweise.map((h) => `- ${h.text}`).join("\n")}`
      : "";
    return `${wissensBasisText()}\n\n${trackingZusammenfassung(appData)}${hinweiseText}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData, adminNotizenKontext, bereich]);
  const [offen, setOffen] = useState(() => autoStart);
  const [verlauf, setVerlauf] = useState([]);
  const [verlaufSichtbar, setVerlaufSichtbar] = useState(false);
  const [eingabe, setEingabe] = useState("");
  const [laden, setLaden] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);
  const [hoert, setHoert] = useState(false);
  const [zwischenText, setZwischenText] = useState("");
  const [vorlesenAktiv, setVorlesenAktiv] = useState(() => getVorlesenAktiv());
  const [streamText, setStreamText] = useState("");
  const [erkannterBereich, setErkannterBereich] = useState(null);
  const stopErkennungRef = useRef(null);
  const verlaufGeladenRef = useRef(false);
  const eingeleitetRef = useRef(false);
  const eingabeRef = useRef(null);

  // Laufende Sprachausgabe/-erkennung beenden, wenn die Karte verschwindet
  // (z. B. Wechsel auf einen anderen Bildschirm), statt im Hintergrund
  // weiterzureden oder zuzuhören.
  useEffect(() => {
    return () => {
      sprachausgabeStoppen();
      stopErkennungRef.current?.();
    };
  }, []);

  // Tastatur automatisch bereit, sobald nicht (mehr) zugehört wird — nach
  // manuellem Mikrofon-Stopp, nach Ende der Erkennung, oder von Anfang an,
  // falls Spracherkennung im Browser gar nicht verfügbar ist.
  useEffect(() => {
    if (offen && !hoert) eingabeRef.current?.focus();
  }, [offen, hoert]);

  // Läuft nur, wenn pruefeBereitschaft übergeben wurde (aktuell nur der
  // globale Coach auf der Startseite, der mehrere mögliche Aktionen kennt):
  // prüft nach jeder Coach-Antwort im Hintergrund, ob das Gespräch schon
  // konkret genug für einen "Übernehmen"-Knopf ist, statt ihn nach jeder
  // beliebigen Antwort (auch reinem Small Talk) anzuzeigen.
  useEffect(() => {
    if (!pruefeBereitschaft) return;
    const letzte = verlauf[verlauf.length - 1];
    if (!letzte || letzte.rolle !== "coach") return;
    let abgebrochen = false;
    pruefeBereitschaft(verlauf).then(
      (bereich) => {
        if (!abgebrochen) setErkannterBereich(bereich || null);
      },
      () => {
        if (!abgebrochen) setErkannterBereich(null);
      }
    );
    return () => {
      abgebrochen = true;
    };
  }, [verlauf, pruefeBereitschaft]);

  const senden = async (text) => {
    const nachricht = (text ?? `${eingabe}${eingabe && zwischenText ? " " : ""}${zwischenText}`).trim();
    if (!nachricht || laden) return;
    const neuerVerlauf = [...verlauf, { rolle: "nutzer", text: nachricht }];
    setVerlauf(neuerVerlauf);
    setEingabe("");
    setZwischenText("");
    setErgebnis(null);
    setLaden(true);
    setFehler(null);
    setStreamText("");
    if (bereich) coachNachrichtSpeichern(bereich, "nutzer", nachricht);
    try {
      const antwort = await AIService.coachChatStreamend({
        systemPrompt: `${systemPrompt}\n\n${hintergrundKontext}`,
        verlauf: neuerVerlauf.slice(-KI_KONTEXT_LIMIT),
        coachName: getCoachName(),
        onTeilantwort: setStreamText,
      });
      setVerlauf((prev) => [...prev, { rolle: "coach", text: antwort }]);
      if (bereich) coachNachrichtSpeichern(bereich, "coach", antwort);
      const kannHoeren = spracherkennungVerfuegbar();
      if (vorlesenAktiv) {
        sprich(antwort, { onEnde: () => kannHoeren && mikrofonStarten() });
      } else if (kannHoeren) {
        mikrofonStarten();
      }
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLaden(false);
      setStreamText("");
    }
  };

  // Erkannter Text landet nur im Eingabefeld statt automatisch abgesendet
  // zu werden — Spracherkennung verhört sich, und die Nutzerin soll vor dem
  // Senden noch korrigieren können. Zwischenergebnisse werden schon
  // während des Sprechens angezeigt (nicht erst am Ende), damit der
  // Senden-Knopf sofort reagiert statt lange inaktiv zu wirken.
  const mikrofonStarten = () => {
    setFehler(null);
    setHoert(true);
    setZwischenText("");
    // Barge-in: sobald ich selbst rede, wird eine gerade laufende
    // Vorlese-Antwort des Coaches sofort unterbrochen statt weiterzulaufen.
    sprachausgabeStoppen();
    stopErkennungRef.current = starteSprachErkennung({
      onZwischenergebnis: setZwischenText,
      onErgebnis: (text) => {
        setEingabe((prev) => (prev ? `${prev} ${text}` : text));
        setZwischenText("");
      },
      onEnde: () => {
        setHoert(false);
        setZwischenText("");
      },
      onFehler: (msg) => {
        setFehler(msg);
        setHoert(false);
        setZwischenText("");
      },
    });
  };

  const mikrofonUmschalten = () => {
    if (hoert) {
      stopErkennungRef.current?.();
      setHoert(false);
      setZwischenText("");
      return;
    }
    mikrofonStarten();
  };

  // Statt sofort beim Öffnen nur stumm zuzuhören, wird zuerst die
  // Begrüßung (bzw. bei einem bestehenden Verlauf die letzte Coach-
  // Nachricht, damit man beim Wiedereinsteigen weiß, wo man stand)
  // vorgelesen — das Mikrofon startet automatisch erst danach (oder
  // sofort, falls Vorlesen aus ist), analog zu den Onboarding-Screens.
  const starteGespraech = async () => {
    setOffen(true);
    let geladenerVerlauf = verlauf;
    if (bereich && !verlaufGeladenRef.current) {
      verlaufGeladenRef.current = true;
      const gespeichert = await coachVerlaufLaden(bereich);
      if (gespeichert.length) {
        setVerlauf(gespeichert);
        geladenerVerlauf = gespeichert;
      }
    }
    const kannHoeren = spracherkennungVerfuegbar();
    const letzteNachricht = [...geladenerVerlauf].reverse().find((n) => n.rolle === "coach")?.text;
    const zuSprechen = letzteNachricht || einleitung;
    if (vorlesenAktiv && zuSprechen) {
      sprich(zuSprechen, { onEnde: () => kannHoeren && mikrofonStarten() });
    } else if (kannHoeren) {
      mikrofonStarten();
    }
  };

  // autoStart: schon eingebettet sichtbar statt hinter einem Trigger-Orb —
  // das Erscheinen dieses Screens gilt bereits als Zustimmung zum Gespräch.
  // Läuft nicht, wenn der Assistent global ausgeschaltet ist (siehe unten).
  useEffect(() => {
    if (!autoStart || eingeleitetRef.current || !getKiAktiv()) return;
    eingeleitetRef.current = true;
    starteGespraech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const schliessen = () => {
    stopErkennungRef.current?.();
    setHoert(false);
    sprachausgabeStoppen();
    setOffen(false);
  };

  const uebernehmen = async () => {
    setLaden(true);
    setFehler(null);
    setErgebnis(null);
    try {
      const result = await onUebernehmen(verlauf, erkannterBereich);
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
  const zeigeUebernehmenKnopf = onUebernehmen && verlauf.some((n) => n.rolle === "coach") && (!pruefeBereitschaft || erkannterBereich);
  const aktuellesUebernehmenLabel = (pruefeBereitschaft && uebernehmenLabels?.[erkannterBereich]) || uebernehmenLabel || `An ${getCoachName()} übermitteln`;

  // Globaler An/Aus-Schalter (Einstellungen → "Mehr"): bei "Aus" erscheint
  // weder der schwebende Orb noch ein offenes Chat-Fenster — die manuellen
  // Formulare rund um diese Stelle bleiben davon komplett unberührt.
  if (!getKiAktiv()) return null;

  if (!offen) {
    return (
      <button
        type="button"
        className="mp-tap"
        onClick={starteGespraech}
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
            <VorlesenToggle aktiv={vorlesenAktiv} onChange={setVorlesenAktiv} />
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
          <button
            type="button"
            onClick={sprachausgabeStoppen}
            title="Antippen, um den Coach beim Sprechen zu unterbrechen"
            style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", borderRadius: "50%" }}
          >
            <CoachOrb zustand={orbZustand} size={76} />
          </button>
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
            <TextInput
              ref={eingabeRef}
              value={hoert && zwischenText ? `${eingabe}${eingabe ? " " : ""}${zwischenText}` : eingabe}
              onChange={setEingabe}
              placeholder={hoert ? "Höre zu…" : `Anweisung an ${getCoachName()} eingeben…`}
              onKeyPress={(e) => e.key === "Enter" && senden()}
            />
          </div>
          <button
            type="button"
            onClick={() => senden()}
            disabled={laden || !(eingabe.trim() || zwischenText.trim())}
            style={{
              padding: "0 18px",
              borderRadius: 10,
              border: "none",
              background: accentDark,
              color: "#fff",
              fontWeight: 700,
              cursor: laden || !(eingabe.trim() || zwischenText.trim()) ? "not-allowed" : "pointer",
              opacity: laden || !(eingabe.trim() || zwischenText.trim()) ? 0.6 : 1,
            }}
          >
            Senden
          </button>
        </div>

        {zeigeUebernehmenKnopf && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
            <PrimaryButton onClick={uebernehmen} disabled={laden}>
              {laden ? "Wird übernommen…" : aktuellesUebernehmenLabel}
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
