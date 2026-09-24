import React, { useEffect, useState } from "react";
import Profilbild from "./Profilbild";
import { cardBorder, danger, hexZuRgba, logoVerlauf, nachtSchatten, nachtVerlauf, textMuted } from "./theme";
import { KATEGORIE_META, ROUTINE_META, TAGESRAETSEL_META } from "../utils/dayItems";
import { toLocalISODate } from "../utils/dates";
import { questFortschritt, tagImProtokoll, werHatHeute } from "../data/gruppenprotokoll";
import { feuereBelohnung } from "../utils/belohnungBus";
import { supabase } from "../lib/supabaseClient";

// Gruppenprotokoll auf der Team-Seite (24.09., Nutzerinnen-Freigabe der
// Vorschau): gemeinsamer Fortschritt (Tag x von y, Gruppen-Quests), "Heute"
// je Baustein mit Profilbildern, wer schon dran war, eigene Gruppen-
// Gewohnheiten zum Abhaken, und die letzten Tage je Person. Nur
// "geschafft / nicht geschafft" — keine Gesundheitsdetails.
export const BAUSTEIN_FARBE = {
  morgenroutine: ROUTINE_META.morgenroutine,
  abendroutine: ROUTINE_META.abendroutine,
  trinkziel: KATEGORIE_META.hydration,
  tageslicht: KATEGORIE_META.tageslicht,
  tagesraetsel: TAGESRAETSEL_META,
  eigen: KATEGORIE_META.gewohnheit,
};

const AUTO_HINWEIS = {
  morgenroutine: "zählt, sobald die Morgenroutine abgeschlossen ist",
  abendroutine: "zählt, sobald die Abendroutine abgeschlossen ist",
  trinkziel: "zählt, sobald das eigene Trinkziel erreicht ist",
  tageslicht: "zählt, sobald das Tageslicht-Ziel erreicht ist",
  tagesraetsel: "zählt, sobald die 5 Tagesrätsel-Fragen gelöst sind",
};

function letzteTage(gp, anzahl = 14) {
  const tage = [];
  const heute = new Date();
  for (let i = anzahl - 1; i >= 0; i--) {
    const d = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - i);
    const iso = toLocalISODate(d);
    if (iso >= gp.startdatum) tage.push(iso);
  }
  return tage;
}

export default function GruppenprotokollKarte({ gp, userId, onUmschalten, darfAbhaken = true }) {
  const heute = toLocalISODate(new Date());
  const { tag, gesamt } = tagImProtokoll(gp, heute);
  const [laedt, setLaedt] = useState(null);
  const [fehler, setFehler] = useState(null);
  const mitglieder = gp.stand.mitglieder;
  const tage = letzteTage(gp);

  // Gruppen-Quest geschafft → einmal große Feier + Team-Abzeichen für jede
  // Person, die die Karte sieht (Abzeichen-Key gruppenquest_<id>).
  useEffect(() => {
    if (!userId) return;
    for (const q of gp.quests) {
      const f = questFortschritt(q, gp.stand, userId);
      if (!f.geschafft) continue;
      const key = `aka_gruppenquest_${q.id}_${userId}`;
      let schonGefeiert = false;
      try {
        schonGefeiert = localStorage.getItem(key) === "1";
        localStorage.setItem(key, "1");
      } catch {
        schonGefeiert = false;
      }
      if (schonGefeiert) continue;
      feuereBelohnung({ text: `Gruppen-Quest geschafft: ${q.titel}! 🏅`, untertitel: q.belohnung || "Stark als Team – ihr habt es gemeinsam geschafft.", icon: "trophy", gross: true });
      supabase
        .from("errungenschaften")
        .upsert([{ user_id: userId, badge_key: `gruppenquest_${q.id}`, erreicht_am: new Date().toISOString() }], { onConflict: "user_id,badge_key", ignoreDuplicates: true })
        .then(({ error }) => error && console.error(error));
    }
  }, [gp, userId]);

  const umschalten = async (bausteinId) => {
    setLaedt(bausteinId);
    setFehler(null);
    const r = await onUmschalten?.(bausteinId);
    setLaedt(null);
    if (r && !r.ok) setFehler(r.error || "Speichern fehlgeschlagen.");
    else if (r?.erledigt) feuereBelohnung({ text: "Für dein Team abgehakt! 👥", icon: "target" });
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ borderRadius: 22, padding: 16, color: "#fff", background: nachtVerlauf, boxShadow: nachtSchatten }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 99, background: "rgba(255,255,255,0.18)" }}>📋 Gruppenprotokoll</span>
          <span style={{ fontSize: 12, opacity: 0.85 }}>{gesamt ? `Tag ${Math.min(tag, gesamt)} von ${gesamt}` : `Tag ${tag}`}</span>
        </div>
        <div style={{ fontSize: 19, fontWeight: 900, marginTop: 10 }}>{gp.name}</div>
        {gp.ziel && <div style={{ fontSize: 12.5, opacity: 0.85 }}>{gp.ziel}</div>}
        {gp.quests.map((q) => {
          const f = questFortschritt(q, gp.stand, userId);
          return (
            <div key={q.id} style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                🎯 {q.titel}: {Math.min(f.gesamt, f.ziel)} / {f.ziel} {f.geschafft ? "🏅" : ""}
              </div>
              <div style={{ height: 10, borderRadius: 99, background: "rgba(255,255,255,0.2)", overflow: "hidden", marginTop: 6 }}>
                <div style={{ width: `${Math.min(100, Math.round((f.gesamt / f.ziel) * 100))}%`, height: "100%", borderRadius: 99, background: logoVerlauf }} />
              </div>
              {userId && <div style={{ fontSize: 11.5, opacity: 0.8, marginTop: 4 }}>dein Beitrag: {f.eigen}</div>}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 15, fontWeight: 800, margin: "14px 0 8px" }}>Heute</div>
      {gp.bausteine.map((b) => {
        const k = BAUSTEIN_FARBE[b.art] || KATEGORIE_META.gewohnheit;
        const wer = werHatHeute(gp.stand, b.id, heute);
        const ichSchon = wer.some((m) => m.userId === userId);
        return (
          <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 16, padding: "10px 12px", marginBottom: 8, border: `2px solid ${k.dot}`, background: k.bg }}>
            <span style={{ fontSize: 20 }}>{b.icon || "🌱"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: k.text }}>{b.name}</div>
              {wer.length > 0 ? (
                <div style={{ display: "flex", marginTop: 4, paddingLeft: 6 }}>
                  {wer.slice(0, 8).map((m) => (
                    <div key={m.userId} style={{ marginLeft: -6 }} title={m.privat ? "privat" : m.vorname}>
                      <Profilbild pfad={m.profilbildPfad} name={m.privat ? "?" : m.vorname} size={24} rand />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 11.5, color: k.text, opacity: 0.8 }}>{b.art === "eigen" ? "noch niemand" : AUTO_HINWEIS[b.art]}</div>
              )}
            </div>
            {b.art === "eigen" && darfAbhaken && userId ? (
              <button
                type="button"
                className="mp-tap"
                disabled={laedt === b.id}
                onClick={() => umschalten(b.id)}
                aria-label={ichSchon ? `${b.name} zurücknehmen` : `${b.name} erledigt`}
                style={{ border: ichSchon ? `2px solid ${k.dot}` : "none", borderRadius: 10, padding: "7px 10px", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "inherit", background: ichSchon ? "#fff" : k.dot, color: ichSchon ? k.dot : "#fff", flexShrink: 0 }}
              >
                {ichSchon ? "✓ Erledigt" : "Erledigt?"}
              </button>
            ) : (
              <b style={{ color: k.text, fontSize: 13, whiteSpace: "nowrap" }}>
                {wer.length}/{mitglieder.length}
                {wer.length === mitglieder.length && mitglieder.length > 0 ? " ✓" : ""}
              </b>
            )}
          </div>
        );
      })}
      {fehler && <div style={{ fontSize: 12, color: danger, marginBottom: 8 }}>{fehler}</div>}

      {tage.length > 1 && (
        <>
          <div style={{ fontSize: 15, fontWeight: 800, margin: "14px 0 8px" }}>Die letzten Tage</div>
          <div style={{ border: `1.5px solid ${cardBorder}`, borderRadius: 16, padding: "10px 12px" }}>
            {mitglieder.map((m) => (
              <div key={m.userId} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{m.privat ? "🙈 privat" : m.userId === userId ? `${m.vorname || "Du"} (du)` : m.vorname || "—"}</div>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 4 }}>
                  {tage.map((t) => {
                    const anzahl = gp.bausteine.filter((b) => gp.stand.erledigt.has(`${m.userId}|${b.id}|${t}`)).length;
                    const alle = anzahl === gp.bausteine.length && anzahl > 0;
                    return (
                      <span
                        key={t}
                        title={`${t}: ${anzahl}/${gp.bausteine.length}`}
                        style={{ width: 12, height: 12, borderRadius: 3, background: anzahl === 0 ? "#E3E6EE" : alle ? ROUTINE_META.morgenroutine.dot : hexZuRgba(ROUTINE_META.morgenroutine.dot, 0.45) }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: textMuted }}>Volles Kästchen = alle Bausteine geschafft, halbes = ein Teil.</div>
          </div>
        </>
      )}
    </div>
  );
}
