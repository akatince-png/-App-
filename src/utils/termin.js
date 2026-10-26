// Termin-Rückmeldung als kurzer Text (26.10.): „✓ Wahrgenommen · bis 9:40“.
export function rueckmeldungText(r) {
  if (!r) return null;
  if (r.status === "ausgefallen") return `✕ Ausgefallen${r.notiz ? ` · ${r.notiz}` : ""}`;
  return `✓ Wahrgenommen${r.ende ? ` · bis ${r.ende}` : ""}${r.notiz ? ` · ${r.notiz}` : ""}`;
}
