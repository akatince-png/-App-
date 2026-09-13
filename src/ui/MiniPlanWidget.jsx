import React from "react";
import { KATEGORIE_META } from "../utils/dayItems";
import { hexZuRgba } from "./theme";

/**
 * MiniPlanWidget: Kleine Doppelring-Visualisierung für einen Plan
 * Zeigt Tagesfortschritt (innerer Ring) und Wochenfortschritt (äußerer Ring)
 *
 * Props:
 * - name: string - Name des Plans (z.B. "Medikamente", "Training")
 * - dailyCount: number - Heutige Erfüllung (z.B. 3)
 * - dailyTotal: number - Heutiges Ziel (z.B. 5)
 * - weeklyCount: number - Wochenerfüllung (z.B. 4)
 * - weeklyTotal: number - Wochenziel (z.B. 7)
 * - kategorie: string - Kategorie für Farbe (z.B. "peptid", "hormon")
 * - aktiv: boolean - false = Kategorie noch nicht eingerichtet, erscheint
 *   grau/entsättigt statt farbig (bleibt aber antippbar, um sie einzurichten)
 * - onClick: () => void - springt ins zugehörige Menü (auch wenn inaktiv)
 * - actionLabel/onAction: optionaler Schnellzugriff (z. B. "+200ml"), oben
 *   rechts als kleiner Button — für Aktionen, die keinen vollen
 *   Seitenwechsel brauchen (siehe Hydration-Widget in HomeView)
 * - statusText: optionaler Text statt der Standard-"x/y heute"-Anzeige —
 *   für Kategorien ohne sinnvollen Bruchteil (z. B. Morgen-/Abendroutine:
 *   "heute erledigt"/"heute noch offen" statt "0/1 heute")
 */
export default function MiniPlanWidget({
  name,
  dailyCount,
  dailyTotal,
  weeklyCount,
  weeklyTotal,
  kategorie,
  unit = "",
  aktiv = true,
  onClick,
  actionLabel,
  onAction,
  farbe,
  hintergrund,
  statusText,
}) {
  // KATEGORIE_META-Einträge haben kein "color"-Feld (nur bg/text/dot/label) —
  // ein vorheriger Zugriff auf meta.color war deshalb immer undefined und
  // ließ die Ring-Striche unsichtbar werden (SVG-Default für stroke: "none").
  // farbe/hintergrund: expliziter Override für Kategorien ohne eigenen
  // KATEGORIE_META-Eintrag (Morgen-/Abendroutine — bewusst NICHT in
  // KATEGORIE_META aufgenommen, siehe PlaeneView.jsx: dort würden sie sonst
  // als tote Einträge in der Wochenübersicht-Legende auftauchen).
  const meta = KATEGORIE_META[kategorie] || { dot: "#999", bg: "#fff" };
  const baseColor = aktiv ? farbe || meta.dot : "#B5B5B5";
  // Farbiger Karten-Hintergrund statt durchgehend Weiß (Nutzerinnen-Vorgabe,
  // 16.08.: "die Farben etwas catchier machen, zumindest im Homemenü") —
  // vorher trugen nur die dünnen Ringe Farbe, die Kachel selbst wirkte
  // dadurch blass/uniform grau-weiß.
  const kartenHintergrund = aktiv ? hintergrund || meta.bg : "#F3F3F3";

  // Berechne Prozentsätze
  const dailyPercent = dailyTotal > 0 ? (dailyCount / dailyTotal) * 100 : 0;
  const weeklyPercent = weeklyTotal > 0 ? (weeklyCount / weeklyTotal) * 100 : 0;

  // Berechne Stroke-Dasharray für die Ringe
  // Innerer Ring Umfang ≈ 2π * 14 ≈ 88
  // Äußerer Ring Umfang ≈ 2π * 22 ≈ 138
  const innerCircumference = 2 * Math.PI * 14;
  const outerCircumference = 2 * Math.PI * 22;

  const innerStrokeDash = (dailyPercent / 100) * innerCircumference;
  const outerStrokeDash = (weeklyPercent / 100) * outerCircumference;

  // Hellere Farbe für Hintergrund. Bug-Fix (13.09.): einfaches String-
  // Anhängen von Alpha-Hex ("40") setzt voraus, dass baseColor immer ein
  // 6-stelliger Hex-String ist — bei einem 3-stelligen Hex oder einem
  // rgb(...)-String (z. B. aus einer künftigen Farbwahl) entstünde ein
  // ungültiger CSS-Wert, der Ring-Hintergrund verschwindet lautlos.
  // hexZuRgba() (theme.js) ist für genau diesen Zweck gedacht und wird
  // bereits eine Zeile darunter für border verwendet.
  const lighterColor = hexZuRgba(baseColor, 0.25);

  return (
    <div
      className={onClick ? "mp-tap" : undefined}
      onClick={onClick}
      style={{
        position: "relative",
        background: kartenHintergrund,
        border: `1px solid ${aktiv ? hexZuRgba(baseColor, 0.28) : "#e5e7eb"}`,
        borderRadius: "12px",
        padding: "12px",
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        cursor: onClick ? "pointer" : "default",
        opacity: aktiv ? 1 : 0.6,
        filter: aktiv ? "none" : "grayscale(1)",
      }}
    >
      {/* Sichtbarer Hinweis, dass die Kachel antippbar ist (14.08.,
          Nutzerin-Feedback: die Navigation per Tap gab es zwar schon, war
          aber ohne jede visuelle Andeutung nicht auffindbar) — dezent in der
          Ecke statt aufdringlich, damit die Ring-Visualisierung im Fokus
          bleibt. */}
      {onClick && !(actionLabel && onAction) && (
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            color: "#B5B5B5",
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          ›
        </div>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAction();
          }}
          className="mp-tap"
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            border: "none",
            borderRadius: 8,
            background: meta.dot,
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            padding: "3px 6px",
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}

      <div
        style={{
          fontSize: "11px",
          fontWeight: "600",
          color: baseColor,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          // Bug-Fix: der Aktions-Button (actionLabel/onAction, z. B. "+200ml")
          // sitzt absolut oben rechts über dieser Zeile — bei einem etwas
          // längeren Namen (z. B. "Hydration") lief der Text bisher unter
          // den Button und wurde dort unleserlich überlappt. Reserviert
          // jetzt Platz dafür, statt darunter durchzulaufen.
          maxWidth: actionLabel && onAction ? "calc(100% - 46px)" : "100%",
        }}
      >
        {name}
      </div>

      <svg
        style={{
          width: "70px",
          height: "70px",
        }}
        viewBox="0 0 60 60"
      >
        {/* Äußerer Ring Hintergrund */}
        <circle
          cx="30"
          cy="30"
          r="22"
          fill="none"
          stroke={lighterColor}
          strokeWidth="4"
        />

        {/* Äußerer Ring Fortschritt (Woche) */}
        <circle
          cx="30"
          cy="30"
          r="22"
          fill="none"
          stroke={baseColor}
          strokeWidth="4"
          strokeDasharray={`${outerStrokeDash} ${outerCircumference}`}
          strokeLinecap="round"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "30px 30px",
            transition: "stroke-dasharray 0.3s ease",
          }}
        />

        {/* Innerer Ring Hintergrund */}
        <circle
          cx="30"
          cy="30"
          r="14"
          fill="none"
          stroke={lighterColor}
          strokeWidth="3"
        />

        {/* Innerer Ring Fortschritt (Tag) */}
        <circle
          cx="30"
          cy="30"
          r="14"
          fill="none"
          stroke={baseColor}
          strokeWidth="3"
          strokeDasharray={`${innerStrokeDash} ${innerCircumference}`}
          strokeLinecap="round"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "30px 30px",
            transition: "stroke-dasharray 0.3s ease",
          }}
        />
      </svg>

      <div
        style={{
          fontSize: "9px",
          color: "#888",
          marginTop: "4px",
        }}
      >
        {aktiv ? statusText || `${dailyCount}${unit}/${dailyTotal}${unit} heute` : "Noch nicht eingerichtet"}
      </div>
    </div>
  );
}
