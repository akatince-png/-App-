import React, { useEffect, useRef, useState } from "react";
import { Shell, Card, PrimaryButton } from "../../ui/primitives";
import { cardBorder, textMuted } from "../../ui/theme";
import { useAppData } from "../../context/AppDataContext";

// "Wie viele Wochen läuft das schon?" — dieselbe Rechnung wie
// AktuellesProtokoll (MehrTab.jsx, seitWoche()), hier fürs Hauptprotokoll
// insgesamt statt pro Baustein.
function wochenSeit(datumStr) {
  if (!datumStr) return null;
  const start = new Date(datumStr);
  const wochen = Math.floor((new Date() - start) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, wochen);
}

// Bestätigungs-Zwischenschritt vor "Neues Protokoll" (Nutzerinnen-Vorgabe,
// 15.09.: "möchte ich erstmal gefragt werden, möchtest du das archivieren
// ... und ich möchte auch darüber informiert werden, auf welchem Stand das
// alte Protokoll ist ... das soll nicht einfach blind passieren"). Vorher
// archivierte `neuesProtokoll()` in AuthenticatedApp.jsx das laufende
// Peptid-Protokoll sofort beim Klick auf den "+"-Button, ohne jede
// Rückfrage — jetzt erst hier, nach explizitem "Ja".
//
// Zeigt bewusst nur Kennzahlen, die ohne zusätzliche Datenbankabfragen
// schon vorliegen (aktivesHauptprotokoll, teilprotokolle) — keine neue
// Statistik-Funktion nur für diesen einen Screen.
export default function NeuesProtokollBestaetigenView({ onBestaetigt, onAbbrechen }) {
  const { aktivesHauptprotokoll, teilprotokolle } = useAppData();
  const [laedt, setLaedt] = useState(false);
  const automatischWeiterRef = useRef(false);

  // Kein aktives Hauptprotokoll (sollte bei abgeschlossenem Onboarding
  // praktisch nie vorkommen) — nichts zu archivieren, nichts zu bestätigen,
  // direkt weiter statt eine leere Nachfrage anzuzeigen.
  useEffect(() => {
    if (!aktivesHauptprotokoll && !automatischWeiterRef.current) {
      automatischWeiterRef.current = true;
      onBestaetigt();
    }
  }, [aktivesHauptprotokoll, onBestaetigt]);

  if (!aktivesHauptprotokoll) return null;

  const aktiveAnzahl = teilprotokolle.filter((t) => t.hauptprotokoll_id === aktivesHauptprotokoll.id && t.aktiv).length;
  const wochen = wochenSeit(aktivesHauptprotokoll.startdatum);

  const bestaetigen = async () => {
    setLaedt(true);
    await onBestaetigt();
    setLaedt(false);
  };

  return (
    <Shell>
      <div style={{ marginBottom: 24, paddingTop: 20 }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Neues Protokoll beginnen?</div>
        <div style={{ fontSize: 13, color: textMuted, lineHeight: 1.5 }}>
          Dein aktuelles Protokoll wird dabei archiviert. Du kannst es danach jederzeit unter Archiv → Protokolle
          nachlesen, aber nicht mehr weiterführen.
        </div>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{aktivesHauptprotokoll.name}</div>
        {aktivesHauptprotokoll.startdatum && (
          <div style={{ fontSize: 12.5, color: textMuted, marginBottom: 3 }}>
            seit {aktivesHauptprotokoll.startdatum}
            {wochen ? ` · Woche ${wochen}` : ""}
          </div>
        )}
        <div style={{ fontSize: 12.5, color: textMuted }}>
          {aktiveAnzahl} {aktiveAnzahl === 1 ? "Bereich" : "Bereiche"} aktiv
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={bestaetigen} disabled={laedt}>
          {laedt ? "Einen Moment…" : "Ja, archivieren und neu beginnen"}
        </PrimaryButton>
        <button
          type="button"
          onClick={onAbbrechen}
          disabled={laedt}
          style={{
            padding: "12px 20px",
            borderRadius: 12,
            border: `1px solid ${cardBorder}`,
            background: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: laedt ? "not-allowed" : "pointer",
          }}
        >
          Abbrechen, beim aktuellen Protokoll bleiben
        </button>
      </div>
    </Shell>
  );
}
