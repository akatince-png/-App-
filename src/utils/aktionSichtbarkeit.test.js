import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ProtokollLogView.jsx importiert transitiv sehr viele Module (u. a.
// AuthContext.jsx, useDiktat.js -> utils/speech.js), die alle direkt oder
// indirekt lib/supabaseClient.js importieren — das wirft ohne
// VITE_SUPABASE_URL sofort. Statt jede einzelne Kette einzeln zu mocken
// (gleiches Muster wie in mehreren bestehenden Test-Dateien, z. B.
// RoutineHeuteChecklist.test.jsx, aber dort reicht ein Mock, weil die
// Komponente selbst schlank ist), hier direkt an der Quelle gemockt.
vi.mock("../lib/supabaseClient", () => ({ supabase: {} }));

const { TAGESVERLAUF_AKTIONEN } = await import("../views/ProtokollLogView");
const { VERLAUF_AKTIONEN } = await import("../ui/ItemVerlauf");

const SRC_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function sammleQuellDateien(dir, out = []) {
  for (const eintrag of fs.readdirSync(dir, { withFileTypes: true })) {
    if (eintrag.name === "node_modules") continue;
    const voller = path.join(dir, eintrag.name);
    if (eintrag.isDirectory()) {
      sammleQuellDateien(voller, out);
    } else if (/\.(jsx?|tsx?)$/.test(eintrag.name) && !/\.test\.[jt]sx?$/.test(eintrag.name)) {
      out.push(voller);
    }
  }
  return out;
}

// Nutzerinnen-Nachfrage (17.09.): "Protokolländerungen sind ja nicht
// umsonst ... soll dann auch ... einsehbar sein." Beim Nachprüfen fielen
// gleich fünf `aktion`-Werte (aus drei verschiedenen Dateien) durch beide
// Anzeige-Filterlisten (ProtokollLogView.jsx TAGESVERLAUF_AKTIONEN,
// ItemVerlauf.jsx VERLAUF_AKTIONEN) — sie wurden protokolliert, aber
// NIRGENDS angezeigt, lautlos, ohne Fehler. Dieser Test durchsucht die
// gesamte Codebasis nach jedem `aktion: "..."`-Literal (direkt oder als
// beide Zweige eines Ternary, z. B. `aktion: x ? "A" : "B"`), das an
// aenderungVermerken() übergeben wird, und stellt sicher, dass JEDER
// gefundene Wert in MINDESTENS einer der beiden Listen steht — sonst
// wiederholt sich genau dieser stille Bug beim nächsten neuen Feature,
// ohne dass es je auffällt.
describe("Jeder aenderungVermerken()-Aktion-Wert ist irgendwo sichtbar", () => {
  const bekannteAktionen = new Set([...TAGESVERLAUF_AKTIONEN, ...VERLAUF_AKTIONEN]);

  it("jedes 'aktion: \"...\"'-Literal (direkt oder in einem Ternary) steht in TAGESVERLAUF_AKTIONEN oder VERLAUF_AKTIONEN", () => {
    const dateien = sammleQuellDateien(SRC_DIR);
    const unsichtbar = [];
    for (const datei of dateien) {
      const text = fs.readFileSync(datei, "utf8");
      // Direktes Literal: aktion: "..."
      for (const m of text.matchAll(/aktion:\s*"([^"]+)"/g)) {
        if (!bekannteAktionen.has(m[1])) unsichtbar.push(`${path.relative(SRC_DIR, datei)}: "${m[1]}"`);
      }
      // Ternary: aktion: bedingung ? "A" : "B"
      for (const m of text.matchAll(/aktion:\s*[^,\n?]+\?\s*"([^"]+)"\s*:\s*"([^"]+)"/g)) {
        if (!bekannteAktionen.has(m[1])) unsichtbar.push(`${path.relative(SRC_DIR, datei)}: "${m[1]}"`);
        if (!bekannteAktionen.has(m[2])) unsichtbar.push(`${path.relative(SRC_DIR, datei)}: "${m[2]}"`);
      }
    }
    expect(unsichtbar).toEqual([]);
  });
});
