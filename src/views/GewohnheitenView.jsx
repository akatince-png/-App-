import React, { useState } from "react";
import { Shell, Card, Label, Pill, PrimaryButton, TextInput } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import GrundEingabe from "../ui/GrundEingabe";
import TimeWheelField from "../ui/TimeWheelField";
import { cardBorder, danger, textMuted } from "../ui/theme";
import { useAppData } from "../context/AppDataContext";
import { AIService } from "../services/aiService";
import { getCoachName } from "../utils/coachStorage";
import KiChat from "../ui/KiChat";
import { KATEGORIE_META } from "../utils/dayItems";
import { toLocalISODate, verspaetungText } from "../utils/dates";
import RoutineAblauf from "../ui/RoutineAblauf";
import RoutineSchritteEditor from "../ui/RoutineSchritteEditor";
import SpotifyAnlassPicker from "../ui/SpotifyAnlassPicker";
import WorkflowTimer from "../ui/WorkflowTimer";
import KategorieErinnerung from "../ui/KategorieErinnerung";

// Bereichseigene Farbe statt der generischen Marken-Akzentfarbe —
// Gewohnheiten sind Teal, passend zu den bunten Home-Mini-Widgets.
const { text: accentDark, bg: accentSoft } = KATEGORIE_META.gewohnheit;

const ICON_OPTIONEN = ["🌱", "🧘", "📖", "🚶", "✍️", "🎯", "☀️", "💤", "🥗", "🚭"];

const LEERE_GEWOHNHEIT = { name: "", icon: "🌱", uhrzeit: "", urzeitVon: "", urzeitBis: "", zielTage: "", menge: "" };

function Fortschrittsbalken({ tage, ziel }) {
  const pct = ziel ? Math.min(100, Math.round((tage / ziel) * 100)) : 0;
  return (
    <div style={{ height: 8, borderRadius: 4, background: "#EEF1EE", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "#5E9468", borderRadius: 4, transition: "width 0.2s" }} />
    </div>
  );
}

function GewohnheitKarte({ g, heuteErledigt, onToggleHeute, onEntfernen, onZielAendern, gesamtTage, aktuelleSerie }) {
  const [zielEditOpen, setZielEditOpen] = useState(false);
  const [zielEntwurf, setZielEntwurf] = useState(g.zielTage ? String(g.zielTage) : "");
  const [zielGrund, setZielGrund] = useState("");
  const tage = gesamtTage(g.id);
  const serie = aktuelleSerie(g.id);

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 20 }}>{g.icon}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {g.name}
              {g.menge && <span style={{ fontWeight: 600, color: textMuted }}> · {g.menge}</span>}
            </div>
            {(g.uhrzeit || g.urzeitVon) && (
              <div style={{ fontSize: 11, color: textMuted }}>
                {g.urzeitVon && g.urzeitBis ? `${g.urzeitVon}–${g.urzeitBis} Uhr` : g.uhrzeit ? `${g.uhrzeit} Uhr` : ""}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => onEntfernen(g)}
          style={{ border: "none", background: "transparent", color: danger, fontSize: 18, cursor: "pointer" }}
          title="Gewohnheit löschen"
        >
          ×
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: textMuted }}>
          {serie > 0 ? <span style={{ color: accentDark, fontWeight: 700 }}>🔥 {serie} Tage in Folge</span> : "Noch keine Serie"}
        </div>
        <div style={{ fontSize: 12, color: textMuted }}>{tage} Tage insgesamt</div>
      </div>

      {g.zielTage ? (
        <>
          <Fortschrittsbalken tage={tage} ziel={g.zielTage} />
          <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>
            {tage} / {g.zielTage} Tage bis zum Ziel
          </div>
        </>
      ) : (
        <div style={{ fontSize: 11, color: textMuted, fontStyle: "italic" }}>Kein Ziel gesetzt — offen fortlaufend.</div>
      )}

      {zielEditOpen ? (
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <div style={{ width: 90 }}>
            <TextInput type="number" value={zielEntwurf} onChange={setZielEntwurf} placeholder="z. B. 66" />
          </div>
          <button
            onClick={() => {
              onZielAendern(g, zielEntwurf ? Number(zielEntwurf) : null, zielGrund);
              setZielGrund("");
              setZielEditOpen(false);
            }}
            style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: accentDark, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Speichern
          </button>
          <button
            onClick={() => setZielEditOpen(false)}
            style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${cardBorder}`, background: "#fff", color: textMuted, fontSize: 12, cursor: "pointer" }}
          >
            Abbrechen
          </button>
        </div>
      ) : null}
      {zielEditOpen && <GrundEingabe grund={zielGrund} onChange={setZielGrund} />}
      {!zielEditOpen && (
        <button
          onClick={() => setZielEditOpen(true)}
          style={{ marginTop: 8, border: "none", background: "transparent", color: accentDark, fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: 0 }}
        >
          Ziel bearbeiten
        </button>
      )}

      <div style={{ marginTop: 14 }}>
        <PrimaryButton onClick={onToggleHeute} variant={heuteErledigt ? "success" : "accent"}>
          {heuteErledigt ? "✓ Heute erledigt" : "Heute erledigen"}
        </PrimaryButton>
      </div>
    </Card>
  );
}

export default function GewohnheitenView({ onHome }) {
  const {
    gewohnheiten,
    gewohnheitErledigt,
    gewohnheitHinzufuegen,
    gewohnheitEntfernen,
    gewohnheitZielAktualisieren,
    toggleGewohnheitErledigt,
    gesamtTage,
    aktuelleSerie,
    aenderungVermerken,
    routineSchritte,
    routineSchrittHinzufuegen,
    routineSchrittEntfernen,
    routineSchrittVerschieben,
    routineDurchlaufSpeichern,
  } = useAppData();

  const [neu, setNeu] = useState(LEERE_GEWOHNHEIT);
  const [fehler, setFehler] = useState(null);
  const heute = toLocalISODate(new Date());
  // Morgen-/Abendroutine bekommt hier einen prominenten Einstieg, seit
  // "Gewohnheiten" im Home-Menü zu "Routinen" wurde (Nutzerinnen-Vorgabe,
  // 13.08.) — derselbe geführte Ablauf-Screen wie im Tagesplan.
  const [ablaufRoutine, setAblaufRoutine] = useState(null);
  const [schritteBearbeiten, setSchritteBearbeiten] = useState({ morgen: false, abend: false });
  // Workflow-Intervalltimer (14.08., Nutzerin-Vorgabe): eigener, einfacher
  // Konzentrations-Timer neben den Gewohnheiten — siehe WorkflowTimer.jsx.
  const [workflowOffen, setWorkflowOffen] = useState(false);

  // Lückenloses Tagesprotokoll (Nutzerinnen-Vorgabe 28.07.): beim Abhaken
  // (nicht beim Zurücknehmen) wird die Erledigung — inkl. Verspätung
  // gegenüber der geplanten Uhrzeit — im Änderungsprotokoll vermerkt.
  const handleToggleHeute = (g) => {
    const warErledigt = !!gewohnheitErledigt[`${heute}__${g.id}`];
    toggleGewohnheitErledigt(heute, g.id);
    if (!warErledigt) {
      const verspaetung = verspaetungText(g.uhrzeit);
      aenderungVermerken({ kategorie: "gewohnheit", itemName: g.name, aktion: "erledigt", detail: verspaetung || "" });
    }
  };

  const submit = async () => {
    setFehler(null);
    const result = await gewohnheitHinzufuegen({ ...neu, zielTage: neu.zielTage ? Number(neu.zielTage) : null });
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    const timeDetail = neu.urzeitVon && neu.urzeitBis ? `Zeitfenster: ${neu.urzeitVon}–${neu.urzeitBis}` : neu.uhrzeit ? `Uhrzeit: ${neu.uhrzeit}` : "";
    aenderungVermerken({
      kategorie: "gewohnheit",
      itemName: neu.name,
      aktion: "hinzugefügt",
      detail: timeDetail,
    });
    setNeu(LEERE_GEWOHNHEIT);
  };

  // Übergabe an <KiChat onUebernehmen>: lässt die KI aus dem Gespräch die
  // fertige Gewohnheit extrahieren und legt sie über denselben Weg an wie
  // das manuelle Formular unten.
  const handleGewohnheitUebernehmen = async (verlauf) => {
    const g = await AIService.gewohnheitAusChat({ verlauf, coachName: getCoachName() });
    const result = await gewohnheitHinzufuegen({
      name: g.name,
      icon: g.icon || "🌱",
      menge: g.menge || "",
      uhrzeit: g.uhrzeit || "",
      urzeitVon: g.urzeitVon || "",
      urzeitBis: g.urzeitBis || "",
      zielTage: g.zielTage ?? null,
    });
    if (!result?.ok) throw new Error(result?.error || "Speichern fehlgeschlagen.");
    aenderungVermerken({
      kategorie: "gewohnheit",
      itemName: g.name,
      aktion: "hinzugefügt",
      detail: g.uhrzeit ? `Uhrzeit: ${g.uhrzeit}` : g.urzeitVon ? `Zeitfenster: ${g.urzeitVon}–${g.urzeitBis}` : "",
    });
    return g;
  };

  const handleEntfernen = (g) => {
    aenderungVermerken({
      kategorie: "gewohnheit",
      itemName: g.name,
      aktion: "entfernt",
      detail: g.zielTage ? `Ziel war: ${g.zielTage} Tage` : "",
    });
    gewohnheitEntfernen(g.id);
  };

  const handleZielAendern = (g, neuesZiel, grund) => {
    aenderungVermerken({
      kategorie: "gewohnheit",
      itemName: g.name,
      aktion: "geändert",
      detail: `Ziel: ${g.zielTage ?? "offen"} → ${neuesZiel ?? "offen"} Tage`,
      grund,
    });
    gewohnheitZielAktualisieren(g.id, neuesZiel);
  };

  if (workflowOffen) {
    return <WorkflowTimer onSchliessen={() => setWorkflowOffen(false)} />;
  }

  if (ablaufRoutine) {
    const schritteFuerRoutine = routineSchritte.filter((s) => s.routine === ablaufRoutine).sort((a, b) => a.reihenfolge - b.reihenfolge);
    return (
      <RoutineAblauf
        routine={ablaufRoutine}
        schritte={schritteFuerRoutine}
        onAbschluss={() => setAblaufRoutine(null)}
        onAbbrechen={() => setAblaufRoutine(null)}
        routineDurchlaufSpeichern={routineDurchlaufSpeichern}
      />
    );
  }

  return (
    <Shell bereich="gewohnheit">
      <ViewHeader title="🌱 Routinen" onHome={onHome} />
      <div style={{ fontSize: 12, color: textMuted, marginBottom: 18 }}>
        Baue neue Gewohnheiten auf — Achtsamkeit, Lesen oder was du dir vornimmst. Erscheint mit Uhrzeit auch im Tagesplan zum Abhaken.
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>🌅🌙 Morgen- & Abendroutine</div>
        <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
          Lass dich Schritt für Schritt durch deinen Morgen/Abend begleiten.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={() => setAblaufRoutine("morgen")}>▶️ Morgenroutine</PrimaryButton>
          </div>
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={() => setAblaufRoutine("abend")}>▶️ Abendroutine</PrimaryButton>
          </div>
          <button
            type="button"
            onClick={() => setSchritteBearbeiten((p) => ({ ...p, morgen: !p.morgen || !p.abend, abend: !p.morgen || !p.abend }))}
            style={{ border: `1px solid ${cardBorder}`, borderRadius: 12, background: "#fff", color: textMuted, fontSize: 18, cursor: "pointer", padding: "0 12px" }}
          >
            ⚙️
          </button>
        </div>
        {(schritteBearbeiten.morgen || schritteBearbeiten.abend) && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 10 }}>🌅 Morgenroutine-Schritte</div>
            <RoutineSchritteEditor
              routine="morgen"
              schritte={routineSchritte.filter((s) => s.routine === "morgen")}
              onHinzufuegen={(name, dauerMin) => routineSchrittHinzufuegen("morgen", name, dauerMin)}
              onEntfernen={routineSchrittEntfernen}
              onVerschieben={routineSchrittVerschieben}
            />
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 14 }}>🌙 Abendroutine-Schritte</div>
            <RoutineSchritteEditor
              routine="abend"
              schritte={routineSchritte.filter((s) => s.routine === "abend")}
              onHinzufuegen={(name, dauerMin) => routineSchrittHinzufuegen("abend", name, dauerMin)}
              onEntfernen={routineSchrittEntfernen}
              onVerschieben={routineSchrittVerschieben}
            />
          </>
        )}
        <SpotifyAnlassPicker anlass="morgenroutine" label="🎵 Playlist für die Morgenroutine" />
        <SpotifyAnlassPicker anlass="abendroutine" label="🎵 Playlist für die Abendroutine" />
      </Card>

      <div className="mp-routinen-oben-grid">
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>⏱️ Workflow</div>
          <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 10 }}>
            Konzentriert arbeiten in Intervallen — z. B. 25 Minuten Arbeit, 5 Minuten Pause — mit eigener Playlist.
          </div>
          <PrimaryButton onClick={() => setWorkflowOffen(true)}>▶️ Workflow starten</PrimaryButton>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>🎵 Musik für deine Gewohnheiten</div>
          <div style={{ fontSize: 11.5, color: textMuted, marginBottom: 4 }}>
            Eine Playlist, die zu allen deinen sonstigen Gewohnheiten passt — spielst du dir selbst über "Jetzt testen" an, wenn du startest.
          </div>
          <SpotifyAnlassPicker anlass="gewohnheiten" label="" />
        </Card>
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>🔔 Erinnerungen</div>
      <Card style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <KategorieErinnerung kategorie="morgenroutine" label="🌅 Morgenroutine" />
        <KategorieErinnerung kategorie="abendroutine" label="🌆 Abendroutine" />
        <KategorieErinnerung kategorie="workflow" label="🔁 Workflow" mitTagen />
        <KategorieErinnerung kategorie="gewohnheiten" label="🌱 Gewohnheiten (alle, siehe unten)" />
      </Card>

      <div style={{ marginBottom: 16 }}>
        <KiChat
          bereich="gewohnheiten"
          systemPrompt="Du hilfst dabei, eine neue Gewohnheit/Routine für eine bestehende App einzurichten. Frag nach, was noch fehlt (z. B. Uhrzeit oder Zeitfenster, Umfang/Menge, ob es ein Zieltage-Ende geben soll oder offen fortlaufend sein soll), bevor ihr fertig seid. Antworte auf Deutsch, in normalem Fließtext, keine Aufzählungen von JSON oder Code."
          einleitung={`Hi, ich bin ${getCoachName()}! Welche Gewohnheit möchtest du dir aufbauen?`}
          onUebernehmen={handleGewohnheitUebernehmen}
          uebernehmenLabel="Gewohnheit anlegen"
          renderErgebnis={(g) => (
            <div style={{ padding: 12, borderRadius: 12, background: accentSoft, fontSize: 12.5, lineHeight: 1.6 }}>
              "{g.name}" wurde angelegt{g.uhrzeit ? ` · ${g.uhrzeit} Uhr` : g.urzeitVon ? ` · ${g.urzeitVon}–${g.urzeitBis} Uhr` : ""}
              {g.menge ? ` · ${g.menge}` : ""}
            </div>
          )}
        />
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Neue Gewohnheit (manuell)</div>
      <Card style={{ marginBottom: 16 }}>
        <Label>Name</Label>
        <TextInput value={neu.name} onChange={(v) => setNeu((p) => ({ ...p, name: v }))} placeholder="z. B. 10 Minuten lesen" />

        <Label>Symbol</Label>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {ICON_OPTIONEN.map((icon) => (
            <Pill key={icon} label={icon} selected={neu.icon === icon} onClick={() => setNeu((p) => ({ ...p, icon }))} />
          ))}
        </div>

        <Label>Menge / Umfang (optional)</Label>
        <TextInput value={neu.menge} onChange={(v) => setNeu((p) => ({ ...p, menge: v }))} placeholder="z. B. 20 Seiten, 10 Minuten" />

        <Label>Uhrzeit (optional — für den Tagesplan)</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Pill
            label="Feste Uhrzeit"
            selected={!neu.urzeitVon && neu.uhrzeit}
            onClick={() => setNeu((p) => ({ ...p, urzeitVon: "", urzeitBis: "", uhrzeit: neu.uhrzeit || "12:00" }))}
          />
          <Pill
            label="Zeitfenster"
            selected={!!neu.urzeitVon}
            onClick={() => setNeu((p) => ({ ...p, uhrzeit: "", urzeitVon: neu.urzeitVon || "09:00", urzeitBis: neu.urzeitBis || "17:00" }))}
          />
        </div>
        {neu.urzeitVon ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <TimeWheelField value={neu.urzeitVon} onChange={(v) => setNeu((p) => ({ ...p, urzeitVon: v }))} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: textMuted }}>–</div>
            <div style={{ flex: 1 }}>
              <TimeWheelField value={neu.urzeitBis} onChange={(v) => setNeu((p) => ({ ...p, urzeitBis: v }))} />
            </div>
          </div>
        ) : (
          <TimeWheelField value={neu.uhrzeit} onChange={(v) => setNeu((p) => ({ ...p, uhrzeit: v }))} />
        )}

        <Label>Eigenes Ziel in Tagen (optional)</Label>
        <TextInput type="number" value={neu.zielTage} onChange={(v) => setNeu((p) => ({ ...p, zielTage: v }))} placeholder="z. B. 66" />
        <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>
          Für neue Gewohnheiten werden oft 21–66 Tage genannt — nur ein Anhaltspunkt. Du kannst ein eigenes Ziel setzen oder es leer lassen.
        </div>

        {fehler && <div style={{ fontSize: 12, color: danger, marginTop: 6 }}>{fehler}</div>}
        <div style={{ marginTop: 10 }}>
          <PrimaryButton onClick={submit} disabled={!neu.name.trim()}>
            + Gewohnheit anlegen
          </PrimaryButton>
        </div>
      </Card>

      {gewohnheiten.length === 0 ? (
        <Card>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>
            Noch keine Gewohnheiten angelegt — leg oben deine erste an.
          </div>
        </Card>
      ) : (
        <div className="mp-routinen-liste-grid">
          {gewohnheiten.map((g) => (
            <GewohnheitKarte
              key={g.id}
              g={g}
              heuteErledigt={!!gewohnheitErledigt[`${heute}__${g.id}`]}
              onToggleHeute={() => handleToggleHeute(g)}
              onEntfernen={handleEntfernen}
              onZielAendern={handleZielAendern}
              gesamtTage={gesamtTage}
              aktuelleSerie={aktuelleSerie}
            />
          ))}
        </div>
      )}
    </Shell>
  );
}
