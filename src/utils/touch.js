// Touch-Gerät? (29.09.) iPad mit Pencil oder Trackpad meldet in CSS
// „pointer: fine“ wie ein Computer – der Touchscreen verrät es trotzdem.
// Setzt data-touch am <html>, damit index.css die Leiste unten zeigt.
export const istTouchGeraet = () => typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;

export function touchMarkieren() {
  if (typeof document !== "undefined" && istTouchGeraet()) document.documentElement.dataset.touch = "1";
}
