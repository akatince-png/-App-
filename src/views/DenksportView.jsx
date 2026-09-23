import React, { useState } from "react";
import { Shell } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import { success, textMain, textMuted, cardBorder } from "../ui/theme";
import { DENKPAUSEN_KATEGORIEN, denksportRunde } from "../data/denkpausen";
import { useAppData } from "../context/AppDataContext";
import { feuereBelohnung } from "../utils/belohnungBus";

// Denksport nach Wunsch (Nutzerinnen-Wunsch 23.09.): die Aufgaben aus dem
// Denkpausen-Katalog (je 200 Mathe, Wortspiele, Rätsel, Allgemeinwissen)
// nicht nur spontan im Tagesplan/bei Bildschirmzeit, sondern gezielt
// spielbar — Kategorie wählen, Runde aus 5 Fragen, kleine Auswertung.
// ADHS-Grundsätze wie bei der Denkpause: kurz, kein Zeitdruck, kein
// "falsch"-Rot — eine falsche Antwort zeigt nur freundlich die richtige.
// Ergebnisse werden wie bei den Denkpausen gespeichert (richtige Antworten
// zählen als Punkte, siehe utils/errungenschaften.js).
const RUNDE = 5;
const KARTEN = [
  { id: "mathe", emoji: "🔢", farbe: "#4F6BD8", text: "Kopfrechnen, Uhrzeiten, Zahlenreihen" },
  { id: "wortspiele", emoji: "🔤", farbe: "#D9822B", text: "Teekesselchen, Redewendungen, Wortketten" },
  { id: "raetsel", emoji: "🧩", farbe: "#7C5CE0", text: "Logik, Denkfallen, Knobeleien" },
  { id: "wissen", emoji: "🌍", farbe: "#1FA39A", text: "Geografie, Natur, Körper, Geschichte" },
  { id: "gemischt", emoji: "🎲", farbe: "#E4643F", text: "Von allem etwas" },
];
const LABEL = { ...Object.fromEntries(DENKPAUSEN_KATEGORIEN.map((k) => [k.id, k.label])), gemischt: "Gemischt" };

function ergebnisText(richtig) {
  if (richtig === RUNDE) return "Alles richtig — dein Kopf ist hellwach! 🚀";
  if (richtig >= 3) return "Stark! Dein Gehirn ist warmgelaufen. 💪";
  if (richtig >= 1) return "Gut gemacht — jede Runde trainiert. 🌱";
  return "Kein Ding — Mitmachen zählt, dein Kopf ist jetzt wach. 💛";
}

export default function DenksportView({ onHome }) {
  const { denkpauseErgebnisVermerken } = useAppData();
  const [kategorie, setKategorie] = useState(null);
  const [runde, setRunde] = useState([]);
  const [index, setIndex] = useState(0);
  const [gewaehlt, setGewaehlt] = useState(null);
  const [ergebnisse, setErgebnisse] = useState([]);

  const starten = (id) => {
    setKategorie(id);
    setRunde(denksportRunde(id, RUNDE));
    setIndex(0);
    setGewaehlt(null);
    setErgebnisse([]);
  };

  const aufgabe = runde[index];
  const fertig = kategorie && ergebnisse.length === runde.length && runde.length > 0 && gewaehlt === null;

  const antworten = (i) => {
    if (gewaehlt !== null) return;
    const richtig = i === aufgabe.richtig;
    setGewaehlt(i);
    denkpauseErgebnisVermerken?.(aufgabe.kategorie, richtig);
  };

  const weiter = () => {
    const neu = [...ergebnisse, gewaehlt === aufgabe.richtig];
    setErgebnisse(neu);
    setGewaehlt(null);
    if (index + 1 < runde.length) {
      setIndex(index + 1);
    } else {
      const anzahl = neu.filter(Boolean).length;
      feuereBelohnung({
        text: `Runde geschafft: ${anzahl} von ${runde.length} richtig!`,
        untertitel: ergebnisText(anzahl),
        icon: "trophy",
        gross: true,
      });
    }
  };

  // Auswahl
  if (!kategorie) {
    return (
      <Shell>
        <ViewHeader title="🧩 Denksport" onHome={onHome} />
        <div style={{ fontSize: 13.5, color: textMuted, lineHeight: 1.5, marginBottom: 16 }}>
          Kurz das Gehirn aufwecken: {RUNDE} Fragen, kein Zeitdruck. Jede richtige Antwort bringt einen Punkt und lädt die Region „Fokus & Planung“ in deinem Gehirn auf.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {KARTEN.map((k) => (
            <button
              key={k.id}
              type="button"
              className="mp-tap"
              onClick={() => starten(k.id)}
              style={{
                gridColumn: k.id === "gemischt" ? "1 / -1" : undefined,
                textAlign: "left",
                border: "none",
                borderRadius: 20,
                padding: "16px 14px",
                background: `linear-gradient(145deg, ${k.farbe}, ${k.farbe}CC)`,
                color: "#fff",
                cursor: "pointer",
                boxShadow: `0 8px 18px ${k.farbe}40`,
                fontFamily: "inherit",
              }}
            >
              <div style={{ fontSize: 26 }}>{k.emoji}</div>
              <div style={{ fontSize: 15.5, fontWeight: 800, marginTop: 6 }}>{LABEL[k.id]}</div>
              <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 2, lineHeight: 1.35 }}>{k.text}</div>
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  // Auswertung
  if (fertig) {
    const anzahl = ergebnisse.filter(Boolean).length;
    return (
      <Shell>
        <ViewHeader title="🧩 Denksport" onHome={onHome} />
        <div style={{ textAlign: "center", padding: "24px 8px" }}>
          <div style={{ fontSize: 44 }}>{anzahl >= 3 ? "🏆" : "🌱"}</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 8 }}>
            {anzahl} von {runde.length} richtig
          </div>
          <div style={{ fontSize: 14, color: textMuted, marginTop: 6 }}>{ergebnisText(anzahl)}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
            {ergebnisse.map((r, i) => (
              <span key={i} style={{ width: 14, height: 14, borderRadius: 99, background: r ? success : "#D9DCD8" }} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" className="mp-tap" onClick={() => starten(kategorie)} style={knopf(success, "#fff")}>
            Noch eine Runde {LABEL[kategorie]}
          </button>
          <button type="button" className="mp-tap" onClick={() => setKategorie(null)} style={knopf("#fff", textMain, true)}>
            Andere Kategorie
          </button>
        </div>
      </Shell>
    );
  }

  // Frage
  const ausgewertet = gewaehlt !== null;
  return (
    <Shell>
      <ViewHeader title={`${KARTEN.find((k) => k.id === kategorie)?.emoji || "🧩"} ${LABEL[kategorie]}`} onHome={() => setKategorie(null)} homeTitle="Zurück" />
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }} aria-label={`Frage ${index + 1} von ${runde.length}`}>
        {runde.map((_, i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 99,
              background: i < ergebnisse.length ? (ergebnisse[i] ? success : "#C9CCC8") : i === index ? textMain : "#E6E8E4",
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 6 }}>
        Frage {index + 1} von {runde.length}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: textMain, lineHeight: 1.4, marginBottom: 16 }}>{aufgabe.frage}</div>
      <div role="group" aria-label="Antworten" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {aufgabe.antworten.map((a, i) => {
          const istRichtig = i === aufgabe.richtig;
          const markiert = ausgewertet && (istRichtig || i === gewaehlt);
          return (
            <button
              key={i}
              type="button"
              className="mp-tap"
              onClick={() => antworten(i)}
              disabled={ausgewertet}
              style={{
                textAlign: "left",
                borderRadius: 16,
                padding: "14px 16px",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: ausgewertet ? "default" : "pointer",
                border: `2px solid ${ausgewertet && istRichtig ? success : cardBorder}`,
                background: ausgewertet && istRichtig ? success : "#fff",
                color: ausgewertet && istRichtig ? "#fff" : textMain,
                opacity: ausgewertet && !markiert ? 0.55 : 1,
              }}
            >
              {ausgewertet && istRichtig ? "✓ " : ""}
              {a}
            </button>
          );
        })}
      </div>
      {ausgewertet && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: gewaehlt === aufgabe.richtig ? success : textMain, marginBottom: 10 }}>
            {gewaehlt === aufgabe.richtig ? "Genau richtig! 🎉" : "Kein Ding — so wär's richtig gewesen."}
          </div>
          <button type="button" className="mp-tap" onClick={weiter} style={knopf(success, "#fff")}>
            {index + 1 < runde.length ? "Weiter" : "Zur Auswertung"}
          </button>
        </div>
      )}
    </Shell>
  );
}

function knopf(hintergrund, farbe, rand = false) {
  return {
    width: "100%",
    border: rand ? `1.5px solid ${cardBorder}` : "none",
    borderRadius: 16,
    padding: "15px 18px",
    background: hintergrund,
    color: farbe,
    fontSize: 15.5,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}
