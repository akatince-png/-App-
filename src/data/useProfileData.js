import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { MESSWERT_DEFS } from "../constants";

const DEFAULT_AKTIVE = ["gewicht", "kfa", "taille", "blutdruck", "ruhepuls", "energie"];

export function useProfileData(userId) {
  const [loading, setLoading] = useState(true);
  const [personalData, setPersonalData] = useState({
    geschlecht: "",
    geburtsdatum: "",
    groesse: "",
    gewichtStart: "",
  });
  const [datenteilung, setDatenteilungState] = useState(false);
  const [onboardingComplete, setOnboardingCompleteState] = useState(false);
  const [onboardingModus, setOnboardingModusState] = useState("kurz");
  const [isAdmin, setIsAdmin] = useState(false);
  const [aktiveMesswerte, setAktiveMesswerte] = useState(DEFAULT_AKTIVE);
  const [customMesswerte, setCustomMesswerte] = useState([]);
  const [categoryZiele, setCategoryZieleState] = useState({});
  const [erinnerungen, setErinnerungenState] = useState({});
  const [steckbrief, setSteckbriefState] = useState({});
  const [belohnungPufferMin, setBelohnungPufferMinState] = useState(10);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: profile }, { data: custom }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("custom_messwerte").select("*").eq("user_id", userId).order("created_at"),
      ]);
      if (cancelled) return;
      if (profile) {
        setPersonalData({
          geschlecht: profile.geschlecht || "",
          geburtsdatum: profile.geburtsdatum || "",
          groesse: profile.groesse ?? "",
          gewichtStart: profile.gewicht_start ?? "",
        });
        setDatenteilungState(!!profile.datenteilung);
        setOnboardingCompleteState(!!profile.onboarding_complete);
        setOnboardingModusState(profile.onboarding_modus === "lang" ? "lang" : "kurz");
        setIsAdmin(!!profile.is_admin);
        setAktiveMesswerte(profile.aktive_messwerte?.length ? profile.aktive_messwerte : DEFAULT_AKTIVE);
        setCategoryZieleState(profile.category_ziele || {});
        setErinnerungenState(profile.erinnerungen || {});
        setSteckbriefState(profile.steckbrief || {});
        setBelohnungPufferMinState(profile.belohnung_puffer_min ?? 10);

        // Serverseitiger Erinnerungs-Versand (pg_cron) rechnet in UTC und
        // muss wissen, in welcher Zeitzone eine eingetragene Uhrzeit
        // ("08:00") gemeint ist — deshalb hier einmalig aus dem Browser
        // übernehmen, falls noch nicht gesetzt oder der Nutzer inzwischen in
        // einer anderen Zeitzone ist.
        const erkannteZeitzone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (erkannteZeitzone && profile.zeitzone !== erkannteZeitzone) {
          supabase
            .from("profiles")
            .update({ zeitzone: erkannteZeitzone })
            .eq("id", userId)
            .then(({ error }) => error && console.error(error));
        }
      }
      setCustomMesswerte(
        (custom || []).map((c) => ({ id: c.key, label: c.label, unit: c.unit || "", numeric: true }))
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Bug-Fix (alle Set-Funktionen in dieser Datei): bei einem Fehlschlag des
  // Updates zeigte die Oberfläche trotzdem dauerhaft den neuen (nicht
  // gespeicherten) Wert, bis zum nächsten Neuladen — jetzt Rollback auf den
  // vorherigen Stand bei einem Fehler.
  const setPersonal = useCallback(
    (feld, val) => {
      let vorher;
      setPersonalData((prev) => {
        vorher = prev[feld];
        return { ...prev, [feld]: val };
      });
      const column = { geschlecht: "geschlecht", geburtsdatum: "geburtsdatum", groesse: "groesse", gewichtStart: "gewicht_start" }[feld];
      if (!column || !userId) return;
      supabase
        .from("profiles")
        .update({ [column]: val === "" ? null : val })
        .eq("id", userId)
        .then(({ error }) => {
          if (error) {
            console.error(error);
            setPersonalData((prev) => ({ ...prev, [feld]: vorher }));
          }
        });
    },
    [userId]
  );

  const toggleDatenteilung = useCallback(() => {
    let vorher;
    setDatenteilungState((prev) => {
      vorher = prev;
      const next = !prev;
      supabase
        .from("profiles")
        .update({ datenteilung: next })
        .eq("id", userId)
        .then(({ error }) => {
          if (error) {
            console.error(error);
            setDatenteilungState(vorher);
          }
        });
      return next;
    });
  }, [userId]);

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleteState(true);
    supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", userId)
      .then(({ error }) => {
        if (error) {
          console.error(error);
          setOnboardingCompleteState(false);
        }
      });
  }, [userId]);

  // Zum wiederholten Testen des Willkommens-/Einrichtungs-Ablaufs mit
  // demselben Account, ohne jedes Mal ein neues Konto anzulegen. Muss
  // wirklich blank zurücksetzen, sonst zeigt der erneute Durchlauf die
  // alten Peptide/Gewohnheiten/Mahlzeiten/Supplemente/Medikamente wieder
  // an (identische Fehlerklasse wie der frühere "Neues Protokoll"-Bug).
  // Löscht nur, was das Onboarding selbst anlegen kann (je ein Beispiel
  // pro Kategorie) — Trainings-/Schlaf-/Hydration-Log-Historie bleibt
  // unangetastet, das Onboarding schreibt dort nur ein Ziel, keine Logs.
  const resetOnboarding = useCallback(async () => {
    const results = await Promise.all([
      supabase.from("protocols").delete().eq("user_id", userId),
      supabase.from("routines").delete().eq("user_id", userId),
      supabase.from("meals").delete().eq("user_id", userId),
      supabase.from("supplements").delete().eq("user_id", userId),
      supabase.from("hormones").delete().eq("user_id", userId),
      supabase.from("hydration_settings").delete().eq("user_id", userId),
    ]);
    const failed = results.find((r) => r.error);
    if (failed) {
      console.error(failed.error);
      return { ok: false, error: failed.error.message };
    }
    const { error } = await supabase.from("profiles").update({ onboarding_complete: false, category_ziele: {} }).eq("id", userId);
    if (error) {
      console.error(error);
      return { ok: false, error: error.message };
    }
    setOnboardingCompleteState(false);
    setCategoryZieleState({});
    return { ok: true };
  }, [userId]);

  // Zieldauer (offen/zeitlich begrenzt) je Pläne-Kategorie ohne eigene
  // "eine Zeile pro Nutzer"-Tabelle (Schlaf, Hydration, Ernährung, Training,
  // Supplemente, Medikamente) — Peptide/Gewohnheiten haben dafür eigene
  // Spalten (protocols.dauer_wochen bzw. routines.ziel_tage).
  const setCategoryZiel = useCallback(
    (kategorie, patch) => {
      let vorher;
      setCategoryZieleState((prev) => {
        vorher = prev;
        const next = { ...prev, [kategorie]: patch };
        supabase
          .from("profiles")
          .update({ category_ziele: next })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) {
              console.error(error);
              setCategoryZieleState(vorher);
            }
          });
        return next;
      });
    },
    [userId]
  );

  // Erinnerungs-Präferenz je Pläne-Kategorie (Ja/Nein) — steuert, ob der
  // serverseitige Erinnerungs-Versand diese Kategorie für den Nutzer
  // berücksichtigt. Gleiches jsonb-Muster wie setCategoryZiel.
  const setErinnerung = useCallback(
    (kategorie, aktiv) => {
      let vorher;
      setErinnerungenState((prev) => {
        vorher = prev;
        const next = { ...prev, [kategorie]: aktiv };
        supabase
          .from("profiles")
          .update({ erinnerungen: next })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) {
              console.error(error);
              setErinnerungenState(vorher);
            }
          });
        return next;
      });
    },
    [userId]
  );

  // Kurzer "Steckbrief" aus dem reduzierten Coachee-Onboarding (13.08.) —
  // Hintergrundfragen, die NICHT direkt in Supplemente/Training übernommen
  // werden (die richtet die Admin stellvertretend ein), sondern der Admin
  // nur als Vorbereitung fürs Erstgespräch dienen. Gleiches jsonb-Muster
  // wie setCategoryZiel/setErinnerung.
  const setSteckbrief = useCallback(
    (felder) => {
      let vorher;
      setSteckbriefState((prev) => {
        vorher = prev;
        const next = { ...prev, ...felder };
        supabase
          .from("profiles")
          .update({ steckbrief: next })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) {
              console.error(error);
              setSteckbriefState(vorher);
            }
          });
        return next;
      });
    },
    [userId]
  );

  // Admin-konfigurierbarer Puffer fürs Belohnungsfenster (Nutzerin-Vorgabe,
  // 12.09.) — gleiches Update-mit-Rollback-Muster wie setPersonal.
  const setBelohnungPufferMin = useCallback(
    (minuten) => {
      const wert = Math.max(0, Number(minuten) || 0);
      let vorher;
      setBelohnungPufferMinState((prev) => {
        vorher = prev;
        return wert;
      });
      supabase
        .from("profiles")
        .update({ belohnung_puffer_min: wert })
        .eq("id", userId)
        .then(({ error }) => {
          if (error) {
            console.error(error);
            setBelohnungPufferMinState(vorher);
          }
        });
    },
    [userId]
  );

  const combinedMesswertDefs = useMemo(() => [...MESSWERT_DEFS, ...customMesswerte], [customMesswerte]);

  const toggleMesswert = useCallback(
    (id) => {
      let vorher;
      setAktiveMesswerte((prev) => {
        vorher = prev;
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        supabase
          .from("profiles")
          .update({ aktive_messwerte: next })
          .eq("id", userId)
          .then(({ error }) => {
            if (error) {
              console.error(error);
              setAktiveMesswerte(vorher);
            }
          });
        return next;
      });
    },
    [userId]
  );

  const addCustomMesswert = useCallback(
    async (label) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const id = trimmed.toLowerCase().replace(/\s+/g, "_");
      // Sowohl per ID als auch per Label (unabhängig von Groß-/Kleinschreibung)
      // gegen Duplikate prüfen — ein alter, vor dieser Prüfung angelegter
      // Eintrag kann eine andere ID als der eingebaute Messwert tragen, aber
      // dasselbe Label ("BMI"), und würde sonst doppelt in der Liste auftauchen.
      const doppelt = combinedMesswertDefs.some(
        (d) => d.id === id || d.label.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (doppelt) return;
      const { error } = await supabase
        .from("custom_messwerte")
        .insert({ user_id: userId, key: id, label: trimmed, unit: "" });
      if (error) {
        console.error(error);
        return;
      }
      setCustomMesswerte((prev) => [...prev, { id, label: trimmed, unit: "", numeric: true }]);
      setAktiveMesswerte((prev) => {
        const next = [...prev, id];
        supabase
          .from("profiles")
          .update({ aktive_messwerte: next })
          .eq("id", userId)
          .then(({ error: e }) => e && console.error(e));
        return next;
      });
    },
    [userId, combinedMesswertDefs]
  );

  // Entfernt einen selbst angelegten Messwert wieder (z. B. einen versehentlich
  // doppelt angelegten) — nur für eigene, nicht für eingebaute Messwerte
  // relevant, siehe combinedMesswertDefs.
  const removeCustomMesswert = useCallback(
    async (id) => {
      const { error } = await supabase.from("custom_messwerte").delete().eq("user_id", userId).eq("key", id);
      if (error) {
        console.error(error);
        return;
      }
      setCustomMesswerte((prev) => prev.filter((d) => d.id !== id));
      setAktiveMesswerte((prev) => {
        const next = prev.filter((x) => x !== id);
        supabase
          .from("profiles")
          .update({ aktive_messwerte: next })
          .eq("id", userId)
          .then(({ error: e }) => e && console.error(e));
        return next;
      });
    },
    [userId]
  );

  return {
    loading,
    personalData,
    setPersonal,
    datenteilung,
    toggleDatenteilung,
    onboardingComplete,
    completeOnboarding,
    resetOnboarding,
    onboardingModus,
    isAdmin,
    aktiveMesswerte,
    toggleMesswert,
    customMesswerte,
    combinedMesswertDefs,
    addCustomMesswert,
    removeCustomMesswert,
    categoryZiele,
    setCategoryZiel,
    erinnerungen,
    setErinnerung,
    steckbrief,
    setSteckbrief,
    belohnungPufferMin,
    setBelohnungPufferMin,
  };
}
