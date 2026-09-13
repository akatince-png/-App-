// Bug-Fix (13.09.): `supabase.functions.invoke()` liefert bei einem
// non-2xx-Status IMMER `data: null` und einen `FunctionsHttpError`, dessen
// `.message` nur die generische, englische Meldung "Edge Function returned
// a non-2xx status code" ist — unabhängig davon, was die Funktion selbst als
// JSON-Body gesendet hat (z. B. { error: "Nicht angemeldet." }). Der
// App-weit verwendete Ausdruck `data?.error || error.message` griff dadurch
// nie: `data` ist im Fehlerfall ja gerade `null`, also landete IMMER die
// unverständliche englische Systemmeldung in der Oberfläche (z. B. im
// Akutmodus als "Edge Function returned a non-2xx status code" sichtbar).
// Der tatsächlich gesendete JSON-Body steckt stattdessen in
// `error.context` (ein Response-Objekt) und muss separat ausgelesen werden.
export async function edgeFunctionFehlertext(error, data, fallback = "Etwas ist schiefgelaufen. Bitte später erneut versuchen.") {
  if (data?.error) return data.error;
  if (!error) return fallback;
  if (error.context && typeof error.context.json === "function") {
    try {
      const body = await error.context.json();
      if (body?.error) return body.error;
    } catch {
      // Body war kein (gültiges) JSON — Fallback unten greift.
    }
  }
  return fallback;
}
