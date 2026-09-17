import React, { useMemo, useState } from "react";
import { Shell, Card } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import { accent, accentDark, cardBorder, danger, textMain, textMuted } from "../ui/theme";
import { KATEGORIE_META } from "../utils/dayItems";
import { uebungGewichtText, uebungWiederholungenText } from "../ui/UebungenEditor";
import { useAppData } from "../context/AppDataContext";
import ProtokollSeitenView from "./plan/ProtokollSeitenView";
import { useMehrfachauswahl } from "../ui/useMehrfachauswahl";
import MehrfachauswahlLeiste from "../ui/MehrfachauswahlLeiste";

// Anzeige-Beschriftung fürs Änderungsprotokoll — bewusst getrennt vom
// gespeicherten `aktion`-Wert, der u. a. von ausgefallenSweep.js zum
// Wiedererkennen bereits erfasster Einträge geprüft wird (`e.aktion ===
// "ausgefallen"`, siehe dort). Das rohe "ausgefallen" klingt wie ein
// Verdikt ("durchgefallen") — App-Bauplan-Punkt: wohlwollende Sprache
// auch außerhalb des KI-Chats, nicht nur dort, wo ohnehin schon der
// Assistenten-Systemprompt greift (aiService.js, "motivierend statt
// beschämend").
const AKTION_ANZEIGE = {
  ausgefallen: "Nicht geschafft",
};

// Siehe Kommentar bei aenderungGruppen weiter unten — nur echte
// Tagesereignisse gehören in den Tagesverlauf, keine Struktur-Änderungen.
const TAGESVERLAUF_AKTIONEN = ["erledigt", "ausgefallen", "Ausnahme zurückgenommen"];

function datumLabel(datumStr) {
  const [y, m, d] = datumStr.split("-");
  const datum = new Date(`${datumStr}T12:00:00`);
  const wochentag = datum.toLocaleDateString("de-DE", { weekday: "short" });
  return `${wochentag}., ${d}.${m}.${y}`;
}

function Zeile({ label, wert }) {
  if (!wert) return null;
  return (
    <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
      {label}: <span style={{ color: textMain, fontWeight: 600 }}>{wert}</span>
    </div>
  );
}

function TrainingProtokollKarte({ e, ausgewaehlt, onUmschalten, onLoeschen }) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
          <input
            type="checkbox"
            checked={ausgewaehlt}
            onChange={onUmschalten}
            style={{ marginTop: 4, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: textMain }}>
              {e.art}
              {e.name && <span style={{ fontWeight: 600 }}> · {e.name}</span>}
              {!e.erledigt && (
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: textMuted, background: cardBorder, borderRadius: 6, padding: "2px 6px" }}>
                  nicht abgeschlossen
                </span>
              )}
            </div>
            {e.uhrzeit && <div style={{ fontSize: 11.5, color: textMuted, marginTop: 1 }}>{e.uhrzeit}</div>}
          </div>
        </div>
        <button
          type="button"
          onClick={onLoeschen}
          title="Endgültig löschen"
          style={{ flexShrink: 0, border: "none", background: "transparent", color: danger, fontSize: 14, cursor: "pointer", padding: "2px 4px" }}
        >
          🗑
        </button>
      </div>

      {e.art === "Krafttraining" && (e.uebungen || []).length > 0 && (
        <div style={{ marginTop: 10 }}>
          {e.uebungen
            .filter((u) => u.name)
            .map((u, i) => (
              <div key={i} style={{ padding: "8px 0", borderTop: i > 0 ? `1px solid ${cardBorder}` : "none" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: textMain }}>{u.name}</div>
                <div style={{ fontSize: 12, color: accentDark, fontWeight: 700, marginTop: 1 }}>
                  {u.saetze || "?"} Sätze × {uebungWiederholungenText(u) || "?"} Wdh.{uebungGewichtText(u) && ` · ${uebungGewichtText(u)}`}
                </div>
                {u.pauseSekunden && <div style={{ fontSize: 11, color: textMuted, marginTop: 1 }}>Pause: {u.pauseSekunden}s zwischen den Sätzen</div>}
              </div>
            ))}
        </div>
      )}

      {e.art !== "Krafttraining" && (
        <div style={{ marginTop: 8 }}>
          <Zeile label="Dauer" wert={e.dauerMin ? `${e.dauerMin} min` : null} />
          <Zeile label="Distanz" wert={e.distanzKm ? `${e.distanzKm} km` : null} />
          <Zeile label="Ø Puls" wert={e.puls ? `${e.puls} bpm` : null} />
          <Zeile label="Runden" wert={e.runden} />
        </div>
      )}

      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Zeile label="RPE" wert={e.rpe} />
        <Zeile label="Kalorien" wert={e.kalorien ? `${e.kalorien} kcal` : null} />
        <Zeile label="Energielevel" wert={e.energielevel} />
        <Zeile label="Schmerzen" wert={e.schmerzen} />
      </div>
      {e.bemerkungen && (
        <div style={{ fontSize: 12, color: textMuted, marginTop: 8, fontStyle: "italic" }}>„{e.bemerkungen}“</div>
      )}
    </Card>
  );
}

function AenderungKarte({ e, ausgewaehlt, onUmschalten, onLoeschen }) {
  const k = KATEGORIE_META[e.kategorie] || { dot: cardBorder, text: textMuted };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, padding: "10px 0", borderBottom: `1px solid ${cardBorder}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0, flex: 1 }}>
        <input
          type="checkbox"
          checked={ausgewaehlt}
          onChange={onUmschalten}
          style={{ marginTop: 3, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: k.dot, flexShrink: 0 }} />
            <div style={{ fontSize: 13, fontWeight: 700 }}>{e.itemName}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: k.text }}>{AKTION_ANZEIGE[e.aktion] || e.aktion}</div>
          </div>
          {e.detail && <div style={{ fontSize: 12, color: textMuted, marginTop: 2, marginLeft: 16 }}>{e.detail}</div>}
          {e.grund && <div style={{ fontSize: 12, color: textMuted, marginTop: 2, marginLeft: 16, fontStyle: "italic" }}>„{e.grund}“</div>}
        </div>
      </div>
      <button
        onClick={() => onLoeschen(e.id)}
        title="Eintrag löschen"
        style={{ flexShrink: 0, border: "none", background: "transparent", color: danger, fontSize: 12, cursor: "pointer", padding: "2px 4px" }}
      >
        🗑
      </button>
    </div>
  );
}

const KATEGORIE_LABEL = {
  schlaf: "Schlaf",
  hydration: "Hydration",
  tageslicht: "Tageslicht",
  ernaehrung: "Ernährung",
  training: "Training",
  gewohnheiten: "Gewohnheiten",
  supplemente: "Supplemente",
  medikamente: "Medikamente",
  morgenroutine: "Morgenroutine",
  abendroutine: "Abendroutine",
  projekt: "Projekte & Zeitblöcke",
};

// Generischer Snapshot-Renderer statt eigener Formatierung je Kategorie
// (die haben alle unterschiedliche Datenstrukturen, siehe
// MehrTab.jsx/snapshotFuer) — zeigt bei Listen Anzahl + soweit vorhanden
// Namen, sonst den rohen Wert.
function VersionSnapshot({ snapshot }) {
  if (!snapshot || (typeof snapshot === "object" && Object.keys(snapshot).length === 0)) {
    return <div style={{ fontSize: 11.5, color: textMuted, marginTop: 4 }}>Keine Daten zu diesem Zeitpunkt.</div>;
  }
  const eintraege = typeof snapshot === "object" ? Object.entries(snapshot) : [["Wert", snapshot]];
  return (
    <div style={{ marginTop: 6 }}>
      {eintraege.map(([key, val]) => (
        <div key={key} style={{ fontSize: 11.5, color: textMuted, marginTop: 3 }}>
          <span style={{ fontWeight: 700 }}>{key}: </span>
          {Array.isArray(val)
            ? val.length === 0
              ? "leer"
              : `${val.length} Eintr${val.length === 1 ? "ag" : "äge"} — ${val
                  .slice(0, 6)
                  .map((v) => (typeof v === "object" ? v?.name || v?.wochentag || "?" : String(v)))
                  .join(", ")}${val.length > 6 ? "…" : ""}`
            : val && typeof val === "object"
              ? JSON.stringify(val)
              : String(val)}
        </div>
      ))}
    </div>
  );
}

function VersionKarte({ v, ausgewaehlt, onUmschalten, onLoeschen }) {
  const [offen, setOffen] = useState(false);
  return (
    <div style={{ padding: "10px 0", borderBottom: `1px solid ${cardBorder}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <input
          type="checkbox"
          checked={ausgewaehlt}
          onChange={onUmschalten}
          style={{ marginTop: 4, width: 16, height: 16, flexShrink: 0, cursor: "pointer" }}
        />
        <button onClick={() => setOffen((o) => !o)} className="mp-tap" style={{ flex: 1, textAlign: "left", background: "transparent", border: "none", cursor: "pointer", padding: 0, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{KATEGORIE_LABEL[v.kategorie] || v.kategorie}</div>
          <div style={{ fontSize: 11, color: textMuted, marginTop: 1 }}>
            {new Date(v.erstellt_am).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </div>
          {v.notiz && <div style={{ fontSize: 12, marginTop: 3, fontStyle: "italic" }}>„{v.notiz}“</div>}
        </button>
        <button
          onClick={() => onLoeschen(v.id)}
          title="Version löschen"
          style={{ flexShrink: 0, border: "none", background: "transparent", color: danger, fontSize: 12, cursor: "pointer", padding: "2px 4px" }}
        >
          🗑
        </button>
      </div>
      {offen && <VersionSnapshot snapshot={v.snapshot} />}
    </div>
  );
}

export default function ProtokollLogView({ onHome, embedded = false }) {
  const { trainingEintraege, trainingEntfernen, protokollEintraege, wochenprotokollSnapshots, aenderungEntfernen, versionen, versionLoeschen } =
    useAppData();

  // Bug-Fix (13.09.): Einzel-Löschen (🗑-Icon) synchronisierte die
  // Mehrfachauswahl bisher nicht — löschte man einen markierten Eintrag
  // einzeln, blieb seine ID im Auswahl-Set stehen. "X ausgewählt" zeigte
  // danach eine zu hohe Zahl, und "Alle löschen" fragte nach einer falschen
  // Anzahl an Einträgen, die es teils gar nicht mehr gibt.
  const handleVersionLoeschen = (id) => {
    if (!window.confirm("Diese Version endgültig löschen?")) return;
    versionLoeschen(id);
    versionAuswahl.entfernenAusAuswahl(id);
  };

  const handleAenderungLoeschen = (id) => {
    if (!window.confirm("Diesen Eintrag endgültig löschen?")) return;
    aenderungEntfernen(id);
    aenderungAuswahl.entfernenAusAuswahl(id);
  };

  const handleTrainingLoeschen = (id) => {
    if (!window.confirm("Diesen Trainings-Eintrag endgültig löschen?")) return;
    trainingEntfernen(id);
    trainingAuswahl.entfernenAusAuswahl(id);
  };

  const [seitenOffen, setSeitenOffen] = useState(false);
  const ersteWoche = wochenprotokollSnapshots.find((s) => s.wochenNummer === 1);

  // Bug-Fix (12.09., Nutzerin-Bericht "kann Training nicht entfernen, obwohl
  // alles gelöscht"): zeigte bisher nur erledigte Trainings — ein über "Jetzt
  // live starten"/Vorlage-Direktstart angelegter, aber nie beendeter Eintrag
  // (erledigt: false, z. B. über "Schließen" in der Live-Ansicht abgebrochen,
  // die den Eintrag NICHT löscht) blieb dadurch für sie unsichtbar und
  // unlöschbar, hielt aber trainingEintraege.length > 0 und damit den
  // Home-Widget dauerhaft "aktiv". Jetzt: alle Einträge, nicht nur erledigte.
  const alleTrainings = trainingEintraege;

  const gruppen = useMemo(() => {
    const map = new Map();
    alleTrainings.forEach((e) => {
      if (!map.has(e.datum)) map.set(e.datum, []);
      map.get(e.datum).push(e);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [alleTrainings]);

  // Nutzerinnen-Vorgabe (17.09.): "Die Veränderung selber ... soll
  // lediglich im Protokoll einsehbar sein, nicht im Tagesverlauf ... Der
  // Tagesverlauf soll immer den aktuellsten Stand der Dinge nach
  // entsprechenden Zeit- und Datumrahmen anzeigen." Strukturelle
  // Änderungen (Dosis/Zeitrahmen geändert, Schritt hinzugefügt/entfernt,
  // Version festgehalten) laufen seitdem NICHT mehr hier ein, sondern über
  // die neue <ItemVerlauf> direkt am jeweiligen Eintrag (siehe
  // MedikamenteView.jsx & Co.) — dieselbe Datenquelle (protokollEintraege),
  // nur anders gefiltert. Hier bleiben ausschließlich tatsächliche
  // Tagesereignisse: "erledigt" (Einnahme/Schritt bestätigt), "ausgefallen"
  // (nicht rechtzeitig bestätigt, siehe ausgefallenSweep.js), "Ausnahme
  // zurückgenommen" (Einzeltag-Ausnahme aufgehoben).
  const tagesverlaufEintraege = useMemo(
    () => protokollEintraege.filter((e) => TAGESVERLAUF_AKTIONEN.includes(e.aktion)),
    [protokollEintraege]
  );

  const aenderungGruppen = useMemo(() => {
    const map = new Map();
    tagesverlaufEintraege.forEach((e) => {
      const datum = e.erstelltAm.slice(0, 10);
      if (!map.has(datum)) map.set(datum, []);
      map.get(datum).push(e);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [tagesverlaufEintraege]);

  // Mehrfachauswahl (12.09., Nutzerin-Vorgabe: "in diesen Bereichen [den
  // Protokollen] möchte ich auch die Möglichkeit haben, mehrere Sachen
  // gleichzeitig zu löschen") — eine Auswahl je Bereich, unabhängig von der
  // Datums-Gruppierung darüber (Auswahl kann Einträge aus mehreren Tagen
  // gleichzeitig umfassen).
  const aenderungAuswahl = useMehrfachauswahl(tagesverlaufEintraege, (e) => e.id);
  const versionAuswahl = useMehrfachauswahl(versionen, (v) => v.id);
  const trainingAuswahl = useMehrfachauswahl(alleTrainings, (e) => e.id);

  const aenderungMehrfachLoeschen = () => {
    const ids = [...aenderungAuswahl.ausgewaehlt];
    if (ids.length === 0) return;
    if (!window.confirm(`Bist du sicher, dass du ${ids.length} Eintrag/Einträge endgültig entfernen möchtest? Das kann nicht rückgängig gemacht werden.`)) return;
    ids.forEach((id) => aenderungEntfernen(id));
    aenderungAuswahl.zuruecksetzen();
  };

  const versionMehrfachLoeschen = () => {
    const ids = [...versionAuswahl.ausgewaehlt];
    if (ids.length === 0) return;
    if (!window.confirm(`Bist du sicher, dass du ${ids.length} Version(en) endgültig entfernen möchtest? Das kann nicht rückgängig gemacht werden.`)) return;
    ids.forEach((id) => versionLoeschen(id));
    versionAuswahl.zuruecksetzen();
  };

  const trainingMehrfachLoeschen = () => {
    const ids = [...trainingAuswahl.ausgewaehlt];
    if (ids.length === 0) return;
    if (!window.confirm(`Bist du sicher, dass du ${ids.length} Trainings-Eintrag/Einträge endgültig entfernen möchtest? Das kann nicht rückgängig gemacht werden.`)) return;
    ids.forEach((id) => trainingEntfernen(id));
    trainingAuswahl.zuruecksetzen();
  };

  if (seitenOffen && ersteWoche) {
    return <ProtokollSeitenView snapshot={ersteWoche} onHome={() => setSeitenOffen(false)} />;
  }

  const content = (
    <>
      {!embedded && (
        <ViewHeader title="📖 Akas fertige Protokolle" onHome={onHome} />
      )}

      {ersteWoche && (
        <button
          onClick={() => setSeitenOffen(true)}
          className="mp-tap"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "14px 16px",
            borderRadius: 16,
            border: "none",
            background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
            color: "#fff",
            cursor: "pointer",
            marginBottom: 20,
            textAlign: "left",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>🎉 Dein erstes Wochen-Protokoll</div>
            <div style={{ fontSize: 11.5, opacity: 0.9 }}>Fertig zum Ansehen — 4 Seiten</div>
          </div>
          <span style={{ fontSize: 18 }}>›</span>
        </button>
      )}

      <div style={{ fontSize: 12, color: textMuted, marginBottom: 20 }}>
        Was du wirklich gemacht hast — nicht der Plan, sondern das tatsächliche Ergebnis.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>📝 Tagesverlauf</div>
        {protokollEintraege.length > 0 && (
          <MehrfachauswahlLeiste
            anzahlAusgewaehlt={aenderungAuswahl.ausgewaehlt.size}
            alleAusgewaehlt={aenderungAuswahl.alleAusgewaehlt}
            onAlleUmschalten={aenderungAuswahl.alleUmschalten}
            onMehrfachLoeschen={aenderungMehrfachLoeschen}
          />
        )}
      </div>
      {aenderungGruppen.length === 0 ? (
        <Card style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>
            Noch nichts protokolliert — sobald du eine Einnahme oder einen Schritt bestätigst, erscheint es hier, inklusive Verspätung gegenüber der geplanten Uhrzeit. Änderungen an den Plänen selbst (Dosis, Zeiten, ...) findest du direkt beim jeweiligen Eintrag unter „🕐 Verlauf".
          </div>
        </Card>
      ) : (
        aenderungGruppen.map(([datum, eintraege]) => (
          <div key={datum} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: textMain, marginBottom: 8 }}>{datumLabel(datum)}</div>
            <Card>
              {eintraege.map((e) => (
                <AenderungKarte
                  key={e.id}
                  e={e}
                  ausgewaehlt={aenderungAuswahl.ausgewaehlt.has(e.id)}
                  onUmschalten={() => aenderungAuswahl.umschalten(e.id)}
                  onLoeschen={handleAenderungLoeschen}
                />
              ))}
            </Card>
          </div>
        ))
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>🗂️ Baustein-Versionen</div>
        {versionen.length > 0 && (
          <MehrfachauswahlLeiste
            anzahlAusgewaehlt={versionAuswahl.ausgewaehlt.size}
            alleAusgewaehlt={versionAuswahl.alleAusgewaehlt}
            onAlleUmschalten={versionAuswahl.alleUmschalten}
            onMehrfachLoeschen={versionMehrfachLoeschen}
          />
        )}
      </div>
      {versionen.length === 0 ? (
        <Card style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>
            Noch keine Version festgehalten — unter Mehr → Aktuelles Protokoll kannst du bei jedem Baustein mit 📌 die
            aktuelle Einstellung sichern, bevor du sie änderst.
          </div>
        </Card>
      ) : (
        <Card style={{ marginBottom: 18 }}>
          {versionen.map((v) => (
            <VersionKarte
              key={v.id}
              v={v}
              ausgewaehlt={versionAuswahl.ausgewaehlt.has(v.id)}
              onUmschalten={() => versionAuswahl.umschalten(v.id)}
              onLoeschen={handleVersionLoeschen}
            />
          ))}
        </Card>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, fontWeight: 800 }}>🏋️ Training</div>
        {alleTrainings.length > 0 && (
          <MehrfachauswahlLeiste
            anzahlAusgewaehlt={trainingAuswahl.ausgewaehlt.size}
            alleAusgewaehlt={trainingAuswahl.alleAusgewaehlt}
            onAlleUmschalten={trainingAuswahl.alleUmschalten}
            onMehrfachLoeschen={trainingMehrfachLoeschen}
          />
        )}
      </div>
      {gruppen.length === 0 ? (
        <Card>
          <div style={{ fontSize: 13, color: textMuted, textAlign: "center" }}>
            Noch keine Trainings — sobald du eins live durchführst oder einträgst, erscheint es hier mit allen Details.
          </div>
        </Card>
      ) : (
        gruppen.map(([datum, eintraege]) => (
          <div key={datum} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: textMain, marginBottom: 8 }}>{datumLabel(datum)}</div>
            {eintraege.map((e) => (
              <TrainingProtokollKarte
                key={e.id}
                e={e}
                ausgewaehlt={trainingAuswahl.ausgewaehlt.has(e.id)}
                onUmschalten={() => trainingAuswahl.umschalten(e.id)}
                onLoeschen={() => handleTrainingLoeschen(e.id)}
              />
            ))}
          </div>
        ))
      )}
    </>
  );
  return embedded ? content : <Shell>{content}</Shell>;
}
