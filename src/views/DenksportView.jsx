import React, { useEffect, useRef, useState } from "react";
import { Shell } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import { success, textMain, textMuted, cardBorder } from "../ui/theme";
import { denksportRunde } from "../data/denkpausen";
import { useAppData } from "../context/AppDataContext";
import { feuereBelohnung } from "../utils/belohnungBus";
import { TAGESRAETSEL_ZIEL, tagesraetselHeute } from "../utils/tagesraetsel";
import { TAGESRAETSEL_META } from "../utils/dayItems";

// Denksport nach Wunsch (Nutzerinnen-Wunsch 23.09.): die Aufgaben aus dem
// Denkpausen-Katalog (je 200 Mathe, Wortspiele, Rätsel, Allgemeinwissen)
// nicht nur spontan im Tagesplan/bei Bildschirmzeit, sondern gezielt
// spielbar — Kategorie wählen, Runde aus 5 Fragen, kleine Auswertung.
// ADHS-Grundsätze wie bei der Denkpause: kurz, kein Zeitdruck, kein
// "falsch"-Rot — eine falsche Antwort zeigt nur freundlich die richtige.
// Ergebnisse werden wie bei den Denkpausen gespeichert (richtige Antworten
// zählen als Punkte, siehe utils/errungenschaften.js).
const RUNDE = 5;

function ergebnisText(richtig) {
  if (richtig === RUNDE) return "Alles richtig — dein Kopf ist hellwach! 🚀";
  if (richtig >= 3) return "Stark! Dein Gehirn ist warmgelaufen. 💪";
  if (richtig >= 1) return "Gut gemacht — jede Runde trainiert. 🌱";
  return "Kein Ding — Mitmachen zählt, dein Kopf ist jetzt wach. 💛";
}

// Tagesrätsel (24.09.): Die Seite zeigt nur noch die feste Tagesaufgabe
// (Nutzerinnen-Entscheidung 24.09., "Variante 3": freies Training mit
// Kategorie-Auswahl ausgeblendet, weil der Fragenvorrat sonst zu schnell
// verbraucht ist) (5
// gemischte Fragen, siehe utils/tagesraetsel.js). Aus der Tages-Quest bzw.
// "Als Nächstes" (View "tagesraetsel") startet die Runde direkt.
export default function DenksportView({ onHome, tagesraetselStart = false }) {
  const { denkpauseErgebnisVermerken, denkpauseErgebnisse } = useAppData();
  const raetselHeute = tagesraetselHeute(denkpauseErgebnisse);
  const raetselOffen = Math.max(0, TAGESRAETSEL_ZIEL - raetselHeute);
  const [istTagesraetsel, setIstTagesraetsel] = useState(false);
  const [kategorie, setKategorie] = useState(null);
  const [runde, setRunde] = useState([]);
  const [index, setIndex] = useState(0);
  const [gewaehlt, setGewaehlt] = useState(null);
  const [ergebnisse, setErgebnisse] = useState([]);

  const starten = (id, anzahl = RUNDE, tagesraetsel = false) => {
    setIstTagesraetsel(tagesraetsel);
    setKategorie(id);
    setRunde(denksportRunde(id, anzahl));
    setIndex(0);
    setGewaehlt(null);
    setErgebnisse([]);
  };

  const tagesraetselStarten = () => starten("gemischt", raetselOffen || RUNDE, true);
  const autoGestartet = useRef(false);
  useEffect(() => {
    if (!tagesraetselStart || autoGestartet.current) return;
    autoGestartet.current = true;
    if (raetselOffen > 0) starten("gemischt", raetselOffen, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagesraetselStart]);

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
        text: istTagesraetsel ? "Tagesrätsel geschafft! 🧩" : `Runde geschafft: ${anzahl} von ${runde.length} richtig!`,
        untertitel: istTagesraetsel ? `${anzahl} von ${runde.length} richtig — dazu ein Bonuspunkt für heute.` : ergebnisText(anzahl),
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
          Kurz das Gehirn aufwecken: jeden Tag {TAGESRAETSEL_ZIEL} gemischte Fragen, kein Zeitdruck. Jede richtige Antwort bringt einen Punkt und lädt die Region „Fokus & Planung“ in deinem Gehirn auf.
        </div>
        <TagesraetselKarte heute={raetselHeute} onStart={tagesraetselStarten} />
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
          <button type="button" className="mp-tap" onClick={onHome} style={knopf(success, "#fff")}>
            Zurück zur Startseite
          </button>
        </div>
      </Shell>
    );
  }

  // Frage
  const ausgewertet = gewaehlt !== null;
  return (
    <Shell>
      <ViewHeader title="🧩 Tagesrätsel" onHome={() => setKategorie(null)} homeTitle="Zurück" />
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

function TagesraetselKarte({ heute, onStart }) {
  const f = TAGESRAETSEL_META;
  const geschafft = heute >= TAGESRAETSEL_ZIEL;
  const anteil = Math.min(1, heute / TAGESRAETSEL_ZIEL);
  return (
    <div style={{ borderRadius: 20, border: `2px solid ${f.dot}`, background: geschafft ? f.dot : f.bg, color: geschafft ? "#fff" : f.text, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>{geschafft ? "✓ Tagesrätsel geschafft" : "🧩 Tagesrätsel"}</div>
        <div style={{ fontSize: 13, fontWeight: 800 }}>
          {Math.min(heute, TAGESRAETSEL_ZIEL)}/{TAGESRAETSEL_ZIEL}
        </div>
      </div>
      <div style={{ fontSize: 12.5, marginTop: 4, lineHeight: 1.45, opacity: 0.9 }}>
        {geschafft
          ? "Super, für heute erledigt! Morgen warten 5 neue Fragen."
          : `Deine Tagesaufgabe: ${TAGESRAETSEL_ZIEL} gemischte Fragen. Geschafft gibt's einen Bonuspunkt, jede richtige Antwort zählt extra.`}
      </div>
      <div style={{ height: 7, borderRadius: 99, background: geschafft ? "rgba(255,255,255,0.3)" : "rgba(228,100,63,0.18)", marginTop: 10, overflow: "hidden" }}>
        <div style={{ width: `${Math.round(anteil * 100)}%`, height: "100%", borderRadius: 99, background: geschafft ? "#fff" : f.dot }} />
      </div>
      {!geschafft && (
        <button type="button" className="mp-tap" onClick={onStart} style={{ ...knopf(f.dot, "#fff"), marginTop: 12 }}>
          {heute > 0 ? "Weiter lösen" : "Jetzt lösen"}
        </button>
      )}
    </div>
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
