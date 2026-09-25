// Feier, wenn eine Morgen-/Abendroutine komplett ist (25.09., Nutzerinnen-
// Rückmeldung: nach dem Abhaken kam gar kein Fenster). Gilt für beide Wege
// — geführter Ablauf und Abhaken der einzelnen Schritte — und erscheint
// IMMER: pünktlich mit "Starker Start", später mit "Auch später zählt".
// Die kleinen Meldungen je Schritt bleiben an die Pünktlichkeit gebunden
// (Vorgabe 12.09.).
// `verspaetung` (25.09.): Text aus verspaetungHinweis() — erscheint klein
// unter der Feier, ohne Vorwurf, mit dem Vermerk, dass es protokolliert ist.
export function routineGeschafftFeier(routine, rechtzeitig, verspaetung = null) {
  const morgen = routine === "morgen";
  return {
    text: morgen ? "Morgenroutine geschafft! 🌅" : "Abendroutine geschafft! 🌙",
    untertitel: morgen
      ? rechtzeitig
        ? "Starker Start – jetzt ab in deinen Tag. 💪"
        : "Auch später zählt – jetzt starte gut in deinen Tag. 💪"
      : rechtzeitig
        ? "Stark – der Tag ist rund. Schlaf gut. 🌙"
        : "Auch später zählt – der Tag ist rund. Schlaf gut. 🌙",
    icon: morgen ? "sunrise" : "moon",
    punkte: 1,
    gross: true,
    ...(verspaetung ? { hinweis: `🕐 ${verspaetung}. Ist im Protokoll vermerkt.` } : {}),
  };
}
