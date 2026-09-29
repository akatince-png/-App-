import React, { useState } from "react";
import { Shell, PrimaryButton } from "../../ui/primitives";
import { cardBorder, shadow, textMain, textMuted, accentDark } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";
import { datumKurz } from "../../utils/kernprogramm";
import MenschFigur from "../../ui/MenschFigur";
import AchtWochenPlan from "../../ui/AchtWochenPlan";

// "So geht's weiter" direkt nach dem Onboarding (27.09., Nutzerinnen-Wunsch:
// "Erstinfofenster, wo man durch die wichtigsten Punkte der App geführt
// wird" + die 8 Wochen sichtbar machen). Fünf kurze Seiten im App-Look,
// jederzeit überspringbar; später erneut aufrufbar über "Mein AKA-Coaching".

const karte = { background: "var(--mp-karte)", border: `1px solid ${cardBorder}`, borderRadius: 18, boxShadow: shadow };

function Titel({ children, unter }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.25, color: textMain }}>{children}</div>
      {unter && <div style={{ fontSize: 14.5, color: textMuted, lineHeight: 1.5, marginTop: 6 }}>{unter}</div>}
    </div>
  );
}

function Zeile({ icon, titel, text }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderTop: `1px solid ${cardBorder}` }}>
      <span style={{ fontSize: 22, width: 30, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <span>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: textMain }}>{titel}</span>
        <span style={{ display: "block", fontSize: 13, color: textMuted, lineHeight: 1.45 }}>{text}</span>
      </span>
    </div>
  );
}

// ① Deine 8 Wochen
function SeiteAchtWochen({ start }) {
  return (
    <>
      <Titel unter="Deine Einstellungsphase: Wir lernen dich kennen, messen und bauen Schritt für Schritt auf.">Deine ersten 8 Wochen</Titel>
      {start && (
        <div style={{ borderRadius: 14, padding: "10px 12px", background: "#1B2350", color: "#fff", marginBottom: 12, fontSize: 13.5, fontWeight: 800 }}>
          🧭 Start: {datumKurz(start)} abends – mit deiner ersten Abendroutine
        </div>
      )}
      <AchtWochenPlan start={start} />
    </>
  );
}

// ② Abend vor Morgen + Stoppuhr
function SeiteAbend({ abend, morgen }) {
  const routine = (icon, name, zeit, farbe) => (
    <div style={{ ...karte, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, borderLeft: `5px solid ${farbe}` }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 900, color: textMain }}>{name}</span>
        <span style={{ display: "block", fontSize: 12.5, color: textMuted }}>ab {zeit} · Uhr läuft mit</span>
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: textMain, background: "color-mix(in srgb, #F3F4F8 var(--mp-flaeche), var(--mp-karte))", borderRadius: 10, padding: "5px 9px", fontVariantNumeric: "tabular-nums" }}>⏱ 00:00</span>
    </div>
  );
  return (
    <>
      <Titel unter="Deshalb startest du am Abend. Die Abendroutine bereitet den nächsten Morgen vor.">Ein guter Morgen beginnt am Abend davor.</Titel>
      <div style={{ display: "grid", gap: 8 }}>
        {routine("🌙", "Abendroutine", abend, "#6B5CC7")}
        <div style={{ textAlign: "center", fontSize: 18, color: textMuted }}>↓</div>
        {routine("☀️", "Morgenroutine", morgen, "#E8A33B")}
      </div>
      <div style={{ ...karte, marginTop: 14, padding: "12px 14px" }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: textMain }}>Woche 1: Wir messen nur.</div>
        <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.5, marginTop: 4 }}>
          Tippe „Routine starten“ und dich dann in deinem Tempo durch die Schritte. Die Stoppuhr zählt mit. Nichts muss schnell gehen, nichts wird bewertet. Nach 3 Messungen schlägt die App feste Zeiten vor.
        </div>
      </div>
    </>
  );
}

// ③ Dein Tag in der App
function SeiteTag() {
  return (
    <>
      <Titel unter="Alles Wichtige liegt auf der Startseite.">Dein Tag mit AKA</Titel>
      <div style={{ ...karte, padding: "2px 14px" }}>
        <Zeile icon="🧠" titel="Gehirn + Körper" text="Füllt sich mit allem, was du heute schaffst – Routinen, Wasser, Licht, Bewegung, Essen." />
        <Zeile icon="📋" titel="Dein Tagesplan" text="Was heute dran ist, als Bild oder Liste. Antippen = erledigt." />
        <Zeile icon="🔔" titel="Erinnerungen" text="Die App meldet sich, wenn eine Routine ansteht." />
        <Zeile icon="💡" titel="Grad nicht gut?" text="Der gelbe Knopf hilft im schwierigen Moment und hält ihn für später fest." />
      </div>
    </>
  );
}

// ④ Coach + Aka
function SeiteCoach() {
  return (
    <>
      <Titel unter="Du machst das nicht allein.">Dein Coach und Aka</Titel>
      <div style={{ ...karte, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
        <MenschFigur pose="reden" typ={2} size={60} />
        <div style={{ fontSize: 13.5, color: textMain, lineHeight: 1.5 }}>
          <b>Dein Coach</b> sieht deinen Fortschritt, stellt deine Zeiten ein und schreibt dir. Nach Woche 4 und 8 sprecht ihr in Ruhe.
        </div>
      </div>
      <div style={{ ...karte, padding: "2px 14px" }}>
        <Zeile icon="💬" titel="Aka" text="Sag oder schreib einfach, was war – Aka trägt es für dich ein. Alles geht auch von Hand." />
        <Zeile icon="📅" titel="Sonntags" text="Kurzer Wochen-Check: Was lief gut, was hat gestört?" />
        <Zeile icon="👥" titel="Dein Team" text="Gemeinsam fokussieren, Atempausen, Punkte sammeln." />
      </div>
    </>
  );
}

// ⑤ Dein Start
function SeiteStart({ start, abend }) {
  const { pushUnterstuetzt, pushAktiv, pushAktivieren, pushLadend } = useAppData();
  const punkt = (fertig, icon, text, knopf) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: `1px solid ${cardBorder}` }}>
      <span style={{ width: 30, height: 30, borderRadius: 15, background: fertig ? "color-mix(in srgb, #E8F7F2 var(--mp-flaeche), var(--mp-karte))" : "color-mix(in srgb, #F3F4F8 var(--mp-flaeche), var(--mp-karte))", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{fertig ? "✓" : icon}</span>
      <span style={{ flex: 1, fontSize: 14, color: textMain, lineHeight: 1.4 }}>{text}</span>
      {knopf}
    </div>
  );
  return (
    <>
      <Titel unter="Drei Kleinigkeiten, dann bist du bereit.">{start ? `Dein Start am ${datumKurz(start)}` : "Dein Start"}</Titel>
      <div style={{ ...karte, padding: "2px 14px" }}>
        {punkt(
          pushAktiv,
          "🔔",
          "Erinnerungen erlauben",
          pushUnterstuetzt && !pushAktiv ? (
            <button type="button" className="mp-tap" disabled={pushLadend} onClick={() => pushAktivieren?.()} style={{ border: "none", background: accentDark, color: "#fff", borderRadius: 10, padding: "7px 11px", fontSize: 12.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
              Erlauben
            </button>
          ) : null,
        )}
        {punkt(false, "⏰", `Handy-Wecker für morgen früh stellen`)}
        {punkt(false, "💧", `Heute Abend um ${abend} ein Glas Wasser ans Bett`)}
      </div>
      <div style={{ ...karte, marginTop: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
        <MenschFigur pose="jubel" typ={0} size={56} />
        <div style={{ fontSize: 13.5, color: textMain, lineHeight: 1.5 }}>Diese Tour findest du jederzeit wieder unter <b>Mein AKA-Coaching</b>.</div>
      </div>
    </>
  );
}

export default function StartTourView({ onDone }) {
  const { kernStand, routineEinstellungen = {} } = useAppData();
  const start = kernStand?.geplant?.start || kernStand?.etappe?.start || null;
  const abend = String(routineEinstellungen?.abend?.startZeit || "21:30").slice(0, 5);
  const morgen = String(routineEinstellungen?.morgen?.startZeit || "06:30").slice(0, 5);
  const seiten = [
    () => <SeiteAchtWochen start={start} />,
    () => <SeiteAbend abend={abend} morgen={morgen} />,
    () => <SeiteTag />,
    () => <SeiteCoach />,
    () => <SeiteStart start={start} abend={abend} />,
  ];
  const [index, setIndex] = useState(0);
  const letzte = index === seiten.length - 1;
  const Seite = seiten[index];

  return (
    <Shell>
      <div data-start-tour style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 4 }} aria-label={`Seite ${index + 1} von ${seiten.length}`}>
          {seiten.map((_, i) => (
            <button key={i} type="button" aria-label={`Seite ${i + 1}`} onClick={() => setIndex(i)} style={{ width: i === index ? 20 : 8, height: 8, borderRadius: 99, border: "none", padding: 0, cursor: "pointer", background: i === index ? accentDark : "color-mix(in srgb, #E1E3EA var(--mp-flaeche), var(--mp-karte))", transition: "width .3s" }} />
          ))}
        </div>
        <button type="button" onClick={onDone} style={{ border: "none", background: "transparent", color: textMuted, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "6px 4px", fontFamily: "inherit" }}>
          Überspringen
        </button>
      </div>
      <div key={index} style={{ animation: "fadeInUp 0.4s ease-out" }}>
        <Seite />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {index > 0 && (
          <button type="button" onClick={() => setIndex((i) => i - 1)} aria-label="Zurück" className="mp-tap" style={{ minWidth: 52, borderRadius: 16, border: `1px solid ${cardBorder}`, background: "var(--mp-karte)", color: textMuted, fontSize: 20, cursor: "pointer" }}>
            ‹
          </button>
        )}
        <div style={{ flex: 1 }}>
          <PrimaryButton onClick={letzte ? onDone : () => setIndex((i) => i + 1)}>{letzte ? "Alles klar – zur Startseite" : "Weiter"}</PrimaryButton>
        </div>
      </div>
    </Shell>
  );
}
