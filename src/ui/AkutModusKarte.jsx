import React, { useState } from "react";
import { Card, Pill, PrimaryButton, TextArea } from "./primitives";
import { accentDark, accentSoft, textMuted } from "./theme";
import { useAkutModus, AKUT_SYMPTOME, akutmodusEreignisLoggen } from "../data/useAkutModus";
import { useAppData } from "../context/AppDataContext";
import AtemTimer from "./AtemTimer";

// Standard-Atemübung, falls unter "Atemübungen" noch keine eigene
// angelegt wurde — 4-4-6 ist ein gängiges, leicht zu merkendes Muster
// (Box-Breathing-Variante), niemand soll erst eine Übung anlegen müssen,
// bevor der Akutmodus nutzbar ist.
const STANDARD_ATEMUEBUNG = { name: "Ruhig werden", icon: "🌬️", einatmenSek: 4, haltenSek: 4, ausatmenSek: 6, dauerMinuten: 3 };

// Akutmodus (16.08., mehrfach erweitert: eigener, schmalerer Knopf statt
// Untertitel-Karte, vorab festlegbare "Akut-Übung", jetzt zusätzlich
// direkter Atemübungs-Start + einfache Dokumentation). Ein Knopf für
// Momente akuter ADHS-Symptomatik ("innere Unruhe", "kirre werden") —
// Symptom auswählen/frei beschreiben, die eigene Übung starten oder eine
// geführte Atemübung machen, sofort eine konkrete Lösung bekommen.
//
// Bewusst KEIN offener KI-Chat (siehe KiChat.jsx-Kommentar "der
// KI-Assistent ist für Coachees nicht mehr Teil der App") — stattdessen
// derselbe leichtgewichtige Einzelanfrage-Mechanismus wie das Lexikon
// (useLexikon.js), nur mit wärmerer, direktiver Antwort-Rolle ("Akutmodus"
// in der lexikon-Edge-Function) statt Glossar-Ton.
//
// Zwei Teile, damit HomeView.jsx den Knopf schmal neben den
// Notfallmodus-Knopf setzen kann, das ausgeklappte Panel aber die volle
// Breite bekommt: AkutModusTrigger (klein, für die Knopf-Reihe) und
// AkutModusPanel (das eigentliche Feature, offen-Zustand wird von
// HomeView.jsx gehalten).

export function AkutModusTrigger({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mp-tap"
      style={{
        width: "100%",
        height: "100%",
        minHeight: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "12px 10px",
        background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
        border: "none",
        borderRadius: 16,
        cursor: "pointer",
        boxShadow: "0 8px 16px rgba(245, 158, 11, 0.2)",
      }}
    >
      <span style={{ fontSize: 22 }}>💡</span>
      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", textAlign: "center", lineHeight: 1.25 }}>
        Grad nicht gut?
      </span>
    </button>
  );
}

function GefuehlAbfrage({ onWaehlen }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 6 }}>Geht's dir jetzt besser?</div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {[
          { emoji: "😊", wert: "besser" },
          { emoji: "😐", wert: "gleich" },
          { emoji: "😞", wert: "schlechter" },
        ].map((g) => (
          <button
            key={g.wert}
            type="button"
            onClick={() => onWaehlen(g.wert)}
            className="mp-tap"
            style={{ fontSize: 22, border: "none", background: "transparent", cursor: "pointer" }}
          >
            {g.emoji}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onWaehlen(null)}
          style={{ border: "none", background: "transparent", color: textMuted, fontSize: 11, cursor: "pointer", marginLeft: 4 }}
        >
          Überspringen
        </button>
      </div>
    </div>
  );
}

// akutUebungen: Gewohnheiten mit akutFavorit === true (siehe
// gewohnheitAkutFavoritUmschalten, GewohnheitenView.jsx) — werden hier
// prominent vor den allgemeinen Symptom-Kacheln angeboten.
export function AkutModusPanel({ onClose, onSendenAnCoach, coachName, zeigeCoachOption, akutUebungen }) {
  const { userId, atemuebungen, atemuebungAbschliessen } = useAppData();
  const [freitext, setFreitext] = useState("");
  const [anCoachGesendet, setAnCoachGesendet] = useState(false);
  const [aktuelleAktion, setAktuelleAktion] = useState(null);
  const [gefuehlProtokolliert, setGefuehlProtokolliert] = useState(false);
  const [atemModusAktiv, setAtemModusAktiv] = useState(false);
  // "Eigene Maßnahme" (16.08., Nutzerinnen-Vorgabe): manche machen im
  // Akutmodus etwas ganz anderes als die angebotenen Optionen (Beispiel
  // der Nutzerin: "geht an die frische Luft und konzentriert sich fünf
  // Minuten auf eine schöne Aussicht") — das soll sich trotzdem eintragen
  // und dokumentieren lassen, unabhängig von der KI-Vorschlagslogik, rein
  // als eigener Log-Eintrag mit Freitext + demselben Gefühls-Check-in.
  const [massnahmeOffen, setMassnahmeOffen] = useState(false);
  const [massnahmeText, setMassnahmeText] = useState("");
  const [massnahmeEingetragen, setMassnahmeEingetragen] = useState(false);
  const [massnahmeGefuehlProtokolliert, setMassnahmeGefuehlProtokolliert] = useState(false);
  const { antwort, laden, fehler, hilfeAnfordern, uebungAnfordern, zuruecksetzen } = useAkutModus();

  const zuruecksetzenKomplett = () => {
    setAnCoachGesendet(false);
    setGefuehlProtokolliert(false);
    setAtemModusAktiv(false);
    setAktuelleAktion(null);
    setMassnahmeOffen(false);
    setMassnahmeText("");
    setMassnahmeEingetragen(false);
    setMassnahmeGefuehlProtokolliert(false);
    zuruecksetzen();
  };

  const massnahmeEintragen = () => {
    if (!massnahmeText.trim()) return;
    setMassnahmeEingetragen(true);
  };

  const massnahmeGefuehlWaehlen = (gefuehl) => {
    setMassnahmeGefuehlProtokolliert(true);
    if (userId) akutmodusEreignisLoggen(userId, "Eigene Maßnahme", massnahmeText.trim(), gefuehl);
  };

  const symptomWaehlen = (symptom) => {
    zuruecksetzenKomplett();
    setAktuelleAktion(`Symptom: ${symptom.label.replace(/^\S+\s/, "")}`);
    hilfeAnfordern(symptom.label.replace(/^\S+\s/, ""), symptom.pfade);
  };

  const uebungWaehlen = (uebung) => {
    zuruecksetzenKomplett();
    setAktuelleAktion(`Akut-Übung: ${uebung.name}`);
    uebungAnfordern(uebung.name);
  };

  const freitextSenden = () => {
    if (!freitext.trim()) return;
    zuruecksetzenKomplett();
    setAktuelleAktion(`Freitext: ${freitext.trim()}`);
    hilfeAnfordern(freitext, null);
  };

  const gefuehlWaehlen = (gefuehl) => {
    setGefuehlProtokolliert(true);
    if (userId && aktuelleAktion) akutmodusEreignisLoggen(userId, aktuelleAktion, null, gefuehl);
  };

  const atemUebungFuerAkutmodus = atemuebungen?.[0] || STANDARD_ATEMUEBUNG;

  const atemFertig = (dauerSek, gefuehlDanach) => {
    if (dauerSek == null) return;
    if (userId) {
      atemuebungAbschliessen?.(atemUebungFuerAkutmodus, dauerSek, { ausAkutmodus: true, gefuehlDanach });
      akutmodusEreignisLoggen(userId, `Atemübung: ${atemUebungFuerAkutmodus.name}`, null, gefuehlDanach);
    }
  };

  const anCoachSenden = async () => {
    if (!onSendenAnCoach) return;
    const nachricht = freitext.trim()
      ? `Akutmodus: ${freitext.trim()}`
      : `Akutmodus — hat sich gerade nicht gut gefühlt.${antwort ? ` (Vorschlag der App: ${antwort})` : ""}`;
    const result = await onSendenAnCoach(nachricht);
    if (result?.ok) setAnCoachGesendet(true);
  };

  return (
    <Card style={{ marginBottom: 18, background: "#FFF7ED", border: "1px solid rgba(217, 119, 6, 0.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#B45309" }}>💡 Was hilft mir jetzt?</div>
        <button
          type="button"
          onClick={onClose}
          style={{ border: "none", background: "transparent", color: textMuted, fontSize: 13, cursor: "pointer" }}
        >
          ✕ Schließen
        </button>
      </div>

      {atemModusAktiv && (
        <div>
          <AtemTimer uebung={atemUebungFuerAkutmodus} onFertig={atemFertig} kompakt />
          <button
            type="button"
            onClick={() => setAtemModusAktiv(false)}
            style={{ border: "none", background: "transparent", color: "#B45309", fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginTop: 10 }}
          >
            🔁 Zurück zur Übersicht
          </button>
        </div>
      )}

      {(massnahmeOffen || massnahmeEingetragen) && (
        <div>
          {!massnahmeEingetragen ? (
            <>
              <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 8 }}>Was hast du gemacht?</div>
              <TextArea value={massnahmeText} onChange={setMassnahmeText} placeholder="z. B. mich 5 Min. auf eine schöne Aussicht konzentriert ..." />
              <div style={{ marginTop: 10 }}>
                <PrimaryButton onClick={massnahmeEintragen} disabled={!massnahmeText.trim()}>
                  Eintragen
                </PrimaryButton>
              </div>
            </>
          ) : (
            <>
              <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 13.5, lineHeight: 1.6, color: accentDark }}>
                Notiert: „{massnahmeText.trim()}"
              </div>
              {!massnahmeGefuehlProtokolliert ? (
                <GefuehlAbfrage onWaehlen={massnahmeGefuehlWaehlen} />
              ) : (
                <div style={{ fontSize: 12, color: "#B45309", marginTop: 8 }}>Danke, festgehalten ✓</div>
              )}
            </>
          )}
          <button
            type="button"
            onClick={zuruecksetzenKomplett}
            className="mp-tap"
            style={{ border: "none", background: "transparent", color: "#B45309", fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginTop: 10, padding: "6px 4px" }}
          >
            🔁 Zurück zur Übersicht
          </button>
        </div>
      )}

      {!atemModusAktiv && !massnahmeOffen && !massnahmeEingetragen && !antwort && !laden && (
        <>
          <button
            type="button"
            onClick={() => setAtemModusAktiv(true)}
            className="mp-tap"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "12px 14px",
              marginBottom: 10,
              borderRadius: 14,
              border: "1px solid rgba(217, 119, 6, 0.35)",
              background: "#fff",
              color: "#B45309",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 18 }}>🌬️</span> Atemübung machen ({atemUebungFuerAkutmodus.name})
          </button>

          {akutUebungen?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>Deine festgelegte Übung:</div>
              {akutUebungen.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => uebungWaehlen(u)}
                  className="mp-tap"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "12px 14px",
                    marginBottom: 8,
                    borderRadius: 14,
                    border: "1px solid rgba(217, 119, 6, 0.35)",
                    background: "#fff",
                    color: "#B45309",
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{u.icon}</span> {u.name} machen
                </button>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
            Oder was passt gerade am besten — oder beschreib's mit eigenen Worten.
          </div>
          <div style={{ marginBottom: 12 }}>
            {AKUT_SYMPTOME.map((s) => (
              <Pill key={s.label} label={s.label} selected={false} onClick={() => symptomWaehlen(s)} />
            ))}
          </div>
          <TextArea value={freitext} onChange={setFreitext} placeholder="Oder hier frei beschreiben ..." />
          <div style={{ marginTop: 10 }}>
            <PrimaryButton onClick={freitextSenden} disabled={!freitext.trim()}>
              Idee holen
            </PrimaryButton>
          </div>
          <button
            type="button"
            onClick={() => setMassnahmeOffen(true)}
            style={{ border: "none", background: "transparent", color: "#B45309", fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 12, padding: 0 }}
          >
            ✍️ Ich hab schon selbst was gemacht — eintragen
          </button>
          {(!akutUebungen || akutUebungen.length === 0) && (
            <div style={{ fontSize: 11, color: textMuted, marginTop: 10, fontStyle: "italic" }}>
              Tipp: Leg dir bei einer Gewohnheit "⭐ Als Akut-Übung merken" fest — dann taucht sie hier als Schnellstart auf.
            </div>
          )}
        </>
      )}

      {laden && <div style={{ fontSize: 13, color: textMuted, padding: "10px 0" }}>🔎 Denkt kurz nach ...</div>}

      {fehler && <div style={{ fontSize: 12.5, color: "#C24545", marginTop: 8 }}>{fehler}</div>}

      {antwort && (
        <div style={{ marginTop: 4 }}>
          <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 13.5, lineHeight: 1.6, color: accentDark }}>
            {antwort}
          </div>
          {!gefuehlProtokolliert ? (
            <GefuehlAbfrage onWaehlen={gefuehlWaehlen} />
          ) : (
            <div style={{ fontSize: 12, color: "#B45309", marginTop: 8 }}>Danke, festgehalten ✓</div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={zuruecksetzenKomplett}
              className="mp-tap"
              style={{
                border: "none",
                background: "transparent",
                color: "#B45309",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                padding: "6px 4px",
              }}
            >
              🔁 Andere Übung/Symptom
            </button>
            {zeigeCoachOption && onSendenAnCoach && !anCoachGesendet && (
              <button
                type="button"
                onClick={anCoachSenden}
                className="mp-tap"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#B45309",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "6px 4px",
                }}
              >
                ✉️ An {coachName} schicken
              </button>
            )}
            {anCoachGesendet && <div style={{ fontSize: 12, color: "#B45309", padding: "6px 4px" }}>Gesendet ✓</div>}
          </div>
        </div>
      )}
    </Card>
  );
}
