// Kurze, positive Rückmeldungen statt nüchterner Zahlen — motivieren, ohne
// zu gamifizieren (keine Punkte/Level, nur ein ehrlicher Satz zum Stand des Tages).
export function statusText(done, total) {
  if (total === 0) return "Für heute steht nichts an. 🌿";
  if (done === total) return "Perfekt. Heute bist du im Plan. 🎉";
  if (done === 0) return "Auf geht's — der erste Punkt wartet.";
  const rest = total - done;
  if (rest === 1) return "Nur noch eine Aufgabe bis zum Tagesziel.";
  if (rest === 2) return "Nur noch zwei Aufgaben bis zum Tagesziel.";
  if (done / total >= 0.66) return "Fast geschafft, weiter so!";
  return `${rest} von ${total} stehen noch an.`;
}
