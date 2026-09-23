import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadPhoto } from "../lib/storage";
import { buildDosePlan, coerceDoseFeldWert, DOSE_SPALTEN_VOLLSTAENDIG, DOSE_NUMERISCHE_FELDER_VOLLSTAENDIG } from "../utils/schedule";
import { toLocalISODate } from "../utils/dates";
import { istRechtzeitig } from "../utils/belohnungZeit";
import { feuereBelohnung } from "../utils/belohnungBus";

function rowToHormonDosierung(row) {
  return {
    id: row.id,
    hauptprotokollId: row.hauptprotokoll_id || null,
    menge: row.menge || "",
    kategorie: row.kategorie || "Hormone",
    einnahmeart: row.einnahmeart || "Injektion",
    intervallTyp: row.intervall_mode || "fixed",
    intervallDays: row.intervall_days || 7,
    customDays: row.custom_days != null ? String(row.custom_days) : "",
    onDays: row.on_days != null ? String(row.on_days) : "",
    offDays: row.off_days != null ? String(row.off_days) : "",
    weekdays: row.weekdays || [],
    eigenerStart: row.eigener_start || "",
    uhrzeiten: row.uhrzeiten?.length ? row.uhrzeiten.map((t) => t.slice(0, 5)) : ["20:00"],
    fotoPath: row.foto_path || null,
    // Nur für kategorie "Peptid" relevant (Injektion/Nasenspray-Details,
    // siehe useProtocolData.js — dieselben zwei Felder, jetzt hier
    // gespiegelt, damit das Onboarding komplett auf hormones umgestellt
    // werden kann, siehe Migration 0077).
    bacWasser: row.bac_wasser_ml != null ? String(row.bac_wasser_ml) : "",
    spruehstoesse: row.spruehstoesse != null ? String(row.spruehstoesse) : "",
    // Nur für kategorie "Cannabis" relevant (THC/CBD-Gehalt + Konsumform-
    // Details je Einnahmeart), siehe CannabisFelder.jsx.
    thcProzent: row.cannabis_thc_prozent != null ? String(row.cannabis_thc_prozent) : "",
    cbdProzent: row.cannabis_cbd_prozent != null ? String(row.cannabis_cbd_prozent) : "",
    tabakMenge: row.cannabis_tabak_menge || "",
    filterTyp: row.cannabis_filter || "",
    temperaturGrad: row.cannabis_temperatur_grad != null ? String(row.cannabis_temperatur_grad) : "",
    tropfenAnzahl: row.cannabis_tropfen != null ? String(row.cannabis_tropfen) : "",
  };
}

// hormones hat (anders als protocol_peptide, siehe useProtocolData.js) alle
// Spalten inkl. Cannabis-Details — deshalb hier die vollständige Zuordnung
// aus utils/schedule.js direkt verwenden statt einer eigenen Kopie
// (13.09., Teil 60).
const DOSE_FELD_TO_COLUMN = DOSE_SPALTEN_VOLLSTAENDIG;
const NUMERIC_FELDER = DOSE_NUMERISCHE_FELDER_VOLLSTAENDIG;

function toRow(userId, neuesHormon, hauptprotokollId) {
  const isCustom = neuesHormon.intervallTyp === "custom";
  const isCycle = neuesHormon.intervallTyp === "cycle";
  const isWeekdays = neuesHormon.intervallTyp === "weekdays";
  return {
    user_id: userId,
    hauptprotokoll_id: hauptprotokollId || null,
    menge: neuesHormon.menge,
    kategorie: neuesHormon.kategorie || "Hormone",
    einnahmeart: neuesHormon.einnahmeart || "Injektion",
    intervall_mode: neuesHormon.intervallTyp || "fixed",
    intervall_days: !isCustom && !isCycle && !isWeekdays ? neuesHormon.intervallDays : null,
    custom_days: isCustom && neuesHormon.customDays ? Number(neuesHormon.customDays) : null,
    on_days: isCycle && neuesHormon.onDays ? Number(neuesHormon.onDays) : null,
    off_days: isCycle && neuesHormon.offDays !== "" ? Number(neuesHormon.offDays) : null,
    weekdays: isWeekdays ? neuesHormon.weekdays || [] : [],
    eigener_start: neuesHormon.eigenerStart || null,
    uhrzeiten: neuesHormon.uhrzeiten?.length ? neuesHormon.uhrzeiten : ["20:00"],
    // Cannabis-Detailfelder gleich beim Anlegen mit erfassen (anders als
    // bacWasser/spruehstoesse, die bisher nur nachträglich über die
    // Dosis-Bearbeitung gesetzt werden) — die Nutzerin will THC/CBD-Gehalt
    // direkt beim Einrichten angeben können, nicht erst danach.
    cannabis_thc_prozent: neuesHormon.thcProzent ? Number(neuesHormon.thcProzent) : null,
    cannabis_cbd_prozent: neuesHormon.cbdProzent ? Number(neuesHormon.cbdProzent) : null,
    cannabis_tabak_menge: neuesHormon.tabakMenge || null,
    cannabis_filter: neuesHormon.filterTyp || null,
    cannabis_temperatur_grad: neuesHormon.temperaturGrad ? Number(neuesHormon.temperaturGrad) : null,
    cannabis_tropfen: neuesHormon.tropfenAnzahl ? Number(neuesHormon.tropfenAnzahl) : null,
  };
}

export function useHormoneData(userId, startdatum, dauer, hauptprotokollId, belohnungPufferMin) {
  const [hormone, setHormone] = useState([]);
  const [hormonDosierung, setHormonDosierung] = useState({});
  const [hormonErledigt, setHormonErledigt] = useState({});
  const [hormonFeedback, setHormonFeedback] = useState({});
  // Doppeltipp-Schutz (13.09.): siehe pendingErledigtRef in
  // useGewohnheitenData.js — ohne das läse ein zweiter, schnell
  // hinterhergetippter Tap noch den alten (veralteten) React-State, bevor
  // der erste Toggle im UI ankommt, und würde denselben nextVal erneut
  // senden statt das Abhaken rückgängig zu machen.
  const pendingErledigtRef = useRef({});

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: rows }, { data: logs }] = await Promise.all([
        supabase.from("hormones").select("*").eq("user_id", userId).order("created_at"),
        supabase.from("hormone_logs").select("*").eq("user_id", userId),
      ]);
      if (cancelled) return;
      const nextDosierung = {};
      (rows || []).forEach((row) => (nextDosierung[row.name] = rowToHormonDosierung(row)));
      setHormone((rows || []).map((r) => r.name));
      setHormonDosierung(nextDosierung);

      const nextErledigt = {};
      const nextFeedback = {};
      (logs || []).forEach((row) => {
        const k = `${row.dose_date}__${row.hormone_name}__${row.uhrzeit}`;
        nextErledigt[k] = row.erledigt;
        nextFeedback[k] = {
          vertraeglichkeit: row.vertraeglichkeit || "",
          wirkung: row.wirkung || "",
          nebenwirkungen: row.nebenwirkungen || [],
          notizen: row.notizen || "",
          menge: row.menge || null,
        };
      });
      setHormonErledigt(nextErledigt);
      setHormonFeedback(nextFeedback);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const hormonHinzufuegen = useCallback(
    async (neuesHormon) => {
      const name = neuesHormon.name.trim();
      if (!name) return { ok: false, error: "Bitte einen Namen eingeben." };
      if (hormone.includes(name)) return { ok: false, error: "Dieses Präparat ist schon in deinem Protokoll." };
      const { data, error } = await supabase.from("hormones").insert({ name, ...toRow(userId, neuesHormon, hauptprotokollId) }).select().single();
      if (error) {
        console.error(error);
        if (error.code === "23505") {
          // Existiert in der Datenbank schon (z. B. weil ein früherer Versuch
          // tatsächlich gespeichert wurde, die Seite das aber noch nicht wusste)
          // -> lokalen Stand aus der DB neu laden statt nur einen Fehler zu zeigen.
          const { data: rows } = await supabase.from("hormones").select("*").eq("user_id", userId).order("created_at");
          const nextDosierung = {};
          (rows || []).forEach((row) => (nextDosierung[row.name] = rowToHormonDosierung(row)));
          setHormone((rows || []).map((r) => r.name));
          setHormonDosierung(nextDosierung);
          return { ok: false, error: `"${name}" war schon gespeichert — deine Liste wurde aktualisiert, schau weiter unten.` };
        }
        return { ok: false, error: `Speichern fehlgeschlagen: ${error.message}` };
      }
      setHormone((prev) => [...prev, name]);
      setHormonDosierung((prev) => ({
        ...prev,
        [name]: {
          id: data.id,
          hauptprotokollId: data.hauptprotokoll_id || null,
          menge: neuesHormon.menge,
          kategorie: neuesHormon.kategorie || "Hormone",
          einnahmeart: neuesHormon.einnahmeart || "Injektion",
          intervallTyp: neuesHormon.intervallTyp || "fixed",
          intervallDays: neuesHormon.intervallDays,
          customDays: neuesHormon.customDays,
          onDays: neuesHormon.onDays,
          offDays: neuesHormon.offDays,
          weekdays: neuesHormon.weekdays || [],
          eigenerStart: neuesHormon.eigenerStart,
          uhrzeiten: neuesHormon.uhrzeiten?.length ? neuesHormon.uhrzeiten : ["20:00"],
          fotoPath: null,
          bacWasser: "",
          spruehstoesse: "",
          thcProzent: neuesHormon.thcProzent || "",
          cbdProzent: neuesHormon.cbdProzent || "",
          tabakMenge: neuesHormon.tabakMenge || "",
          filterTyp: neuesHormon.filterTyp || "",
          temperaturGrad: neuesHormon.temperaturGrad || "",
          tropfenAnzahl: neuesHormon.tropfenAnzahl || "",
        },
      }));
      return { ok: true };
    },
    [hormone, userId, hauptprotokollId]
  );

  const hormonEntfernen = useCallback(
    async (name) => {
      // Bug-Fix: bei Fehlschlag (Netzwerk/RLS) verschwand der Eintrag trotzdem
      // sofort aus der Ansicht, bis zum nächsten Neuladen — wirkte wie
      // "gelöscht", tauchte dann aber wieder auf. Vorherigen Stand merken und
      // bei Fehler wiederherstellen statt nur in die Konsole zu loggen.
      let vorherigerEintrag;
      setHormonDosierung((prev) => {
        vorherigerEintrag = prev[name];
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setHormone((prev) => prev.filter((h) => h !== name));
      const { error } = await supabase.from("hormones").delete().eq("user_id", userId).eq("name", name);
      if (error) {
        console.error(error);
        setHormone((prev) => (prev.includes(name) ? prev : [...prev, name]));
        setHormonDosierung((prev) => ({ ...prev, [name]: vorherigerEintrag }));
      }
    },
    [userId]
  );

  const setHormonFoto = useCallback(
    async (name, file) => {
      try {
        const path = await uploadPhoto(userId, file, "praeparate");
        setHormonDosierung((prev) => ({ ...prev, [name]: { ...prev[name], fotoPath: path } }));
        const { error } = await supabase.from("hormones").update({ foto_path: path }).eq("user_id", userId).eq("name", name);
        if (error) console.error(error);
      } catch (err) {
        console.error(err);
      }
    },
    [userId]
  );

  const setHormonKategorie = useCallback(
    async (name, kategorie) => {
      // Bug-Fix: bei Fehlschlag zeigte die Oberfläche trotzdem dauerhaft die
      // neue Kategorie, bis zum nächsten Neuladen — jetzt Rollback auf den
      // vorherigen Stand bei einem Fehler.
      let vorherigerWert;
      setHormonDosierung((prev) => {
        vorherigerWert = prev[name]?.kategorie;
        return { ...prev, [name]: { ...prev[name], kategorie } };
      });
      const { error } = await supabase.from("hormones").update({ kategorie }).eq("user_id", userId).eq("name", name);
      if (error) {
        console.error(error);
        setHormonDosierung((prev) => ({ ...prev, [name]: { ...prev[name], kategorie: vorherigerWert } }));
      }
    },
    [userId]
  );

  const setHormonEinnahmeart = useCallback(
    async (name, einnahmeart) => {
      let vorherigerWert;
      setHormonDosierung((prev) => {
        vorherigerWert = prev[name]?.einnahmeart;
        return { ...prev, [name]: { ...prev[name], einnahmeart } };
      });
      const { error } = await supabase.from("hormones").update({ einnahmeart }).eq("user_id", userId).eq("name", name);
      if (error) {
        console.error(error);
        setHormonDosierung((prev) => ({ ...prev, [name]: { ...prev[name], einnahmeart: vorherigerWert } }));
      }
    },
    [userId]
  );

  // Ändert ein einzelnes Dosierungsfeld eines bestehenden Medikaments —
  // spiegelt useProtocolData.setDose für Peptide, nur direkt gegen die
  // hormones-Tabelle statt über protocol_id/protocol_peptide.
  // Bug-Fix (alle drei Zweige): bei einem Fehlschlag des Updates zeigte die
  // Oberfläche trotzdem dauerhaft den neuen (nicht gespeicherten) Wert, bis
  // zum nächsten Neuladen — jetzt wird der vorherige Stand vor der
  // optimistischen Änderung gemerkt und bei einem Fehler wiederhergestellt.
  const setHormonDose = useCallback(
    (name, feld, val) => {
      if (feld === "intervallPreset") {
        let vorher;
        setHormonDosierung((prev) => {
          vorher = prev[name];
          return { ...prev, [name]: { ...prev[name], intervallTyp: "fixed", intervallDays: val } };
        });
        supabase
          .from("hormones")
          .update({ intervall_mode: "fixed", intervall_days: val })
          .eq("user_id", userId)
          .eq("name", name)
          .then(({ error }) => {
            if (error) {
              console.error(error);
              setHormonDosierung((prev) => ({ ...prev, [name]: vorher }));
            }
          });
        return;
      }

      let vorher;
      setHormonDosierung((prev) => {
        vorher = prev[name];
        return { ...prev, [name]: { ...prev[name], [feld]: val } };
      });

      if (feld === "intervallTyp") {
        supabase
          .from("hormones")
          .update({ intervall_mode: val })
          .eq("user_id", userId)
          .eq("name", name)
          .then(({ error }) => {
            if (error) {
              console.error(error);
              setHormonDosierung((prev) => ({ ...prev, [name]: vorher }));
            }
          });
        return;
      }

      const column = DOSE_FELD_TO_COLUMN[feld];
      if (!column) return;
      const value = coerceDoseFeldWert(feld, val, NUMERIC_FELDER);

      supabase
        .from("hormones")
        .update({ [column]: value })
        .eq("user_id", userId)
        .eq("name", name)
        .then(({ error }) => {
          if (error) {
            console.error(error);
            setHormonDosierung((prev) => ({ ...prev, [name]: vorher }));
          }
        });
    },
    [userId]
  );

  // Wie setHormonDose(), aber für mehrere Felder auf einmal — ein einzelner
  // DB-Aufruf statt einem pro geändertem Feld (siehe setDoseBatch() in
  // useProtocolData.js für dieselbe Begründung/dasselbe Muster).
  const setHormonDoseBatch = useCallback(
    (name, felder) => {
      let localPatch = {};
      const dbPatch = {};

      Object.entries(felder).forEach(([feld, val]) => {
        if (feld === "intervallPreset") {
          localPatch = { ...localPatch, intervallTyp: "fixed", intervallDays: val };
          dbPatch.intervall_mode = "fixed";
          dbPatch.intervall_days = val;
          return;
        }
        if (feld === "intervallTyp") {
          localPatch = { ...localPatch, intervallTyp: val };
          dbPatch.intervall_mode = val;
          return;
        }
        const column = DOSE_FELD_TO_COLUMN[feld];
        if (!column) return;
        localPatch = { ...localPatch, [feld]: val };
        dbPatch[column] = coerceDoseFeldWert(feld, val, NUMERIC_FELDER);
      });

      // Bug-Fix: siehe setHormonDose() — Rollback auf den vorherigen Stand
      // bei einem Fehlschlag statt eines dauerhaft falschen Anzeigewerts.
      let vorher;
      setHormonDosierung((prev) => {
        vorher = prev[name];
        return { ...prev, [name]: { ...prev[name], ...localPatch } };
      });
      if (Object.keys(dbPatch).length === 0) return;

      supabase
        .from("hormones")
        .update(dbPatch)
        .eq("user_id", userId)
        .eq("name", name)
        .then(({ error }) => {
          if (error) {
            console.error(error);
            setHormonDosierung((prev) => ({ ...prev, [name]: vorher }));
          }
        });
    },
    [userId]
  );

  const toggleHormonErledigt = useCallback(
    async (datumStr, name, uhrzeit) => {
      const k = `${datumStr}__${name}__${uhrzeit}`;
      const aktuellerWert = k in pendingErledigtRef.current ? pendingErledigtRef.current[k] : hormonErledigt[k];
      const nextVal = !aktuellerWert;
      pendingErledigtRef.current[k] = nextVal;
      const nowIso = new Date().toISOString();
      const payload = { user_id: userId, hormone_name: name, dose_date: datumStr, uhrzeit, erledigt: nextVal, erledigt_at: nextVal ? nowIso : null };
      setHormonErledigt((prev) => ({ ...prev, [k]: nextVal }));
      if (nextVal) {
        // Menge wird als Schnappschuss der gerade gültigen Dosierung
        // gespeichert, damit sie erhalten bleibt, falls die Dosierung
        // später geändert wird — Historie darf sich nicht rückwirkend ändern.
        const menge = hormonDosierung[name]?.menge || null;
        payload.menge = menge;
        setHormonFeedback((prev) => ({ ...prev, [k]: { ...prev[k], menge } }));
      }
      const { error } = await supabase.from("hormone_logs").upsert(payload, { onConflict: "user_id,hormone_name,dose_date,uhrzeit" });
      if (error) {
        console.error(error);
        // Bug-Fix: bei Fehlschlag blieb das Abhaken trotzdem dauerhaft
        // sichtbar (bis zum nächsten Neuladen) — jetzt Rollback auf den
        // Stand vor dem Tap.
        pendingErledigtRef.current[k] = aktuellerWert;
        setHormonErledigt((prev) => ({ ...prev, [k]: aktuellerWert }));
        return;
      }
      // Belohnungsfenster (Nutzerin-Vorgabe, 12.09.): nur beim Abhaken (nicht
      // beim Rückgängigmachen) und nur, wenn nicht später als der
      // Admin-Puffer nach der geplanten Uhrzeit erledigt.
      if (nextVal && istRechtzeitig(uhrzeit, belohnungPufferMin)) {
        feuereBelohnung({ text: `„${name}" genommen`, icon: "cross", punkte: 1 });
      }
    },
    [hormonErledigt, userId, hormonDosierung, belohnungPufferMin]
  );

  // Bug-Fix (13.09.): bei einem Fehlschlag des Upserts zeigte die
  // Oberfläche trotzdem dauerhaft "erledigt + Feedback gespeichert" an, bis
  // zum nächsten Neuladen.
  const saveHormonFeedback = useCallback(
    async (dose, draftFeedback) => {
      const datumStr = toLocalISODate(dose.date);
      const k = `${datumStr}__${dose.name}__${dose.uhrzeit}`;
      const nowIso = new Date().toISOString();
      const record = {
        vertraeglichkeit: draftFeedback.vertraeglichkeit,
        wirkung: draftFeedback.wirkung,
        nebenwirkungen: draftFeedback.nebenwirkungen,
        notizen: draftFeedback.notizen,
        menge: dose.menge || null,
      };
      const vorherErledigt = hormonErledigt[k];
      const vorherFeedback = hormonFeedback[k];
      setHormonErledigt((prev) => ({ ...prev, [k]: true }));
      setHormonFeedback((prev) => ({ ...prev, [k]: record }));
      const { error } = await supabase.from("hormone_logs").upsert(
        {
          user_id: userId,
          hormone_name: dose.name,
          dose_date: datumStr,
          uhrzeit: dose.uhrzeit,
          erledigt: true,
          erledigt_at: nowIso,
          ...record,
        },
        { onConflict: "user_id,hormone_name,dose_date,uhrzeit" }
      );
      if (error) {
        console.error(error);
        setHormonErledigt((prev) => ({ ...prev, [k]: vorherErledigt }));
        setHormonFeedback((prev) => ({ ...prev, [k]: vorherFeedback }));
      }
    },
    [userId, hormonErledigt, hormonFeedback]
  );

  const skipHormonFeedback = useCallback(
    async (dose) => {
      const datumStr = toLocalISODate(dose.date);
      const k = `${datumStr}__${dose.name}__${dose.uhrzeit}`;
      const nowIso = new Date().toISOString();
      const vorherErledigt = hormonErledigt[k];
      const vorherFeedback = hormonFeedback[k];
      setHormonErledigt((prev) => ({ ...prev, [k]: true }));
      setHormonFeedback((prev) => ({ ...prev, [k]: { ...prev[k], menge: dose.menge || null } }));
      const { error } = await supabase.from("hormone_logs").upsert(
        { user_id: userId, hormone_name: dose.name, dose_date: datumStr, uhrzeit: dose.uhrzeit, erledigt: true, erledigt_at: nowIso, menge: dose.menge || null },
        { onConflict: "user_id,hormone_name,dose_date,uhrzeit" }
      );
      if (error) {
        console.error(error);
        setHormonErledigt((prev) => ({ ...prev, [k]: vorherErledigt }));
        setHormonFeedback((prev) => ({ ...prev, [k]: vorherFeedback }));
        return;
      }
      // Tagesplan-"Bestätigen" läuft seit dem Ein-Tipp-Umbau (23.09.) über
      // diese Funktion — ohne diese Zeile blieb das Belohnungsfenster dort
      // stumm (es feuerte bisher nur über toggleHormonErledigt, also nur auf
      // der Startseite). Gleiche Bedingungen wie dort.
      if (!vorherErledigt && istRechtzeitig(dose.uhrzeit, belohnungPufferMin)) {
        feuereBelohnung({ text: `„${dose.name}" genommen`, icon: "cross", punkte: 1 });
      }
    },
    [userId, hormonErledigt, hormonFeedback, belohnungPufferMin]
  );

  const hormonPlan = useMemo(
    () =>
      buildDosePlan(hormone, hormonDosierung, startdatum, dauer, (h, d, date, uhrzeit) => ({
        date,
        name: h,
        menge: d.menge || "",
        einnahmeart: d.einnahmeart || "Injektion",
        uhrzeit,
      })),
    [hormone, hormonDosierung, startdatum, dauer]
  );

  return {
    hormone,
    hormonDosierung,
    hormonHinzufuegen,
    hormonEntfernen,
    setHormonFoto,
    setHormonKategorie,
    setHormonEinnahmeart,
    setHormonDose,
    setHormonDoseBatch,
    hormonErledigt,
    toggleHormonErledigt,
    hormonFeedback,
    saveHormonFeedback,
    skipHormonFeedback,
    hormonPlan,
  };
}
