import { useEffect, useRef } from "react";
import { feuereBelohnung } from "../utils/belohnungBus";
import { levelAusPunkten } from "../utils/level";
import { badgeLabel } from "../utils/errungenschaften";

// Große Feiern für Level-Aufstieg und neu erreichte Abzeichen (Spiel-Ausbau
// 23.09.). Beides existierte schon still im Hintergrund — Level nur als Zahl
// in der SpielstandKarte, Abzeichen nur in der Erfolge-Galerie —, ohne dass
// man den Moment des Erreichens mitbekam.
//
// Level: das höchste je gesehene Level wird pro Person auf dem Gerät
// gemerkt. Beim allerersten Mal wird nur gemerkt, nicht gefeiert (sonst gäbe
// es für Bestandsnutzerinnen eine Schein-Feier). Nur ein ANSTIEG über das
// gemerkte Maximum feiert — ein Zwischenstand beim Laden (noch nicht alle
// Daten da, Punkte kurz niedriger) löst also nichts aus.
export function useSpielFeiern({ userId, gesamtPunkte, ladend, neueBadgeKeys }) {
  useEffect(() => {
    if (!userId || ladend) return;
    const level = levelAusPunkten(gesamtPunkte).level;
    const schluessel = `aka_level_${userId}`;
    let gemerkt = null;
    try {
      gemerkt = localStorage.getItem(schluessel);
    } catch {
      return;
    }
    const bisher = gemerkt === null ? null : Number(gemerkt);
    if (bisher !== null && level <= bisher) return;
    try {
      localStorage.setItem(schluessel, String(level));
    } catch {
      return;
    }
    if (bisher === null) return;
    feuereBelohnung({
      text: `Level ${level} erreicht! 🚀`,
      untertitel: "Du wächst — jeder erledigte Bereich zählt.",
      icon: "trophy",
      gross: true,
    });
  }, [userId, gesamtPunkte, ladend]);

  const gefeiertRef = useRef(new Set());
  useEffect(() => {
    const neu = [...(neueBadgeKeys || [])].filter((k) => !gefeiertRef.current.has(k));
    if (neu.length === 0) return;
    neu.forEach((k) => gefeiertRef.current.add(k));
    feuereBelohnung(
      neu.length === 1
        ? { text: "Neues Abzeichen! 🏅", untertitel: badgeLabel(neu[0]), icon: "trophy", gross: true }
        : { text: `${neu.length} neue Abzeichen! 🏅`, untertitel: "Schau sie dir unter Erfolge an.", icon: "trophy", gross: true }
    );
  }, [neueBadgeKeys]);
}
