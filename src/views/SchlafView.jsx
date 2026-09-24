import React, { useEffect, useRef, useState } from "react";
import { Shell, Card, CheckRow, Label, Pill, PrimaryButton, TextArea, TextInput } from "../ui/primitives";
import ViewHeader from "../ui/ViewHeader";
import { SimpleLineChart } from "../ui/charts";
import { cardBorder, danger, textMuted } from "../ui/theme";
import { SCHLAFQUALITAET_OPTIONEN, WOCHENTAGE } from "../constants";
import { useAppData } from "../context/AppDataContext";
import TimeWheelField from "../ui/TimeWheelField";
import ZeitErinnerungenCard from "../ui/ZeitErinnerungenCard";
import { KATEGORIE_META } from "../utils/dayItems";
import SpotifyAnlassPicker from "../ui/SpotifyAnlassPicker";
import SchlafplanCard, { neuerSchlafblock } from "../ui/SchlafplanCard";
import ItemVerlauf from "../ui/ItemVerlauf";
import { toLocalISODate } from "../utils/dates";

// Bereichseigene Farbe statt der generischen Marken-Akzentfarbe — Schlaf
// ist Indigo, passend zu den bunten Home-Mini-Widgets.
const { text: accentDark, dot: blue } = KATEGORIE_META.schlaf;

const LEERER_EINTRAG = {
  datum: toLocalISODate(new Date()),
  stunden: "",
  schlafqualitaet: "",
  einschlafzeit: "",
  durchgeschlafen: null,
  erholt: null,
  traeume: "",
  bemerkungen: "",
};

export default function SchlafView({ onHome, embedded = false }) {
  const { schlafEintraege, schlafHinzufuegen, schlafEintragLoeschen, schlafDurchschnitt7Tage, categoryZiele, setCategoryZiel, aenderungVermerken } =
    useAppData();
  const [neuerSchlafEintrag, setNeuerSchlafEintrag] = useState(LEERER_EINTRAG);
  const [detailsOffen, setDetailsOffen] = useState(false);
  const [schlafError, setSchlafError] = useState(null);

  // Schlafplan-Editor (Bettzeit/Aufwachzeit je Wochentag) — bis 17.09. nur
  // über RoutineTabView.jsx (Abend-Reiter) oder das Onboarding erreichbar
  // (Nutzerinnen-Report: "wer 'Schlaf' direkt öffnet, kann den Schlafplan
  // gar nicht bearbeiten"). Gleiches Muster wie dort: `categoryZiele.schlaf`
  // ist die gemeinsame Quelle, sofortiges Speichern über setCategoryZiel
  // statt eines eigenen "Weiter"-Knopfs wie im Onboarding.
  const [schlafIntervallTyp, setSchlafIntervallTyp] = useState("weekdays");
  const [schlafBloecke, setSchlafBloecke] = useState([neuerSchlafblock([...WOCHENTAGE])]);
  const [schlafIstZustand, setSchlafIstZustand] = useState("");
  const schlafIstZustandGespeichertRef = useRef("");

  useEffect(() => {
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
  }, []);

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
    // Bewusst KEINE sofortige Speicherung/Protokollierung hier, siehe
    // RoutineTabView.jsx für dieselbe Begründung — Debounce-Effekt unten.
    setSchlafIstZustand(text);
  };
  useEffect(() => {
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
  }, [schlafIstZustand, schlafIntervallTyp, schlafBloecke]);

  const submit = async () => {
    setSchlafError(null);
    const result = await schlafHinzufuegen(neuerSchlafEintrag);
    if (!result?.ok) {
      setSchlafError(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setNeuerSchlafEintrag(LEERER_EINTRAG);
    setDetailsOffen(false);
  };

  // Bearbeiten eines vergangenen Eintrags (17.09., Konsistenz-Check) —
  // schlafHinzufuegen() upsert't schon länger pro Datum, es fehlte nur der
  // Weg, einen bestehenden Tag zurück ins Formular zu laden. Löschen war
  // bisher gar nicht möglich.
  const istBearbeitung = schlafEintraege.some((e) => e.datum === neuerSchlafEintrag.datum);
  const bearbeiten = (e) => {
    setNeuerSchlafEintrag({
      datum: e.datum,
      stunden: String(e.stunden ?? ""),
      schlafqualitaet: e.schlafqualitaet || "",
      einschlafzeit: e.einschlafzeit || "",
      durchgeschlafen: e.durchgeschlafen ?? null,
      erholt: e.erholt ?? null,
      traeume: e.traeume || "",
      bemerkungen: e.bemerkungen || "",
    });
    setDetailsOffen(true);
  };
  const loeschen = async (datum) => {
    if (!window.confirm("Diesen Schlaf-Eintrag wirklich löschen?")) return;
    await schlafEintragLoeschen(datum);
    if (neuerSchlafEintrag.datum === datum) {
      setNeuerSchlafEintrag(LEERER_EINTRAG);
      setDetailsOffen(false);
    }
  };

  const content = (
    <>
      {!embedded && (
        <ViewHeader title="😴 Schlaf" onHome={onHome} />
      )}

      <Card akzent style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🌙 Und, wie hast du geschlafen?</div>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>Trag's ein, bevor der Tag dich einholt — dauert 10 Sekunden.</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Label>Datum</Label>
            <TextInput type="date" value={neuerSchlafEintrag.datum} onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, datum: v }))} />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Stunden</Label>
            <TextInput type="number" value={neuerSchlafEintrag.stunden} onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, stunden: v }))} placeholder="7,2" />
          </div>
        </div>

        {!detailsOffen ? (
          <button
            onClick={() => setDetailsOffen(true)}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "9px",
              borderRadius: 10,
              border: `1px dashed ${cardBorder}`,
              background: "transparent",
              color: textMuted,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            + Mehr Details (optional)
          </button>
        ) : (
          <>
            <Label>Schlafqualität</Label>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {SCHLAFQUALITAET_OPTIONEN.map((q) => (
                <Pill
                  key={q}
                  label={q}
                  selected={neuerSchlafEintrag.schlafqualitaet === q}
                  onClick={() => setNeuerSchlafEintrag((p) => ({ ...p, schlafqualitaet: q }))}
                />
              ))}
            </div>
            <Label>Einschlafzeit</Label>
            <TimeWheelField
              value={neuerSchlafEintrag.einschlafzeit}
              onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, einschlafzeit: v }))}
            />
            <div style={{ marginTop: 10 }}>
              <CheckRow
                label="Durchgeschlafen"
                checked={!!neuerSchlafEintrag.durchgeschlafen}
                onToggle={() => setNeuerSchlafEintrag((p) => ({ ...p, durchgeschlafen: !p.durchgeschlafen }))}
              />
              <CheckRow
                label="Erholt aufgewacht"
                checked={!!neuerSchlafEintrag.erholt}
                onToggle={() => setNeuerSchlafEintrag((p) => ({ ...p, erholt: !p.erholt }))}
              />
            </div>
            <Label>Träume (optional)</Label>
            <TextArea value={neuerSchlafEintrag.traeume} onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, traeume: v }))} placeholder="Woran erinnerst du dich?" />
            <Label>Bemerkungen (optional)</Label>
            <TextArea value={neuerSchlafEintrag.bemerkungen} onChange={(v) => setNeuerSchlafEintrag((p) => ({ ...p, bemerkungen: v }))} placeholder="Sonst noch was?" />
          </>
        )}

        {schlafError && <div style={{ fontSize: 12, color: danger, marginTop: 10 }}>{schlafError}</div>}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <PrimaryButton onClick={submit}>{istBearbeitung ? "Eintrag ändern" : "Eintrag hinzufügen"}</PrimaryButton>
          </div>
          {istBearbeitung && (
            <button
              type="button"
              onClick={() => {
                setNeuerSchlafEintrag(LEERER_EINTRAG);
                setDetailsOffen(false);
              }}
              style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
            >
              Abbrechen
            </button>
          )}
        </div>
      </Card>

      <SchlafplanCard
        intervallTyp={schlafIntervallTyp}
        onIntervallTypChange={handleSchlafIntervallTyp}
        bloecke={schlafBloecke}
        onBloeckeChange={handleSchlafBloecke}
        istZustand={schlafIstZustand}
        onIstZustandChange={handleSchlafIstZustand}
        zeigeErinnerung={false}
      />
      <div style={{ marginTop: -10, marginBottom: 14 }}>
        <ItemVerlauf kategorie="schlaf" itemName="Schlafplan" />
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Erinnerung</div>
      <Card style={{ marginBottom: 14 }}>
        <ZeitErinnerungenCard kategorie="schlaf" labelKey="onboarding.hydration.erinnerungszeiten.label" zeitStandard="22:00" />
        {/* Nutzerin-Vorgabe 15.08.: 1 Min. nach der Schlafenszeit oben
            automatisch eine Playlist starten (z. B. Regengeräusche) — läuft
            serverseitig über send-due-reminders, unabhängig davon, ob die
            App gerade offen ist. Zuordnen = Aktivieren, wie bei den anderen
            Anlässen (Morgenroutine/Abendroutine/Training/Gewohnheiten). */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${cardBorder}` }}>
          <SpotifyAnlassPicker anlass="schlaf" label="🎵 Playlist zum Einschlafen (startet automatisch 1 Min. nach der Schlafenszeit oben)" />
        </div>
      </Card>

      {schlafEintraege.length > 0 && (
        <>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: accentDark }}>{schlafDurchschnitt7Tage ?? "—"} h</div>
                <div style={{ fontSize: 11, color: textMuted }}>Ø letzte 7 Tage</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{schlafEintraege.length}</div>
                <div style={{ fontSize: 11, color: textMuted }}>Einträge gesamt</div>
              </div>
            </div>
            {schlafEintraege.length >= 2 && <SimpleLineChart data={schlafEintraege.slice(-14)} dataKey="stunden" stroke={blue} />}
          </Card>

          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Letzte Einträge</div>
          <Card style={{ marginBottom: 14 }}>
            {schlafEintraege
              .slice()
              .reverse()
              .slice(0, 10)
              .map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${cardBorder}`, fontSize: 13 }}>
                  <span style={{ color: textMuted }}>{e.datum}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 700 }}>{e.stunden} h</span>
                    <button
                      type="button"
                      onClick={() => bearbeiten(e)}
                      title="Bearbeiten"
                      style={{ border: "none", background: "transparent", color: textMuted, fontSize: 13, cursor: "pointer", padding: "0 2px" }}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => loeschen(e.datum)}
                      title="Löschen"
                      style={{ border: "none", background: "transparent", color: danger, fontSize: 16, cursor: "pointer", padding: "0 4px" }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
          </Card>
        </>
      )}
    </>
  );
  return embedded ? content : <Shell bereich="schlaf">{content}</Shell>;
}
