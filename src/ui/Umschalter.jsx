import React from "react";

// Design 2.0 (29.09., Nutzerin: „modernen Stil für das gesamte Hauptmenü“):
// EIN einheitlicher Umschalter für Reiter mit wenigen Optionen (Tag/Woche,
// Personen/Teams …): hell hinterlegte Leiste, die aktive Wahl als weißes
// Feld. Stil in index.css (.mp-segment).
// optionen: [[wert, label], …]
export default function Umschalter({ optionen, wert, onWahl, name, style, dataAttr }) {
  return (
    <div className="mp-segment" role="group" aria-label={name} style={style} {...(dataAttr ? { [dataAttr[0]]: dataAttr[1] } : {})}>
      {optionen.map(([id, label]) => (
        <button key={id} type="button" className="mp-tap" aria-pressed={wert === id} onClick={() => onWahl(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

// Ein/Aus-Schalter im iOS-Stil (29.09.), z. B. Bausteine unter Mehr.
export function Schalter({ an, onClick, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!an}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="mp-schalter"
    >
      <span />
    </button>
  );
}

// Für viele Optionen (Archiv-Reiter, Pläne): eine wischbare Chip-Zeile.
// optionen: [{ id, label, icon?, farbe? }]; farbe = Hintergrund, wenn aktiv.
export function ChipReihe({ optionen, wert, onWahl, name, renderIcon }) {
  return (
    <div className="mp-chips" role="group" aria-label={name}>
      {optionen.map((o) => {
        const an = wert === o.id;
        return (
          <button
            key={o.id}
            type="button"
            className="mp-tap"
            aria-pressed={an}
            onClick={() => onWahl(o.id)}
            style={an && o.farbe ? { background: o.farbe, color: "#fff" } : undefined}
          >
            {o.icon && renderIcon ? renderIcon(o.icon) : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
