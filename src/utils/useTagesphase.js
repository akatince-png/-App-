import { useEffect, useState } from "react";
import { tagesphase } from "./tagesphase";
import { sonnenuntergangMinuten } from "./sonne";

// Aktuelle Tagesphase ("morgen" | "tag" | "abend" | "nacht"), minütlich neu
// geprüft, damit sie bei offener App von selbst wechselt (24.09.). Seit
// 24.10. mit Abendphase ab Sonnenuntergang (Hannover).
export function useTagesphase({ routineDurchlaeufe, routineSchritte, routineEinstellungen }) {
  const [uhr, setUhr] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setUhr(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  return tagesphase({ jetzt: uhr, routineDurchlaeufe, routineSchritte, routineEinstellungen, sonnenuntergangMin: sonnenuntergangMinuten(uhr) });
}
