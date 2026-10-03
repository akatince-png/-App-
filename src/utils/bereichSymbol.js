// Welches moderne Symbol (ui/SchnellIcon.jsx) zu welchem Bereich gehört
// (30.09., Nutzerin: „im Tagesplan in den jeweiligen Bereichen die coolen
// Logos, für Essen das Essenslogo, in der klaren Farbe“).
const SYMBOL = {
  hormon: "medikament",
  medikament: "medikament",
  supplement: "einnahme",
  einnahme: "einnahme",
  mahlzeit: "mahlzeit",
  ernaehrung: "mahlzeit",
  snack: "snack",
  training: "training",
  gewohnheit: "gewohnheit",
  workflow: "workflow",
  zeitblock: "uhr",
  hydration: "trinken",
  trinken: "trinken",
  tageslicht: "sonne",
  schlaf: "nickerchen",
  nickerchen: "nickerchen",
  atemuebung: "atem",
  atem: "atem",
  bildschirmzeit: "handy",
  morgenroutine: "sonnenaufgang",
  abendroutine: "mond",
  gruppe: "gruppe",
  alltag: "kalender",
  kalender: "kalender",
  tagesraetsel: "puzzle",
  knobel: "puzzle",
  tagebuch: "tagebuch",
  notfallmodus: "akut",
};

export function bereichSymbol(kategorie) {
  return SYMBOL[kategorie] || "gewohnheit";
}

// Seitentitel mit Emoji vorn („💧 Wasser“) bekommen stattdessen das
// moderne Symbol als farbige Kugel (30.09., Nutzerin: „überarbeite gerne alle
// alten Icons“). Unbekannte Emojis bleiben, wie sie sind.
const TITEL_SYMBOL = {
  "☀️": ["sonne", "#E8A70C"],
  "🌬️": ["atem", "#12A5C6"],
  "🌱": ["gewohnheit", "#1FA39A"],
  "🎯": ["ziel", "#E4643F"],
  "🏋️": ["training", "#E0352B"],
  "👥": ["gruppe", "#7A63B0"],
  "💊": ["medikament", "#8436C2"],
  "💧": ["trinken", "#2D6FD6"],
  "📅": ["kalender", "#3F63D8"],
  "🗓️": ["kalender", "#3F63D8"],
  "📊": ["diagramm", "#3F63D8"],
  "📋": ["notiz", "#5B6B84"],
  "📓": ["tagebuch", "#7A63B0"],
  "📖": ["tagebuch", "#B25A8C"],
  "📚": ["tagebuch", "#B25A8C"],
  "📱": ["handy", "#5B6B84"],
  "🗂️": ["raster", "#C43A8E"],
  "😴": ["nickerchen", "#5B5BD6"],
  "🥗": ["mahlzeit", "#3E9B3A"],
  "🧩": ["puzzle", "#E4643F"],
  "🧭": ["kompass", "#E08A3E"],
  "🩸": ["tropfen", "#D12121"],
  "🌅": ["sonnenaufgang", "#F08A24"],
  "🌙": ["mond", "#2B3480"],
  "⚙️": ["zahnrad", "#5B6B84"],
};

export function titelSymbol(titel) {
  if (typeof titel !== "string") return null;
  for (const [emoji, [icon, farbe]] of Object.entries(TITEL_SYMBOL)) {
    if (titel.startsWith(emoji + " ")) {
      const rest = titel.slice(emoji.length + 1);
      // Supplemente teilen sich das 💊 mit den Medikamenten.
      if (emoji === "💊" && /^Supplement/.test(rest))
        return { icon: "einnahme", farbe: "#B7791F", rest };
      return { icon, farbe, rest };
    }
  }
  return null;
}
