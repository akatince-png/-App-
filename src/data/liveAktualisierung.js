import { useEffect, useRef } from "react";
import { supabase, setzeSchreibBeobachter } from "../lib/supabaseClient";

// Live-Aktualisierung (28.09., Nutzerin: „während ich mit ihm telefoniere,
// direkt Veränderungen vornehmen, die er dann eins zu eins gleich sieht“).
// Coach-Seite: Im Modus „Verwalten“ meldet jedes erfolgreiche Speichern
// (POST/PATCH/PUT/DELETE auf /rest/v1) ein kurzes Signal über einen
// Realtime-Broadcast-Kanal der Person. Es werden keine Daten mitgeschickt.
// Coachee-Seite: Die App hört auf diesen Kanal und lädt ihre Daten neu
// (App.jsx), auf derselben Seite. Läuft gerade eine Routine, ein Training
// oder ein Timer, oder tippt die Person in ein Feld, wartet das Neuladen,
// bis das vorbei ist.

export const EREIGNIS = "coach-aenderung";
export const kanalName = (userId) => `aka-live-${userId}`;

// --- Coach-Seite -----------------------------------------------------------
let liveZiel = null;
let sendeTimer = null;

export function setzeLiveZiel(userId) {
  liveZiel = userId || null;
}

export function istSchreibAnfrage(url, methode) {
  const m = String(methode || "GET").toUpperCase();
  if (m === "GET" || m === "HEAD") return false;
  // Tabellen-Schreibzugriffe; /rpc/ sind überwiegend Abfragen (z. B. Status).
  return /\/rest\/v1\/(?!rpc\/)/.test(String(url || ""));
}

async function signalSenden(userId) {
  try {
    const kanal = supabase.channel(kanalName(userId));
    await kanal.httpSend(EREIGNIS, { zeit: Date.now() });
    supabase.removeChannel(kanal);
  } catch (e) {
    console.warn("Live-Signal nicht gesendet", e);
  }
}

// Mehrere Speichervorgänge kurz hintereinander = ein Signal.
export function aenderungGespeichert() {
  if (!liveZiel) return;
  const id = liveZiel;
  clearTimeout(sendeTimer);
  sendeTimer = setTimeout(() => signalSenden(id), 1000);
}

setzeSchreibBeobachter((url, methode, ok) => {
  if (ok && istSchreibAnfrage(url, methode)) aenderungGespeichert();
});

// --- Coachee-Seite: Sperren während etwas läuft -----------------------------
const sperren = new Set();
let wartend = null;

const tipptGerade = () => {
  const el = typeof document !== "undefined" ? document.activeElement : null;
  return !!el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && !["button", "checkbox", "radio"].includes(el.type)));
};
export const neuladenGesperrt = () => sperren.size > 0 || tipptGerade();

function wartendesAusfuehren() {
  if (!wartend || neuladenGesperrt()) return;
  const f = wartend;
  wartend = null;
  f();
}
if (typeof document !== "undefined") document.addEventListener("focusout", () => setTimeout(wartendesAusfuehren, 50));

// In Komponenten, die nicht unterbrochen werden dürfen (Routine, Training, Timer).
export function useLiveNeuladenSperre(aktiv = true) {
  useEffect(() => {
    if (!aktiv) return;
    const token = {};
    sperren.add(token);
    return () => {
      sperren.delete(token);
      setTimeout(wartendesAusfuehren, 0);
    };
  }, [aktiv]);
}

// Nach dem Neuladen auf derselben Seite bleiben (AuthenticatedApp).
let neuladenMarke = false;
export const markiereLiveNeuladen = () => {
  neuladenMarke = true;
};
export const nimmLiveNeuladen = () => {
  const m = neuladenMarke;
  neuladenMarke = false;
  return m;
};

export function useLiveAktualisierung(userId, aktiv, onAenderung) {
  const ref = useRef(onAenderung);
  ref.current = onAenderung;
  useEffect(() => {
    if (!aktiv || !userId) return;
    // Mehrere Signale kurz hintereinander = einmal neu laden.
    let timer;
    const ausloesen = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        wartend = () => ref.current();
        wartendesAusfuehren();
      }, 800);
    };
    const kanal = supabase.channel(kanalName(userId)).on("broadcast", { event: EREIGNIS }, ausloesen).subscribe();
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(kanal);
    };
  }, [userId, aktiv]);
}
