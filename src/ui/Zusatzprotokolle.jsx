import React, { useState } from "react";
import { Card, PrimaryButton } from "./primitives";
import { cardBorder, danger, textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { anzahlEintraege } from "./useZusatzEtikett";
import { fmtDate, toLocalISODate } from "../utils/dates";

// Farbe für alles rund um Zusatzprotokolle (Banner, Etikett, Karte) — das
// Violett der Belohnungs-/Punkte-Welt, damit sich "Experiment" klar vom
// Petrol des Hauptprotokolls absetzt.
const ZUSATZ_FARBE = "#6D4FC2";
const ZUSATZ_FARBE_SOFT = "#EFEAFB";

function datum(iso) {
  return iso ? fmtDate(new Date(`${iso}T12:00:00`)) : "";
}

// Sticky-Band oben, solange neue Einträge in ein Zusatzprotokoll statt ins
// Hauptprotokoll gehen — damit nie unbemerkt am falschen Ort gespeichert
// wird.
export function ZusatzprotokollBanner() {
  const { eintragsZielId, zusatzprotokolle = [], setEintragsZielId } = useAppData();
  const ziel = zusatzprotokolle.find((z) => z.id === eintragsZielId);
  if (!ziel) return null;
  return (
    <div
      role="status"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 49,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 16px",
        background: ZUSATZ_FARBE,
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span>🧪 Neue Einträge landen in „{ziel.name}"</span>
      <button
        type="button"
        onClick={() => setEintragsZielId(null)}
        className="mp-tap"
        style={{ border: "none", background: "rgba(255,255,255,0.18)", color: "#fff", borderRadius: 10, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
      >
        Fertig
      </button>
    </div>
  );
}

// Kleines Etikett hinter dem Namen eines Tagesplan-/Home-Eintrags.
export function ZusatzEtikett({ name }) {
  if (!name) return null;
  return (
    <span
      style={{
        display: "inline-block",
        marginLeft: 6,
        padding: "2px 7px",
        borderRadius: 999,
        background: ZUSATZ_FARBE_SOFT,
        color: ZUSATZ_FARBE,
        fontSize: 10.5,
        fontWeight: 800,
        verticalAlign: "middle",
        whiteSpace: "nowrap",
      }}
    >
      🧪 {name}
    </span>
  );
}

function ZusatzprotokollZeile({ z, onEintraegeHinzufuegen }) {
  const appData = useAppData();
  const { zusatzprotokollAbschliessen, aktivesHauptprotokoll } = appData;
  const [abschliessenOffen, setAbschliessenOffen] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [laeuft, setLaeuft] = useState(false);
  const anzahl = anzahlEintraege(z.id, appData);
  const ueberfaellig = z.geplantes_ende && z.geplantes_ende < toLocalISODate(new Date());

  const abschliessen = async (uebernehmen) => {
    setFehler(null);
    setLaeuft(true);
    const result = await zusatzprotokollAbschliessen(z.id, { uebernehmen });
    setLaeuft(false);
    if (!result?.ok) setFehler(result?.error || "Speichern fehlgeschlagen.");
  };

  return (
    <div style={{ padding: "12px 0", borderTop: `1px solid ${cardBorder}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800 }}>🧪 {z.name}</div>
          <div style={{ fontSize: 12, color: ueberfaellig ? danger : textMuted, marginTop: 2 }}>
            seit {datum(z.startdatum)}
            {z.geplantes_ende ? ` · geplant bis ${datum(z.geplantes_ende)}` : " · offen"}
            {ueberfaellig ? " — Zeit für ein Fazit?" : ""}
          </div>
          {z.beschreibung && <div style={{ fontSize: 12.5, color: textMuted, marginTop: 4 }}>{z.beschreibung}</div>}
          <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>
            {anzahl} {anzahl === 1 ? "Eintrag" : "Einträge"}
          </div>
        </div>
        <button
          type="button"
          className="mp-tap"
          onClick={() => onEintraegeHinzufuegen(z.id)}
          style={{ border: `1px solid ${ZUSATZ_FARBE}`, background: "#fff", color: ZUSATZ_FARBE, borderRadius: 10, padding: "7px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
        >
          + Einträge
        </button>
      </div>

      {!abschliessenOffen ? (
        <button
          type="button"
          className="mp-tap"
          onClick={() => setAbschliessenOffen(true)}
          style={{ marginTop: 8, border: "none", background: "transparent", color: textMuted, padding: "4px 0", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
        >
          Abschließen …
        </button>
      ) : (
        <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: ZUSATZ_FARBE_SOFT, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>Wie soll es weitergehen?</div>
          {aktivesHauptprotokoll && (
            <PrimaryButton onClick={() => abschliessen(true)} disabled={laeuft}>
              Hat sich bewährt — ins Hauptprotokoll übernehmen
            </PrimaryButton>
          )}
          <PrimaryButton onClick={() => abschliessen(false)} disabled={laeuft} variant="ghost">
            Beenden — Einträge aus dem Tagesplan nehmen
          </PrimaryButton>
          <button
            type="button"
            onClick={() => setAbschliessenOffen(false)}
            style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 4 }}
          >
            Abbrechen
          </button>
          <div style={{ fontSize: 11.5, color: textMuted }}>Der Verlauf (was du wann erledigt hast) bleibt in beiden Fällen erhalten.</div>
          {fehler && <div style={{ fontSize: 12, color: danger }}>{fehler}</div>}
        </div>
      )}
    </div>
  );
}

// Übersicht der laufenden Zusatzprotokolle (Pläne-Hub, nur Admin-/Verwalten-
// als-Modus — Coachees legen selbst keine Protokolle an, siehe Abschnitt 6
// im Übergabeprotokoll).
export function ZusatzprotokolleKarte({ onEintraegeHinzufuegen, onNeu }) {
  const { zusatzprotokolle = [] } = useAppData();
  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: zusatzprotokolle.length ? 4 : 8 }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>Zusatzprotokolle</div>
        <button
          type="button"
          className="mp-tap"
          onClick={onNeu}
          style={{ border: "none", background: ZUSATZ_FARBE_SOFT, color: ZUSATZ_FARBE, borderRadius: 10, padding: "7px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
        >
          + Parallel starten
        </button>
      </div>
      {zusatzprotokolle.length === 0 ? (
        <div style={{ fontSize: 12.5, color: textMuted }}>
          Etwas ausprobieren, ohne das Hauptprotokoll zu ändern? Ein Zusatzprotokoll läuft parallel und lässt sich später beenden oder übernehmen.
        </div>
      ) : (
        zusatzprotokolle.map((z) => <ZusatzprotokollZeile key={z.id} z={z} onEintraegeHinzufuegen={onEintraegeHinzufuegen} />)
      )}
    </Card>
  );
}
