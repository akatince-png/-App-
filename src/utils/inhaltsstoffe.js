// Inhaltsstoffe je Einnahme (25.09.), z. B. [{ name: "Magnesium", menge: 450, einheit: "mg" }].
const fmt = (n) => String(Math.round(Number(n) * 100) / 100).replace(".", ",");

export function inhaltsstoffZeile(s) {
  return `${s.name}${s.menge ? ` ${fmt(s.menge)}${s.einheit ? ` ${s.einheit}` : ""}` : ""}`;
}

export function inhaltsstoffeText(liste = [], max = 99) {
  const l = (liste || []).filter((s) => s?.name);
  const teil = l.slice(0, max).map(inhaltsstoffZeile).join(" · ");
  return l.length > max ? `${teil} · +${l.length - max} weitere` : teil;
}

// Darreichungsform aus der Foto-Erkennung auf die Einnahmearten der App
// abbilden (unbekannt → null, dann bleibt die bisherige Auswahl).
export function formZuEinnahmeart(form, erlaubt) {
  return erlaubt.includes(form) ? form : null;
}
