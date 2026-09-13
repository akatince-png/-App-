import { useState } from "react";
import { useZielEntwurf } from "./useZielEntwurf";

/**
 * Bündelt die Zustands-/Speicherlogik, die sich HydrationView.jsx und
 * TageslichtView.jsx bisher fast wortgleich geteilt haben (13.09., Teil 60
 * — im Punch-Liste-Eintrag selbst als Kandidat benannt): Tagesziel-Entwurf
 * (inkl. Änderungsgrund + Änderungsprotokoll-Eintrag), "Verschätzt?"-
 * Korrektur der Tagesmenge, Zurücksetzen des Ziels mit Bestätigungsdialog,
 * und einheitliche Fehlerbehandlung. Bewusst NUR die Logik, nicht die
 * JSX-Darstellung — die unterscheidet sich zwischen beiden Views genug
 * (Hydration hat zusätzlich eine Check-in-Karte für Elektrolyte/
 * Durstgefühl), dass ein gemeinsames Render dort eher eine
 * Konfigurations-Objekt-Wüste erzeugen würde als echte Klarheit.
 *
 * `hinzufuegen`/`zielSetzen`/`zielZuruecksetzen` sind die jeweiligen
 * useAppData()-Funktionen (hydrationHinzufuegen/tageslichtHinzufuegen usw.).
 */
export function useZielMitKorrektur({ zielWert, heuteWert, hinzufuegen, zielSetzen, zielZuruecksetzen, aenderungVermerken, kategorie, itemName, einheit, kachelName, defaultZiel }) {
  const [zielEntwurf, setZielEntwurf] = useZielEntwurf(zielWert);
  const [korrekturEntwurf, setKorrekturEntwurf] = useState("");
  const [zielGrund, setZielGrund] = useState("");
  const [fehler, setFehler] = useState(null);

  const schnellHinzufuegen = async (menge) => {
    setFehler(null);
    const result = await hinzufuegen(menge);
    if (!result?.ok) setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
  };

  const zielSpeichern = async () => {
    setFehler(null);
    if (Number(zielEntwurf) !== zielWert) {
      aenderungVermerken({
        kategorie,
        itemName,
        aktion: "geändert",
        detail: `Ziel: ${zielWert} ${einheit} → ${zielEntwurf} ${einheit}`,
        grund: zielGrund,
      });
    }
    const result = await zielSetzen(zielEntwurf);
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setZielGrund("");
  };

  const zielZuruecksetzenMitBestaetigung = async () => {
    if (!window.confirm(`Tagesziel zurücksetzen? Die ${kachelName}-Kachel verschwindet dann wieder von der Startseite, bis du erneut etwas einträgst.`)) return;
    setFehler(null);
    const result = await zielZuruecksetzen();
    if (!result?.ok) {
      setFehler(result?.error || "Zurücksetzen fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setZielEntwurf(String(defaultZiel));
  };

  const korrekturSetzen = async () => {
    if (korrekturEntwurf === "") return;
    setFehler(null);
    const result = await hinzufuegen(Number(korrekturEntwurf) - heuteWert);
    if (!result?.ok) {
      setFehler(result?.error || "Speichern fehlgeschlagen. Bitte nochmal versuchen.");
      return;
    }
    setKorrekturEntwurf("");
  };

  return {
    zielEntwurf,
    setZielEntwurf,
    korrekturEntwurf,
    setKorrekturEntwurf,
    zielGrund,
    setZielGrund,
    fehler,
    // Exportiert, damit Aufrufer mit zusätzlichen, hook-fremden
    // Speicherwegen (z. B. HydrationView.checkinSpeichern) denselben
    // Fehler-Banner mitbenutzen können statt einen eigenen zu führen.
    setFehler,
    schnellHinzufuegen,
    zielSpeichern,
    zielZuruecksetzen: zielZuruecksetzenMitBestaetigung,
    korrekturSetzen,
  };
}
