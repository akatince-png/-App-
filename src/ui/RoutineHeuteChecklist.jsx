import React, { useState } from "react";
import { Card, StatusBadge } from "./primitives";
import { cardBorder, textMuted } from "./theme";
import { toLocalISODate } from "../utils/dates";
import { routineTagesStatus } from "../utils/routineStatus";
import { useAppData } from "../context/AppDataContext";
import { ROUTINE_META } from "../utils/dayItems";
import TagebuchFormular from "./TagebuchFormular";
import { istTagebuchSchritt } from "../utils/tagebuch";
import { istMessPhase, istNachmessen } from "../utils/messwoche";
import { ATEM_ROUTINE_KEY, ATEM_START_KEY, atemFuerRoutineSchritt } from "../utils/atemBibliothek";

const ROUTINE_FARBE = { morgen: ROUTINE_META.morgenroutine.dot, abend: ROUTINE_META.abendroutine.dot };
const ROUTINE_LABEL = { morgen: "Morgenroutine", abend: "Abendroutine" };

// Direkte Tages-Checkliste für Morgen-/Abendroutine (12.09.,
// Nutzerin-Vorgabe): zeigt AUSSCHLIESSLICH die echten, konfigurierten
// Schritte dieser Routine — Zeit für Zeit, mit je einem eigenen
// Bestätigungs-Haken direkt daneben. Bewusst KEIN Navigieren zu einer
// anderen Seite und KEIN Öffnen des Schritte-Editors ("als würde ich die
// Maske bearbeiten wollen") — reines Abhaken, inline auf der Startseite,
// unabhängig vom geführten "Routine starten"-Ablauf (RoutineAblauf.jsx),
// der für alle, die lieber Schritt für Schritt mit Timer durchgehen,
// weiterhin unverändert verfügbar bleibt.
const ROUTINE_KATEGORIE = { morgen: "morgenroutine", abend: "abendroutine" };

// `datum` optional (Standard: heute) — seit 17.09. (Nutzerin-Vorgabe "die
// Einzelschritte einsehen können") wird dieselbe Komponente auch für
// vergangene Tage aus Tagesplan/Wochenübersicht/Monatsansicht verwendet,
// um "reinzugucken", was an einem Tag erledigt war. Ein bereits über den
// geführten Ablauf abgeschlossener Tag zeigt dann alle Schritte als
// erledigt an (siehe routineTagesStatus), auch ohne einzelne
// `routine_schritt_logs`.
// Messwoche/Nachmessen (29.09., Nutzerin: „ich habe nur bestätigt, es lief
// keine Stoppuhr“): in diesen Wochen führt „Bestätigen“ in den geführten
// Ablauf mit Stoppuhr (`onStoppuhrStart`), damit gemessen wird. Manuell
// abhaken bleibt möglich über „Ohne Stoppuhr abhaken“.
export default function RoutineHeuteChecklist({ routine, datum, onStoppuhrStart }) {
  const { routineSchritte, routineDurchlaeufe, routineSchrittErledigt, routineSchrittZeit, routineSchrittErledigtUmschalten, aenderungVermerken, tagebuchEintraege, kernStand } =
    useAppData();
  const [ohneStoppuhr, setOhneStoppuhr] = useState(false);
  const messen = !datum && istMessPhase(kernStand);
  const zurStoppuhr = messen && !!onStoppuhrStart && !ohneStoppuhr;
  const heute = datum || toLocalISODate(new Date());
  const { schritte, schrittIstErledigt } = routineTagesStatus(routine, heute, { routineSchritte, routineDurchlaeufe, routineSchrittErledigt });
  const farbe = ROUTINE_FARBE[routine];

  // Nutzerinnen-Vorgabe (17.09.): "Alle Veränderungen sollen immer im
  // Tagesverlauf mit auftauchen" — nur beim Bestätigen protokolliert (nicht
  // beim Rückgängigmachen), gleiches Muster wie GewohnheitenView.jsx. Diese
  // Komponente zeigt den "Bestätigen"-Knopf ohnehin nur, solange der Schritt
  // noch offen ist (siehe unten) — jeder Klick hier ist also immer ein
  // echtes Bestätigen, nie ein Zurücknehmen.
  // Tagebuch-Schritt (25.09.): "Bestätigen" öffnet "Wie war dein Tag?"
  // direkt darunter; gespeichert = Schritt erledigt. Gibt es schon einen
  // Eintrag für den Tag, wird einfach abgehakt.
  const [tagebuchOffen, setTagebuchOffen] = useState(null);
  const tagebuchVorhanden = (tagebuchEintraege || []).some((e) => e.datum === heute);
  const klick = (schritt) => {
    if (zurStoppuhr) return onStoppuhrStart(routine);
    if (istTagebuchSchritt(schritt) && !tagebuchVorhanden) return setTagebuchOffen(schritt.id);
    bestaetigen(schritt);
  };
  // Atem-Schritt (29.09., Nutzerin: „wenn ich draufklicke, in den Bereich
  // geführt werden, wo die Atemübungen durchgeführt werden“): „Mitmachen“
  // startet die fest hinterlegte, geführte Übung (ohne KI) auf der
  // Atem-Seite; ist sie durch, wird der Schritt dort automatisch abgehakt.
  // „Bestätigen“ bleibt für alle, die schon anders geatmet haben.
  const atemMitmachen = (schritt, atem) => {
    try {
      sessionStorage.setItem(ATEM_START_KEY, atem.key);
      sessionStorage.setItem(ATEM_ROUTINE_KEY, JSON.stringify({ schrittId: schritt.id, datum: heute, routine, name: schritt.name, dauerMinuten: atem.dauerMinuten }));
    } catch {
      // ohne Speicher öffnet sich einfach die Atem-Seite
    }
    window.location.hash = "#/atemuebungen";
  };
  const bestaetigen = (schritt) => {
    routineSchrittErledigtUmschalten(schritt.id, heute);
    aenderungVermerken({ kategorie: ROUTINE_KATEGORIE[routine], itemName: schritt.name, aktion: "erledigt", detail: "" });
  };

  if (schritte.length === 0) {
    return (
      <Card style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12.5, color: textMuted, textAlign: "center" }}>
          Für die {ROUTINE_LABEL[routine]} sind noch keine Schritte eingerichtet.
        </div>
      </Card>
    );
  }

  const alleErledigt = schritte.every((x) => schrittIstErledigt(x.id));
  return (
    <Card style={{ marginTop: 8 }}>
      {messen && !alleErledigt && (
        <div data-mess-hinweis style={{ fontSize: 12.5, lineHeight: 1.45, padding: "8px 10px", marginBottom: 6, borderRadius: 12, background: "color-mix(in srgb, #FFF6E5 var(--mp-flaeche), var(--mp-rand-dunkel))", color: "color-mix(in srgb, #7A4B00 var(--mp-schrift), var(--mp-schrift-hell))" }}>
          ⏱️ {istNachmessen(kernStand) ? "Nachmess-Woche" : "Messwoche"}: Bitte mit Stoppuhr starten, damit wir sehen, wie lange du wirklich brauchst.
          {zurStoppuhr && " „Bestätigen“ startet deshalb den Ablauf mit Uhr."}
          {onStoppuhrStart && (
            <button type="button" onClick={() => setOhneStoppuhr((x) => !x)} style={{ display: "block", marginTop: 4, padding: 0, border: "none", background: "none", color: "inherit", textDecoration: "underline", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {ohneStoppuhr ? "Doch mit Stoppuhr" : "Ohne Stoppuhr abhaken"}
            </button>
          )}
        </div>
      )}
      {schritte.map((s, i) => {
        const zeit = routineSchrittZeit(s.id);
        const done = schrittIstErledigt(s.id);
        return (
          <React.Fragment key={s.id}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "9px 0",
              borderBottom: i < schritte.length - 1 ? `1px solid ${cardBorder}` : "none",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                {zeit && <span style={{ color: farbe, fontWeight: 800 }}>{zeit} · </span>}
                {s.name}
              </div>
            </div>
            {done ? (
              <StatusBadge status="erledigt" />
            ) : (
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {atemFuerRoutineSchritt(s, routine) && !datum && (
                <button
                  type="button"
                  data-atem-mitmachen
                  onClick={() => atemMitmachen(s, atemFuerRoutineSchritt(s, routine))}
                  style={{ padding: "7px 12px", borderRadius: 10, border: `1.5px solid ${farbe}`, background: "var(--mp-karte)", color: farbe, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                >
                  ▶ Mitmachen
                </button>
              )}
              <button
                type="button"
                onClick={() => klick(s)}
                style={{
                  flexShrink: 0,
                  padding: "7px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: farbe,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Bestätigen
              </button>
              </div>
            )}
          </div>
          {tagebuchOffen === s.id && !done && (
            <div style={{ padding: "4px 0 10px" }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>📓 Wie war dein Tag?</div>
              <TagebuchFormular datum={heute} kompakt onGespeichert={() => { setTagebuchOffen(null); bestaetigen(s); }} />
            </div>
          )}
          </React.Fragment>
        );
      })}
    </Card>
  );
}
