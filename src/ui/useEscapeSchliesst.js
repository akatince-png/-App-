import { useEffect } from "react";

// Barrierefreiheit (13.09., Stichprobe): Bottom-Sheets/Modals ließen sich
// bisher nur per Tap auf den Hintergrund oder den ×-Knopf schließen, nicht
// per Tastatur — Escape ist die etablierte Konvention für "Dialog
// schließen". Ein zentraler Hook statt Duplikat in jedem Modal.
export function useEscapeSchliesst(schliessen, aktiv = true) {
  useEffect(() => {
    if (!aktiv) return;
    const aufEscape = (e) => {
      if (e.key === "Escape") schliessen();
    };
    window.addEventListener("keydown", aufEscape);
    return () => window.removeEventListener("keydown", aufEscape);
  }, [schliessen, aktiv]);
}
