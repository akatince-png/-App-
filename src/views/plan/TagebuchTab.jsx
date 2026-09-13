import React, { useEffect, useRef, useState } from "react";
import { Card } from "../../ui/primitives";
import Icon from "../../ui/Icon";
import { accentDark, accentSoft, danger, textMain, textMuted } from "../../ui/theme";
import { tagebuchEintraegeLesen, tagebuchEintragLoeschen } from "../../utils/tagebuchStorage";
import { exportElementAsPdf } from "../../utils/pdfExport";

function datumLang(iso) {
  const d = new Date(iso);
  const datum = d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const uhrzeit = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return `${datum}, ${uhrzeit} Uhr`;
}
function datumKurz(iso) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Tagebuch-Archiv (13.09., Nutzerinnen-Vorgabe): "wenn ich etwas
// abgespeichert habe, will ich das nächste Mal, wenn ich das Feld Tagebuch
// aufrufe, nicht unten sehen, was ich zuletzt abgespeichert hatte, sondern
// es soll... im Archivbereich einen Button geben, wo Tagebuch steht... die
// einzelnen Seiten nachlesen... einsehen... als PDF herunterladen." Ersetzt
// die bisherige Liste UNTEN im Schreibfenster (TagebuchModal.jsx) — das
// Schreibfenster ist jetzt nur noch zum Schreiben da, Übersicht/Nachlesen/
// PDF-Export leben hier, als eigener "Tagebuch"-Reiter im Archiv-Hub
// (PlanView.jsx), genau wie bei den anderen Protokollen dort.
// Bleibt wie tagebuchStorage.js komplett lokal — auch der PDF-Export läuft
// rein clientseitig (exportElementAsPdf, schon für die Wochenübersicht im
// Einsatz), es wird nichts hochgeladen.
export default function TagebuchTab() {
  const [eintraege, setEintraege] = useState(() => tagebuchEintraegeLesen());
  const [offenerEintrag, setOffenerEintrag] = useState(null);
  const [exportEintrag, setExportEintrag] = useState(null);
  const [exportLaufendId, setExportLaufendId] = useState(null);
  const exportRef = useRef(null);

  useEffect(() => {
    if (!exportEintrag) return;
    let abgebrochen = false;
    (async () => {
      // Ein Frame warten, bis der gerade gesetzte Inhalt im unsichtbaren
      // Export-Bereich tatsächlich im DOM steht, bevor html2canvas
      // fotografiert (gleiches Muster wie in WochenuebersichtView.jsx).
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (abgebrochen || !exportRef.current) return;
      try {
        await exportElementAsPdf(exportRef.current, `tagebuch-${exportEintrag.erstelltAm.slice(0, 10)}.pdf`);
      } catch (err) {
        console.error(err);
      } finally {
        if (!abgebrochen) {
          setExportEintrag(null);
          setExportLaufendId(null);
        }
      }
    })();
    return () => {
      abgebrochen = true;
    };
  }, [exportEintrag]);

  const pdfHerunterladen = (eintrag) => {
    setExportLaufendId(eintrag.id);
    setExportEintrag(eintrag);
  };

  const eintragLoeschen = (id) => {
    if (tagebuchEintragLoeschen(id)) {
      setEintraege(tagebuchEintraegeLesen());
      if (offenerEintrag === id) setOffenerEintrag(null);
    }
  };

  if (eintraege.length === 0) {
    return (
      <Card>
        <div style={{ fontSize: 13, color: textMuted }}>
          Noch keine Tagebuch-Seiten gespeichert — über die Kachel "Tagebuch" auf der Startseite geht's los.
        </div>
      </Card>
    );
  }

  return (
    <>
      {eintraege.map((e) => {
        const offen = offenerEintrag === e.id;
        return (
          <Card key={e.id} style={{ marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setOffenerEintrag(offen ? null : e.id)}
              style={{ width: "100%", textAlign: "left", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="book" size={16} color={accentDark} />
                <div style={{ fontSize: 13, fontWeight: 800, color: textMain }}>{datumKurz(e.erstelltAm)}</div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: textMuted,
                  marginTop: 6,
                  lineHeight: 1.5,
                  whiteSpace: offen ? "pre-wrap" : "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {e.text}
              </div>
            </button>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                type="button"
                onClick={() => pdfHerunterladen(e)}
                disabled={exportLaufendId === e.id}
                style={{
                  border: "none",
                  borderRadius: 10,
                  background: accentSoft,
                  color: accentDark,
                  fontWeight: 700,
                  fontSize: 12,
                  padding: "8px 12px",
                  cursor: exportLaufendId === e.id ? "not-allowed" : "pointer",
                }}
              >
                {exportLaufendId === e.id ? "Erstellt PDF…" : "Als PDF herunterladen"}
              </button>
              <button
                type="button"
                onClick={() => eintragLoeschen(e.id)}
                style={{ border: "none", background: "transparent", color: danger, fontWeight: 700, fontSize: 12, padding: "8px 6px", cursor: "pointer" }}
              >
                Löschen
              </button>
            </div>
          </Card>
        );
      })}

      {/* Unsichtbares Export-Layout für die gerade heruntergeladene Seite —
          gleiches Muster wie in WochenuebersichtView.jsx: außerhalb des
          sichtbaren Bereichs positioniert (display:none würde html2canvas
          leer liefern, position:absolute funktioniert). A4-Seitenbreite
          (794px ≈ 210mm bei 96dpi), damit das PDF wirklich wie eine
          einzelne A4-Tagebuchseite aussieht statt wie ein App-Ausschnitt. */}
      {exportEintrag && (
        <div style={{ position: "absolute", left: -9999, top: 0, width: 794 }}>
          <div
            ref={exportRef}
            style={{
              // Bewusst KEIN minHeight in exakter A4-Höhe (1123px) — bei
              // kurzen Einträgen lag die gerenderte Höhe dann exakt auf der
              // Seitengrenze von exportElementAsPdf, und ein
              // Rundungsfehler erzeugte eine fast leere zweite Seite. Ohne
              // minHeight endet die Seite einfach dort, wo der Text endet
              // (darunter bleibt die A4-Seite schlicht weiß) — bei langen
              // Einträgen paginiert exportElementAsPdf ganz normal weiter.
              background: "#fff",
              width: 794,
              boxSizing: "border-box",
              padding: "70px 64px",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            <div style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#8A8A85", marginBottom: 6 }}>Tagebuch</div>
            <div style={{ fontSize: 20, fontStyle: "italic", color: "#3A3A36", marginBottom: 24, paddingBottom: 18, borderBottom: "1px solid #E4E4DF" }}>
              {datumLang(exportEintrag.erstelltAm)}
            </div>
            <div style={{ fontSize: 16, lineHeight: 1.9, color: "#20201D", whiteSpace: "pre-wrap" }}>{exportEintrag.text}</div>
          </div>
        </div>
      )}
    </>
  );
}
