import { gabeTitel } from "./bildTagesplan";

// Bündel (26.10., Nutzerin: „nur einmal gefragt werden, ob ich meine
// Supplemente nehme, darunter eine Liste … nicht jedes einzeln abhaken“):
// Supplemente und Spritzen/Medikamente mit derselben Uhrzeit werden ein
// Punkt; `teile` hält die einzelnen Einträge für die Liste im Fenster.
export function gruppiereFuerAlsNaechstes(items, t = (k) => k, _tLabel) {
  const angezeigt = [];
  const supplementSlots = {};
  const hormonSlots = {};
  let trainingSlot = null;

  items.forEach((item) => {
    if (item.kategorie === "supplement" && !item.raw?.getraenkMl) {
      let slot = supplementSlots[item.uhrzeit];
      if (!slot) {
        slot = { ...item, _ids: [item.refId], _namen: [item.name], _teile: [item] };
        supplementSlots[item.uhrzeit] = slot;
        angezeigt.push(slot);
      } else {
        slot._ids.push(item.refId);
        slot._namen.push(item.name);
        slot._teile.push(item);
      }
    } else if (item.kategorie === "hormon" && item.uhrzeit) {
      const art = item.raw?.einnahmeart === "Injektion" ? "injektion" : "medikament";
      const k = `${art}|${item.uhrzeit}`;
      if (!hormonSlots[k]) {
        hormonSlots[k] = { ...item, _art: art, _teile: [item] };
        angezeigt.push(hormonSlots[k]);
      } else hormonSlots[k]._teile.push(item);
    } else if (item.kategorie === "training") {
      if (!trainingSlot) {
        trainingSlot = { ...item, _traininganzahl: 1 };
        angezeigt.push(trainingSlot);
      } else {
        trainingSlot._traininganzahl += 1;
      }
    } else {
      angezeigt.push(item);
    }
  });

  return angezeigt.map((it) => {
    if (it.kategorie === "supplement" && it._ids?.length > 1) {
      return { ...it, name: `${gabeTitel("supplement", it.uhrzeit)} · ${it._ids.length}`, detail: it._namen.join(", "), bundleIds: it._ids, teile: it._teile, done: it._teile.every((x) => x.done) };
    }
    if (it.kategorie === "hormon" && it._teile?.length > 1) {
      return { ...it, key: `buendel-${it._art}-${it.uhrzeit}`, name: `${gabeTitel(it._art, it.uhrzeit)} · ${it._teile.length}`, detail: it._teile.map((x) => x.name).join(", "), teile: it._teile, done: it._teile.every((x) => x.done) };
    }
    if (it.kategorie === "training" && it._traininganzahl > 1) {
      return { ...it, name: t("home.list.trainingseinheit") };
    }
    return it;
  });
}
