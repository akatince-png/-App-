import React from "react";
import { Label, Pill, TextInput } from "./primitives";
import { textMuted } from "./theme";
import { CANNABIS_FILTER_OPTIONEN } from "../constants";

// Zusatzfelder für die Medikamente-Kategorie "Cannabis" (12.09.,
// Nutzerinnen-Vorgabe): THC-/CBD-Gehalt gilt für jede Konsumform, die
// übrigen Details hängen von der gewählten Einnahmeart ab — Tabak/Filter
// nur beim Rauchen einer Blüte, Temperatur nur beim Verdampfen, Tropfenzahl
// nur bei Öl/Tropfen. Menge (Gramm/Tropfen/Kapseln pro Einnahme), Intervall
// und Uhrzeit(en) laufen bewusst über die schon vorhandenen generischen
// DosierungFields — "wie bei jeder anderen Medigabe auch".
export default function CannabisFelder({ value, onChange }) {
  const v = value || {};
  const mitTabak = !!v.tabakMenge;

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Label>THC-Gehalt (%)</Label>
          <TextInput type="number" value={v.thcProzent || ""} onChange={(val) => onChange("thcProzent", val)} placeholder="z. B. 18" />
        </div>
        <div style={{ flex: 1 }}>
          <Label>CBD-Gehalt (%)</Label>
          <TextInput type="number" value={v.cbdProzent || ""} onChange={(val) => onChange("cbdProzent", val)} placeholder="z. B. 1" />
        </div>
      </div>

      {v.einnahmeart === "Blüte (Rauchen)" && (
        <>
          <Label>Tabak</Label>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <Pill label="Ohne Tabak" selected={!mitTabak} onClick={() => onChange("tabakMenge", "")} />
            <Pill label="Mit Tabak" selected={mitTabak} onClick={() => onChange("tabakMenge", v.tabakMenge || "0,3 g")} />
          </div>
          {mitTabak && (
            <div style={{ marginTop: 6 }}>
              <TextInput value={v.tabakMenge || ""} onChange={(val) => onChange("tabakMenge", val)} placeholder="z. B. 0,3 g" />
            </div>
          )}

          <Label>Filter</Label>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {CANNABIS_FILTER_OPTIONEN.map((f) => (
              <Pill key={f} label={f} selected={v.filterTyp === f} onClick={() => onChange("filterTyp", f)} />
            ))}
          </div>
        </>
      )}

      {v.einnahmeart === "Blüte (Verdampfen)" && (
        <>
          <Label>Temperatur (°C)</Label>
          <TextInput type="number" value={v.temperaturGrad || ""} onChange={(val) => onChange("temperaturGrad", val)} placeholder="z. B. 180" />
        </>
      )}

      {v.einnahmeart === "Tropfen" && (
        <>
          <Label>Anzahl Tropfen (pro Einnahme)</Label>
          <TextInput type="number" value={v.tropfenAnzahl || ""} onChange={(val) => onChange("tropfenAnzahl", val)} placeholder="z. B. 5" />
        </>
      )}

      {(v.einnahmeart === "Kapsel" || v.einnahmeart === "Esswaren (Edibles)") && (
        <div style={{ fontSize: 11.5, color: textMuted, marginTop: 4 }}>
          Menge (z. B. mg) trägst du wie gewohnt oben bei "Menge" ein.
        </div>
      )}
    </div>
  );
}
