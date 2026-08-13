import React, { useMemo, useState } from "react";
import { Shell, Card, PrimaryButton } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import TimeWheelField from "../ui/TimeWheelField";
import { cardBorder, textMuted } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { buildDayItems } from "../utils/dayItems";
import RoutineAblauf from "../ui/RoutineAblauf";
import RoutineSchritteEditor from "../ui/RoutineSchritteEditor";
import SpotifyAnlassPicker from "../ui/SpotifyAnlassPicker";

const ROUTINE_ANLASS = { morgen: "morgenroutine", abend: "abendroutine" };

const ROUTINE_LABEL = { morgen: "Morgenroutine", abend: "Abendroutine" };
const ROUTINE_EMOJI = { morgen: "🌅", abend: "🌙" };
// Eigene Farben statt KATEGORIE_META (utils/dayItems.js): KATEGORIE_META
// steuert auch die Farb-Legende der Monatsansicht (WochenuebersichtView) —
// dort würden Morgen-/Abendroutine als tote Einträge auftauchen, weil
// buildDayItems() nie Tagesplan-Punkte mit dieser Kategorie erzeugt (die
// Routine ist eine Sammlung frei benannter Schritte, kein Tracker-Item).
// Gleiches Muster wie WOCHENUEBERSICHT_FARBE in PlaeneView.jsx.
const ROUTINE_FARBE = { morgen: "#E08A3E", abend: "#4E6690" };

function minutenSeitMitternacht(zeit) {
  if (!zeit) return null;
  const [h, m] = zeit.split(":").map(Number);
  return h * 60 + (m || 0);
}

// Morgen- und Abendroutine sind seit 13.08. eigene Reiter im "Alle Pläne"-
// Bereich (zusätzlich zu den aufklappbaren Karten im Tagesplan), damit sie
// als eigenständiger, gleichrangiger Bereich sichtbar sind statt nur als
// Unterpunkt von "Gewohnheiten"/im Tagesplan zu erscheinen. Der Zeitrahmen
// (z. B. 6:00–9:00 Uhr) ist die Grundlage für die Überlappungs-Erkennung
// unten: andere geplante Punkte (Training, Supplemente, ...), deren Uhrzeit
// in den Zeitrahmen fällt, werden zur Übernahme als Routine-Schritt
// vorgeschlagen — welche Inhalte eine Morgen-/Abendroutine grundsätzlich
// haben sollte (Tageslicht, Bewegung, bestimmte Supplemente ...), ist
// bewusst noch nicht vorgegeben und folgt erst nach der von der Nutzerin
// angekündigten Recherche zu ADHS-gerechten Routine-Vorgaben.
export default function RoutineTabView({ routine, embedded = false, onHome }) {
  const {
    routineSchritte,
    routineSchrittHinzufuegen,
    routineSchrittEntfernen,
    routineSchrittVerschieben,
    routineDurchlaufSpeichern,
    routineEinstellungen,
    routineZeitrahmenSetzen,
    hormonPlan,
    hormonErledigt,
    hormonDosierung,
    supplemente,
    supplementErledigt,
    mahlzeiten,
    mahlzeitErledigt,
    mealWochenplan,
    trainingEintraege,
    trainingWochenplan,
    gewohnheiten,
    gewohnheitErledigt,
  } = useAppData();

  const [ablaufAktiv, setAblaufAktiv] = useState(false);
  const [schritteOffen, setSchritteOffen] = useState(false);

  const einstellung = routineEinstellungen[routine] || { startZeit: "", endZeit: "" };
  const schritteFuerRoutine = routineSchritte.filter((s) => s.routine === routine).sort((a, b) => a.reihenfolge - b.reihenfolge);

  const startMin = minutenSeitMitternacht(einstellung.startZeit);
  const endMin = minutenSeitMitternacht(einstellung.endZeit);

  // Überlappungs-Erkennung: welche der heute ohnehin geplanten Punkte
  // fallen zeitlich in den Zeitrahmen dieser Routine und sind noch nicht
  // schon als Routine-Schritt übernommen?
  const ueberlappendeItems = useMemo(() => {
    if (startMin === null || endMin === null) return [];
    const heute = buildDayItems(new Date(), {
      hormonPlan,
      hormonErledigt,
      hormonDosierung,
      supplemente,
      supplementErledigt,
      mahlzeiten,
      mahlzeitErledigt,
      mealWochenplan,
      trainingEintraege,
      trainingWochenplan,
      gewohnheiten,
      gewohnheitErledigt,
    });
    const schonUebernommen = new Set(schritteFuerRoutine.map((s) => s.name.toLowerCase()));
    return heute.filter((item) => {
      if (item.kategorie === "gewohnheit") return false;
      if (!item.uhrzeit || !/^\d{2}:\d{2}/.test(item.uhrzeit)) return false;
      const min = minutenSeitMitternacht(item.uhrzeit.slice(0, 5));
      if (min === null || min < startMin || min >= endMin) return false;
      return !schonUebernommen.has((item.name || "").toLowerCase());
    });
  }, [
    startMin,
    endMin,
    hormonPlan,
    hormonErledigt,
    hormonDosierung,
    supplemente,
    supplementErledigt,
    mahlzeiten,
    mahlzeitErledigt,
    mealWochenplan,
    trainingEintraege,
    trainingWochenplan,
    gewohnheiten,
    gewohnheitErledigt,
    schritteFuerRoutine,
  ]);

  const uebernehmen = (item) => {
    const dauerMin = item.raw?.dauerMin || 5;
    routineSchrittHinzufuegen(routine, item.name, dauerMin);
  };

  if (ablaufAktiv) {
    return (
      <RoutineAblauf
        routine={routine}
        schritte={schritteFuerRoutine}
        onAbschluss={() => setAblaufAktiv(false)}
        onAbbrechen={() => setAblaufAktiv(false)}
        routineDurchlaufSpeichern={routineDurchlaufSpeichern}
      />
    );
  }

  const farbe = ROUTINE_FARBE[routine];

  const content = (
    <>
      {!embedded && <ViewHeader title={`${ROUTINE_EMOJI[routine]} ${ROUTINE_LABEL[routine]}`} onHome={onHome} />}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
          {ROUTINE_EMOJI[routine]} {ROUTINE_LABEL[routine]}
        </div>
        <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 12 }}>
          Lass dich Schritt für Schritt begleiten — mit Countdown je Schritt.
        </div>
        <PrimaryButton onClick={() => setAblaufAktiv(true)}>▶️ {ROUTINE_LABEL[routine]} starten</PrimaryButton>

        <button
          type="button"
          onClick={() => setSchritteOffen((o) => !o)}
          style={{
            marginTop: 10,
            border: "none",
            background: "transparent",
            color: farbe,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            padding: 0,
          }}
        >
          {schritteOffen ? "Schritte ausblenden" : "⚙️ Schritte einrichten"}
        </button>
        {schritteOffen && (
          <div style={{ marginTop: 10 }}>
            <RoutineSchritteEditor
              schritte={schritteFuerRoutine}
              onHinzufuegen={(name, dauerMin) => routineSchrittHinzufuegen(routine, name, dauerMin)}
              onEntfernen={routineSchrittEntfernen}
              onVerschieben={routineSchrittVerschieben}
            />
          </div>
        )}
        <SpotifyAnlassPicker anlass={ROUTINE_ANLASS[routine]} label={`🎵 Playlist für die ${ROUTINE_LABEL[routine]}`} />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Zeitrahmen</div>
        <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
          Grober Rahmen, z. B. 6:00–9:00 Uhr — dient auch dazu, andere geplante Punkte zu erkennen, die in diese Zeit fallen.
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <TimeWheelField value={einstellung.startZeit} onChange={(v) => routineZeitrahmenSetzen(routine, v, einstellung.endZeit)} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: textMuted }}>–</div>
          <div style={{ flex: 1 }}>
            <TimeWheelField value={einstellung.endZeit} onChange={(v) => routineZeitrahmenSetzen(routine, einstellung.startZeit, v)} />
          </div>
        </div>
      </Card>

      {ueberlappendeItems.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Passt in deinen Zeitrahmen</div>
          <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
            Diese heute geplanten Punkte liegen zeitlich in der {ROUTINE_LABEL[routine]} ({einstellung.startZeit}–{einstellung.endZeit} Uhr). In die Routine übernehmen?
          </div>
          {ueberlappendeItems.map((item) => (
            <div
              key={item.key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderTop: `1px solid ${cardBorder}`,
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: textMuted }}>{item.uhrzeit.slice(0, 5)} Uhr</div>
              </div>
              <button
                type="button"
                onClick={() => uebernehmen(item)}
                style={{
                  border: "none",
                  borderRadius: 10,
                  padding: "6px 12px",
                  background: farbe,
                  color: "#fff",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Übernehmen
              </button>
            </div>
          ))}
        </Card>
      )}

      {schritteFuerRoutine.length === 0 && (
        <Card>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>
            Noch keine Schritte eingerichtet — leg oben unter "Schritte einrichten" die ersten an.
          </div>
        </Card>
      )}
    </>
  );

  return embedded ? content : <Shell>{content}</Shell>;
}
