import React, { useEffect, useRef, useState } from "react";
import { useLiveNeuladenSperre } from "../data/liveAktualisierung";
import { Shell, Card, PrimaryButton } from "./primitives";
import { danger, textMain, textMuted } from "./theme";
import { useAppData } from "../context/AppDataContext";
import { istRechtzeitig } from "../utils/belohnungZeit";
import { feuereBelohnung } from "../utils/belohnungBus";
import { routineGeschafftFeier } from "../utils/routineFeier";
import { verspaetungHinweis } from "../utils/routineVerspaetung";
import TagebuchFormular from "./TagebuchFormular";
import { istTagebuchSchritt } from "../utils/tagebuch";
import { toLocalISODate } from "../utils/dates";
import { playBeep } from "../utils/beep";
import AtemFuehrung from "./AtemFuehrung";
import MitWahl from "./MitWahl";
import TagesRueckblick from "./TagesRueckblick";
import AufgeladenFenster from "./AufgeladenFenster";
import GuteNachtFenster from "./GuteNachtFenster";
import { atemFuerRoutineSchritt, bibliotheksUebung } from "../utils/atemBibliothek";
import { istMessPhase, istNachmessen, messTag } from "../utils/messwoche";
import { istLichtSchritt, nochZuDunkel, sonnenaufgangUhr } from "../utils/sonne";
import WetterTipp from "./WetterTipp";
import { nurWennFaellig } from "../utils/routineVerknuepfung";
import RoutineZeitprotokoll from "./RoutineZeitprotokoll";

const ROUTINE_ANLASS = { morgen: "morgenroutine", abend: "abendroutine" };

const ROUTINE_LABEL = { morgen: "Morgenroutine", abend: "Abendroutine" };
const ROUTINE_EMOJI = { morgen: "🌅", abend: "🌙" };

// Laufender Durchlauf im Browser gemerkt (28.10., Nutzerin: „App geschlossen,
// wieder geöffnet … Morgenroutine auf den Start zurückgesetzt“). Gilt nur für
// heute; nach dem Abschluss gelöscht.
const laufSchluessel = (routine) => `aka-routine-lauf-${routine}`;
function laufLesen(routine, datum) {
  try {
    const x = JSON.parse(localStorage.getItem(laufSchluessel(routine)) || "null");
    return x && x.datum === datum ? x : null;
  } catch {
    return null;
  }
}
function laufMerken(routine, lauf) {
  try {
    if (lauf) localStorage.setItem(laufSchluessel(routine), JSON.stringify(lauf));
    else localStorage.removeItem(laufSchluessel(routine));
  } catch {
    /* ohne Speicher geht es trotzdem, nur ohne Fortsetzen */
  }
}

function fmtDauer(sekunden) {
  const s = Math.max(0, Math.round(sekunden));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

// Geführter Ablauf-Screen (Phase 1, 13.08.): führt Schritt für Schritt durch
// die konfigurierten Routine-Schritte, mit Countdown + Vorwarnton kurz vor
// Ende je Schritt — gegen das ADHS-typische "sich in der Zeit verlieren".
// "Schritt fertig" geht jederzeit, auch vor Ablauf des Timers (z. B. wenn
// etwas schneller ging als geplant). Tatsächlich gebrauchte Zeit je Schritt
// wird mitgeschrieben und am Ende als ein Durchlauf gespeichert.
export default function RoutineAblauf({ routine, schritte: rohSchritte, onAbschluss, onAbbrechen, routineDurchlaufSpeichern, onSchrittFertig, verknuepfteFuer, itemUmschalten }) {
  // Spritztag-Schritte (03.11.): nur an Tagen, an denen die Injektion fällig ist.
  const [alleSchritte] = useState(() => (verknuepfteFuer ? rohSchritte.filter((sc) => !nurWennFaellig(sc) || verknuepfteFuer({ ...sc, routine }).length > 0) : rohSchritte));
  useLiveNeuladenSperre(); // Coach-Änderungen erst nach der Routine neu laden
  const { spotifyVerbunden, spotifyAnlaesse, spotifyAbspielen, spotifyPausieren, routineEinstellungen, belohnungPufferMin, tagebuchEintraege, kernStand, atemuebungAbschliessen, aenderungVermerken, routineSchrittErledigt = {}, routineSchrittMerken } = useAppData();
  const heute = toLocalISODate(new Date());
  const [gemerkt] = useState(() => laufLesen(routine, heute));
  const tagebuchHeute = (tagebuchEintraege || []).find((e) => e.datum === heute);
  const [tagebuchNachher, setTagebuchNachher] = useState(false);
  // Messwoche (26.09.): Woche 1 des AKA-Coachings misst statt vorzugeben –
  // Stoppuhr je Schritt statt Countdown, Hauptuhr ab dem Aufwachen.
  const messmodus = istMessPhase(kernStand);
  const messName = istNachmessen(kernStand) ? "Nachmessen" : "Messwoche";
  const messTagNr = messTag(kernStand, heute);
  const weckzeit = routineEinstellungen?.[routine]?.startZeit || "";
  const weckMs = weckzeit ? new Date(`${heute}T${weckzeit}:00`).getTime() : null;
  // Frage "Seit wann wach?" nur morgens: in der Messwoche bis 3 h nach der
  // Weckzeit, sonst wenn der Start mehr als 20 Min. nach der Weckzeit liegt
  // (07.11., Nutzerin: „Wecker auf 7 Uhr, ich beginne aber erst um 9“). Die
  // Aufwachzeit wird getrennt vom echten Beginn gespeichert.
  const seitWecker = weckMs ? Date.now() - weckMs : -1;
  const wachFrage = routine === "morgen" && weckMs && (messmodus ? seitWecker > 0 && seitWecker < 3 * 3600000 : seitWecker > 20 * 60000 && seitWecker < 8 * 3600000);
  const [wachGefragt, setWachGefragt] = useState(!!gemerkt || !wachFrage);
  const aufgewachtRef = useRef(gemerkt?.aufgewachtUm || null);
  const [wachZeit, setWachZeit] = useState("");
  const [fertig, setFertig] = useState(false);
  // ⚡ Kurzfassung (24.10., Nutzerin: „diese Notfallversion gerne überall
  // integrieren“): Sind Schritte als „kurz“ markiert, fragt die Routine beim
  // Start „Ganz“ oder „Kurz“. Die Kurzfassung zählt genauso als geschafft.
  const kurzSchritte = alleSchritte.filter((s) => s.kurz);
  const kurzMoeglich = kurzSchritte.length > 0 && kurzSchritte.length < alleSchritte.length;
  const [fassung, setFassung] = useState(gemerkt?.fassung || (kurzMoeglich ? null : "ganz"));
  const schritte = fassung === "kurz" ? kurzSchritte : alleSchritte;
  const [musikFehler, setMusikFehler] = useState(null);
  const protokollRef = useRef(gemerkt?.protokoll || []);
  // Fortsetzen: erster Schritt, der heute weder abgehakt (auch auf der
  // Startseite) noch im gemerkten Durchlauf erledigt ist.
  const ersterOffener = (liste) => {
    const gemacht = new Set(protokollRef.current.map((p) => p.schrittId));
    const i = liste.findIndex((sc) => !gemacht.has(sc.id) && !routineSchrittErledigt[`${heute}__${sc.id}`]);
    return i < 0 ? Math.max(0, liste.length - 1) : i;
  };
  const [index, setIndex] = useState(() => ersterOffener(schritte));
  const fortgesetzt = index > 0;
  const feierRef = useRef(null);
  const startZeitRef = useRef(Date.now());
  const gestartetUmRef = useRef(gemerkt?.gestartetUm || new Date().toISOString());
  // Belohnungsfenster (Nutzerin-Vorgabe, 12.09.): bei Routinen mit echtem
  // Start/Ende-Verlauf zählt für "rechtzeitig" der START, nicht das Ende —
  // einmal innerhalb des Puffers nach der geplanten Startzeit (Zeitrahmen
  // der Routine) begonnen, darf die Erledigung selbst beliebig lange
  // dauern. Einmalig beim Mounten geprüft, nicht bei jedem Schritt neu.
  const rechtzeitigGestartetRef = useRef(
    istRechtzeitig(routineEinstellungen?.[routine]?.startZeit, belohnungPufferMin, new Date(gestartetUmRef.current))
  );
  // Gesamtzeit der Routine (Nutzerin-Vorgabe 14.08., analog zum
  // Trainings-Gesamtzeit-Timer): läuft unabhängig von den einzelnen
  // Schritt-Countdowns durch, beginnt beim Start der Routine und endet erst
  // beim wirklichen Abschluss — damit sichtbar/auswertbar wird, ob die
  // ganze Routine zu lang oder zu kurz ist, nicht nur einzelne Schritte.
  const gesamtStartRef = useRef(gemerkt?.gesamtStart || Date.now());
  const merken = (f = fassung) => laufMerken(routine, { datum: heute, fassung: f, protokoll: protokollRef.current, gestartetUm: gestartetUmRef.current, gesamtStart: gesamtStartRef.current, aufgewachtUm: aufgewachtRef.current });
  // Gleich beim Start merken, nicht erst nach dem ersten Schritt.
  useEffect(() => {
    if (fassung && wachGefragt) merken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fassung, wachGefragt]);
  const [gesamtSek, setGesamtSek] = useState(0);
  useEffect(() => {
    if (fertig) return;
    const id = setInterval(() => setGesamtSek(Math.round((Date.now() - gesamtStartRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [fertig]);

  // Startet automatisch die zugeordnete Playlist (falls unter "Schritte
  // einrichten" → Playlist eine hinterlegt ist), einmalig beim Start dieses
  // Durchlaufs — nicht bei jedem Schrittwechsel.
  useEffect(() => {
    const uri = spotifyAnlaesse[ROUTINE_ANLASS[routine]]?.uri;
    if (uri && spotifyVerbunden) {
      spotifyAbspielen(uri).then((result) => {
        if (!result?.ok) setMusikFehler(result?.error || "Wiedergabe fehlgeschlagen.");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aktuell = schritte[index];
  // Atem-Schritt (30.09., Nutzerin: „die Atemübung ploppt auf, aber es
  // findet keine geführte Übung statt“): hier direkt die fest hinterlegte
  // Übung mit Kreis + Stimme (ohne KI, ohne Video). Ist sie durch, geht
  // es automatisch zum nächsten Schritt.
  const atemInfo = atemFuerRoutineSchritt(aktuell, routine);
  const atemUebung = atemInfo ? { ...bibliotheksUebung(atemInfo.key), dauerMinuten: atemInfo.dauerMinuten } : null;

  // Tageslicht vor Sonnenaufgang (28.10., Nutzerin: „im Zweifelsfall sogar
  // ablehnen, weil die Sonne dann noch nicht aufgegangen ist“): erst fragen,
  // ob später nachholen oder trotzdem jetzt (z. B. Tageslichtlampe).
  const [lichtTrotzdem, setLichtTrotzdem] = useState(null);
  const lichtFrage = istLichtSchritt(aktuell) && lichtTrotzdem !== aktuell?.id && nochZuDunkel(new Date());

  // Schritt-Uhr (29.09., Nutzerin): jeder Schritt hat eine Soll-Zeit als
  // Rahmen – auch in der Messwoche. Sie läuft rückwärts; ist sie um, gibt es
  // Ton + Vibration und die Uhr zählt sichtbar weiter („+1:20 länger“),
  // statt automatisch weiterzuspringen. Gespeichert wird die echte Dauer,
  // damit kürzer/länger dokumentiert ist und nachjustiert werden kann.
  const sollSek = (Number(aktuell?.dauerMin) || 5) * 60;
  const schrittSek = Math.max(0, Math.round((Date.now() - startZeitRef.current) / 1000));
  const restSek = sollSek - schrittSek;
  const signalRef = useRef({ index: -1, vorwarnung: false, ende: false });
  useEffect(() => {
    if (fertig || !wachGefragt || !aktuell || istTagebuchSchritt(aktuell) || atemUebung || lichtFrage) return;
    const sig = signalRef.current;
    if (sig.index !== index) signalRef.current = { index, vorwarnung: false, ende: false };
    const r = signalRef.current;
    if (!r.vorwarnung && sollSek > 60 && restSek <= 30 && restSek > 0) {
      r.vorwarnung = true;
      playBeep(1);
      navigator.vibrate?.(200);
    }
    if (!r.ende && restSek <= 0) {
      r.ende = true;
      playBeep(2);
      navigator.vibrate?.([300, 150, 300]);
    }
  });

  // Supplemente/Injektionen des Schritts einzeln abhaken (03.11., Nutzerin:
  // „Ich habe ein paar Mal vergessen, das HGH zu nehmen“). `dazuLokal` zeigt
  // den Haken sofort, bis die Daten nachziehen; `nachfrage` = noch etwas offen.
  const [dazuLokal, setDazuLokal] = useState({});
  const [nachfrage, setNachfrage] = useState(false);
  useEffect(() => {
    setDazuLokal({});
    setNachfrage(false);
  }, [index]);
  const dazuItems = (aktuell && verknuepfteFuer?.({ ...aktuell, routine })) || [];
  const dazuFertig = (it) => (it.key in dazuLokal ? dazuLokal[it.key] : it.done);
  const dazuOffen = dazuItems.filter((it) => !dazuFertig(it));
  const dazuUmschalten = (it) => {
    setDazuLokal((l) => ({ ...l, [it.key]: !dazuFertig(it) }));
    itemUmschalten?.(it, aktuell.name);
  };
  const schrittFertigKlick = () => (dazuOffen.length ? setNachfrage(true) : weiter());
  // Freie Reihenfolge (07.11., Nutzerin: „fällt mir schwer, mich immer an die
  // Reihenfolge zu halten“): jeden offenen Schritt vorziehen; das Zeitprotokoll
  // hält fest, in welcher Reihenfolge es wirklich war.
  const gemachtIds = new Set(protokollRef.current.map((p) => p.schrittId));
  const andereOffene = schritte.map((sc, i) => ({ sc, i })).filter(({ sc, i }) => i !== index && !gemachtIds.has(sc.id) && !routineSchrittErledigt[`${heute}__${sc.id}`]);
  const schrittVorziehen = (i) => {
    setIndex(i);
    startZeitRef.current = Date.now();
    merken();
  };

  const weiter = (opt) => {
    const ausgelassen = opt?.ausgelassen === true; // onClick/onGespeichert reichen ein Event bzw. den Eintrag durch
    const tatsaechlichSek = ausgelassen ? null : Math.round((Date.now() - startZeitRef.current) / 1000);
    // Echte Uhrzeiten und Reihenfolge je Schritt (07.11., Nutzerin: „wann ich
    // einen Prozess starte und beende … noch detaillierter“).
    const zeiten = ausgelassen ? {} : { startUm: new Date(startZeitRef.current).toISOString(), endeUm: new Date().toISOString() };
    protokollRef.current = [
      ...protokollRef.current,
      { schrittId: aktuell.id, name: aktuell.name, geplantMin: aktuell.dauerMin, tatsaechlichSek, ...zeiten, platz: protokollRef.current.length + 1, planPlatz: index + 1, ...(ausgelassen ? { ausgelassen: true } : {}) },
    ];
    if (!ausgelassen) {
      routineSchrittMerken?.(aktuell.id, heute);
      // Verknüpfte Tagespunkte mit abhaken (28.10., utils/routineVerknuepfung.js) –
      // außer bei „Heute ohne“ (03.11.).
      if (opt?.ohneDazu !== true) onSchrittFertig?.({ ...aktuell, routine });
    }
    // Nächster offener Schritt in Plan-Reihenfolge; was schon erledigt ist
    // (auch auf der Startseite) oder vorgezogen wurde, wird übersprungen.
    const gemacht = new Set(protokollRef.current.map((p) => p.schrittId));
    const naechster = schritte.findIndex((sc) => !gemacht.has(sc.id) && !routineSchrittErledigt[`${heute}__${sc.id}`]);
    if (naechster >= 0) {
      setIndex(naechster);
      startZeitRef.current = Date.now();
      merken();
    } else {
      laufMerken(routine, null);
      // Schritte, die auf der Startseite abgehakt wurden, ohne Zeit mitspeichern.
      const vorhanden = new Map(protokollRef.current.map((p) => [p.schrittId, p]));
      protokollRef.current = schritte.map((sc) => vorhanden.get(sc.id) || { schrittId: sc.id, name: sc.name, geplantMin: sc.dauerMin, tatsaechlichSek: null });
      // Musik lief seit dem Start automatisch mit — muss beim Abschluss
      // genauso automatisch aufhören, sonst läuft sie einfach unbemerkt
      // weiter (gleicher Bug wie beim Workflow-/Trainings-Timer).
      spotifyPausieren();
      routineDurchlaufSpeichern?.({ routine, schritte: protokollRef.current, gestartetUm: gestartetUmRef.current, aufgewachtUm: aufgewachtRef.current });
      // Immer feiern (25.09.), pünktlich oder später — siehe routineFeier.js.
      // „Aufgeladen“ (morgens) bzw. „Gute Nacht“ (abends) übernehmen seit
      // 06.10. die Feier selbst, sonst lägen zwei Fenster übereinander.
      const feier = routineGeschafftFeier(routine, rechtzeitigGestartetRef.current, verspaetungHinweis(routineEinstellungen?.[routine]?.startZeit, gestartetUmRef.current, belohnungPufferMin));
      if (routine === "morgen" || routine === "abend") feierRef.current = feier;
      else feuereBelohnung(feier);
      setFertig(true);
    }
  };

  const abbrechen = () => {
    spotifyPausieren();
    onAbbrechen();
  };

  if (!schritte.length) {
    return (
      <Shell>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, color: textMuted, marginBottom: 12 }}>
            Für die {ROUTINE_LABEL[routine]} sind noch keine Schritte eingerichtet.
          </div>
          <PrimaryButton onClick={abbrechen}>Zurück</PrimaryButton>
        </Card>
      </Shell>
    );
  }

  if (fassung === null) {
    const minuten = (liste) => liste.reduce((summe, s) => summe + (Number(s.dauerMin) || 0), 0);
    const waehlen = (f) => {
      setFassung(f);
      setIndex(ersterOffener(f === "kurz" ? kurzSchritte : alleSchritte));
      startZeitRef.current = Date.now();
      gesamtStartRef.current = Date.now();
      merken(f);
    };
    return (
      <Shell>
        <Card style={{ textAlign: "center" }}>
          <div data-routine-fassung style={{ fontSize: 18, fontWeight: 800, color: textMain, marginBottom: 6 }}>
            {ROUTINE_EMOJI[routine]} {ROUTINE_LABEL[routine]}
          </div>
          <div style={{ fontSize: 13, color: textMuted, marginBottom: 16 }}>Wie viel geht heute?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PrimaryButton onClick={() => waehlen("ganz")}>
              Ganz · {alleSchritte.length} Schritte · ca. {minuten(alleSchritte)} Min.
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => waehlen("kurz")}>
              ⚡ Kurz · {kurzSchritte.length} Schritte · ca. {minuten(kurzSchritte)} Min.
            </PrimaryButton>
          </div>
          <div style={{ fontSize: 12, color: textMuted, marginTop: 12 }}>Auch die Kurzfassung zählt als geschafft.</div>
        </Card>
      </Shell>
    );
  }

  if (!wachGefragt && schritte.length) {
    // Beginn ist immer der echte Start; die Aufwachzeit steht extra.
    // In der Messwoche läuft die Hauptuhr ab dem Aufwachen.
    const wach = (ms) => {
      aufgewachtRef.current = ms ? new Date(ms).toISOString() : null;
      if (messmodus && ms) gesamtStartRef.current = ms;
      startZeitRef.current = Date.now();
      setWachGefragt(true);
    };
    const eigeneMs = wachZeit ? new Date(`${heute}T${wachZeit}:00`).getTime() : null;
    return (
      <Shell mittig>
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30 }}>{messmodus ? "📏" : "⏰"}</div>
          {messmodus && <div style={{ fontSize: 13, fontWeight: 800, color: textMuted }}>{messName}{messTagNr ? ` · Tag ${messTagNr} von 7` : ""}</div>}
          <div data-wach-frage style={{ fontSize: 18, fontWeight: 900, margin: "6px 0 4px" }}>Seit wann bist du wach?</div>
          <div style={{ fontSize: 13.5, color: textMuted, lineHeight: 1.5, marginBottom: 14 }}>Dann ist dokumentiert, wann du aufgewacht bist und wann du wirklich losgelegt hast.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PrimaryButton onClick={() => wach(weckMs)}>⏰ Mit dem Wecker um {weckzeit}</PrimaryButton>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="time" value={wachZeit} onChange={(e) => setWachZeit(e.target.value)} aria-label="Aufgewacht um" style={{ flex: 1, minWidth: 0, border: "1.5px solid var(--mp-rand)", borderRadius: 12, padding: "10px", fontSize: 16, fontFamily: "inherit", background: "var(--mp-karte)", color: "inherit" }} />
              <PrimaryButton variant="ghost" disabled={!eigeneMs} onClick={() => wach(eigeneMs)}>
                Andere Uhrzeit
              </PrimaryButton>
            </div>
            <PrimaryButton variant="ghost" onClick={() => wach(Date.now())}>
              Gerade erst aufgewacht
            </PrimaryButton>
          </div>
        </Card>
      </Shell>
    );
  }

  if (fertig) {
    const protokoll = protokollRef.current;
    return (
      <Shell>
        {routine === "morgen" ? (
          <AufgeladenFenster gesamtZeit={fmtDauer(gesamtSek)} feier={feierRef.current} onWeiter={onAbschluss} />
        ) : (
          <GuteNachtFenster gesamtZeit={fmtDauer(gesamtSek)} feier={feierRef.current} onWeiter={onAbschluss} />
        )}
        {/* "Wie war dein Tag?" (25.09.): gehört an den Abend, nicht auf die
            Startseite – hier, falls die Abendroutine keinen Tagebuch-Schritt hat. */}
        {routine === "abend" && !schritte.some(istTagebuchSchritt) && (!tagebuchHeute || tagebuchNachher) && (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>📓 Wie war dein Tag?</div>
            {tagebuchNachher ? (
              <div role="status" style={{ fontSize: 13, fontWeight: 700, color: "var(--mp-accent-dark-text)" }}>✓ Festgehalten. Gute Nacht!</div>
            ) : (
              <TagebuchFormular datum={heute} kompakt onGespeichert={() => setTagebuchNachher(true)} />
            )}
          </Card>
        )}
        {protokoll.length > 0 && (
          <Card>
            <RoutineZeitprotokoll durchlauf={{ schritte: protokoll, gestartetUm: gestartetUmRef.current, abgeschlossenUm: new Date().toISOString(), aufgewachtUm: aufgewachtRef.current }} />
          </Card>
        )}
      </Shell>
    );
  }

  return (
    <Shell mittig>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, letterSpacing: 0.3 }}>GESAMTZEIT {ROUTINE_LABEL[routine].toUpperCase()}</div>
        <div style={{ fontSize: 24, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmtDauer(gesamtSek)}</div>
      </div>
      <div style={{ fontSize: 12, color: textMuted, textAlign: "center", marginBottom: 8 }}>
        {ROUTINE_EMOJI[routine]} {ROUTINE_LABEL[routine]} · Schritt {index + 1} von {schritte.length}
        {fortgesetzt && <div data-routine-fortgesetzt style={{ fontWeight: 700, marginTop: 2 }}>↺ Weiter, wo du warst – erledigte Schritte sind gespeichert</div>}
        {messmodus && ` · 📏 ${messName}${messTagNr ? ` Tag ${messTagNr}` : ""}`}
      </div>
      {musikFehler && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "color-mix(in srgb, #FBEAE7 var(--mp-flaeche), var(--mp-karte))", color: danger, borderRadius: 12, padding: "8px 12px", fontSize: 12, marginBottom: 12 }}>
          <span>🎵 Playlist konnte nicht gestartet werden: {musikFehler}</span>
          <button
            type="button"
            onClick={() => setMusikFehler(null)}
            style={{ border: "none", background: "transparent", color: danger, fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}
      {istTagebuchSchritt(aktuell) ? (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, textAlign: "center" }}>📓 Wie war dein Tag?</div>
          <TagebuchFormular key={aktuell.id} datum={heute} vorhanden={tagebuchHeute} kompakt onGespeichert={weiter} />
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button type="button" onClick={weiter} style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12.5, cursor: "pointer", padding: 6 }}>
              Heute überspringen
            </button>
          </div>
        </Card>
      ) : atemUebung ? (
        <div data-routine-atem>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, textAlign: "center" }}>{aktuell.name}</div>
          <AtemFuehrung
            key={aktuell.id}
            uebung={atemUebung}
            onFertig={({ dauerSek, vorher, nachher }) => {
              if (dauerSek > 0) {
                atemuebungAbschliessen?.(atemUebung, dauerSek, { gefuehlVorher: vorher, gefuehlDanach: nachher, sessionId: null });
                aenderungVermerken?.({ kategorie: "atemuebung", itemName: atemUebung.name, aktion: "erledigt", detail: `${Math.round(dauerSek / 60) || 1} Min. · aus der ${ROUTINE_LABEL[routine]}` });
              }
              weiter();
            }}
          />
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button type="button" onClick={weiter} style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12.5, cursor: "pointer", padding: 6 }}>
              Schon geatmet – weiter
            </button>
          </div>
        </Card>
        </div>
      ) : lichtFrage ? (
        <Card data-routine-licht-frage style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 34 }}>🌄</div>
          <div style={{ fontSize: 20, fontWeight: 800, margin: "6px 0 6px" }}>{aktuell.name}</div>
          <div style={{ fontSize: 14, color: textMuted, lineHeight: 1.5, marginBottom: 14 }}>
            Die Sonne geht heute erst um {sonnenaufgangUhr(new Date())} Uhr auf, draußen ist es noch kaum hell. Tageslicht holst du besser später nach.
          </div>
          <WetterTipp style={{ marginBottom: 14 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PrimaryButton onClick={() => weiter({ ausgelassen: true })}>☀️ Später nachholen</PrimaryButton>
            <PrimaryButton
              variant="ghost"
              onClick={() => {
                setLichtTrotzdem(aktuell.id);
                startZeitRef.current = Date.now();
              }}
            >
              Trotzdem jetzt (z. B. Tageslichtlampe)
            </PrimaryButton>
          </div>
        </Card>
      ) : (
      <Card style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>{aktuell.name}</div>
        <DazuGehoert items={dazuItems} fertig={dazuFertig} onUmschalten={itemUmschalten ? dazuUmschalten : null} />
        <div aria-label="Uhr Schritt" data-schritt-uhr={restSek > 0 ? "laeuft" : "drueber"} style={{ fontSize: 44, fontWeight: 900, fontVariantNumeric: "tabular-nums", color: restSek > 0 ? "inherit" : "color-mix(in srgb, #D9822B var(--mp-schrift), var(--mp-schrift-hell))" }}>
          {restSek > 0 ? fmtDauer(restSek) : `+${fmtDauer(-restSek)}`}
          <div style={{ fontSize: 12.5, fontWeight: 700, color: textMuted }}>
            {restSek > 0 ? `noch · geplant ${aktuell.dauerMin || 5} Min.` : `länger als geplant (${aktuell.dauerMin || 5} Min.) – kein Problem, wird notiert`}
          </div>
          {messmodus && <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginTop: 2 }}>📏 wird gemessen – in deinem Tempo</div>}
        </div>
        {/* Abends erst „heute geschafft?“, dann ⭐ für morgen (25.10.); morgens ⭐ bei Top 3. */}
        {aktuell.kernKey === "plan_morgen" && <TagesRueckblick />}
        {aktuell.kernKey === "top3" && <MitWahl datum={new Date()} titel="⭐ Deine MITs für heute" />}
        {nachfrage && dazuOffen.length > 0 ? (
          <div data-schritt-nachfrage style={{ marginTop: 14, padding: "10px 12px", borderRadius: 14, background: "color-mix(in srgb, #FFF1CC var(--mp-flaeche), var(--mp-karte))" }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Noch nicht abgehakt: {dazuOffen.map((it) => it.raw?.name || it.name).join(", ")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <PrimaryButton onClick={weiter} variant="success">
                ✓ Doch genommen – alles abhaken
              </PrimaryButton>
              <PrimaryButton variant="ghost" onClick={() => weiter({ ohneDazu: true })}>
                Heute ohne – weiter
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <PrimaryButton onClick={schrittFertigKlick} variant="success">
              Schritt fertig
            </PrimaryButton>
          </div>
        )}
      </Card>
      )}
      <AndererSchritt offen={andereOffene} onWaehlen={schrittVorziehen} />
      <div style={{ textAlign: "center" }}>
        <button
          type="button"
          onClick={abbrechen}
          style={{ border: "none", background: "transparent", color: textMuted, fontSize: 12, cursor: "pointer", padding: 8 }}
        >
          Routine abbrechen
        </button>
      </div>
    </Shell>
  );
}

// Was zu diesem Schritt gehört (03.11., Nutzerin: Supplemente und Injektionen
// sollen in den Routinen mit drin sein, einzeln abhakbar, „das soll nicht
// untergehen“). Jede Gabe ist eine eigene Zeile zum Antippen.
function DazuGehoert({ items, fertig, onUmschalten }) {
  if (!items.length) return null;
  return (
    <div data-schritt-dazu style={{ textAlign: "left", margin: "-6px auto 14px", maxWidth: 380, display: "grid", gap: 6 }}>
      {items.map((it) => {
        const an = fertig(it);
        const symbol = it.kategorie === "hormon" ? "💉" : it.kategorie === "mahlzeit" ? "🍽️" : "💊";
        return (
          <button
            key={it.key}
            type="button"
            role="checkbox"
            aria-checked={an}
            disabled={!onUmschalten}
            onClick={() => onUmschalten?.(it)}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", border: `1.5px solid ${an ? "#2E9C6E" : "var(--mp-rand)"}`, borderRadius: 14, padding: "10px 12px", background: an ? "color-mix(in srgb, #DDF3E9 var(--mp-flaeche), var(--mp-karte))" : "var(--mp-karte)", cursor: onUmschalten ? "pointer" : "default", fontFamily: "inherit", color: "inherit" }}
          >
            <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: an ? "#2E9C6E" : "transparent", border: `2px solid ${an ? "#2E9C6E" : "#C3C8D4"}`, color: "#fff", fontSize: 15, fontWeight: 900 }}>{an ? "✓" : ""}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: "block", fontSize: 15 }}>
                {symbol} {it.raw?.name || it.name}
              </b>
              {it.detail && <span style={{ fontSize: 12.5, color: textMuted }}>{it.detail}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// „Lieber erst etwas anderes?“ – offene Schritte zum Vorziehen (07.11.).
function AndererSchritt({ offen, onWaehlen }) {
  const [auf, setAuf] = useState(false);
  if (!offen.length) return null;
  return (
    <div data-anderer-schritt style={{ textAlign: "center", marginBottom: 4 }}>
      <button type="button" aria-expanded={auf} onClick={() => setAuf((a) => !a)} style={{ border: "none", background: "transparent", color: "var(--mp-accent-dark-text)", fontSize: 13.5, fontWeight: 800, cursor: "pointer", padding: 8, fontFamily: "inherit" }}>
        {auf ? "▴ Zuklappen" : "↕ Lieber erst etwas anderes?"}
      </button>
      {auf && (
        <div style={{ display: "grid", gap: 6, maxWidth: 420, margin: "0 auto 8px", textAlign: "left" }}>
          {offen.map(({ sc, i }) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => {
                setAuf(false);
                onWaehlen(i);
              }}
              style={{ border: "1.5px solid var(--mp-rand)", borderRadius: 14, padding: "10px 12px", background: "var(--mp-karte)", color: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "left", display: "flex", justifyContent: "space-between", gap: 8 }}
            >
              <span>{sc.name}</span>
              <span style={{ color: textMuted, fontSize: 12.5, flexShrink: 0 }}>{sc.dauerMin} Min.</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
