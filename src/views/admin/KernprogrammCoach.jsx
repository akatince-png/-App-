import MesswocheAuswertung from "../../ui/MesswocheAuswertung";
import React, { useCallback, useEffect, useState } from "react";
import { PrimaryButton } from "../../ui/primitives";
import { cardBorder, danger, textMuted } from "../../ui/theme";
import { supabase } from "../../lib/supabaseClient";
import { toLocalISODate } from "../../utils/dates";
import { kernprogrammStarten } from "../../data/kernprogrammAdmin";
import { zeileZuEssen } from "../../data/useEssen";
import { plusTage } from "../../utils/schichtplan";
import {
  ETAPPEN_NAME,
  ampel,
  bausteinFuer,
  datumKurz,
  ernaehrungFuerBilanz,
  faelligeBausteine,
  kernBilanz,
  naechsteEtappeVorschlag,
  naechsterMontag,
  programmStand,
  wackelnZweiWochen,
  zeileZuEtappe,
  zeileZuPause,
} from "../../utils/kernprogramm";

const AMPEL_FARBE = { gruen: "#1E8E5A", gelb: "#C27A00", rot: "#E0352B", grau: "#9AA0AA" };
const feld = { border: `1.5px solid ${cardBorder}`, borderRadius: 10, padding: "7px 9px", fontSize: 13.5, fontFamily: "inherit" };

// Aufgeklappte Zeile: Etappe, Bausteine der letzten 7 Tage, was zwei
// Wochen hintereinander wackelt, Wochen-Check, Gespräch + nächste Etappe,
// Baustein pausieren (nur der Coach, mit Begründung).
export default function KernprogrammCoach({ personId, vorname, onChat, onGeaendert }) {
  const heute = toLocalISODate(new Date());
  const [d, setD] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [startDatum, setStartDatum] = useState(naechsterMontag(heute));
  const [gespraech, setGespraech] = useState(null);
  const [pause, setPause] = useState(null);

  const laden = useCallback(async () => {
    const seit = plusTage(heute, -14);
    const [et, pa, sc, sl, du, tr, wp, ml, wc, t3, es, me, zu, pr, ch, alleSchritte] = await Promise.all([
      supabase.from("coaching_etappen").select("*").eq("user_id", personId).order("nummer"),
      supabase.from("kern_pausen").select("*").eq("user_id", personId),
      supabase.from("routine_schritte").select("id, routine, kern_key").eq("user_id", personId).not("kern_key", "is", null),
      supabase.from("routine_schritt_logs").select("schritt_id, datum").eq("user_id", personId).gte("datum", seit),
      supabase.from("routine_durchlaeufe").select("routine, datum, schritte, gestartet_um, abgeschlossen_um").eq("user_id", personId).gte("datum", plusTage(heute, -21)),
      supabase.from("training_sessions").select("datum, erledigt, dauer_min").eq("user_id", personId).gte("datum", plusTage(heute, -21)),
      supabase.from("training_wochenplan").select("id, wochentag, name").eq("user_id", personId),
      supabase.from("meal_logs").select("log_date, meal_id, tageszeit, erledigt").eq("user_id", personId).gte("log_date", seit),
      supabase.from("wochen_checks").select("*").eq("user_id", personId).order("woche_start", { ascending: false }).limit(2),
      supabase.from("tages_top3").select("datum, angefangen").eq("user_id", personId).gte("datum", plusTage(heute, -6)),
      // Ernährung (Baustein "Eiweißziel" ab Woche 3)
      supabase.from("essen_eintraege").select("*").eq("user_id", personId).gte("datum", seit),
      supabase.from("meals").select("id, name").eq("user_id", personId),
      supabase.from("meal_ingredients").select("meal_id, name, menge, menge_gramm").eq("user_id", personId),
      supabase.from("profiles").select("category_ziele, gewicht_start").eq("id", personId).maybeSingle(),
      supabase.from("checkins").select("datum, values").eq("user_id", personId).order("datum"),
      // Messwoche (26.09.): alle Schritte mit Dauer, um Vorschläge zu übernehmen.
      supabase.from("routine_schritte").select("id, routine, name, dauer_min").eq("user_id", personId),
    ]);
    const schrittErledigt = {};
    (sl.data || []).forEach((r) => (schrittErledigt[`${r.datum}__${r.schritt_id}`] = true));
    const mahlzeitErledigt = {};
    (ml.data || []).forEach((r) => r.erledigt && (mahlzeitErledigt[`${r.log_date}__${r.meal_id}__${r.tageszeit}`] = true));
    setD({
      etappen: (et.data || []).map(zeileZuEtappe),
      pausen: (pa.data || []).map(zeileZuPause),
      schritte: (sc.data || []).map((r) => ({ id: r.id, routine: r.routine, kernKey: r.kern_key })),
      schrittErledigt,
      durchlaeufe: du.data || [],
      messDurchlaeufe: (du.data || []).map((r) => ({ routine: r.routine, datum: r.datum, schritte: r.schritte || [], gestartetUm: r.gestartet_um, abgeschlossenUm: r.abgeschlossen_um })),
      messSchritte: (alleSchritte.data || []).map((r) => ({ id: r.id, routine: r.routine, name: r.name, dauerMin: r.dauer_min })),
      messTrainings: (tr.data || []).map((r) => ({ datum: r.datum, erledigt: r.erledigt, dauerMin: r.dauer_min })),
      trainings: tr.data || [],
      trainingWochenplan: wp.data || [],
      mahlzeitErledigt,
      checks: wc.data || [],
      ...ernaehrungFuerBilanz({
        essenEintraege: (es.data || []).map(zeileZuEssen),
        mahlzeiten: (me.data || []).map((m) => ({ ...m, zutaten: (zu.data || []).filter((z) => z.meal_id === m.id).map((z) => ({ name: z.name, menge: z.menge, mengeGramm: z.menge_gramm })) })),
        mahlzeitErledigt,
        categoryZiele: pr.data?.category_ziele || {},
        gewichtsEintraege: (ch.data || []).map((r) => ({ datum: r.datum, ...r.values })),
        personalData: { gewichtStart: pr.data?.gewicht_start },
      }),
      top3: t3.data || [],
    });
  }, [personId, heute]);

  useEffect(() => {
    laden();
  }, [laden]);

  if (!d) return null;
  const stand = programmStand(d.etappen, heute);
  const neu = async () => {
    await laden();
    onGeaendert?.();
  };
  const box = { borderRadius: 12, border: `1.5px solid ${cardBorder}`, padding: "10px 12px", marginBottom: 10, background: "#fff" };

  if (!d.etappen.length) {
    return (
      <div style={box} data-kern-coach="leer">
        <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted }}>🧭 AKA-KERNPROGRAMM</div>
        <div style={{ fontSize: 13, margin: "4px 0 8px" }}>Noch nicht gestartet. Etappe 1 (Einführung, 4 Wochen) beginnt am:</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="date" aria-label="Startdatum Kernprogramm" value={startDatum} onChange={(e) => setStartDatum(e.target.value)} style={feld} />
          <PrimaryButton
            onClick={async () => {
              const r = await kernprogrammStarten([personId], startDatum);
              if (!r.ok) return setFehler(r.error);
              neu();
            }}
          >
            Programm starten
          </PrimaryButton>
        </div>
        {fehler && <div style={{ color: danger, fontSize: 12.5, marginTop: 6 }}>{fehler}</div>}
      </div>
    );
  }

  const bilanz = stand.aktiv ? kernBilanz(d, plusTage(heute, -6), heute, heute) : [];
  const vorher = stand.aktiv ? kernBilanz(d, plusTage(heute, -13), plusTage(heute, -7), heute) : [];
  const wackeln = wackelnZweiWochen(bilanz, vorher);
  const letzte = d.etappen[d.etappen.length - 1];
  const laufend = d.etappen.find((e) => e.status === "laufend" && e.start <= heute) || (letzte.status === "laufend" ? letzte : null);
  const aktivePausen = d.pausen.filter((p) => p.bis >= heute);
  const check = d.checks[0];
  const top3Ja = d.top3.filter((t) => t.angefangen).length;

  const gespraechSpeichern = async () => {
    setFehler(null);
    const { error } = await supabase
      .from("coaching_etappen")
      .update({ status: gespraech.weiter === "beenden" ? "beendet" : "abgeschlossen", gespraech_am: gespraech.am, gespraech_notiz: gespraech.notiz.trim() || null })
      .eq("id", laufend.id);
    if (error) return setFehler(error.message);
    if (gespraech.weiter === "erhaltung") {
      const v = naechsteEtappeVorschlag(d.etappen, heute, "erhaltung");
      const { data: auth } = await supabase.auth.getUser();
      const { error: e2 } = await supabase.from("coaching_etappen").insert({ user_id: personId, nummer: v.nummer, art: "erhaltung", start: v.start, ende: v.ende, erstellt_von: auth?.user?.id || null });
      if (e2) return setFehler(e2.message);
    }
    setGespraech(null);
    neu();
  };

  const pauseSpeichern = async () => {
    setFehler(null);
    if (!pause.key || !pause.bis || !pause.begruendung.trim()) return setFehler("Bitte Baustein, Datum und Begründung angeben.");
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("kern_pausen").insert({ user_id: personId, kern_key: pause.key, von: heute, bis: pause.bis, begruendung: pause.begruendung.trim(), erstellt_von: auth?.user?.id || null });
    if (error) return setFehler(error.message);
    setPause(null);
    neu();
  };

  return (
    <div style={box} data-kern-coach={stand.aktiv ? "aktiv" : "geplant"}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted }}>🧭 AKA-KERNPROGRAMM</div>
      <div style={{ fontSize: 14, fontWeight: 800, marginTop: 3 }}>
        {stand.aktiv
          ? `Etappe ${stand.etappe.nummer} · ${ETAPPEN_NAME[stand.etappe.art]} · Woche ${stand.woche} von 4`
          : stand.geplant
            ? `Startet ${datumKurz(stand.geplant.start)} (Einführung)`
            : "Coaching beendet"}
      </div>
      {stand.aktiv && <div style={{ fontSize: 12, color: textMuted }}>{datumKurz(stand.etappe.start)} – {datumKurz(stand.etappe.ende)}</div>}

      {bilanz.length > 0 && (
        <div style={{ fontSize: 12.5, margin: "8px 0 4px", lineHeight: 1.7 }} aria-label="Bausteine letzte 7 Tage">
          {bilanz.map((b) => (
            <span key={b.key} style={{ marginRight: 10, whiteSpace: "nowrap" }} title={b.name}>
              {b.icon} <b style={{ color: AMPEL_FARBE[ampel(b)] }}>{b.von ? `${b.erledigt}/${b.von}` : "–"}</b>
              {b.pausiert ? " ⏸" : ""}
            </span>
          ))}
          <div style={{ fontSize: 11.5, color: textMuted }}>letzte 7 Tage{faelligeBausteine(stand).some((b) => b.key === "top3") ? ` · Top 3 angefangen: ${top3Ja}×` : ""}</div>
        </div>
      )}

      {wackeln.map((w) => (
        <div key={w.key} style={{ fontSize: 12.5, background: "#FFF6E0", borderRadius: 10, padding: "7px 9px", marginTop: 6 }}>
          ⚠️ {w.icon} <b>{w.name}</b> wackelt seit 2 Wochen ({w.erledigt}/{w.von}).{" "}
          <button
            type="button"
            onClick={() => onChat(`Hallo${vorname ? ` ${vorname}` : ""}, mir ist aufgefallen, dass „${w.name}“ die letzten zwei Wochen oft nicht geklappt hat. Was stört gerade? Wollen wir Uhrzeit oder Art anpassen?`)}
            style={{ border: "none", background: "transparent", color: "#2D6FD6", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", padding: 0 }}
          >
            Ansprechen ›
          </button>
        </div>
      ))}

      {check && (
        <div style={{ fontSize: 12, color: textMuted, marginTop: 6 }}>
          Wochen-Check {datumKurz(check.woche_start)}: {check.kern_key ? `${bausteinFuer(check.kern_key)?.name || check.kern_key} – ` : ""}
          {(check.stoerung || []).join(", ") || "keine Störung genannt"}
          {check.aenderung ? ` → ${check.aenderung}` : ""} · Woche {["", "😣", "😕", "😐", "🙂", "🤩"][check.stimmung] || ""}
        </div>
      )}

      {/* Messwoche (26.09.): Woche 1 der Einführung wird gemessen; ab 3
          Messungen je Schritt Vorschlag mit einem Tipp übernehmen. */}
      {stand.aktiv && stand.etappe.art === "einfuehrung" && heute <= plusTage(stand.etappe.start, 20) && (
        <div style={{ marginTop: 10, borderTop: `1px solid ${cardBorder}`, paddingTop: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>📏 Messwoche {datumKurz(stand.etappe.start)} – {datumKurz(plusTage(stand.etappe.start, 6))}</div>
          <MesswocheAuswertung
            durchlaeufe={d.messDurchlaeufe}
            schritte={d.messSchritte}
            trainings={d.messTrainings}
            von={stand.etappe.start}
            bis={plusTage(stand.etappe.start, 6)}
            onUebernehmen={async (id, min) => {
              const { error } = await supabase.from("routine_schritte").update({ dauer_min: min }).eq("id", id);
              if (error) {
                setFehler(error.message);
                return { ok: false };
              }
              return { ok: true };
            }}
          />
        </div>
      )}

      {aktivePausen.map((p) => (
        <div key={p.id} style={{ fontSize: 12.5, background: "#F4F6FA", borderRadius: 10, padding: "7px 9px", marginTop: 6 }}>
          ⏸ <b>{bausteinFuer(p.kernKey)?.name || p.kernKey}</b> pausiert bis {datumKurz(p.bis)} · {p.begruendung}{" "}
          <button
            type="button"
            onClick={async () => {
              const { error } = await supabase.from("kern_pausen").update({ bis: plusTage(heute, -1) }).eq("id", p.id);
              if (error) return setFehler(error.message);
              neu();
            }}
            style={{ border: "none", background: "transparent", color: "#2D6FD6", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", padding: 0 }}
          >
            aufheben
          </button>
        </div>
      ))}

      {stand.gespraechFaellig && !gespraech && (
        <div style={{ fontSize: 13, fontWeight: 800, background: "#FFFBEF", border: "1.5px solid #F4C542", borderRadius: 10, padding: "8px 10px", marginTop: 8 }}>
          💬 Etappen-Gespräch fällig (Etappe endet {datumKurz(stand.etappe.ende)})
        </div>
      )}

      {gespraech ? (
        <div style={{ marginTop: 10, borderTop: `1px solid ${cardBorder}`, paddingTop: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>💬 Etappen-Gespräch</div>
          <input type="date" aria-label="Gespräch am" value={gespraech.am} onChange={(e) => setGespraech((g) => ({ ...g, am: e.target.value }))} style={feld} />
          <textarea
            aria-label="Notiz zum Gespräch"
            rows={3}
            value={gespraech.notiz}
            placeholder="Was bleibt, was wird angepasst? (nur für dich)"
            onChange={(e) => setGespraech((g) => ({ ...g, notiz: e.target.value }))}
            style={{ ...feld, width: "100%", boxSizing: "border-box", marginTop: 6, resize: "vertical" }}
          />
          <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, margin: "8px 0 6px" }}>WIE GEHT'S WEITER?</div>
          <div role="group" aria-label="Wie geht es weiter?" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              ["erhaltung", "🔁 Erhaltung (4 Wochen)"],
              ["pause", "⏸ Pause"],
              ["beenden", "🏁 Coaching beenden"],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={gespraech.weiter === k}
                onClick={() => setGespraech((g) => ({ ...g, weiter: k }))}
                style={{ border: "none", borderRadius: 99, padding: "7px 11px", fontSize: 12.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", background: gespraech.weiter === k ? "#1B2350" : "#EEF4FF", color: gespraech.weiter === k ? "#fff" : "#2D6FD6" }}
              >
                {label}
              </button>
            ))}
          </div>
          {gespraech.weiter === "erhaltung" && (
            <div style={{ fontSize: 12, color: textMuted, marginTop: 6 }}>
              Nächste Etappe: {datumKurz(naechsteEtappeVorschlag(d.etappen, heute).start)} – {datumKurz(naechsteEtappeVorschlag(d.etappen, heute).ende)}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <PrimaryButton onClick={gespraechSpeichern}>Speichern</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setGespraech(null)}>
              Abbrechen
            </PrimaryButton>
          </div>
        </div>
      ) : pause ? (
        <div style={{ marginTop: 10, borderTop: `1px solid ${cardBorder}`, paddingTop: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>⏸ Baustein pausieren</div>
          <select aria-label="Baustein" value={pause.key} onChange={(e) => setPause((p) => ({ ...p, key: e.target.value }))} style={{ ...feld, width: "100%" }}>
            <option value="">Baustein wählen…</option>
            {faelligeBausteine(stand.aktiv ? stand : programmStand(d.etappen, letzte.ende)).map((b) => (
              <option key={b.key} value={b.key}>
                {b.icon} {b.name}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, fontSize: 12.5 }}>
            bis <input type="date" aria-label="Pausiert bis" value={pause.bis} onChange={(e) => setPause((p) => ({ ...p, bis: e.target.value }))} style={feld} />
          </div>
          <input aria-label="Begründung" value={pause.begruendung} placeholder="Begründung, z. B. Knieverletzung" onChange={(e) => setPause((p) => ({ ...p, begruendung: e.target.value }))} style={{ ...feld, width: "100%", boxSizing: "border-box", marginTop: 6 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <PrimaryButton onClick={pauseSpeichern}>Pausieren</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setPause(null)}>
              Abbrechen
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {laufend ? (
            <div style={{ flex: 1 }}>
              <PrimaryButton variant={stand.gespraechFaellig ? "accent" : "ghost"} onClick={() => setGespraech({ am: heute, notiz: "", weiter: "erhaltung" })}>
                💬 Gespräch eintragen
              </PrimaryButton>
            </div>
          ) : (
            letzte.status === "abgeschlossen" && (
              <div style={{ flex: 1 }}>
                <PrimaryButton
                  onClick={async () => {
                    const v = naechsteEtappeVorschlag(d.etappen, heute, "erhaltung");
                    const { error } = await supabase.from("coaching_etappen").insert({ user_id: personId, nummer: v.nummer, art: "erhaltung", start: v.start, ende: v.ende });
                    if (error) return setFehler(error.message);
                    neu();
                  }}
                >
                  🔁 Nächste Etappe starten
                </PrimaryButton>
              </div>
            )
          )}
          <div style={{ flex: 1 }}>
            <PrimaryButton variant="ghost" onClick={() => setPause({ key: "", bis: plusTage(heute, 14), begruendung: "" })}>
              ⏸ Baustein pausieren
            </PrimaryButton>
          </div>
        </div>
      )}
      {fehler && <div style={{ color: danger, fontSize: 12.5, marginTop: 6 }}>{fehler}</div>}
    </div>
  );
}
