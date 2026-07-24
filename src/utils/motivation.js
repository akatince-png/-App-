// Kurze, positive Rückmeldungen statt nüchterner Zahlen — motivieren, ohne
// zu gamifizieren (keine Punkte/Level, nur ein ehrlicher Satz zum Stand des Tages).
// `lang` kommt vom Aufrufer (aus useT()), da diese Funktion selbst kein Hook
// ist und daher nicht direkt auf den Sprachkontext zugreifen kann.
export function statusText(done, total, lang = "de") {
  if (lang === "en") {
    if (total === 0) return "Nothing planned for today. 🌿";
    if (done === total) return "Perfect. You're on track today. 🎉";
    if (done === 0) return "Let's go — the first item is waiting.";
    const rest = total - done;
    if (rest === 1) return "Just one more task until your daily goal.";
    if (rest === 2) return "Just two more tasks until your daily goal.";
    if (done / total >= 0.66) return "Almost there, keep going!";
    return `${rest} of ${total} still to go.`;
  }
  if (total === 0) return "Für heute steht nichts an. 🌿";
  if (done === total) return "Perfekt. Heute bist du im Plan. 🎉";
  if (done === 0) return "Auf geht's — der erste Punkt wartet.";
  const rest = total - done;
  if (rest === 1) return "Nur noch eine Aufgabe bis zum Tagesziel.";
  if (rest === 2) return "Nur noch zwei Aufgaben bis zum Tagesziel.";
  if (done / total >= 0.66) return "Fast geschafft, weiter so!";
  return `${rest} von ${total} stehen noch an.`;
}
