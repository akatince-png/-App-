// Siri über die Kurzbefehle-App (10.10.): Ein iOS-Kurzbefehl diktiert einen
// Satz und öffnet akaapp.vercel.app/?aka=<Satz>. Aka liest den Satz einmal
// aus der Adresse, entfernt ihn (damit Neuladen ihn nicht wiederholt) und
// schickt ihn ab, als hätte die Person ihn getippt.
export function akaSatzAusAdresse() {
  try {
    const url = new URL(window.location.href);
    const satz = (url.searchParams.get("aka") || "").trim().slice(0, 500);
    if (!url.searchParams.has("aka")) return null;
    url.searchParams.delete("aka");
    window.history.replaceState(window.history.state, "", url.toString());
    return satz || null;
  } catch {
    return null;
  }
}
