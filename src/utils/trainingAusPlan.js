// Ein geplantes („virtuelles“) Training aus dem Wochenplan als echten
// Trainings-Eintrag anlegen – gemeinsam genutzt von der Startseite und Aka
// (10.10.), damit beide genau dasselbe anlegen.
export function trainingAusPlan(raw, { erledigt = false } = {}) {
  const arten = raw.arten || [];
  const art = arten.find((a) => a === "Krafttraining") || arten.find((a) => a === "Bodyweight") || arten[0] || "";
  const warmupCooldown = [
    raw.warmup?.aktiv ? `Warm-up${raw.warmup.dauerMin ? ` ${raw.warmup.dauerMin} Min.` : ""}` : "",
    raw.cooldown?.aktiv ? `Cool-down${raw.cooldown.dauerMin ? ` ${raw.cooldown.dauerMin} Min.` : ""}` : "",
  ].filter(Boolean);
  return {
    datum: raw.datum,
    uhrzeit: raw.uhrzeit || "",
    art,
    name: raw.name || "",
    uebungen: raw.uebungenListe || [],
    bemerkungen: warmupCooldown.join(" · "),
    erledigt,
    intervallArbeitSek: raw.intervallArbeitSek || "",
    intervallPauseSek: raw.intervallPauseSek || "",
    runden: raw.runden || "",
  };
}
