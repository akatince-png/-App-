import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { PrimaryButton } from "./primitives";
import { cardBorder, danger, textMuted } from "./theme";
import { useDiktat } from "./useDiktat";
import { AIService } from "../services/aiService";
import { essenAuswerten, summe, werteMitEinlage } from "../utils/essenRechner";
import { toLocalISODate } from "../utils/dates";
import { essenFotoAuswerten } from "../data/essenFoto";

// "Was hast du gegessen?" (25.09., Nutzerinnen-Vorgabe): schreiben oder
// sprechen, absenden – die App rechnet im Hintergrund ca.-Werte aus und
// zeigt sie mit angenommenen Gramm und Rechenweg zum Bestätigen. Kein Chat,
// keine Erklärung: nur die Rechnung und "Passt das so?". Lebensmittel, die
// die eingebaute Liste nicht kennt, werden im Hintergrund geschätzt und
// genauso angezeigt (als "übliche Portion").
const fmt = (n) => String(Math.round(Number(n) * 10) / 10).replace(".", ",");

export default function EssenEingabe({ datum: festesDatum, kompakt = false }) {
  const { essenSpeichern, aenderungVermerken, userId } = useAppData();
  const [text, setText] = useState("");
  const [ergebnis, setErgebnis] = useState(null);
  const [rechnet, setRechnet] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [gespeichert, setGespeichert] = useState(null);
  const diktat = useDiktat({ value: text, onChange: setText });
  // Foto (25.09.): Nährwerttabelle abfotografieren ("2 Scheiben von diesem
  // Brot") oder die ganze Mahlzeit – Ergebnis erscheint als dieselbe
  // Rechnung zum Bestätigen.
  const fotoAuswerten = async (file, art) => {
    if (!file) return;
    setFehler(null);
    setGespeichert(null);
    setRechnet(true);
    try {
      const posten = await essenFotoAuswerten(userId, file, art, text.trim());
      if (!text.trim()) setText(art === "etikett" ? "Foto der Nährwerttabelle" : "Foto der Mahlzeit");
      setErgebnis({ posten, offen: [] });
    } catch (e) {
      setFehler(e.message || "Das Foto konnte nicht ausgewertet werden – bitte als Text eingeben.");
    } finally {
      setRechnet(false);
    }
  };

  const ausrechnen = async () => {
    setFehler(null);
    setGespeichert(null);
    if (!text.trim()) return;
    setRechnet(true);
    const r = essenAuswerten(text);
    let posten = r.posten.map((p) => ({ ...p, name: p.lebensmittel.name }));
    let offen = r.unbekannt;
    if (offen.length) {
      try {
        const geschaetzt = await AIService.naehrwerteSchaetzen(offen);
        posten = [
          ...posten,
          ...geschaetzt
            .filter((g) => g.gramm > 0)
            .map((g) => ({ text: g.text, name: g.name, gramm: g.gramm, annahme: `${fmt(g.gramm)} g (übliche Portion)`, geschaetzt: true, werte: { kcal: g.kcal, eiweiss: g.eiweiss, fett: g.fett, kh: g.kh, zucker: g.zucker, ballast: 0, omega3: g.omega3, epaDha: g.epaDha, omega6: g.omega6 } })),
        ];
        const erkannt = new Set(geschaetzt.filter((g) => g.gramm > 0).map((g) => g.text));
        offen = offen.filter((t) => !erkannt.has(t));
      } catch (e) {
        console.error(e);
      }
    }
    setRechnet(false);
    setErgebnis({ posten, offen });
  };

  const grammAendern = (i, g) =>
    setErgebnis((e) => ({
      ...e,
      posten: e.posten.map((p, j) => {
        if (j !== i) return p;
        const neu = Math.max(0, Number(g) || 0);
        if (p.lebensmittel) return { ...p, gramm: neu, annahme: `${fmt(neu)} g${p.einlage ? ` · in ${p.einlage.label}` : ""}`, werte: werteMitEinlage(p.lebensmittel, neu, p.einlage) };
        const f = p.gramm ? neu / p.gramm : 0;
        return { ...p, gramm: neu, annahme: `${fmt(neu)} g`, werte: Object.fromEntries(Object.entries(p.werte).map(([k, v]) => [k, Math.round(v * f * 10) / 10])) };
      }),
    }));

  const speichern = async () => {
    const jetzt = new Date();
    const datum = festesDatum || toLocalISODate(jetzt);
    const s = summe(ergebnis.posten);
    const r = await essenSpeichern({ datum, uhrzeit: `${String(jetzt.getHours()).padStart(2, "0")}:${String(jetzt.getMinutes()).padStart(2, "0")}`, text: text.trim(), posten: ergebnis.posten, summe: s });
    if (!r?.ok) return setFehler(r?.error || "Speichern fehlgeschlagen.");
    aenderungVermerken?.({ kategorie: "mahlzeit", itemName: text.trim().slice(0, 60), aktion: "erledigt", detail: `≈ ${s.kcal} kcal · ${fmt(s.eiweiss)} g Eiweiß` });
    setGespeichert(s);
    setErgebnis(null);
    setText("");
  };

  const s = ergebnis ? summe(ergebnis.posten) : null;
  return (
    <section aria-label="Was hast du gegessen?" style={{ marginBottom: 14, borderRadius: 18, padding: 14, background: "#fff", border: `1.5px solid ${cardBorder}` }}>
      <div style={{ fontWeight: 900, fontSize: 15.5, marginBottom: 8 }}>🍽️ Was hast du gegessen?</div>
      {!ergebnis && (
        <>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <textarea
              aria-label="Was hast du gegessen?"
              rows={kompakt ? 2 : 3}
              value={diktat.interim ? `${text} ${diktat.interim}`.trim() : text}
              onChange={(e) => setText(e.target.value)}
              placeholder="z. B. zwei Scheiben Vollkornbrot, drei Bananen und fünf Eier"
              style={{ flex: 1, border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "9px 11px", fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
            />
            {diktat.verfuegbar && (
              <button type="button" onClick={diktat.umschalten} aria-label={diktat.hoert ? "Aufnahme stoppen" : "Diktieren"} style={{ border: "none", background: diktat.hoert ? "#FBEAE7" : "#EEF4FF", borderRadius: 12, width: 44, height: 44, fontSize: 20, cursor: "pointer" }}>
                {diktat.hoert ? "⏹" : "🎤"}
              </button>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <PrimaryButton onClick={ausrechnen} disabled={!text.trim() || rechnet}>
              {rechnet ? "Rechnet…" : "Ausrechnen"}
            </PrimaryButton>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {[
              ["etikett", "📷 Nährwerttabelle", "Foto der Verpackung – oben dazuschreiben, wie viel (z. B. „2 Scheiben“)"],
              ["mahlzeit", "📷 Mahlzeit", "Foto vom Teller – die App schätzt Mengen und Werte"],
            ].map(([art, label, titel]) => (
              <label key={art} title={titel} style={{ flex: 1, textAlign: "center", borderRadius: 12, padding: "10px 8px", background: "#EEF4FF", color: "#2D6FD6", fontWeight: 800, fontSize: 13.5, cursor: rechnet ? "default" : "pointer", opacity: rechnet ? 0.6 : 1 }}>
                {label}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  aria-label={label}
                  disabled={rechnet}
                  style={{ display: "none" }}
                  onChange={(ev) => {
                    fotoAuswerten(ev.target.files?.[0], art);
                    ev.target.value = "";
                  }}
                />
              </label>
            ))}
          </div>
          {fehler && <div style={{ color: danger, fontSize: 12.5, marginTop: 6 }}>{fehler}</div>}
          {gespeichert && (
            <div role="status" style={{ fontSize: 13, fontWeight: 700, color: "#1E8E5A", marginTop: 8 }}>
              ✓ Gespeichert: ≈ {gespeichert.kcal} kcal · {fmt(gespeichert.eiweiss)} g Eiweiß
            </div>
          )}
        </>
      )}
      {ergebnis && (
        <div data-essen-ergebnis>
          <div style={{ fontSize: 12, color: textMuted, marginBottom: 6 }}>„{text.trim()}“ – so hat die App gerechnet (Gramm änderbar):</div>
          {ergebnis.posten.map((p, i) => (
            <div key={i} style={{ padding: "7px 0", borderBottom: `1px solid ${cardBorder}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <b style={{ fontSize: 13.5 }}>{p.name}</b>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5 }}>
                  <input aria-label={`Gramm ${p.name}`} type="number" min={0} value={Math.round(p.gramm)} onChange={(e) => grammAendern(i, e.target.value)} style={{ width: 62, border: `1.5px solid ${cardBorder}`, borderRadius: 8, padding: "4px 6px", fontSize: 13, fontFamily: "inherit" }} />g
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: textMuted }}>{p.annahme}</div>
              <div style={{ fontSize: 12 }}>
                {fmt(p.werte.eiweiss)} g Eiweiß · {fmt(p.werte.fett)} g Fett · {fmt(p.werte.kh)} g KH · {Math.round(p.werte.kcal)} kcal
              </div>
            </div>
          ))}
          {ergebnis.offen.length > 0 && <div style={{ fontSize: 12.5, color: danger, marginTop: 6 }}>Nicht erkannt: {ergebnis.offen.join(", ")} – bitte genauer eingeben (z. B. „150 g …“).</div>}
          {ergebnis.posten.length > 0 && (
            <div style={{ fontSize: 13.5, fontWeight: 800, background: "#F4F6FA", borderRadius: 12, padding: "8px 10px", marginTop: 8 }}>
              Zusammen: ≈ {s.kcal} kcal · {fmt(s.eiweiss)} g Eiweiß · {fmt(s.fett)} g Fett · {fmt(s.kh)} g KH
              <div style={{ fontSize: 11.5, fontWeight: 600, color: textMuted }}>
                Omega-3 {s.omega3} mg (davon EPA/DHA {s.epaDha} mg) · Omega-6 {s.omega6} mg · Richtwerte
              </div>
            </div>
          )}
          {fehler && <div style={{ color: danger, fontSize: 12.5, marginTop: 6 }}>{fehler}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <PrimaryButton onClick={speichern} disabled={!ergebnis.posten.length}>
              Passt – speichern
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setErgebnis(null)}>
              Ändern
            </PrimaryButton>
          </div>
        </div>
      )}
    </section>
  );
}
