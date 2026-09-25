import React, { useState } from "react";
import { useAppData } from "../context/AppDataContext";
import { PrimaryButton } from "./primitives";
import { cardBorder, danger, textMuted } from "./theme";
import { useDiktat } from "./useDiktat";
import { praeparatFotoAuswerten } from "../data/essenFoto";
import { inhaltsstoffZeile } from "../utils/inhaltsstoffe";

// Dose/Packung abfotografieren (25.09., Nutzerinnen-Vorgabe): "3 Stück
// davon" dazuschreiben oder sprechen, Foto machen – die App liest Name und
// Inhaltsstoffe ab und rechnet auf die Einnahme um. Ergebnis zum Prüfen,
// "Übernehmen" füllt das manuelle Formular darunter (das bleibt wie es ist).
export default function PraeparatFoto({ art, onUebernehmen }) {
  const { userId } = useAppData();
  const [text, setText] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState(null);
  const [ergebnis, setErgebnis] = useState(null);
  const [uebernommen, setUebernommen] = useState(false);
  const diktat = useDiktat({ value: text, onChange: setText });

  const foto = async (file) => {
    if (!file) return;
    setFehler(null);
    setUebernommen(false);
    setLaeuft(true);
    try {
      setErgebnis(await praeparatFotoAuswerten(userId, file, art, text.trim()));
    } catch (e) {
      setFehler(e.message || "Das Foto konnte nicht ausgewertet werden.");
    } finally {
      setLaeuft(false);
    }
  };

  const stoffEntfernen = (i) => setErgebnis((e) => ({ ...e, inhaltsstoffe: e.inhaltsstoffe.filter((_, j) => j !== i) }));

  return (
    <section aria-label="Per Foto eintragen" style={{ marginBottom: 14, borderRadius: 18, padding: 14, background: "#fff", border: `1.5px solid ${cardBorder}` }}>
      <div style={{ fontWeight: 900, fontSize: 15, marginBottom: 4 }}>📷 Per Foto eintragen</div>
      <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 8 }}>
        {art === "medikament" ? "Packung oder Beipackzettel abfotografieren" : "Dose oder Etikett mit den Inhaltsstoffen abfotografieren"} – die App liest alles ab und rechnet es auf deine Einnahme um.
      </div>
      {!ergebnis && (
        <>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <input
              aria-label="Wie viel nimmst du auf einmal?"
              value={diktat.interim ? `${text} ${diktat.interim}`.trim() : text}
              onChange={(e) => setText(e.target.value)}
              placeholder={art === "medikament" ? "z. B. 1 Tablette morgens" : "z. B. 3 Kapseln / 1 Messlöffel"}
              style={{ flex: 1, border: `1.5px solid ${cardBorder}`, borderRadius: 12, padding: "10px 11px", fontSize: 14, fontFamily: "inherit" }}
            />
            {diktat.verfuegbar && (
              <button type="button" onClick={diktat.umschalten} aria-label={diktat.hoert ? "Aufnahme stoppen" : "Diktieren"} style={{ border: "none", background: diktat.hoert ? "#FBEAE7" : "#EEF4FF", borderRadius: 12, width: 44, height: 42, fontSize: 20, cursor: "pointer" }}>
                {diktat.hoert ? "⏹" : "🎤"}
              </button>
            )}
          </div>
          <label style={{ display: "block", textAlign: "center", marginTop: 8, borderRadius: 12, padding: "11px 8px", background: "#EEF4FF", color: "#2D6FD6", fontWeight: 800, fontSize: 14, cursor: laeuft ? "default" : "pointer", opacity: laeuft ? 0.6 : 1 }}>
            {laeuft ? "Liest ab…" : art === "medikament" ? "📷 Packung abfotografieren" : "📷 Dose abfotografieren"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              aria-label="Foto aufnehmen"
              disabled={laeuft}
              style={{ display: "none" }}
              onChange={(ev) => {
                foto(ev.target.files?.[0]);
                ev.target.value = "";
              }}
            />
          </label>
          {uebernommen && <div role="status" style={{ fontSize: 12.5, fontWeight: 700, color: "#1E8E5A", marginTop: 8 }}>✓ Unten eingetragen – jetzt noch Zeit wählen und speichern.</div>}
        </>
      )}
      {fehler && <div style={{ color: danger, fontSize: 12.5, marginTop: 6 }}>{fehler}</div>}
      {ergebnis && (
        <div data-praeparat-ergebnis>
          <div style={{ fontSize: 14.5, fontWeight: 800 }}>{ergebnis.name || "Unbenannt"}</div>
          <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 6 }}>
            Deine Einnahme: <b>{ergebnis.menge || "–"}</b>
            {ergebnis.portion ? ` · laut Etikett 1 Portion = ${ergebnis.portion}` : ""}
          </div>
          {ergebnis.inhaltsstoffe.length > 0 ? (
            <div style={{ fontSize: 12.5 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: textMuted, marginBottom: 2 }}>INHALT JE EINNAHME</div>
              {ergebnis.inhaltsstoffe.map((s, i) => (
                <div key={`${s.name}-${i}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "4px 0", borderBottom: `1px solid ${cardBorder}` }}>
                  <span>{inhaltsstoffZeile(s)}</span>
                  <button type="button" aria-label={`${s.name} entfernen`} onClick={() => stoffEntfernen(i)} style={{ border: "none", background: "transparent", color: textMuted, cursor: "pointer" }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: textMuted }}>Keine Inhaltsstoffe lesbar.</div>
          )}
          {ergebnis.hinweis && <div style={{ fontSize: 11.5, color: textMuted, marginTop: 6 }}>ℹ️ {ergebnis.hinweis}</div>}
          <div style={{ fontSize: 11.5, color: textMuted, marginTop: 6 }}>Bitte kurz mit der Packung vergleichen – abgelesen, nicht geprüft.</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <PrimaryButton
              onClick={() => {
                onUebernehmen(ergebnis);
                setErgebnis(null);
                setText("");
                setUebernommen(true);
              }}
            >
              Passt – übernehmen
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setErgebnis(null)}>
              Nochmal
            </PrimaryButton>
          </div>
        </div>
      )}
    </section>
  );
}
