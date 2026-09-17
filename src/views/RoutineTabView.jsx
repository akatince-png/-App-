import React, { useEffect, useMemo, useRef, useState } from "react";
import { Shell, Card, PrimaryButton } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import TimeWheelField from "../ui/TimeWheelField";
import { accentSoft, cardBorder, textMuted } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { buildDayItems } from "../utils/dayItems";
import RoutineAblauf from "../ui/RoutineAblauf";
import RoutineHeuteChecklist from "../ui/RoutineHeuteChecklist";
import RoutineSchritteEditor from "../ui/RoutineSchritteEditor";
import RoutineSchritteListe from "../ui/RoutineSchritteListe";
import SpotifyAnlassPicker from "../ui/SpotifyAnlassPicker";
import SchlafplanCard, { neuerSchlafblock } from "../ui/SchlafplanCard";
import ItemVerlauf from "../ui/ItemVerlauf";
import KiChat from "../ui/KiChat";
import { AIService } from "../services/aiService";
import { getCoachName } from "../utils/coachStorage";
import KategorieErinnerung from "../ui/KategorieErinnerung";
import { WOCHENTAGE } from "../constants";

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
    hormone,
    supplemente,
    supplementErledigt,
    mahlzeiten,
    mahlzeitErledigt,
    mealWochenplan,
    trainingEintraege,
    trainingNachDatum,
    trainingWochenplan,
    gewohnheiten,
    gewohnheitErledigt,
    workflowPlaene,
    workflowPresets,
    ausnahmenNachSchluessel,
    spotifyAnlaesse,
    spotifyPlaylists,
    categoryZiele,
    setCategoryZiel,
    aenderungVermerken,
  } = useAppData();

  const [ablaufAktiv, setAblaufAktiv] = useState(false);
  // Bug-Fix (Nutzerinnen-Report, 17.09.: "ob diese Protokolle... im
  // Nachhinein noch über die Reiter Morgens- und Abendroutine bearbeitbar
  // sind"): der Schlafplan (Bettzeit/Aufwachzeit, seit Teil 113 Teil dieser
  // Seite im Onboarding, siehe OnboardingRoutinenView.jsx) hatte danach
  // NIRGENDS eine Bearbeiten-Möglichkeit — dieser Reiter kannte "schlaf"
  // bisher gar nicht. Nur auf dem "abend"-Reiter gezeigt (schließt direkt an
  // die Abendroutine an, wie schon im Onboarding so angeordnet) — anders als
  // dort ohne eigenen "Weiter"-Knopf: jede Änderung speichert hier sofort
  // über setCategoryZiel, wie der Rest dieser (live editierbaren) Seite.
  const [schlafIntervallTyp, setSchlafIntervallTyp] = useState("weekdays");
  const [schlafBloecke, setSchlafBloecke] = useState([neuerSchlafblock([...WOCHENTAGE])]);
  const [schlafIstZustand, setSchlafIstZustand] = useState("");
  // Zuletzt tatsächlich gespeicherter Freitext — Grundlage für den
  // Diff-Text im Tagesverlauf UND dafür, den Debounce-Effekt weiter unten
  // von einem "nichts geändert"-Durchlauf zu unterscheiden.
  const schlafIstZustandGespeichertRef = useRef("");

  useEffect(() => {
    if (routine !== "abend") return;
    const gespeicherteBloecke = categoryZiele?.schlaf?.bloecke;
    if (gespeicherteBloecke?.length) {
      setSchlafIntervallTyp(
        gespeicherteBloecke.length === 1 && gespeicherteBloecke[0].wochentage.length === WOCHENTAGE.length ? "fixed" : "weekdays"
      );
      setSchlafBloecke(gespeicherteBloecke.map((b) => ({ ...neuerSchlafblock(b.wochentage), ...b })));
    }
    const geladenerIstZustand = categoryZiele?.schlaf?.istZustand?.aktuell || "";
    setSchlafIstZustand(geladenerIstZustand);
    schlafIstZustandGespeichertRef.current = geladenerIstZustand;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routine]);

  const beschreibeSchlafbloecke = (bloecke) => bloecke.map((b) => `${b.wochentage.join(",") || "–"} ${b.bettzeit}–${b.aufwachzeit}`).join("; ");

  const speichereSchlafplan = (typ, bloecke, istZustandText) => {
    const effektiveBloecke = typ === "fixed" ? [{ ...bloecke[0], wochentage: [...WOCHENTAGE] }] : bloecke;
    setCategoryZiel("schlaf", {
      bloecke: effektiveBloecke.map(({ wochentage, bettzeit, aufwachzeit }) => ({ wochentage, bettzeit, aufwachzeit })),
      istZustand: { aktuell: istZustandText },
    });
    schlafIstZustandGespeichertRef.current = istZustandText;
  };
  const handleSchlafIntervallTyp = (typ) => {
    const vorherText = schlafIntervallTyp === "fixed" ? "Täglich" : "Bestimmte Wochentage";
    const nachherText = typ === "fixed" ? "Täglich" : "Bestimmte Wochentage";
    setSchlafIntervallTyp(typ);
    speichereSchlafplan(typ, schlafBloecke, schlafIstZustand);
    if (typ !== schlafIntervallTyp) {
      aenderungVermerken({ kategorie: "schlaf", itemName: "Schlafplan", aktion: "geändert", detail: `Intervall: ${vorherText} → ${nachherText}` });
    }
  };
  const handleSchlafBloecke = (neueBloecke) => {
    const vorherDetail = beschreibeSchlafbloecke(schlafBloecke);
    setSchlafBloecke(neueBloecke);
    speichereSchlafplan(schlafIntervallTyp, neueBloecke, schlafIstZustand);
    aenderungVermerken({ kategorie: "schlaf", itemName: "Schlafplan", aktion: "geändert", detail: `${vorherDetail} → ${beschreibeSchlafbloecke(neueBloecke)}` });
  };
  const handleSchlafIstZustand = (text) => {
    // Bewusst KEINE sofortige Speicherung/Protokollierung hier — anders als
    // Bloecke/Intervall (diskrete Taps) tippt man hier Zeichen für Zeichen;
    // ein Tagesverlauf-/Speicher-Aufruf pro Tastenanschlag wäre unbrauchbar
    // "geräuschig". Persistenz + Protokoll-Eintrag laufen deshalb entkoppelt
    // über den debounce-Effekt unten, erst 800ms nach der letzten Änderung.
    setSchlafIstZustand(text);
  };
  // Bug-Fix (Selbstprüfung vor dem Commit): schlafIntervallTyp/schlafBloecke
  // standen ursprünglich NICHT in den Dependencies dieses Debounce-Effekts —
  // klickte man kurz nach dem Tippen zusätzlich noch einen Wochentag an
  // (handleSchlafBloecke speichert sofort), lief der bereits laufende
  // 800ms-Timer trotzdem weiter und speicherte beim Auslösen die zu diesem
  // Zeitpunkt VERALTETEN Bloecke aus seinem eigenen Erstellungs-Zeitpunkt —
  // das hätte die gerade erst gespeicherte Bloecke-Änderung stillschweigend
  // wieder überschrieben. Jetzt als Dependency ergänzt: jede Bloecke-/
  // Intervall-Änderung bricht einen noch laufenden Text-Timer ab und
  // plant ihn (falls noch ein Text-Unterschied besteht) mit frischem
  // Stand neu — der Guard oben verhindert dabei unnötige Neu-Terminierung,
  // wenn der Text ohnehin schon aktuell gespeichert ist.
  useEffect(() => {
    if (routine !== "abend") return;
    if (schlafIstZustand === schlafIstZustandGespeichertRef.current) return;
    const timeout = setTimeout(() => {
      const vorher = schlafIstZustandGespeichertRef.current;
      speichereSchlafplan(schlafIntervallTyp, schlafBloecke, schlafIstZustand);
      aenderungVermerken({
        kategorie: "schlaf",
        itemName: "Schlafplan",
        aktion: "geändert",
        detail: `Aktueller Schlaf: ${vorher || "–"} → ${schlafIstZustand || "–"}`,
      });
    }, 800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schlafIstZustand, schlafIntervallTyp, schlafBloecke, routine]);
  // Nutzerin-Vorgabe (12.09.): dieser Reiter soll in erster Linie zeigen,
  // was heute in der Routine ansteht — bestätigen, fertig. Die Einrichtung
  // (Schritte, Playlist-Auswahl, Erinnerung, Zeitrahmen) wirkte bisher wie
  // eine offene Bearbeitungsmaske ("als würde ich die Maske bearbeiten
  // wollen") und ist jetzt hinter einem Klick zusammengeklappt.
  const [einstellungenOffen, setEinstellungenOffen] = useState(false);

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
      trainingNachDatum,
      trainingWochenplan,
      gewohnheiten,
      gewohnheitErledigt,
      workflowPlaene,
      workflowPresets,
      ausnahmenNachSchluessel,
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
    trainingNachDatum,
    trainingWochenplan,
    gewohnheiten,
    gewohnheitErledigt,
    workflowPlaene,
    workflowPresets,
    ausnahmenNachSchluessel,
    schritteFuerRoutine,
  ]);

  // Nutzerinnen-Vorgabe (17.09.): "Alle Veränderungen sollen immer im
  // Tagesverlauf mit auftauchen" — bisher rief useRoutinen.js an keiner
  // Stelle aenderungVermerken() auf. Ein Wrapper je Mutation statt einzeln
  // an jeder der (mehreren) Aufrufstellen unten, damit keine übersehen wird.
  const schrittHinzufuegenUndProtokollieren = async (name, dauerMin) => {
    const result = await routineSchrittHinzufuegen(routine, name, dauerMin);
    if (result?.ok !== false) {
      aenderungVermerken({ kategorie: ROUTINE_ANLASS[routine], itemName: name, aktion: "hinzugefügt", detail: `${dauerMin || 5} Min.` });
    }
    return result;
  };
  const schrittEntfernenUndProtokollieren = (id) => {
    const schritt = schritteFuerRoutine.find((s) => s.id === id);
    routineSchrittEntfernen(id);
    if (schritt) {
      aenderungVermerken({ kategorie: ROUTINE_ANLASS[routine], itemName: schritt.name, aktion: "entfernt", detail: `${schritt.dauerMin} Min.` });
    }
  };
  const schrittVerschiebenUndProtokollieren = (id, richtung) => {
    const schritt = schritteFuerRoutine.find((s) => s.id === id);
    routineSchrittVerschieben(id, richtung);
    if (schritt) {
      aenderungVermerken({
        kategorie: ROUTINE_ANLASS[routine],
        itemName: schritt.name,
        aktion: "geändert",
        detail: `Reihenfolge geändert (${richtung === "hoch" ? "nach oben" : "nach unten"})`,
      });
    }
  };
  const zeitrahmenAendernUndProtokollieren = (neueStartZeit, neueEndZeit) => {
    const vorherStart = einstellung.startZeit;
    const vorherEnde = einstellung.endZeit;
    routineZeitrahmenSetzen(routine, neueStartZeit, neueEndZeit);
    if (neueStartZeit === vorherStart && neueEndZeit === vorherEnde) return;
    aenderungVermerken({
      kategorie: ROUTINE_ANLASS[routine],
      itemName: ROUTINE_LABEL[routine],
      aktion: "geändert",
      detail: `Zeitrahmen: ${vorherStart || "–"}–${vorherEnde || "–"} → ${neueStartZeit || "–"}–${neueEndZeit || "–"}`,
    });
  };

  const uebernehmen = (item) => {
    const dauerMin = item.raw?.dauerMin || 5;
    schrittHinzufuegenUndProtokollieren(item.name, dauerMin);
  };

  // Übergabe an <KiChat onUebernehmen> weiter unten: lässt Aka aus dem
  // Gespräch eine ganze Schritt-Kette bauen (z. B. "Wasser, 2 Min. ans
  // Fenster, Medikament") — legt jeden Schritt über denselben Weg an wie das
  // manuelle "Schritte einrichten" oben (routineSchrittHinzufuegen).
  const handleRoutineUebernehmen = async (verlauf) => {
    const schritte = await AIService.routineAusChat({ verlauf, coachName: getCoachName() });
    schritte.forEach((s) => schrittHinzufuegenUndProtokollieren(s.name, s.dauerMin || 5));
    return schritte;
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
  // Nur ein Hinweis, WELCHE Playlist zugeordnet ist — die Auswahl selbst
  // (SpotifyAnlassPicker mit allen Pills) lebt jetzt in "Einstellungen"
  // (Nutzerin-Vorgabe: "welche Playlist grade gespielt wird [...] aber
  // nicht diese ganzen Wahlpunkte").
  const aktuellePlaylistName = spotifyPlaylists.find((p) => p.id === spotifyAnlaesse[ROUTINE_ANLASS[routine]]?.playlistId)?.name;

  const content = (
    <>
      {!embedded && <ViewHeader title={`${ROUTINE_EMOJI[routine]} ${ROUTINE_LABEL[routine]}`} onHome={onHome} />}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
          {ROUTINE_EMOJI[routine]} {ROUTINE_LABEL[routine]}
        </div>
        {aktuellePlaylistName && <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>🎵 Playlist: {aktuellePlaylistName}</div>}
        <PrimaryButton onClick={() => setAblaufAktiv(true)}>▶️ {ROUTINE_LABEL[routine]} starten</PrimaryButton>
      </Card>

      {/* Das Eigentliche: was heute in der Routine ansteht, mit direktem
          Bestätigungspunkt je Schritt — dieselbe Checkliste wie auf der
          Startseite (Nutzerin-Vorgabe, 12.09.: "was in der Morgenroutine
          vermerkt ist, was zu tun ist, und daneben, wie ich das
          bestätige"). Die leere-Zustand-Meldung übernimmt die Komponente
          selbst, kein doppelter Hinweis hier nötig. */}
      <RoutineHeuteChecklist routine={routine} />

      <button
        type="button"
        onClick={() => setEinstellungenOffen((o) => !o)}
        style={{
          marginTop: 16,
          marginBottom: 8,
          border: "none",
          background: "transparent",
          color: farbe,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          padding: 0,
        }}
      >
        {einstellungenOffen ? "Einstellungen ausblenden" : "⚙️ Einstellungen"}
      </button>

      {einstellungenOffen && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Schritte einrichten</div>
            <RoutineSchritteEditor
              routine={routine}
              schritte={schritteFuerRoutine}
              onHinzufuegen={schrittHinzufuegenUndProtokollieren}
              mahlzeiten={mahlzeiten}
              supplemente={supplemente}
              hormone={hormone}
              trainingWochenplan={trainingWochenplan}
              gewohnheiten={gewohnheiten}
            />
          </Card>

          <RoutineSchritteListe
            routine={routine}
            schritte={schritteFuerRoutine}
            onEntfernen={schrittEntfernenUndProtokollieren}
            onVerschieben={schrittVerschiebenUndProtokollieren}
          />

          <Card style={{ marginBottom: 16 }}>
            <SpotifyAnlassPicker anlass={ROUTINE_ANLASS[routine]} label={`🎵 Playlist für die ${ROUTINE_LABEL[routine]}`} />
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
              <KategorieErinnerung kategorie={ROUTINE_ANLASS[routine]} label={`🔔 Erinnerung ${ROUTINE_LABEL[routine]}`} />
            </div>
          </Card>

          <div style={{ marginBottom: 16 }}>
            <KiChat
              bereich={ROUTINE_ANLASS[routine]}
              systemPrompt={`Du hilfst dabei, eine ${ROUTINE_LABEL[routine]} für eine bestehende App als feste Kette von 3-6 kurzen Schritten aufzubauen. Frag nach, was die Person sowieso schon jeden Tag macht (kein Neuanfang von null), in welcher Reihenfolge, und wie lange jeder Schritt ungefähr dauert, bevor ihr fertig seid. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code.`}
              einleitung={`Hi, ich bin ${getCoachName()}! Lass uns deine ${ROUTINE_LABEL[routine]} als feste Schritt-Kette aufbauen — was machst du morgens/abends sowieso schon?`}
              onUebernehmen={handleRoutineUebernehmen}
              uebernehmenLabel="Schritte anlegen"
              renderErgebnis={(schritte) => (
                <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
                  {schritte.length} Schritte angelegt: {schritte.map((s) => s.name).join(" → ")}
                </div>
              )}
            />
          </div>

          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Zeitrahmen</div>
            <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
              Grober Rahmen, z. B. 6:00–9:00 Uhr — dient auch dazu, andere geplante Punkte zu erkennen, die in diese Zeit fallen.
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <TimeWheelField value={einstellung.startZeit} onChange={(v) => zeitrahmenAendernUndProtokollieren(v, einstellung.endZeit)} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: textMuted }}>–</div>
              <div style={{ flex: 1 }}>
                <TimeWheelField value={einstellung.endZeit} onChange={(v) => zeitrahmenAendernUndProtokollieren(einstellung.startZeit, v)} />
              </div>
            </div>
            <ItemVerlauf kategorie={ROUTINE_ANLASS[routine]} itemName={ROUTINE_LABEL[routine]} />
          </Card>

          {routine === "abend" && (
            <>
              <SchlafplanCard
                intervallTyp={schlafIntervallTyp}
                onIntervallTypChange={handleSchlafIntervallTyp}
                bloecke={schlafBloecke}
                onBloeckeChange={handleSchlafBloecke}
                istZustand={schlafIstZustand}
                onIstZustandChange={handleSchlafIstZustand}
              />
              <div style={{ marginTop: -8, marginBottom: 16 }}>
                <ItemVerlauf kategorie="schlaf" itemName="Schlafplan" />
              </div>
            </>
          )}

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
        </>
      )}
    </>
  );

  return embedded ? content : <Shell>{content}</Shell>;
}
