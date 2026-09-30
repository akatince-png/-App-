import { toLocalISODate } from "./dates";

// Zu früh abhaken (30.09., Nutzerin): Alles mit Uhrzeit, das mehr als
// 15 Min. vor der geplanten Zeit (oder an einem späteren Tag) abgehakt wird,
// fragt „Sicher, dass du das schon erledigt hast?“. Genutzt im Tagesplan
// und auf der Startseite.
export const FRUEH_TOLERANZ_MIN = 15;

export function istZuFrueh(item, tagStr, jetzt = new Date()) {
  if (
    !item ||
    item.done ||
    !item.uhrzeit ||
    !/^\d{1,2}:\d{2}/.test(item.uhrzeit)
  )
    return false;
  const heute = toLocalISODate(jetzt);
  if (tagStr > heute) return true;
  if (tagStr < heute) return false;
  const [h, m] = item.uhrzeit.split(":").map(Number);
  return (
    h * 60 + m - (jetzt.getHours() * 60 + jetzt.getMinutes()) >
    FRUEH_TOLERANZ_MIN
  );
}
