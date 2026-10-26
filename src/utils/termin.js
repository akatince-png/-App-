// Termin-Rückmeldung als kurzer Text (26.10.): „✓ Wahrgenommen · bis 9:40“.
export function rueckmeldungText(r) {
  if (!r) return null;
  if (r.status === "ausgefallen") return `✕ Ausgefallen${r.notiz ? ` · ${r.notiz}` : ""}`;
  if (r.start && !r.ende) return `▶ Läuft seit ${r.start} Uhr`;
  const zeit = r.start && r.ende ? ` · ${r.start}–${r.ende}` : r.ende ? ` · bis ${r.ende}` : r.start ? ` · ab ${r.start}` : "";
  return `✓ Wahrgenommen${zeit}${r.notiz ? ` · ${r.notiz}` : ""}`;
}

// Uhrzeit „HH:MM“ eines Zeitpunkts (lokal).
export const uhr = (iso) => (iso ? new Date(iso).toTimeString().slice(0, 5) : "");

// Matrix-Aufgabe im Tagesplan (26.10.): „✓ Erledigt · 9:04–9:41“, „✕ Ausgefallen“ …
export function aufgabeZeitText(a) {
  if (a.ausgefallen) return "✕ Ausgefallen";
  if (a.erledigtAm) return `✓ Erledigt${a.gestartetAm ? ` · ${uhr(a.gestartetAm)}–${uhr(a.erledigtAm)}` : ` · ${uhr(a.erledigtAm)}`}`;
  if (a.gestartetAm) return `▶ Läuft seit ${uhr(a.gestartetAm)}`;
  return null;
}


// Termin läuft gerade (gestartet, noch nicht beendet).
export const terminLaeuft = (r) => !!r && r.status === "wahrgenommen" && !!r.start && !r.ende;
