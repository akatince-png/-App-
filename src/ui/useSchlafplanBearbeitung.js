import { useEffect, useRef, useState } from "react";
import { neuerSchlafblock } from "./SchlafplanCard";
import { WOCHENTAGE } from "../constants";

// Gemeinsame Zustands-/Speicherlogik für den Schlafplan-Editor (Bettzeit/
// Aufwachzeit je Wochentag) — bisher an drei Stellen fast wortgleich
// kopiert (RoutineTabView.jsx, SchlafView.jsx, jetzt GewohnheitenView.jsx,
// 17.09., Konsistenz-Check, dritter Einstiegspunkt) — hier einmal
// zentral, damit ein künftiger Bug-Fix nicht an drei Stellen einzeln
// nachgezogen werden muss. `categoryZiele`/`setCategoryZiel`/
// `aenderungVermerken` sind die jeweiligen useAppData()-Werte des
// Aufrufers.
export function useSchlafplanBearbeitung({ categoryZiele, setCategoryZiel, aenderungVermerken }) {
  const [schlafIntervallTyp, setSchlafIntervallTyp] = useState("weekdays");
  const [schlafBloecke, setSchlafBloecke] = useState([neuerSchlafblock([...WOCHENTAGE])]);
  const [schlafIstZustand, setSchlafIstZustand] = useState("");
  const schlafIstZustandGespeichertRef = useRef("");

  useEffect(() => {
    const gespeicherteBloecke = categoryZiele?.schlaf?.bloecke;
    if (gespeicherteBloecke?.length) {
      setSchlafIntervallTyp(
        gespeicherteBloecke.length === 1 && gespeicherteBloecke[0].wochentage.length === WOCHENTAGE.length ? "fixed" : "weekdays"
      );
      setSchlafBloecke(gespeicherteBloecke.map((b) => ({ ...neuerSchlafblock(b.wochentage), ...b })));
    }
    const geladenerIstZustand = categoryZiele?.schlaf?.istZustand?.aktuell || "";
    setSchlafIstZustand(geladenerIstZustand);
    schlafIstZustandGespeichertRef.current = geladenerIstZustand;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beschreibeSchlafbloecke = (bloecke) => bloecke.map((b) => `${b.wochentage.join(",") || "–"} ${b.bettzeit}–${b.aufwachzeit}`).join("; ");

  const speichereSchlafplan = (typ, bloecke, istZustandText) => {
    const effektiveBloecke = typ === "fixed" ? [{ ...bloecke[0], wochentage: [...WOCHENTAGE] }] : bloecke;
    setCategoryZiel("schlaf", {
      bloecke: effektiveBloecke.map(({ wochentage, bettzeit, aufwachzeit }) => ({ wochentage, bettzeit, aufwachzeit })),
      istZustand: { aktuell: istZustandText },
    });
    schlafIstZustandGespeichertRef.current = istZustandText;
  };
  const handleSchlafIntervallTyp = (typ) => {
    const vorherText = schlafIntervallTyp === "fixed" ? "Täglich" : "Bestimmte Wochentage";
    const nachherText = typ === "fixed" ? "Täglich" : "Bestimmte Wochentage";
    setSchlafIntervallTyp(typ);
    speichereSchlafplan(typ, schlafBloecke, schlafIstZustand);
    if (typ !== schlafIntervallTyp) {
      aenderungVermerken({ kategorie: "schlaf", itemName: "Schlafplan", aktion: "geändert", detail: `Intervall: ${vorherText} → ${nachherText}` });
    }
  };
  const handleSchlafBloecke = (neueBloecke) => {
    const vorherDetail = beschreibeSchlafbloecke(schlafBloecke);
    setSchlafBloecke(neueBloecke);
    speichereSchlafplan(schlafIntervallTyp, neueBloecke, schlafIstZustand);
    aenderungVermerken({ kategorie: "schlaf", itemName: "Schlafplan", aktion: "geändert", detail: `${vorherDetail} → ${beschreibeSchlafbloecke(neueBloecke)}` });
  };
  const handleSchlafIstZustand = (text) => {
    // Bewusst KEINE sofortige Speicherung/Protokollierung hier, siehe
    // Debounce-Effekt unten — ein Aufruf pro Tastenanschlag wäre
    // unbrauchbar "geräuschig".
    setSchlafIstZustand(text);
  };
  useEffect(() => {
    if (schlafIstZustand === schlafIstZustandGespeichertRef.current) return;
    const timeout = setTimeout(() => {
      const vorher = schlafIstZustandGespeichertRef.current;
      speichereSchlafplan(schlafIntervallTyp, schlafBloecke, schlafIstZustand);
      aenderungVermerken({
        kategorie: "schlaf",
        itemName: "Schlafplan",
        aktion: "geändert",
        detail: `Aktueller Schlaf: ${vorher || "–"} → ${schlafIstZustand || "–"}`,
      });
    }, 800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schlafIstZustand, schlafIntervallTyp, schlafBloecke]);

  return {
    schlafIntervallTyp,
    schlafBloecke,
    schlafIstZustand,
    handleSchlafIntervallTyp,
    handleSchlafBloecke,
    handleSchlafIstZustand,
  };
}
