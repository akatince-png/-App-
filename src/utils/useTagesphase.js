import { useEffect, useState } from "react";
import { tagesphase } from "./tagesphase";

// Aktuelle Tagesphase ("morgen" | "tag" | "nacht"), minütlich neu geprüft,
// damit sie bei offener App von selbst wechselt (24.09.).
export function useTagesphase({ routineDurchlaeufe, routineSchritte, routineEinstellungen }) {
  const [uhr, setUhr] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setUhr(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  return tagesphase({ jetzt: uhr, routineDurchlaeufe, routineSchritte, routineEinstellungen });
}
