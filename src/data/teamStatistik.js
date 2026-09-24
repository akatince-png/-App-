import { supabase } from "../lib/supabaseClient";
import { toLocalISODate, zaehleTageStreak } from "../utils/dates";

// Team-Seite, Team-Liga und Coach-Ansicht (24.09., Nutzerinnen-Freigabe der
// Vorschau). Die Zahlen kommen aus Server-Funktionen (Migration
// 0095_team_statistik.sql), die nur Summen herausgeben — keine Einträge.

// Wochenziel pro Person (Team-Seite: Ziel = Mitglieder × dieser Wert, im
// Monat entsprechend mehr). Bewusst erreichbar gewählt: ~7 Punkte am Tag.
export const WOCHENZIEL_PRO_PERSON = 50;

// Zeitraum-Grenzen: Woche = Montag bis Sonntag der aktuellen Woche.
export function zeitraumGrenzen(art, heute = new Date()) {
  const d = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
  if (art === "monat") {
    const von = new Date(d.getFullYear(), d.getMonth(), 1);
    const bis = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { von: toLocalISODate(von), bis: toLocalISODate(bis), tage: bis.getDate() };
  }
  if (art === "gesamt") return { von: "2000-01-01", bis: toLocalISODate(d), tage: null };
  const wochentag = (d.getDay() + 6) % 7; // Montag = 0
  const von = new Date(d);
  von.setDate(d.getDate() - wochentag);
  const bis = new Date(von);
  bis.setDate(von.getDate() + 6);
  return { von: toLocalISODate(von), bis: toLocalISODate(bis), tage: 7 };
}

export function serieAusTagen(tage) {
  const set = new Set(tage || []);
  return zaehleTageStreak((tag) => set.has(tag));
}

// Tage seit der letzten Aktivität (null = noch nie aktiv).
export function tageRuhig(letzteAktivitaet, heute = new Date()) {
  if (!letzteAktivitaet) return null;
  const [j, m, t] = letzteAktivitaet.split("-").map(Number);
  const letzte = new Date(j, m - 1, t);
  const h = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
  return Math.round((h - letzte) / 86400000);
}

export async function teamMitgliederLaden(von, bis) {
  const { data, error } = await supabase.rpc("team_mitglieder_statistik", { p_von: von, p_bis: bis });
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return {
    ok: true,
    mitglieder: (data || []).map((r) => ({
      userId: r.user_id,
      vorname: r.vorname,
      profilbildPfad: r.profilbild_pfad,
      teamId: r.team_id,
      privat: !!r.privat,
      punkteZeitraum: r.punkte_zeitraum,
      punkteGesamt: r.punkte_gesamt,
      aktiveTage: r.aktive_tage || [],
      letzteAktivitaet: r.letzte_aktivitaet,
    })),
  };
}

export async function teamLigaLaden(von, bis) {
  const { data, error } = await supabase.rpc("team_liga", { p_von: von, p_bis: bis });
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return {
    ok: true,
    teams: (data || []).map((r) => ({
      teamId: r.team_id,
      name: r.team_name,
      mitglieder: r.mitglieder,
      schnitt: Number(r.schnitt) || 0,
      schnittVorher: Number(r.schnitt_vorher) || 0,
      aktiveTageSchnitt: Number(r.aktive_tage_schnitt) || 0,
      raetselTage: r.raetsel_tage || 0,
      initialen: r.initialen || [],
      istMeinTeam: !!r.ist_mein_team,
      summe: r.punkte_summe || 0,
    })),
  };
}

// Personen-Rangliste über alle Coachees (0098): nur wer teilt, mit Namen und
// Punkten, absteigend sortiert; dazu die Zahl der Personen, die nicht teilen.
export async function ranglistePersonenLaden(von, bis) {
  const { data, error } = await supabase.rpc("rangliste_personen", { p_von: von, p_bis: bis });
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return { ok: true, ...ranglisteAufbereiten(data) };
}

export function ranglisteAufbereiten(zeilen) {
  const alle = zeilen || [];
  const personen = alle
    .filter((r) => r.teilt)
    .map((r) => ({ userId: r.user_id, vorname: r.vorname, profilbildPfad: r.profilbild_pfad, teamName: r.team_name, punkte: r.punkte || 0, aktiveTage: r.aktive_tage || [] }))
    .sort((a, b) => b.punkte - a.punkte || String(a.vorname || "").localeCompare(String(b.vorname || ""), "de"));
  return { personen, nichtTeilend: alle.length - personen.length };
}

// fuer: bei "Verwalten als" die verwaltete Person (wirkt nur für Admins).
export async function teamNeuigkeitenLaden(tage = 3, fuer = null) {
  const { data, error } = await supabase.rpc("team_neuigkeiten", { p_tage: tage, p_fuer: fuer });
  if (error) {
    console.error(error);
    return { ok: false, error: error.message };
  }
  return {
    ok: true,
    neuigkeiten: (data || []).map((r) => ({ userId: r.user_id, vorname: r.vorname, profilbildPfad: r.profilbild_pfad, art: r.art, tag: r.tag, zeitpunkt: r.zeitpunkt })),
  };
}

// "heute" / "gestern" / "vorgestern" / "am 21.09." für den Team-Feed —
// sonst wirkt eine Routine von gestern wie heute geschafft.
export function tagLabel(tag, heute = new Date()) {
  if (!tag) return "";
  const [j, m, t] = tag.split("-").map(Number);
  const diff = Math.round((new Date(heute.getFullYear(), heute.getMonth(), heute.getDate()) - new Date(j, m - 1, t)) / 86400000);
  if (diff <= 0) return "heute";
  if (diff === 1) return "gestern";
  if (diff === 2) return "vorgestern";
  return `am ${String(t).padStart(2, "0")}.${String(m).padStart(2, "0")}.`;
}

// Wochen-Highlights der Liga — nur Team-Ebene.
export function ligaHighlights(teams, mitVorzeitraum = true) {
  const liste = [];
  if (!teams || teams.length < 2) return liste;
  if (mitVorzeitraum) {
    const sprung = [...teams].sort((a, b) => b.schnitt - b.schnittVorher - (a.schnitt - a.schnittVorher))[0];
    const plus = Math.round((sprung.schnitt - sprung.schnittVorher) * 10) / 10;
    if (plus > 0) liste.push({ icon: "🚀", text: "Größter Sprung", wert: `${sprung.name} +${plus} Ø` });
  }
  const aktiv = [...teams].sort((a, b) => b.aktiveTageSchnitt - a.aktiveTageSchnitt)[0];
  if (aktiv.aktiveTageSchnitt > 0) liste.push({ icon: "🔥", text: "Am regelmäßigsten dabei", wert: `${aktiv.name} (Ø ${aktiv.aktiveTageSchnitt} Tage)` });
  const raetsel = [...teams].sort((a, b) => b.raetselTage - a.raetselTage)[0];
  if (raetsel.raetselTage > 0) liste.push({ icon: "🧩", text: "Tagesrätsel-Profis", wert: raetsel.name });
  return liste;
}
