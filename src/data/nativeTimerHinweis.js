import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

// Timer-Ende bei gesperrtem Handy (iPhone-App, 27.09.): der Fokus-Timer
// plant eine lokale Mitteilung für sein Ende – kommt ohne Internet und ohne
// Server. Im Browser tut das nichts (dort bleibt es beim Ring in der App).
const ID = 4711;

export async function timerHinweisPlanen(t) {
  if (!Capacitor.isNativePlatform() || !t) return;
  try {
    let { display } = await LocalNotifications.checkPermissions();
    if (display === "prompt" || display === "prompt-with-rationale") ({ display } = await LocalNotifications.requestPermissions());
    if (display !== "granted") return;
    await LocalNotifications.cancel({ notifications: [{ id: ID }] });
    await LocalNotifications.schedule({
      notifications: [{ id: ID, title: `${t.symbol || "⏱️"} Zeit um`, body: `${t.name}: Geschafft? Oder noch 5 Minuten?`, schedule: { at: new Date(t.ende) } }],
    });
  } catch {
    /* Hinweis ist ein Extra – der Timer läuft auch ohne */
  }
}

export async function timerHinweisLoeschen() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: ID }] });
  } catch {
    /* nichts geplant */
  }
}
