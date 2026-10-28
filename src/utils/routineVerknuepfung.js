// Routine-Schritte ↔ Tagespunkte (28.10., Nutzerin: auf der Startseite
// abhaken soll in der Morgenroutine mitzählen – „und umgekehrt“: Ja).
// Verknüpft wird über Namen und Tageszeit, ohne eigene Einstellung:
// „Frühstück“ ↔ Mahlzeit am Morgen, „Dosette/Supplemente“ ↔ Supplemente der
// Tageszeit, „Shaker“ ↔ Shaker, „Medikament“ ↔ Medikament der Tageszeit,
// sonst wenn der Name des Tagespunkts im Schritt vorkommt.
const norm = (s) => (s || "").toLowerCase().replace(/[^a-zäöüß0-9]+/g, " ").trim();
const KATEGORIEN = ["supplement", "hormon", "mahlzeit", "gewohnheit"];

function passendeTageszeit(routine, uhrzeit) {
  if (!uhrzeit) return false;
  return routine === "morgen" ? uhrzeit < "11:00" : uhrzeit >= "17:00";
}

export function verknuepfteItems(schritt, items = []) {
  const n = norm(schritt?.name);
  if (!n) return [];
  const routine = schritt.routine || "morgen";
  return items.filter((it) => {
    if (!KATEGORIEN.includes(it.kategorie)) return false;
    const name = norm(it.raw?.name || it.name);
    const zeit = passendeTageszeit(routine, it.originalUhrzeit ?? it.uhrzeit);
    const getraenk = it.kategorie === "supplement" && Number(it.raw?.getraenkMl) > 0;
    if (/shaker/.test(n) && (/shaker/.test(name) || getraenk)) return true;
    if (/fr(ü|ue)hst(ü|ue)ck/.test(n) && it.kategorie === "mahlzeit" && (/fr(ü|ue)hst/.test(name) || zeit)) return true;
    if (/dosette|supplement/.test(n) && it.kategorie === "supplement" && zeit && !getraenk) return true;
    if (/medikament|medikation|tablette/.test(n) && it.kategorie === "hormon" && zeit) return true;
    return name.length >= 4 && ` ${n} `.includes(` ${name} `);
  });
}

// Schritte, die durch die gerade abgehakten Punkte komplett erledigt sind:
// alle ihre verknüpften Punkte sind jetzt erledigt.
export function schritteDurchItems(schritte = [], items = [], neuErledigtKeys = new Set()) {
  const istFertig = (it) => it.done || neuErledigtKeys.has(it.key);
  return schritte.filter((sc) => {
    const verknuepft = verknuepfteItems(sc, items);
    return verknuepft.some((it) => neuErledigtKeys.has(it.key)) && verknuepft.every(istFertig);
  });
}
