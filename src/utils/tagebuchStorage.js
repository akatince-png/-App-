// Tagebuch-Einträge liegen bewusst NUR lokal auf dem Gerät (localStorage),
// nie in Supabase/der Cloud — Nutzerinnen-Vorgabe (13.09.): "aufgrund der
// Datenschutzrichtlinien möchte ich, dass man diese Daten nur auf seinem
// Handy abspeichern kann... und nicht auch auf irgendeinem anderen
// Speicher." Tagebuchtexte sind besonders sensibel, deshalb hier bewusst
// keine Anbindung an useAppData()/AppDataContext (das würde über kurz oder
// lang zu einer Supabase-Tabelle verleiten) — ein eigenständiges,
// gerätegebundenes Speichermodul, analog zu adhsStorage.js.
const KEY = "aka_tagebuch_eintraege";

function alleLesen() {
  try {
    const roh = localStorage.getItem(KEY);
    const liste = roh ? JSON.parse(roh) : [];
    return Array.isArray(liste) ? liste : [];
  } catch {
    // Privater Modus/Storage deaktiviert/kaputtes JSON — Tagebuch bleibt
    // dann leer statt die App zum Abstürzen zu bringen.
    return [];
  }
}

function alleSchreiben(liste) {
  try {
    localStorage.setItem(KEY, JSON.stringify(liste));
    return true;
  } catch {
    return false;
  }
}

export function tagebuchEintraegeLesen() {
  return alleLesen().sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));
}

export function tagebuchEintragSpeichern(text) {
  const eintrag = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, erstelltAm: new Date().toISOString(), text };
  const liste = alleLesen();
  liste.push(eintrag);
  const ok = alleSchreiben(liste);
  return ok ? { ok: true, eintrag } : { ok: false, error: "Konnte nicht auf dem Gerät gespeichert werden (Speicher voll oder blockiert)." };
}

export function tagebuchEintragLoeschen(id) {
  const liste = alleLesen().filter((e) => e.id !== id);
  return alleSchreiben(liste);
}
