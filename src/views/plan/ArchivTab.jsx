import React from "react";
import { Card, PrimaryButton } from "../../ui/primitives";
import { SignedPhoto } from "../../ui/SignedPhoto";
import { textMuted } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";
import ArchivAbschnitt from "../../ui/ArchivAbschnitt";

export default function ArchivTab() {
  const {
    abgeschlosseneProtokolle,
    protokollArchivieren,
    protokollLoeschen,
    hauptprotokolle,
    hauptprotokollLoeschen,
    blutwerteArchiv,
    blutwertEntfernen,
    gewichtsEintraege,
    gewichtEntfernen,
    aktiveMesswerte,
    combinedMesswertDefs,
  } = useAppData();

  const archivierteHauptprotokolle = hauptprotokolle.filter((h) => h.status === "archived");

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

      <ArchivAbschnitt
        titel="Abgeschlossene Protokolle"
        leerText="Noch keine abgeschlossenen Protokolle."
        items={abgeschlosseneProtokolle}
        getId={(p) => p.id}
        onLoeschen={protokollLoeschen}
        confirmEinzeln={(p) => `Bist du sicher, dass du "${p.peptide.join(", ") || `Protokoll vom ${p.datum}`}" (${p.datum}) endgültig entfernen möchtest? Das kann nicht rückgängig gemacht werden.`}
        confirmMehrfach={(n) => `Bist du sicher, dass du ${n} Protokoll${n === 1 ? "" : "e"} endgültig entfernen möchtest? Das kann nicht rückgängig gemacht werden.`}
        renderZeile={(p) => (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{p.peptide.join(", ") || "—"}</span>
              <span style={{ fontSize: 12, color: textMuted, flexShrink: 0 }}>{p.datum}</span>
            </div>
            <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
              {p.ziele.join(", ")} · {p.dauer} Wochen · {p.injektionen} Injektionen
            </div>
          </>
        )}
      />

      <ArchivAbschnitt
        titel="Abgeschlossene Hauptprotokolle"
        leerText="Noch keine abgeschlossenen Hauptprotokolle."
        items={archivierteHauptprotokolle}
        getId={(h) => h.id}
        onLoeschen={hauptprotokollLoeschen}
        confirmEinzeln={(h) => `Bist du sicher, dass du "${h.name}" endgültig entfernen möchtest? Das kann nicht rückgängig gemacht werden.`}
        confirmMehrfach={(n) => `Bist du sicher, dass du ${n} Hauptprotokoll${n === 1 ? "" : "e"} endgültig entfernen möchtest? Das kann nicht rückgängig gemacht werden.`}
        renderZeile={(h) => (
          <>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{h.name}</div>
            <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
              Gestartet {h.startdatum}
              {h.archiviert_am && ` · Archiviert ${h.archiviert_am.slice(0, 10)}`}
            </div>
          </>
        )}
      />

      <ArchivAbschnitt
        titel="Blutwerte-Verlauf"
        leerText="Noch keine gescannten Laborberichte — nutze die Kamera-Erfassung im Profil-Tab."
        items={blutwerteArchiv}
        getId={(snap) => snap.id}
        onLoeschen={blutwertEntfernen}
        confirmEinzeln={(snap) => `Blutwerte vom ${snap.datum} endgültig löschen? Das kann nicht rückgängig gemacht werden.`}
        confirmMehrfach={(n) => `Bist du sicher, dass du ${n} Blutwerte-Eintrag/-Einträge endgültig entfernen möchtest? Das kann nicht rückgängig gemacht werden.`}
        renderZeile={(snap) => (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{snap.datum}</div>
            <div style={{ fontSize: 12, color: textMuted }}>
              {Object.entries(snap.werte)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ")}
            </div>
          </>
        )}
      />

      <ArchivAbschnitt
        titel="Check-in-Verlauf (rückwirkend)"
        leerText="Noch keine wöchentlichen Check-ins erfasst."
        items={gewichtsEintraege.slice().reverse()}
        getId={(e) => e.datum}
        onLoeschen={gewichtEntfernen}
        confirmEinzeln={(e) => `Check-in vom ${e.datum} endgültig löschen? Das kann nicht rückgängig gemacht werden.`}
        confirmMehrfach={(n) => `Bist du sicher, dass du ${n} Check-in${n === 1 ? "" : "s"} endgültig entfernen möchtest? Das kann nicht rückgängig gemacht werden.`}
        renderZeile={(e) => (
          <>
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
          </>
        )}
      />
    </>
  );
}
