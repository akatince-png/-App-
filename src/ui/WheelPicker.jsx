import React, { useEffect, useRef } from "react";
import { accentSoft, textMain, textMuted } from "./theme";

// Reine CSS-Scroll-Snap-Wheel (kein Modal, keine neue Abhängigkeit) —
// tippen öffnet das Feld inline, hochscrollen wählt den Wert, loslassen
// rastet ein. Ersetzt getippte Zahlen-/Zeit-Felder, wo die Werte aus
// einem kleinen, festen Bereich stammen (siehe NumberWheelField/TimeWheelField).
export default function WheelPicker({ values, value, onChange, itemHeight = 40, visibleCount = 5 }) {
  const scrollRef = useRef(null);
  const settleTimer = useRef(null);
  const justClickedRef = useRef(false);
  const padCount = Math.floor(visibleCount / 2);
  const height = itemHeight * visibleCount;
  const index = Math.max(0, values.indexOf(value));

  // Bei externem Wertwechsel (oder erstem Rendern) zur passenden Position
  // springen — "instant", damit es nicht mit einer laufenden Nutzer-
  // Scrollbewegung in Konflikt gerät.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: index * itemHeight, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      // Ein Tap hat onChange bereits mit dem korrekten Wert aufgerufen —
      // das Scroll-Snapping, das der Tap selbst über scrollTo auslöst, darf
      // diesen Wert nicht mit einem (durch Snap-Verhalten abweichenden)
      // Scroll-Endpunkt überschreiben.
      if (justClickedRef.current) {
        justClickedRef.current = false;
        return;
      }
      const el = scrollRef.current;
      if (!el) return;
      const nextIndex = Math.round(el.scrollTop / itemHeight);
      const clamped = Math.min(values.length - 1, Math.max(0, nextIndex));
      el.scrollTo({ top: clamped * itemHeight, behavior: "smooth" });
      if (values[clamped] !== value) onChange(values[clamped]);
    }, 120);
  };

  return (
    <div style={{ position: "relative", height }}>
      <div
        style={{
          position: "absolute",
          top: padCount * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
          background: accentSoft,
          borderRadius: 10,
          pointerEvents: "none",
        }}
      />
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="mp-wheel"
        style={{
          height,
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          position: "relative",
        }}
      >
        <div style={{ height: padCount * itemHeight }} />
        {values.map((v, i) => {
          const dist = Math.abs(i - index);
          return (
            <div
              key={v}
              className="mp-wheel-item"
              onClick={() => {
                justClickedRef.current = true;
                const el = scrollRef.current;
                if (el) el.scrollTo({ top: i * itemHeight, behavior: "smooth" });
                if (v !== value) onChange(v);
              }}
              style={{
                height: itemHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                scrollSnapAlign: "center",
                fontSize: dist === 0 ? 18 : 15,
                fontWeight: dist === 0 ? 800 : 600,
                color: dist === 0 ? textMain : textMuted,
                opacity: dist === 0 ? 1 : Math.max(0.35, 1 - dist * 0.3),
                cursor: "pointer",
              }}
            >
              {v}
            </div>
          );
        })}
        <div style={{ height: padCount * itemHeight }} />
      </div>
    </div>
  );
}
