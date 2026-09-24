import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { toLocalISODate } from "../utils/dates";

// Coach-Chat im WhatsApp-Stil (24.09., Nutzerinnen-Freigabe der Vorschau).
// Beide Richtungen liegen in coachee_nachrichten (absender "coach"/"coachee",
// user_id = die Coachee). `gelesen` = vom Empfänger gelesen (✓✓).
// Neue Nachrichten kommen per kurzem Abfrage-Takt, solange der Chat offen
// ist, und beim Zurückkehren in die App.

const ABFRAGE_MS = 8000;

export function zeileZuNachricht(r) {
  return { id: r.id, text: r.text, gelesen: !!r.gelesen, erstelltAm: r.erstellt_am, absender: r.absender || "coachee" };
}

// "Heute" / "Gestern" / "Mo., 21.09." als Trenner im Verlauf.
export function chatTagLabel(iso, heute = new Date()) {
  const d = new Date(iso);
  const tag = toLocalISODate(d);
  if (tag === toLocalISODate(heute)) return "Heute";
  const gestern = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - 1);
  if (tag === toLocalISODate(gestern)) return "Gestern";
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}

// Nachrichten (aufsteigend) in Tagesgruppen für die Trenner.
export function nachTagenGruppieren(nachrichten, heute = new Date()) {
  const gruppen = [];
  for (const n of nachrichten) {
    const label = chatTagLabel(n.erstelltAm, heute);
    const letzte = gruppen[gruppen.length - 1];
    if (letzte && letzte.label === label) letzte.nachrichten.push(n);
    else gruppen.push({ label, nachrichten: [n] });
  }
  return gruppen;
}

// rolle: "coachee" (eigener Chat mit dem Coach) oder "coach" (Admin mit
// einer Person). coacheeId: bei "coachee" die eigene userId, bei "coach"
// die Person, mit der gechattet wird.
export function useCoachChat(coacheeId, rolle) {
  const [nachrichten, setNachrichten] = useState(null);
  const [fehler, setFehler] = useState(null);
  const lief = useRef(false);

  const laden = useCallback(async () => {
    if (!coacheeId) return;
    const { data, error } = await supabase
      .from("coachee_nachrichten")
      .select("id, text, gelesen, erstellt_am, absender")
      .eq("user_id", coacheeId)
      .order("erstellt_am", { ascending: true });
    if (error) {
      console.error(error);
      setFehler("Der Chat konnte gerade nicht geladen werden.");
      return;
    }
    setFehler(null);
    const liste = (data || []).map(zeileZuNachricht);
    setNachrichten(liste);
    // Eingehende als gelesen markieren (der Chat ist ja offen).
    const eingehendUngelesen = liste.some((n) => n.absender !== rolle && !n.gelesen);
    if (eingehendUngelesen) {
      if (rolle === "coachee") await supabase.rpc("coach_nachrichten_gelesen");
      else await supabase.from("coachee_nachrichten").update({ gelesen: true }).eq("user_id", coacheeId).eq("absender", "coachee").eq("gelesen", false);
    }
  }, [coacheeId, rolle]);

  useEffect(() => {
    lief.current = true;
    laden();
    const takt = setInterval(() => document.visibilityState === "visible" && laden(), ABFRAGE_MS);
    const sichtbar = () => document.visibilityState === "visible" && laden();
    document.addEventListener("visibilitychange", sichtbar);
    return () => {
      lief.current = false;
      clearInterval(takt);
      document.removeEventListener("visibilitychange", sichtbar);
    };
  }, [laden]);

  const senden = useCallback(
    async (text) => {
      const sauber = text?.trim();
      if (!sauber) return { ok: false };
      const { data, error } = await supabase
        .from("coachee_nachrichten")
        .insert({ user_id: coacheeId, text: sauber, absender: rolle })
        .select()
        .single();
      if (error) {
        console.error(error);
        return { ok: false, error: "Senden fehlgeschlagen. Bitte nochmal versuchen." };
      }
      setNachrichten((prev) => [...(prev || []), zeileZuNachricht(data)]);
      // Push im Hintergrund — die Nachricht ist schon gespeichert, ein
      // fehlender Push (keine Erinnerungen aktiviert) ist kein Fehler.
      supabase.functions
        .invoke("send-team-push", { body: rolle === "coach" ? { art: "coach", empfaengerId: coacheeId, text: sauber } : { art: "an-coach", text: sauber } })
        .then(({ error: pushFehler }) => pushFehler && console.warn("Push nicht verschickt:", pushFehler.message));
      return { ok: true };
    },
    [coacheeId, rolle]
  );

  return { nachrichten, fehler, senden, neuLaden: laden };
}

// Chatliste für den Coach (24.09., WhatsApp-Startseite): pro Person die
// letzte Nachricht, ungelesene eingehende, sortiert nach "zuletzt
// geschrieben". `zeilen` = coachee_nachrichten beliebiger Personen
// (neueste zuerst oder ungeordnet), `probanden` aus admin_liste_probanden.
export function chatListe(probanden, zeilen) {
  const proPerson = new Map();
  for (const r of zeilen || []) {
    const n = zeileZuNachricht(r);
    const eintrag = proPerson.get(r.user_id) || { letzte: null, ungelesen: 0 };
    if (!eintrag.letzte || n.erstelltAm > eintrag.letzte.erstelltAm) eintrag.letzte = n;
    if (n.absender === "coachee" && !n.gelesen) eintrag.ungelesen++;
    proPerson.set(r.user_id, eintrag);
  }
  return (probanden || [])
    .filter((p) => !p.is_admin && proPerson.has(p.id))
    .map((p) => ({ proband: p, ...proPerson.get(p.id) }))
    .sort((a, b) => (a.letzte.erstelltAm < b.letzte.erstelltAm ? 1 : -1));
}

// "14:05" (heute) / "Gestern" / "Mo." (diese Woche) / "21.09."
export function chatZeitKurz(iso, heute = new Date()) {
  const d = new Date(iso);
  const label = chatTagLabel(iso, heute);
  if (label === "Heute") return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  if (label === "Gestern") return "Gestern";
  const tage = (new Date(heute.getFullYear(), heute.getMonth(), heute.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000;
  if (tage < 7) return d.toLocaleDateString("de-DE", { weekday: "short" });
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}
