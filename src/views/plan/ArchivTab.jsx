import React from "react";
import { Card, PrimaryButton } from "../../ui/primitives";
import { SignedPhoto } from "../../ui/SignedPhoto";
import { cardBorder, textMuted } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";

export default function ArchivTab() {
  const { abgeschlosseneProtokolle, protokollArchivieren, blutwerteArchiv, gewichtsEintraege, aktiveMesswerte, combinedMesswertDefs } = useAppData();

  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Aktuelles Protokoll archivieren</div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
          Schließt dein laufendes Protokoll ab und speichert es im Archiv — du kannst danach ein neues starten.
        </div>
        <PrimaryButton onClick={protokollArchivieren} variant="ghost">
          Protokoll abschließen & archivieren
        </PrimaryButton>
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Abgeschlossene Protokolle</div>
      <Card style={{ marginBottom: 14 }}>
        {abgeschlosseneProtokolle.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Noch keine abgeschlossenen Protokolle.</div>}
        {abgeschlosseneProtokolle.map((p, i) => (
          <div key={p.id || i} style={{ padding: "10px 0", borderBottom: i < abgeschlosseneProtokolle.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{p.peptide.join(", ") || "—"}</span>
              <span style={{ fontSize: 12, color: textMuted }}>{p.datum}</span>
            </div>
            <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
              {p.ziele.join(", ")} · {p.dauer} Wochen · {p.injektionen} Injektionen
            </div>
          </div>
        ))}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Blutwerte-Verlauf</div>
      <Card style={{ marginBottom: 14 }}>
        {blutwerteArchiv.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Noch keine gescannten Laborberichte — nutze die Kamera-Erfassung im Profil-Tab.</div>}
        {blutwerteArchiv.map((snap, i) => (
          <div key={i} style={{ padding: "10px 0", borderBottom: i < blutwerteArchiv.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{snap.datum}</div>
            <div style={{ fontSize: 12, color: textMuted }}>
              {Object.entries(snap.werte)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </div>
          </div>
        ))}
      </Card>

      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Check-in-Verlauf (rückwirkend)</div>
      <Card style={{ marginBottom: 14 }}>
        {gewichtsEintraege.length === 0 && <div style={{ fontSize: 13, color: textMuted }}>Noch keine wöchentlichen Check-ins erfasst.</div>}
        {gewichtsEintraege
          .slice()
          .reverse()
          .map((e, i, arr) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${cardBorder}` : "none" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{e.datum}</div>
              <div style={{ fontSize: 12, color: textMuted, marginBottom: e.fotos?.length ? 6 : 0 }}>
                {aktiveMesswerte
                  .map((id) => {
                    const def = combinedMesswertDefs.find((d) => d.id === id);
                    return e[id] !== "" && e[id] !== undefined ? `${def?.label}: ${e[id]}${def?.unit ? " " + def.unit : ""}` : null;
                  })
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {e.fotos?.length > 0 && (
                <div style={{ display: "flex", gap: 6 }}>
                  {e.fotos.map((f, j) => (
                    <SignedPhoto key={j} path={f.path} alt={f.kategorie} size={36} />
                  ))}
                </div>
              )}
            </div>
          ))}
      </Card>
    </>
  );
}
