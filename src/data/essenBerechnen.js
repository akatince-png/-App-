import { AIService } from "../services/aiService";
import { essenAuswerten } from "../utils/essenRechner";

const fmt = (n) => String(Math.round(Number(n) * 10) / 10).replace(".", ",");

// ca.-Nährwerte zu einem Freitext („2 Eier und ein Brot“): erst die
// eingebaute Lebensmittel-Liste, Unbekanntes schätzt die KI als übliche
// Portion. Gemeinsam genutzt von EssenEingabe und Aka (10.10.).
export async function essenBerechnen(text) {
  const r = essenAuswerten(text);
  let posten = r.posten.map((p) => ({ ...p, name: p.lebensmittel.name }));
  let offen = r.unbekannt;
  if (offen.length) {
    try {
      const geschaetzt = await AIService.naehrwerteSchaetzen(offen);
      posten = [
        ...posten,
        ...geschaetzt
          .filter((g) => g.gramm > 0)
          .map((g) => ({ text: g.text, name: g.name, gramm: g.gramm, annahme: `${fmt(g.gramm)} g (übliche Portion)`, geschaetzt: true, werte: { kcal: g.kcal, eiweiss: g.eiweiss, fett: g.fett, kh: g.kh, zucker: g.zucker, ballast: 0, omega3: g.omega3, epaDha: g.epaDha, omega6: g.omega6 } })),
      ];
      const erkannt = new Set(geschaetzt.filter((g) => g.gramm > 0).map((g) => g.text));
      offen = offen.filter((t) => !erkannt.has(t));
    } catch (e) {
      console.error(e);
    }
  }
  return { posten, offen };
}
