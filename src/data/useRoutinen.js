import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toLocalISODate } from "../utils/dates";
import { istRechtzeitig } from "../utils/belohnungZeit";
import { routineGeschafftFeier } from "../utils/routineFeier";
import { feuereBelohnung } from "../utils/belohnungBus";
import { verspaetungHinweis } from "../utils/routineVerspaetung";
import { einstellungenFuer, planFuer, plusTage, schritteFuer, zeileZuPlantag, zeileZuVariante } from "../utils/schichtplan";

function rowToSchritt(r) {
  return {
    id: r.id,
    routine: r.routine,
    reihenfolge: r.reihenfolge,
    name: r.name,
    dauerMin: r.dauer_min,
    nurVarianten: r.nur_varianten || null,
    gueltigAb: r.gueltig_ab || null,
  };
}

function rowToDurchlauf(r) {
  return {
    id: r.id,
    routine: r.routine,
    datum: r.datum,
    schritte: r.schritte || [],
    gestartetUm: r.gestartet_um,
    abgeschlossenUm: r.abgeschlossen_um,
  };
}

function rowToEinstellung(r) {
  return {
    routine: r.routine,
    startZeit: r.start_zeit ? r.start_zeit.slice(0, 5) : "",
    endZeit: r.end_zeit ? r.end_zeit.slice(0, 5) : "",
  };
}

// Geführte Morgen-/Abendroutine (Phase 1, 13.08.) — Konfiguration
// (routine_schritte: was gehört dazu, Reihenfolge, geplante Dauer) getrennt
// von den tatsächlichen Durchläufen (routine_durchlaeufe: was wurde wann
// wirklich gemacht, wie lange hat's gedauert) — siehe RoutineAblauf.jsx.
export function useRoutinen(userId, belohnungPufferMin, aenderungVermerken) {
  const [schritte, setSchritte] = useState([]);
  const [durchlaeufe, setDurchlaeufe] = useState([]);
  const [einstellungen, setEinstellungen] = useState({});
  // Direkte Tages-Bestätigung einzelner Schritte (12.09., Nutzerin-Vorgabe:
  // "muss auf der ersten Seite von mir bestätigt werden können") — eigene,
  // schlanke Zusatz-Ebene NEBEN den vollständigen Durchläufen, nicht
  // deren Ersatz: der geführte Ablauf (RoutineAblauf) bleibt unverändert
  // nutzbar, die Checkliste ist ein zweiter, schnellerer Weg für einzelne
  // Punkte. Schlüssel wie überall in der App: "datum__schrittId".
  const [schrittErledigt, setSchrittErledigt] = useState({});
  // Doppeltipp-Schutz (13.09.): siehe pendingErledigtRef in
  // useGewohnheitenData.js.
  const pendingErledigtRef = useRef({});
  // Schichtarbeit (25.09., utils/schichtplan.js): Zeit-Varianten und je Tag
  // die geltende Variante. `heute` wird minütlich/beim Zurückkehren
  // aktualisiert, damit nach Mitternacht die neue Schicht gilt.
  const [varianten, setVarianten] = useState([]);
  const [plan, setPlan] = useState({});
  const [heute, setHeute] = useState(() => toLocalISODate(new Date()));
  useEffect(() => {
    const pruefen = () => setHeute(toLocalISODate(new Date()));
    const takt = setInterval(pruefen, 60000);
    document.addEventListener("visibilitychange", pruefen);
    return () => {
      clearInterval(takt);
      document.removeEventListener("visibilitychange", pruefen);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: s }, { data: d }, { data: e }, { data: sl }, { data: va }, { data: pl }] = await Promise.all([
        supabase.from("routine_schritte").select("*").eq("user_id", userId).order("routine").order("reihenfolge"),
        supabase.from("routine_durchlaeufe").select("*").eq("user_id", userId).order("gestartet_um", { ascending: false }),
        supabase.from("routine_einstellungen").select("*").eq("user_id", userId),
        supabase.from("routine_schritt_logs").select("*").eq("user_id", userId),
        supabase.from("routine_varianten").select("*").eq("user_id", userId).order("reihenfolge"),
        supabase.from("routine_schichtplan").select("*").eq("user_id", userId).gte("datum", plusTage(toLocalISODate(new Date()), -35)),
      ]);
      if (cancelled) return;
      if (va) setVarianten(va.map(zeileZuVariante));
      if (pl) {
        const next = {};
        pl.forEach((r) => (next[r.datum] = zeileZuPlantag(r)));
        setPlan(next);
      }
      if (s) setSchritte(s.map(rowToSchritt));
      if (d) setDurchlaeufe(d.map(rowToDurchlauf));
      if (e) {
        const next = {};
        e.map(rowToEinstellung).forEach((einst) => (next[einst.routine] = einst));
        setEinstellungen(next);
      }
      if (sl) {
        const next = {};
        sl.forEach((row) => (next[`${row.datum}__${row.schritt_id}`] = true));
        setSchrittErledigt(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Was gilt an einem Tag? Ohne Varianten/Plan exakt wie bisher.
  const schichtCtx = useMemo(() => ({ plan, varianten, standard: einstellungen }), [plan, varianten, einstellungen]);
  const hatSchicht = varianten.length > 0 || Object.keys(plan).length > 0;
  const einstellungenAm = useCallback((datum) => (hatSchicht ? einstellungenFuer(datum, schichtCtx) : einstellungen), [hatSchicht, schichtCtx, einstellungen]);
  const planAm = useCallback((datum) => planFuer(datum, schichtCtx), [schichtCtx]);
  const schritteAm = useCallback((datum) => schritteFuer(datum, schritte, planFuer(datum, schichtCtx).variante?.id || null), [schritte, schichtCtx]);
  const einstellungenHeute = useMemo(() => einstellungenAm(heute), [einstellungenAm, heute]);
  const schritteHeute = useMemo(() => schritteAm(heute), [schritteAm, heute]);
  const heutePlan = useMemo(() => planAm(heute), [planAm, heute]);

  // Uhrzeit eines Schritts — nicht in der DB gespeichert (nur die geplante
  // Dauer je Schritt), sondern aus dem Zeitrahmen-Start der Routine plus
  // der Summe der Dauer aller davor liegenden Schritte hergeleitet. Fehlt
  // der Zeitrahmen-Start, gibt's keine Uhrzeit — dann gilt der Schritt beim
  // Belohnungsfenster automatisch als "kein geplanter Zeitpunkt" (siehe
  // istRechtzeitig()), nicht als "zu spät".
  const schrittZeit = useCallback(
    (schrittId) => {
      const schritt = schritteHeute.find((sc) => sc.id === schrittId);
      if (!schritt) return "";
      const startZeit = einstellungenHeute[schritt.routine]?.startZeit;
      if (!startZeit) return "";
      const vorherige = schritteHeute
        .filter((sc) => sc.routine === schritt.routine && sc.reihenfolge < schritt.reihenfolge)
        .reduce((summe, sc) => summe + (Number(sc.dauerMin) || 0), 0);
      const [h, m] = startZeit.split(":").map(Number);
      const gesamt = h * 60 + m + vorherige;
      const stunde = Math.floor(gesamt / 60) % 24;
      const minute = gesamt % 60;
      return `${String(stunde).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    },
    [schritteHeute, einstellungenHeute]
  );

  // Zeitrahmen der Routine (z. B. Morgenroutine 6:00-9:00 Uhr) — Grundlage
  // für die Überlappungs-Erkennung mit anderen geplanten Punkten.
  const zeitrahmenSetzen = useCallback(
    async (routine, startZeit, endZeit) => {
      const row = { user_id: userId, routine, start_zeit: startZeit || null, end_zeit: endZeit || null };
      const { data, error } = await supabase
        .from("routine_einstellungen")
        .upsert(row, { onConflict: "user_id,routine" })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToEinstellung(data);
      setEinstellungen((prev) => ({ ...prev, [routine]: neu }));
      return { ok: true, einstellung: neu };
    },
    [userId]
  );

  const schrittHinzufuegen = useCallback(
    async (routine, name, dauerMin, { nurVarianten = null, gueltigAb = null } = {}) => {
      if (!name?.trim()) return { ok: false, error: "Bitte einen Namen für den Schritt eingeben." };
      const bisherige = schritte.filter((sc) => sc.routine === routine);
      const reihenfolge = bisherige.length ? Math.max(...bisherige.map((sc) => sc.reihenfolge)) + 1 : 0;
      const row = { user_id: userId, routine, reihenfolge, name: name.trim(), dauer_min: Number(dauerMin) || 5 };
      // Schichtarbeit (25.09.): Schritt nur bei bestimmten Varianten bzw.
      // erst ab einem Datum ("nächste Woche kommt X dazu").
      if (nurVarianten?.length) row.nur_varianten = nurVarianten;
      if (gueltigAb) row.gueltig_ab = gueltigAb;
      const { data, error } = await supabase.from("routine_schritte").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToSchritt(data);
      setSchritte((prev) => [...prev, neu]);
      return { ok: true, schritt: neu };
    },
    [userId, schritte]
  );

  const schrittEntfernen = useCallback(async (id) => {
    let vorherigerSchritt;
    let vorherigerIndex;
    setSchritte((prev) => {
      vorherigerIndex = prev.findIndex((sc) => sc.id === id);
      vorherigerSchritt = prev[vorherigerIndex];
      return prev.filter((sc) => sc.id !== id);
    });
    const { error } = await supabase.from("routine_schritte").delete().eq("id", id);
    if (error) {
      console.error(error);
      if (vorherigerSchritt) {
        setSchritte((prev) => {
          const next = [...prev];
          next.splice(Math.min(vorherigerIndex, next.length), 0, vorherigerSchritt);
          return next;
        });
      }
    }
  }, []);

  // Tauscht die Reihenfolge zweier benachbarter Schritte innerhalb derselben
  // Routine — reicht für "einen Schritt nach oben/unten verschieben", ohne
  // eine komplette Drag&Drop-Umsortierung bauen zu müssen.
  const schrittVerschieben = useCallback(
    async (id, richtung) => {
      const schritt = schritte.find((sc) => sc.id === id);
      if (!schritt) return;
      const geschwister = schritte.filter((sc) => sc.routine === schritt.routine).sort((a, b) => a.reihenfolge - b.reihenfolge);
      const idx = geschwister.findIndex((sc) => sc.id === id);
      const zielIdx = richtung === "hoch" ? idx - 1 : idx + 1;
      if (zielIdx < 0 || zielIdx >= geschwister.length) return;
      const ziel = geschwister[zielIdx];
      setSchritte((prev) =>
        prev.map((sc) => {
          if (sc.id === schritt.id) return { ...sc, reihenfolge: ziel.reihenfolge };
          if (sc.id === ziel.id) return { ...sc, reihenfolge: schritt.reihenfolge };
          return sc;
        })
      );
      // Bug-Fix: die beiden Updates liefen bisher ohne jede Fehlerprüfung —
      // schlug eines fehl, wich die lokale Reihenfolge dauerhaft von der DB
      // ab, bis zum nächsten Neuladen. Jetzt Rollback auf die alte
      // Reihenfolge bei einem Fehler.
      const [ergSchritt, ergZiel] = await Promise.all([
        supabase.from("routine_schritte").update({ reihenfolge: ziel.reihenfolge }).eq("id", schritt.id),
        supabase.from("routine_schritte").update({ reihenfolge: schritt.reihenfolge }).eq("id", ziel.id),
      ]);
      if (ergSchritt.error || ergZiel.error) {
        console.error(ergSchritt.error || ergZiel.error);
        setSchritte((prev) =>
          prev.map((sc) => {
            if (sc.id === schritt.id) return { ...sc, reihenfolge: schritt.reihenfolge };
            if (sc.id === ziel.id) return { ...sc, reihenfolge: ziel.reihenfolge };
            return sc;
          })
        );
      }
    },
    [schritte]
  );

  // Speichert einen abgeschlossenen Durchlauf — geplant vs. tatsächlich
  // gebrauchte Zeit je Schritt, damit die Aufwach-/Einschlaf-Routine
  // hinterher nachvollziehbar ist (Nutzerinnen-Vorgabe: Zeitgefühl-Problem
  // bei ADHS, "muss irgendwann getrackt/nachvollziehbar sein").
  const durchlaufSpeichern = useCallback(
    async ({ routine, schritte: schritteProtokoll, gestartetUm }) => {
      const heute = toLocalISODate(new Date());
      // Bug-Fix (Nutzerinnen-Report, 17.09.: "Zusammenhänge" bei Morgen-/
      // Abendroutine nicht in Ordnung): dieselbe Routine ließ sich am selben
      // Tag zweifach als Durchlauf speichern — einmal automatisch übers
      // Abhaken ALLER Schritte in der Home-Checkliste (toggleSchrittErledigt
      // unten prüft das zwar selbst schon per `schonDurchlauf`), einmal über
      // den geführten Ablauf (RoutineAblauf.jsx), der beim Abschluss bisher
      // UNGEPRÜFT nochmal speicherte. `errungenschaften.js` zählt jede Zeile
      // aus `routineDurchlaeufe` als eigenen Punkt (`tage.length`, keine
      // Datums-Entdopplung) — zwei Zeilen für denselben Tag verdoppelten so
      // fälschlich die Morgen-/Abendroutine-Punkte (Streak blieb korrekt, da
      // dort über ein Set gezählt wird). Zentraler Schutz hier statt an
      // jeder Aufrufstelle einzeln, damit JEDER Weg (Checkliste, geführter
      // Ablauf, künftige weitere Wege) automatisch geschützt ist.
      const bereitsHeute = durchlaeufe.find((d) => d.routine === routine && d.datum === heute);
      if (bereitsHeute) {
        return { ok: true, durchlauf: bereitsHeute };
      }
      const row = {
        user_id: userId,
        routine,
        datum: heute,
        schritte: schritteProtokoll,
        gestartet_um: gestartetUm,
        abgeschlossen_um: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("routine_durchlaeufe").insert(row).select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = rowToDurchlauf(data);
      setDurchlaeufe((prev) => [neu, ...prev]);
      // Jeder Abschluss landet im Tagesprotokoll, eine Verspätung
      // ausdrücklich mit vermerkt (25.09., utils/routineVerspaetung.js) —
      // gemessen am Start, wie beim Belohnungsfenster.
      const spaet = verspaetungHinweis(einstellungenAm(heute)[routine]?.startZeit, gestartetUm, belohnungPufferMin);
      aenderungVermerken?.({
        kategorie: routine === "morgen" ? "morgenroutine" : "abendroutine",
        itemName: routine === "morgen" ? "Morgenroutine" : "Abendroutine",
        aktion: "erledigt",
        detail: spaet ? `verspätet – ${spaet.replace(/^Heute /, "")}` : "komplett geschafft",
      });
      return { ok: true, durchlauf: neu };
    },
    [userId, durchlaeufe, einstellungenAm, belohnungPufferMin, aenderungVermerken]
  );

  // Bestätigt/entfernt EINEN Schritt für einen Tag, unabhängig vom
  // geführten Ablauf (12.09., Nutzerin-Vorgabe: direkt auf der Startseite
  // abhaken können, ohne "Morgenroutine starten" zu müssen, nur um einen
  // einzelnen Punkt wie eine Medikamentengabe zu bestätigen). Sind danach
  // ALLE Schritte dieser Routine für diesen Tag abgehakt, wird automatisch
  // ein normaler Durchlauf gespeichert (routine_durchlaeufe) — dieselbe
  // Quelle, die Streaks/Abzeichen (utils/errungenschaften.js) und die
  // Direktzugriff-Widgets/"Als Nächstes"-Filterung in HomeView.jsx sowieso
  // schon lesen. So bleibt "heute erledigt" unabhängig davon konsistent,
  // ob die Routine per Checkliste oder per geführtem Ablauf durchlaufen
  // wurde — beide Wege bleiben nebeneinander nutzbar.
  const toggleSchrittErledigt = useCallback(
    async (schrittId, datum) => {
      const k = `${datum}__${schrittId}`;
      const aktuellerWert = k in pendingErledigtRef.current ? pendingErledigtRef.current[k] : schrittErledigt[k];
      const nextVal = !aktuellerWert;
      pendingErledigtRef.current[k] = nextVal;
      setSchrittErledigt((prev) => ({ ...prev, [k]: nextVal }));
      const { error } = nextVal
        ? await supabase
            .from("routine_schritt_logs")
            .upsert({ user_id: userId, schritt_id: schrittId, datum }, { onConflict: "user_id,schritt_id,datum" })
        : await supabase.from("routine_schritt_logs").delete().eq("user_id", userId).eq("schritt_id", schrittId).eq("datum", datum);
      if (error) {
        console.error(error);
        pendingErledigtRef.current[k] = aktuellerWert;
        setSchrittErledigt((prev) => ({ ...prev, [k]: aktuellerWert }));
        return;
      }
      if (!nextVal) return;

      const schritt = schritte.find((sc) => sc.id === schrittId);
      if (schritt && istRechtzeitig(schrittZeit(schrittId), belohnungPufferMin)) {
        // Bug-Fix: war bisher fest auf "sun" verdrahtet — bei Abendroutine-
        // Schritten zeigte das Belohnungsfenster dadurch fälschlich eine
        // Sonne statt eines Monds. Jetzt wie in RoutineAblauf.jsx nach
        // schritt.routine unterschieden (13.09.: Morgenroutine bekam dort
        // zusätzlich ein eigenes "sunrise"-Icon statt der vollen Sonne, zur
        // Unterscheidung von Tageslicht).
        feuereBelohnung({ text: `„${schritt.name}" erledigt`, icon: schritt.routine === "morgen" ? "sunrise" : "moon", punkte: 1 });
      }

      if (!schritt) return;
      const geschwister = schritteAm(datum).filter((sc) => sc.routine === schritt.routine);
      const alleErledigt = geschwister.every((sc) => sc.id === schrittId || schrittErledigt[`${datum}__${sc.id}`]);
      const schonDurchlauf = durchlaeufe.some((d) => d.routine === schritt.routine && d.datum === datum);
      if (alleErledigt && !schonDurchlauf) {
        // Letzter Schritt abgehakt → dieselbe große Feier wie beim geführten
        // Ablauf (25.09.); pünktlich = innerhalb des Puffers nach der
        // eingestellten Startzeit der Routine.
        const startZeit = einstellungenAm(datum)[schritt.routine]?.startZeit;
        const jetztIso = new Date().toISOString();
        feuereBelohnung(routineGeschafftFeier(schritt.routine, istRechtzeitig(startZeit, belohnungPufferMin), verspaetungHinweis(startZeit, jetztIso, belohnungPufferMin)));
        durchlaufSpeichern({
          routine: schritt.routine,
          schritte: geschwister
            .sort((a, b) => a.reihenfolge - b.reihenfolge)
            .map((sc) => ({ name: sc.name, geplantMin: sc.dauerMin, tatsaechlichSek: null })),
          gestartetUm: jetztIso,
        });
      }
    },
    [schrittErledigt, schritte, durchlaeufe, userId, belohnungPufferMin, schrittZeit, durchlaufSpeichern, einstellungenAm, schritteAm]
  );

  // --- Schichtarbeit: Varianten + Schichtplan (25.09.) -------------------
  const varianteSpeichern = useCallback(
    async (v) => {
      const row = {
        user_id: userId,
        name: v.name?.trim() || "Variante",
        icon: v.icon || "🕐",
        arbeit_von: v.arbeitVon || null,
        arbeit_bis: v.arbeitBis || null,
        morgen_start: v.morgenStart || null,
        abend_start: v.abendStart || null,
        reihenfolge: v.reihenfolge ?? varianten.length,
      };
      const anfrage = v.id ? supabase.from("routine_varianten").update(row).eq("id", v.id) : supabase.from("routine_varianten").insert(row);
      const { data, error } = await anfrage.select().single();
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      const neu = zeileZuVariante(data);
      setVarianten((prev) => (v.id ? prev.map((x) => (x.id === v.id ? neu : x)) : [...prev, neu]));
      return { ok: true, variante: neu };
    },
    [userId, varianten.length]
  );

  const varianteEntfernen = useCallback(async (id) => {
    const { error } = await supabase.from("routine_varianten").delete().eq("id", id);
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    setVarianten((prev) => prev.filter((x) => x.id !== id));
    setPlan((prev) => Object.fromEntries(Object.entries(prev).filter(([, t]) => t.varianteId !== id)));
    return { ok: true };
  }, []);

  // Ganzen Zeitraum speichern: alte Einträge von..bis ersetzen. Tage ohne
  // Variante (null) bleiben leer = normale Zeit.
  const schichtplanSpeichern = useCallback(
    async (tage, von, bis) => {
      const { error: loeschFehler } = await supabase.from("routine_schichtplan").delete().eq("user_id", userId).gte("datum", von).lte("datum", bis);
      if (loeschFehler) {
        console.error(loeschFehler);
        return { ok: false, error: loeschFehler.message };
      }
      const rows = tage
        .filter((t) => t.varianteId || t.art === "krank" || t.art === "eigen")
        .map((t) => ({ user_id: userId, datum: t.datum, variante_id: t.varianteId || null, art: t.art || "variante", morgen_start: t.morgenStart || null, abend_start: t.abendStart || null }));
      if (rows.length) {
        const { error } = await supabase.from("routine_schichtplan").insert(rows);
        if (error) {
          console.error(error);
          return { ok: false, error: error.message };
        }
      }
      setPlan((prev) => {
        const next = Object.fromEntries(Object.entries(prev).filter(([d]) => d < von || d > bis));
        rows.forEach((r) => (next[r.datum] = zeileZuPlantag(r)));
        return next;
      });
      return { ok: true, anzahl: rows.length };
    },
    [userId]
  );

  // Einen Tag ändern ("Heute anders"); `eintrag` null = zurück auf normal.
  const schichtplanTagSetzen = useCallback(
    async (datum, eintrag) => {
      if (!eintrag) {
        const { error } = await supabase.from("routine_schichtplan").delete().eq("user_id", userId).eq("datum", datum);
        if (error) return { ok: false, error: error.message };
        setPlan((prev) => Object.fromEntries(Object.entries(prev).filter(([d]) => d !== datum)));
        return { ok: true };
      }
      const row = { user_id: userId, datum, variante_id: eintrag.varianteId || null, art: eintrag.art || "variante", morgen_start: eintrag.morgenStart || null, abend_start: eintrag.abendStart || null };
      const { error } = await supabase.from("routine_schichtplan").upsert(row, { onConflict: "user_id,datum" });
      if (error) {
        console.error(error);
        return { ok: false, error: error.message };
      }
      setPlan((prev) => ({ ...prev, [datum]: zeileZuPlantag(row) }));
      return { ok: true };
    },
    [userId]
  );

  return {
    routineSchritte: schritteHeute,
    routineSchritteAlle: schritte,
    routineEinstellungenStandard: einstellungen,
    routineVarianten: varianten,
    routineSchichtplan: plan,
    routineHeutePlan: heutePlan,
    routinePlanFuer: planAm,
    routineEinstellungenFuer: einstellungenAm,
    routineSchritteFuer: schritteAm,
    routineVarianteSpeichern: varianteSpeichern,
    routineVarianteEntfernen: varianteEntfernen,
    routineSchichtplanSpeichern: schichtplanSpeichern,
    routineSchichtplanTagSetzen: schichtplanTagSetzen,
    routineDurchlaeufe: durchlaeufe,
    routineEinstellungen: einstellungenHeute,
    routineSchrittErledigt: schrittErledigt,
    routineSchrittZeit: schrittZeit,
    routineSchrittErledigtUmschalten: toggleSchrittErledigt,
    routineSchrittHinzufuegen: schrittHinzufuegen,
    routineSchrittEntfernen: schrittEntfernen,
    routineSchrittVerschieben: schrittVerschieben,
    routineDurchlaufSpeichern: durchlaufSpeichern,
    routineZeitrahmenSetzen: zeitrahmenSetzen,
  };
}
