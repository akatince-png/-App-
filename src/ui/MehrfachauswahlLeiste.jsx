import React from "react";
import { accentDark, danger } from "./theme";

// Header-Zeile "Alle auswählen"/"Auswahl aufheben" + "X löschen" — geteilt
// zwischen ArchivAbschnitt.jsx (flache Listen) und ProtokollLogView.jsx
// (nach Datum gruppierte Listen), siehe useMehrfachauswahl.js.
export default function MehrfachauswahlLeiste({ anzahlAusgewaehlt, alleAusgewaehlt, onAlleUmschalten, onMehrfachLoeschen }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {anzahlAusgewaehlt > 0 && (
        <button
          type="button"
          onClick={onMehrfachLoeschen}
          style={{ border: "none", background: "transparent", color: danger, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
        >
          {anzahlAusgewaehlt} löschen
        </button>
      )}
      <button
        type="button"
        onClick={onAlleUmschalten}
        style={{ border: "none", background: "transparent", color: accentDark, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0 }}
      >
        {alleAusgewaehlt ? "Auswahl aufheben" : "Alle auswählen"}
      </button>
    </div>
  );
}
