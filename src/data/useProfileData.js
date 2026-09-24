import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { MESSWERT_DEFS } from "../constants";

const DEFAULT_AKTIVE = ["gewicht", "kfa", "taille", "blutdruck", "ruhepuls", "energie"];

// Bug-Fix (17.09., "Testlauf"-Nachkontrolle): setCategoryZiel/setErinnerung/
// setSteckbrief/toggleMesswert etc. lesen alle den kompletten jsonb-Wert,
// bauen lokal ein gepatchtes Objekt/Array und schreiben es KOMPLETT zurück
// ("ganze Spalte überschreiben" statt gezieltem DB-seitigem Merge). Tippt
// die Nutzerin schnell hintereinander auf zwei VERSCHIEDENE Einstellungen
// (z. B. zwei Erinnerungen in der Liste in "Mehr" — bei ADHS keine
// Seltenheit, siehe pendingErledigtRef-Muster in mehreren anderen Dateien
// für dasselbe Verhalten bei EINEM Wert), lief bisher jeder Tap mit einem
// beim Klick eingefrorenen ("next") Stand direkt in einen eigenen
// Netzwerk-Request — kommt die ÄLTERE Antwort NACH der neueren an (Netzwerk
// garantiert keine Reihenfolge), überschreibt sie die neuere Änderung in
// der DB wieder, lautlos, ohne dass die Anzeige (die längst beides korrekt
// zeigt) das je verrät. Serialisiert alle Schreibvorgänge auf dieselbe
// profiles-Spalte hintereinander UND liest den zu schreibenden Wert erst
// im Moment der tatsächlichen Ausführung aus einer Ref — dadurch trägt
// JEDER Request, ganz gleich in welcher Reihenfolge er tatsächlich
// abgeschickt wird, immer den zu diesem Zeitpunkt aktuellsten, bereits
// vollständig zusammengeführten Stand.
function useSpaltenSchreiber(userId, column) {
  const ref = useRef(undefined);
  const ketteRef = useRef(Promise.resolve());
  const schreiben = useCallback(
    (wert) => {
      ref.current = wert;
      const aufgabe = ketteRef.current.then(() => supabase.from("profiles").update({ [column]: ref.current }).eq("id", userId));
      ketteRef.current = aufgabe.then(
        () => {},
        () => {}
      );
      return aufgabe;
    },
    [userId, column]
  );
  return schreiben;
}

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
  // Admin-Konto vs. Coachee-Ansicht (Nutzerinnen-Wunsch 23.09.: "als Admin
  // auch ganz normal wie jede Coachee die App benutzen"): `istAdminKonto` ist
  // das echte Recht aus profiles.is_admin, `isAdmin` die Ansicht, nach der
  // sich die ganze Oberfläche richtet. Mit eingeschalteter Coachee-Ansicht
  // ist isAdmin false — alles (Home, KI, Pläne, Onboarding) verhält sich
  // exakt wie bei einer Coachee, mit den eigenen Daten. Rein clientseitig,
  // pro Gerät gemerkt; an den Datenbank-Rechten ändert sich nichts.
  const [istAdminKonto, setIstAdminKonto] = useState(false);
  const [coacheeAnsicht, setCoacheeAnsichtState] = useState(() => {
    try {
      return !!userId && localStorage.getItem(`aka_coachee_ansicht_${userId}`) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      setCoacheeAnsichtState(!!userId && localStorage.getItem(`aka_coachee_ansicht_${userId}`) === "1");
    } catch {
      setCoacheeAnsichtState(false);
    }
  }, [userId]);
  const isAdmin = istAdminKonto && !coacheeAnsicht;
  const setCoacheeAnsicht = useCallback(
    (an) => {
      setCoacheeAnsichtState(!!an);
      try {
        if (an) localStorage.setItem(`aka_coachee_ansicht_${userId}`, "1");
        else localStorage.removeItem(`aka_coachee_ansicht_${userId}`);
      } catch {
        // ohne localStorage gilt die Ansicht nur bis zum Neuladen
      }
    },
    [userId]
  );
  const [aktiveMesswerte, setAktiveMesswerte] = useState(DEFAULT_AKTIVE);
  const [customMesswerte, setCustomMesswerte] = useState([]);
  const [categoryZiele, setCategoryZieleState] = useState({});
  const [erinnerungen, setErinnerungenState] = useState({});
  const [steckbrief, setSteckbriefState] = useState({});
  const [belohnungPufferMin, setBelohnungPufferMinState] = useState(10);
  const [ranglisteSichtbar, setRanglisteSichtbarState] = useState(false);
  // Profilbild (24.09., siehe data/profilbild.js): Pfad im privaten Bucket.
  const [profilbildPfad, setProfilbildPfad] = useState(null);

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
        setIstAdminKonto(!!profile.is_admin);
        setAktiveMesswerte(profile.aktive_messwerte?.length ? profile.aktive_messwerte : DEFAULT_AKTIVE);
        setCategoryZieleState(profile.category_ziele || {});
        setErinnerungenState(profile.erinnerungen || {});
        setSteckbriefState(profile.steckbrief || {});
        setBelohnungPufferMinState(profile.belohnung_puffer_min ?? 10);
        setRanglisteSichtbarState(profile.rangliste_sichtbar ?? false);
        setProfilbildPfad(profile.profilbild_pfad || null);

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

  // Bug-Fix (13.09., Teil 60): der Supabase-Aufruf lag bisher INNERHALB der
  // funktionalen setState-Updater — React StrictMode (aktiv in main.jsx)
  // ruft Updater-Funktionen zur Unreinheits-Erkennung im Dev-Modus bewusst
  // zweimal auf, was hier zwei parallele PATCH-Requests auslöste. setPersonal
  // oben macht es bereits richtig (Seiteneffekt NACH dem setState-Aufruf,
  // außerhalb des Updaters) — alle Set-Funktionen unten jetzt genauso.
  const toggleDatenteilung = useCallback(() => {
    let vorher;
    let next;
    setDatenteilungState((prev) => {
      vorher = prev;
      next = !prev;
      return next;
    });
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
  const categoryZieleSchreiben = useSpaltenSchreiber(userId, "category_ziele");
  const setCategoryZiel = useCallback(
    (kategorie, patch) => {
      let vorher;
      let next;
      setCategoryZieleState((prev) => {
        vorher = prev;
        next = { ...prev, [kategorie]: patch };
        return next;
      });
      categoryZieleSchreiben(next).then(({ error }) => {
        if (error) {
          console.error(error);
          setCategoryZieleState(vorher);
        }
      });
    },
    [categoryZieleSchreiben]
  );

  // Erinnerungs-Präferenz je Pläne-Kategorie (Ja/Nein) — steuert, ob der
  // serverseitige Erinnerungs-Versand diese Kategorie für den Nutzer
  // berücksichtigt. Gleiches jsonb-Muster wie setCategoryZiel.
  //
  // Bug-Fix (13.09., Teil 61 — Übergabeprotokoll-Punkt #13): ein
  // Speicherfehler landete bisher nur in der Browser-Konsole, nie sichtbar
  // für die Nutzerin — hat den Erinnerungen-Bug aus Teil 5 wochenlang
  // unsichtbar gehalten. Gibt jetzt wie resetOnboarding() oben
  // {ok, error} zurück, damit die Aufrufer (ZeitErinnerungenCard.jsx,
  // KategorieErinnerung.jsx, MehrTab.jsx, HydrationView.jsx,
  // TrainingView.jsx, OnboardingCategoriesView.jsx) einen fehlgeschlagenen
  // Speicherversuch anzeigen können statt ihn nur lautlos zurückzurollen.
  const erinnerungenSchreiben = useSpaltenSchreiber(userId, "erinnerungen");
  const setErinnerung = useCallback(
    async (kategorie, aktiv) => {
      let vorher;
      let next;
      setErinnerungenState((prev) => {
        vorher = prev;
        next = { ...prev, [kategorie]: aktiv };
        return next;
      });
      const { error } = await erinnerungenSchreiben(next);
      if (error) {
        console.error(error);
        setErinnerungenState(vorher);
        return { ok: false, error: error.message };
      }
      return { ok: true };
    },
    [erinnerungenSchreiben]
  );

  // Kurzer "Steckbrief" aus dem reduzierten Coachee-Onboarding (13.08.) —
  // Hintergrundfragen, die NICHT direkt in Supplemente/Training übernommen
  // werden (die richtet die Admin stellvertretend ein), sondern der Admin
  // nur als Vorbereitung fürs Erstgespräch dienen. Gleiches jsonb-Muster
  // wie setCategoryZiel/setErinnerung.
  const steckbriefSchreiben = useSpaltenSchreiber(userId, "steckbrief");
  const setSteckbrief = useCallback(
    (felder) => {
      let vorher;
      let next;
      setSteckbriefState((prev) => {
        vorher = prev;
        next = { ...prev, ...felder };
        return next;
      });
      steckbriefSchreiben(next).then(({ error }) => {
        if (error) {
          console.error(error);
          setSteckbriefState(vorher);
        }
      });
    },
    [steckbriefSchreiben]
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

  // Rangliste/Wettbewerb optional (App-Bauplan-Punkt) — gleiches
  // Toggle-mit-Rollback-Muster wie toggleDatenteilung.
  const toggleRanglisteSichtbar = useCallback(() => {
    let vorher;
    let next;
    setRanglisteSichtbarState((prev) => {
      vorher = prev;
      next = !prev;
      return next;
    });
    supabase
      .from("profiles")
      .update({ rangliste_sichtbar: next })
      .eq("id", userId)
      .then(({ error }) => {
        if (error) {
          console.error(error);
          setRanglisteSichtbarState(vorher);
        }
      });
  }, [userId]);

  const combinedMesswertDefs = useMemo(() => [...MESSWERT_DEFS, ...customMesswerte], [customMesswerte]);

  const aktiveMesswerteSchreiben = useSpaltenSchreiber(userId, "aktive_messwerte");
  const toggleMesswert = useCallback(
    (id) => {
      let vorher;
      let next;
      setAktiveMesswerte((prev) => {
        vorher = prev;
        next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        return next;
      });
      aktiveMesswerteSchreiben(next).then(({ error }) => {
        if (error) {
          console.error(error);
          setAktiveMesswerte(vorher);
        }
      });
    },
    [aktiveMesswerteSchreiben]
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
      let next;
      setAktiveMesswerte((prev) => {
        next = [...prev, id];
        return next;
      });
      aktiveMesswerteSchreiben(next).then(({ error: e }) => e && console.error(e));
    },
    [userId, combinedMesswertDefs, aktiveMesswerteSchreiben]
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
      let next;
      setAktiveMesswerte((prev) => {
        next = prev.filter((x) => x !== id);
        return next;
      });
      aktiveMesswerteSchreiben(next).then(({ error: e }) => e && console.error(e));
    },
    [userId, aktiveMesswerteSchreiben]
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
    istAdminKonto,
    coacheeAnsicht,
    setCoacheeAnsicht,
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
    ranglisteSichtbar,
    toggleRanglisteSichtbar,
    profilbildPfad,
    setProfilbildPfad,
  };
}
