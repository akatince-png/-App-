// Coach-Übersicht "Wer braucht dich?" (24.09., Nutzerinnen-Freigabe der
// Vorschau): pro Person ein Status mit Ampelfarbe, sortiert so, dass oben
// steht, wer Aufmerksamkeit braucht — ruhig seit ≥ 2 Tagen oder noch nie
// aktiv, Onboarding hängt, ungelesene Nachricht.

function tageZwischen(vonIso, bisDatum) {
  const [j, m, t] = vonIso.slice(0, 10).split("-").map(Number);
  const von = new Date(j, m - 1, t);
  const bis = new Date(bisDatum.getFullYear(), bisDatum.getMonth(), bisDatum.getDate());
  return Math.round((bis - von) / 86400000);
}

export const AMPEL = { rot: "#E0352B", gelb: "#E0A21B", gruen: "#1E8E5A" };

export function coacheeStatus(p, heute = new Date()) {
  const ungelesen = p.ungelesene_nachrichten || 0;
  if (!p.onboarding_complete) {
    const seit = p.erstellt_am ? tageZwischen(p.erstellt_am, heute) : 0;
    return { art: "onboarding", ampel: "gelb", text: "Onboarding offen", zusatz: seit > 0 ? `seit ${seit} ${seit === 1 ? "Tag" : "Tagen"}` : "seit heute", brauchtDich: true, ungelesen, ruhigTage: 0 };
  }
  const ruhigTage = p.letzte_aktivitaet ? tageZwischen(p.letzte_aktivitaet, heute) : null;
  if (ruhigTage === null) return { art: "ruhig", ampel: "rot", text: "noch nicht aktiv", zusatz: null, brauchtDich: true, ungelesen, ruhigTage: 999 };
  if (ruhigTage >= 2) return { art: "ruhig", ampel: "rot", text: `seit ${ruhigTage} Tagen ruhig`, zusatz: null, brauchtDich: true, ungelesen, ruhigTage };
  return { art: "aktiv", ampel: "gruen", text: ruhigTage === 0 ? "heute aktiv" : "gestern aktiv", zusatz: null, brauchtDich: ungelesen > 0, ungelesen, ruhigTage };
}

// Liste für die Übersicht: nur Coachees (Admin-Konten ausgeblendet), mit
// Status, sortiert nach "braucht dich" (ungelesen zuerst, dann am längsten
// ruhig), danach die Übrigen nach Punkten der letzten 7 Tage.
export function coacheesSortiert(probanden, heute = new Date()) {
  return (probanden || [])
    .filter((p) => !p.is_admin)
    .map((p) => ({ ...p, status: coacheeStatus(p, heute) }))
    .sort((a, b) => {
      if (a.status.brauchtDich !== b.status.brauchtDich) return a.status.brauchtDich ? -1 : 1;
      if (a.status.brauchtDich) {
        if ((a.status.ungelesen > 0) !== (b.status.ungelesen > 0)) return a.status.ungelesen > 0 ? -1 : 1;
        return b.status.ruhigTage - a.status.ruhigTage;
      }
      return (b.punkte_7_tage || 0) - (a.punkte_7_tage || 0);
    });
}

export function uebersichtZahlen(liste) {
  return {
    brauchenDich: liste.filter((p) => p.status.brauchtDich).length,
    neueNachrichten: liste.reduce((s, p) => s + (p.status.ungelesen || 0), 0),
    laufenGut: liste.filter((p) => !p.status.brauchtDich).length,
  };
}

// Die letzten 7 Tage (älteste zuerst) mit "etwas geschafft?" für die Kästchen.
export function letzteSiebenTage(aktiveTage, heute = new Date()) {
  const set = new Set((aktiveTage || []).map((d) => String(d).slice(0, 10)));
  const tage = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    tage.push({ iso, aktiv: set.has(iso), kurz: d.toLocaleDateString("de-DE", { weekday: "short" }).slice(0, 2) });
  }
  return tage;
}
